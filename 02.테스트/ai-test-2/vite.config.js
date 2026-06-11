import { defineConfig } from "vite";
import handlebars from "vite-plugin-handlebars";
import { existsSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, extname, relative, resolve, sep } from "node:path";
import * as task from "./task/handlebars-helpers.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const srcDir = resolve(__dirname, "src");
const pagesDir = resolve(srcDir, "pages");

function collectHtmlEntries(dir, rootDir = dir, entries = {}) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = resolve(dir, entry.name);

    if (entry.isDirectory()) {
      collectHtmlEntries(fullPath, rootDir, entries);
      continue;
    }

    if (!entry.isFile() || !entry.name.endsWith(".html")) {
      continue;
    }

    const entryName = relative(rootDir, fullPath).split(sep).join("/").replace(/\.html$/, "");
    entries[entryName] = fullPath;
  }

  return entries;
}

export default defineConfig({
  root: pagesDir,
  publicDir: resolve(__dirname, "public"),
  server: {
    host: "127.0.0.1",
    open: true,
  },
  resolve: {
    alias: {
      "@": srcDir,
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: "modern-compiler",
      },
    },
  },
  plugins: [
    {
      name: "watch-handlebars-data",
      configureServer(server) {
        const i18nDir = resolve(srcDir, "i18n");
        const dataDir = resolve(srcDir, "data");
        server.watcher.add([i18nDir, dataDir]);
        server.watcher.on("change", (file) => {
          if (file.startsWith(i18nDir) || file.startsWith(dataDir)) {
            server.ws.send({ type: "full-reload" });
          }
        });
      },
    },
    handlebars({
      partialDirectory: resolve(srcDir, "partials"),
      helpers: task.createHandlebarsHelpers(srcDir),
      context(pagePath) {
        const site = task.loadSiteData(srcDir, pagePath);
        const navigation = task.loadNavigationData(srcDir, pagePath);
        const meta = task.loadPageMeta(srcDir, pagePath);
        return {
          site,
          navigation,
          locale: task.getLocaleFromPagePath(pagePath),
          stylePath: task.resolveStylePath(pagePath),
          currentPath: task.normalizeCurrentPath(pagePath),
          ...meta,
        };
      },
    }),
  ],
  build: {
    outDir: resolve(__dirname, "dist"),
    emptyOutDir: true,
    rollupOptions: {
      input: collectHtmlEntries(pagesDir),
      output: {
        entryFileNames: "assets/js/[name].js",
        chunkFileNames: "assets/js/[name].js",
        assetFileNames: (assetInfo) => {
          const assetName = assetInfo.name ?? "";
          const ext = extname(assetName).toLowerCase();

          if (ext === ".css") return "assets/css/[name][extname]";
          if ([".woff", ".woff2", ".ttf", ".otf", ".eot"].includes(ext)) return "assets/fonts/[name][extname]";
          if ([".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".avif", ".ico"].includes(ext)) return "assets/images/[name][extname]";
          return "assets/[name][extname]";
        },
      },
    },
  },
});
