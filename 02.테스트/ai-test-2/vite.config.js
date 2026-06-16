import { defineConfig } from "vite";
import handlebars from "vite-plugin-handlebars";
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, extname, relative, resolve, sep } from "node:path";
import * as task from "./task/handlebars-helpers.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const srcDir = resolve(__dirname, "src");
const pagesDir = resolve(srcDir, "pages");
const distDir = resolve(__dirname, "dist");
const cssLinkPattern = /href="\/assets\/css\/([^"]+\.css)"/g;

function isEnglishRoute(pathname) {
  return pathname === "/en" || pathname.startsWith("/en/");
}

function isDefaultLocaleRoute(pathname) {
  return pathname !== "/"
    && !pathname.startsWith("/ko/")
    && !pathname.startsWith("/assets/")
    && !pathname.startsWith("/@")
    && !extname(pathname);
}

function resolveDefaultLocaleSource(pathname) {
  const pagePath = pathname.endsWith("/") ? `${pathname}index.html` : `${pathname}/index.html`;
  const localPath = pagePath.replace(/^\//, "");
  if (existsSync(resolve(pagesDir, localPath))) {
    return pagePath;
  }

  const sourcePath = `/en${pagePath}`;
  return existsSync(resolve(pagesDir, sourcePath.replace(/^\//, ""))) ? sourcePath : "";
}

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

    if (entryName === "en/index") {
      continue;
    }

    const outputName = entryName.startsWith("en/") ? entryName.slice(3) : entryName;
    entries[outputName] = fullPath;
  }

  return entries;
}

function collectHtmlOutputs(dir, files = []) {
  if (!existsSync(dir)) {
    return files;
  }

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = resolve(dir, entry.name);

    if (entry.isDirectory()) {
      collectHtmlOutputs(fullPath, files);
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".html")) {
      files.push(fullPath);
    }
  }

  return files;
}

function getStyleNameFromOutput(htmlPath) {
  const outputPath = relative(distDir, htmlPath).split(sep).join("/");
  const segments = outputPath.split("/");
  const localeOffset = segments[0] === "ko" ? 1 : 0;
  const section = segments[localeOffset];
  const nextSegment = segments[localeOffset + 1];

  if (outputPath === "index.html" || outputPath === "ko/index.html") {
    return "home";
  }

  if (section === "_guide") {
    return "guide";
  }

  if (section === "blog" && nextSegment && nextSegment !== "index.html") {
    return "post";
  }

  return section || "home";
}

function normalizeCssOutputs() {
  const cssDir = resolve(distDir, "assets", "css");

  if (!existsSync(cssDir)) {
    return;
  }

  mkdirSync(cssDir, { recursive: true });

  const generatedCssNames = new Set();
  const targetCssNames = new Set();

  for (const htmlPath of collectHtmlOutputs(distDir)) {
    const html = readFileSync(htmlPath, "utf8");
    const cssLinks = [...html.matchAll(cssLinkPattern)];

    if (!cssLinks.length) {
      continue;
    }

    const targetCssName = `${getStyleNameFromOutput(htmlPath)}.css`;
    const targetCssPath = resolve(cssDir, targetCssName);
    targetCssNames.add(targetCssName);

    for (const [, generatedCssName] of cssLinks) {
      generatedCssNames.add(generatedCssName);

      const generatedCssPath = resolve(cssDir, generatedCssName);
      if (existsSync(generatedCssPath) && !existsSync(targetCssPath)) {
        copyFileSync(generatedCssPath, targetCssPath);
      }
    }

    const updatedHtml = html.replace(cssLinkPattern, `href="/assets/css/${targetCssName}"`);
    if (updatedHtml !== html) {
      writeFileSync(htmlPath, updatedHtml);
    }
  }

  for (const generatedCssName of generatedCssNames) {
    if (targetCssNames.has(generatedCssName)) {
      continue;
    }

    rmSync(resolve(cssDir, generatedCssName), { force: true });
  }
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
        server.middlewares.use((req, res, next) => {
          if (!req.url) {
            next();
            return;
          }

          const url = new URL(req.url, "http://localhost");
          const pathname = url.pathname;
          if (isEnglishRoute(pathname)) {
            res.statusCode = 404;
            res.end("Not Found");
            return;
          }

          if (isDefaultLocaleRoute(pathname)) {
            const sourcePath = resolveDefaultLocaleSource(pathname);
            if (sourcePath) {
              req.url = `${sourcePath}${url.search}`;
            } else {
              res.statusCode = 404;
              res.end("Not Found");
              return;
            }
          }

          next();
        });

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
    {
      name: "flatten-english-output",
      closeBundle() {
        const englishDir = resolve(distDir, "en");

        if (!existsSync(englishDir)) {
          normalizeCssOutputs();
          return;
        }

        for (const entry of readdirSync(englishDir, { withFileTypes: true })) {
          const sourcePath = resolve(englishDir, entry.name);
          const targetPath = resolve(distDir, entry.name);
          renameSync(sourcePath, targetPath);
        }

        rmSync(englishDir, { recursive: true, force: true });
        normalizeCssOutputs();
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
    cssCodeSplit: true,
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
