import { defineConfig } from "vite";
import handlebars from "vite-plugin-handlebars";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, extname, posix, relative, resolve, sep } from "node:path";

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

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function normalizePageKey(pagePath) {
  return pagePath
    .replace(/^\//, "")
    .replace(/\/index\.html$/, "/index")
    .replace(/\.html$/, "") || "index";
}

function normalizeCurrentPath(pagePath) {
  const key = normalizePageKey(pagePath);
  if (key === "index") {
    return "/";
  }

  return `/${key.replace(/\/index$/, "")}/`;
}

function siteHref(currentPath, targetPath) {
  if (!targetPath.startsWith("/")) {
    return targetPath;
  }

  const currentDir = currentPath.endsWith("/") ? currentPath : `${currentPath}/`;
  const target = targetPath === "/"
    ? "/index.html"
    : targetPath.endsWith("/")
      ? `${targetPath}index.html`
      : targetPath;
  let result = posix.relative(currentDir, target);

  if (!result) {
    return "./";
  }

  if (!result.startsWith(".")) {
    result = `./${result}`;
  }

  return result;
}

function loadPageMeta(pagePath) {
  const pagesFile = resolve(srcDir, "data", "pages.json");
  const pages = readJson(pagesFile);
  const pageKey = normalizePageKey(pagePath);
  return pages[pageKey] ?? pages.index;
}

export default defineConfig({
  root: pagesDir,
  server: {
    open: true,
  },
  resolve: {
    alias: {
      "@": srcDir,
    },
  },
  plugins: [
    handlebars({
      partialDirectory: resolve(srcDir, "partials"),
      helpers: {
        eq: (left, right) => left === right,
        includes: (list, value) => Array.isArray(list) && list.includes(value),
        array: (...values) => values.slice(0, -1),
        siteHref,
      },
      context(pagePath) {
        const site = readJson(resolve(srcDir, "data", "site.json"));
        const navigation = readJson(resolve(srcDir, "data", "navigation.json"));
        const meta = loadPageMeta(pagePath);
        return {
          site,
          navigation,
          currentPath: normalizeCurrentPath(pagePath),
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
