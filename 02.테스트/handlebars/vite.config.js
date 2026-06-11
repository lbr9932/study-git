import { defineConfig } from "vite";
import handlebars from "vite-plugin-handlebars";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, extname, relative, resolve, sep } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "./src");
const pagesDir = resolve(__dirname, "./src/pages");
const navFile = resolve(rootDir, "data", "nav.json");

function collectHtmlEntries(dir, rootDir = dir, entries = {}) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = resolve(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "partials" || entry.name === "styles") {
        continue;
      }
      collectHtmlEntries(fullPath, rootDir, entries);
      continue;
    }
    if (!entry.isFile() || !entry.name.endsWith(".html")) {
      continue;
    }

    const relativePath = relative(rootDir, fullPath).split(sep).join("/");
    const entryName = relativePath.replace(/\.html$/, "");
    entries[entryName] = fullPath;
  }

  return entries;
}

function loadPageData(pagePath) {
  const locale = pagePath.startsWith("/en/") ? "en" : "ko";
  const relativePagePath = pagePath
    .replace(/^\/(en|ko)\//, "")
    .replace(/\.html$/, "") || "index";
  const pageFile = resolve(rootDir, "i18n", locale, `${relativePagePath}.json`);
  const fallbackFile = resolve(rootDir, "i18n", locale, "index.json");
  const filePath = existsSync(pageFile) ? pageFile : fallbackFile;
  const commonFile = resolve(rootDir, "i18n", locale, "common.json");

  return {
    ...JSON.parse(readFileSync(commonFile, "utf8")),
    ...JSON.parse(readFileSync(filePath, "utf8")),
  };
}

function loadNavData() {
  return JSON.parse(readFileSync(navFile, "utf8"));
}

function getPageInfo(pagePath) {
  const normalizedPath = pagePath.replace(/^\//, "");
  const parts = normalizedPath.split("/").filter(Boolean);
  const locale = parts[0] === "en" ? "en" : "ko";
  const section = parts.length > 2 ? parts[1] : "home";

  return {
    locale,
    section,
    currentPath: `/${normalizedPath}`,
  };
}

function loadGnbData(pagePath) {
  const { locale, section, currentPath } = getPageInfo(pagePath);
  const navData = loadNavData();
  const items = (navData.gnb?.[locale] ?? []).map((item) => ({
    ...item,
    active: item.id === section,
  }));
  const activeItem = items.find((item) => item.active);
  const children = (activeItem?.children ?? []).map((item) => ({
    ...item,
    active: item.href === currentPath,
  }));

  return {
    nav: {
      languages: navData.languages.map((item) => ({
        ...item,
        active: item.locale === locale,
      })),
    },
    gnb: {
      items,
      children,
    },
    currentPath,
  };
}

export default defineConfig({
  root: pagesDir,
  server: {
    open: true,
  },
  resolve: {
    alias: {
      "@": rootDir,
    },
  },
  plugins: [
    {
      name: "watch-handlebars-data",
      configureServer(server) {
        const i18nDir = resolve(rootDir, "i18n");
        const dataDir = resolve(rootDir, "data");
        server.watcher.add([i18nDir, dataDir]);
        server.watcher.on("change", (file) => {
          if (file.startsWith(i18nDir) || file.startsWith(dataDir)) {
            server.ws.send({ type: "full-reload" });
          }
        });
      },
    },
    handlebars({
      partialDirectory: resolve(rootDir, "partials"),
      helpers: {
        eq: (left, right) => left === right,
      },
      context(pagePath) {
        const { locale, currentPath } = getPageInfo(pagePath);
        const page = loadPageData(pagePath);
        const { nav, gnb } = loadGnbData(pagePath);

        return {
          locale,
          nav,
          gnb,
          currentPath,
          ...page,
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
        entryFileNames: "asset/js/[name].js",
        chunkFileNames: "asset/js/[name].js",
        assetFileNames: (assetInfo) => {
          const assetName = assetInfo.name ?? "";
          const ext = extname(assetName).toLowerCase();

          if (ext === ".css") {
            return "asset/css/[name][extname]";
          }

          if ([".woff", ".woff2", ".ttf", ".otf", ".eot"].includes(ext)) {
            return "asset/font/[name][extname]";
          }

          if ([".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".avif", ".ico"].includes(ext)) {
            return "asset/image/[name][extname]";
          }

          return "asset/[name][extname]";
        },
      },
    },
  },
});
