import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

// JSON data loader used by page meta, site config, and inline helpers.
function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

// URL policy: Korean keeps /ko, English is the default and omits /en.
function getLocaleFromPagePath(pagePath) {
  const normalized = pagePath.replace(/^\//, "");
  const firstSegment = normalized.split("/")[0];
  return firstSegment === "ko" ? firstSegment : "en";
}

// Converts a Vite page path into a locale-free content key.
// Example: /en/blog/index.html -> blog/index.
function normalizePageKey(pagePath) {
  const normalized = pagePath.replace(/^\//, "").replace(/\.html$/, "");
  const segments = normalized.split("/").filter(Boolean);
  if (segments[0] === "en" || segments[0] === "ko") {
    segments.shift();
  }
  return segments.join("/") || "index";
}

// Returns the public URL for the current page.
// English source files under /en are exposed without the /en prefix.
function normalizeCurrentPath(pagePath) {
  const normalized = pagePath.replace(/^\//, "").replace(/\.html$/, "");
  const segments = normalized.split("/").filter(Boolean);
  const locale = segments[0] === "ko" ? segments.shift() : "";
  if (segments[0] === "en") {
    segments.shift();
  }
  const key = segments.join("/") || "index";

  if (key === "index") {
    return locale ? `/${locale}/` : "/";
  }

  return locale ? `/${locale}/${key.replace(/\/index$/, "")}/` : `/${key.replace(/\/index$/, "")}/`;
}

// Resolves the home path for the active locale.
function resolveLocaleHomePath(pagePath) {
  return getLocaleFromPagePath(pagePath) === "ko" ? "/ko/" : "/";
}

// Public href helper used in templates.
// Internal paths are normalized by locale; external and anchor links pass through.
function siteHref(currentPath, targetPath) {
  const resolvedTargetPath = resolveLocalizedPath(currentPath, targetPath);
  return resolvedTargetPath;
}

// Applies locale prefix rules to internal paths.
// /blog/ stays /blog/ for English and becomes /ko/blog/ for Korean.
function resolveLocalizedPath(currentPath, targetPath) {
  if (!targetPath.startsWith("/") || isExternalPath(targetPath)) {
    return targetPath;
  }

  const locale = getLocaleFromPagePath(currentPath);
  if (targetPath === "/") {
    return locale === "ko" ? "/ko/" : "/";
  }

  if (targetPath === "/en" || targetPath.startsWith("/en/")) {
    return targetPath.replace(/^\/en(?=\/|$)/, "") || "/";
  }

  if (targetPath === "/ko") {
    return "/ko/";
  }

  if (targetPath.startsWith("/ko/")) {
    return targetPath;
  }

  return locale === "ko" ? `/ko${targetPath}` : targetPath;
}

// Detects links that should not be rewritten by locale logic.
function isExternalPath(targetPath) {
  return targetPath.startsWith("//") || targetPath.startsWith("#") || /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(targetPath);
}

// Canonical URLs follow the public URL policy, so /en is removed.
function normalizeCanonicalPath(canonical) {
  if (typeof canonical !== "string") {
    return canonical;
  }

  if (canonical === "/en" || canonical.startsWith("/en/")) {
    return canonical.replace(/^\/en(?=\/|$)/, "") || "/";
  }

  return canonical;
}

// Loads a locale-scoped data file such as data/ko/site.json.
function loadLocaleFile(srcDir, locale, fileName) {
  return readJson(resolve(srcDir, "data", locale, fileName));
}

// Normalizes paths passed to the {{json}} helper.
// Supports both data/foo.json and foo.json forms.
function resolveDataPath(srcDir, targetPath) {
  const normalized = String(targetPath)
    .replace(/^\.\//, "")
    .replace(/^\//, "")
    .replace(/^src\//, "");

  if (normalized.startsWith("data/")) {
    return resolve(srcDir, normalized);
  }

  return resolve(srcDir, "data", normalized);
}

// Maps a page file to its page metadata JSON file.
// Example: /ko/blog/sample-post/index.html -> data/ko/pages/blog/sample-post.json.
function resolvePageMetaFile(srcDir, pagePath) {
  const locale = getLocaleFromPagePath(pagePath);
  const pageKey = normalizePageKey(pagePath);
  const segments = pageKey.split("/").filter(Boolean);
  const fileName = segments.at(-1) === "index"
    ? `${segments.at(-2) ?? "index"}.json`
    : `${segments.pop()}.json`;
  const folders = pageKey === "index" || pageKey.endsWith("/index")
    ? segments.slice(0, -2)
    : segments;

  return resolve(srcDir, "data", locale, "pages", ...folders, fileName);
}

// Loads global site data for the page locale.
function loadSiteData(srcDir, pagePath) {
  return loadLocaleFile(srcDir, getLocaleFromPagePath(pagePath), "site.json");
}

// Navigation is shared when data/navigation.json exists.
// Locale-specific navigation remains as a fallback.
function loadNavigationData(srcDir, pagePath) {
  const sharedNavigationFile = resolve(srcDir, "data", "navigation.json");

  if (existsSync(sharedNavigationFile)) {
    return readJson(sharedNavigationFile);
  }

  return loadLocaleFile(srcDir, getLocaleFromPagePath(pagePath), "navigation.json");
}

// Loads page metadata and normalizes canonical paths for public output.
function loadPageMeta(srcDir, pagePath) {
  const pageFile = resolvePageMetaFile(srcDir, pagePath);
  const meta = existsSync(pageFile) ? readJson(pageFile) : {};

  if (meta && typeof meta === "object" && "canonical" in meta) {
    meta.canonical = normalizeCanonicalPath(meta.canonical);
  }

  return meta;
}

// Writes computed values onto the Handlebars root context.
function assignRootValue(name, value, options) {
  if (options.data?.root) {
    options.data.root[name] = value;
  }

  return "";
}

// {{json "name" "path"}} loads a JSON file and exposes it as root.name.
function readJsonHelper(srcDir, name, targetPath, options) {
  if (!targetPath) {
    throw new Error(`json helper requires a path for "${name}"`);
  }

  const value = readJson(resolveDataPath(srcDir, targetPath));
  return assignRootValue(name, value, options);
}

// {{#jsonBlock "name"}}...{{/jsonBlock}} parses inline JSON into root.name.
function jsonBlockHelper(name, options) {
  const raw = options.fn(this).trim();
  if (!raw) {
    return assignRootValue(name, null, options);
  }

  try {
    return assignRootValue(name, JSON.parse(raw), options);
  } catch (error) {
    throw new Error(`jsonBlock helper expected valid JSON for "${name}": ${error.message}`);
  }
}

// {{set "name" key=value}} exposes hash values as root.name.
function setHelper(name, options) {
  return assignRootValue(name, { ...options.hash }, options);
}

// Selects the SCSS entry file for the current page type.
function resolveStylePath(pagePath) {
  const pageKey = normalizePageKey(pagePath);
  const section = pageKey.split("/")[0];
  let styleName = section;

  if (pageKey === "index") {
    styleName = "home";
  } else if (section === "_guide") {
    styleName = "guide";
  } else if (section === "blog" && pageKey !== "blog" && pageKey !== "blog/index") {
    styleName = "post";
  }

  return `../scss/${styleName}.scss`;
}

// Registers helpers consumed by vite-plugin-handlebars templates.
function createHandlebarsHelpers(srcDir) {
  return {
    eq: (left, right) => left === right,
    includes: (list, value) => Array.isArray(list) && list.includes(value),
    array: (...values) => values.slice(0, -1),
    concat: (...values) => values.slice(0, -1).join(""),
    json: (name, targetPath, options) => readJsonHelper(srcDir, name, targetPath, options),
    jsonBlock: jsonBlockHelper,
    localeHomePath: resolveLocaleHomePath,
    localizedPath: resolveLocalizedPath,
    set: setHelper,
    siteHref,
  };
}

export {
  createHandlebarsHelpers,
  getLocaleFromPagePath,
  loadPageMeta,
  loadNavigationData,
  loadSiteData,
  normalizeCurrentPath,
  resolveLocaleHomePath,
  resolveStylePath,
  readJson,
};
