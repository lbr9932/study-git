import { existsSync, readFileSync } from "node:fs";
import { posix, resolve } from "node:path";

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function getLocaleFromPagePath(pagePath) {
  const normalized = pagePath.replace(/^\//, "");
  const firstSegment = normalized.split("/")[0];
  return firstSegment === "en" || firstSegment === "ko" ? firstSegment : "ko";
}

function normalizePageKey(pagePath) {
  const normalized = pagePath.replace(/^\//, "").replace(/\.html$/, "");
  const segments = normalized.split("/").filter(Boolean);
  if (segments[0] === "en" || segments[0] === "ko") {
    segments.shift();
  }
  return segments.join("/") || "index";
}

function normalizeCurrentPath(pagePath) {
  const normalized = pagePath.replace(/^\//, "").replace(/\.html$/, "");
  const segments = normalized.split("/").filter(Boolean);
  const locale = segments[0] === "en" || segments[0] === "ko" ? segments.shift() : "";
  const key = segments.join("/") || "index";

  if (key === "index") {
    return locale ? `/${locale}/` : "/";
  }

  return locale ? `/${locale}/${key.replace(/\/index$/, "")}/` : `/${key.replace(/\/index$/, "")}/`;
}

function resolveLocaleHomePath(pagePath) {
  return `/${getLocaleFromPagePath(pagePath)}/`;
}

function siteHref(currentPath, targetPath) {
  if (!targetPath.startsWith("/")) {
    return targetPath;
  }

  const currentDir = currentPath.endsWith("/") ? currentPath : `${currentPath}/`;
  const isDirectory = targetPath.endsWith("/");
  let result = posix.relative(currentDir, targetPath);

  if (!result) {
    return "./";
  }

  if (isDirectory) {
    result = `${result}/`;
  }

  if (!result.startsWith(".")) {
    result = `./${result}`;
  }

  return result;
}

function loadLocaleFile(srcDir, locale, fileName) {
  return readJson(resolve(srcDir, "data", locale, fileName));
}

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

function loadSiteData(srcDir, pagePath) {
  return loadLocaleFile(srcDir, getLocaleFromPagePath(pagePath), "site.json");
}

function loadNavigationData(srcDir, pagePath) {
  return loadLocaleFile(srcDir, getLocaleFromPagePath(pagePath), "navigation.json");
}

function loadPageMeta(srcDir, pagePath) {
  const pageFile = resolvePageMetaFile(srcDir, pagePath);
  return existsSync(pageFile) ? readJson(pageFile) : {};
}

function assignRootValue(name, value, options) {
  if (options.data?.root) {
    options.data.root[name] = value;
  }

  return "";
}

function readJsonHelper(srcDir, name, targetPath, options) {
  if (!targetPath) {
    throw new Error(`json helper requires a path for "${name}"`);
  }

  const value = readJson(resolveDataPath(srcDir, targetPath));
  return assignRootValue(name, value, options);
}

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

function setHelper(name, options) {
  return assignRootValue(name, { ...options.hash }, options);
}

function resolveStylePath(pagePath) {
  const locale = getLocaleFromPagePath(pagePath);
  const pageKey = normalizePageKey(pagePath);
  const section = pageKey.split("/")[0];
  let styleName = section;

  if (pageKey === "index") {
    styleName = pagePath.startsWith("/en/") || pagePath.startsWith("/ko/") ? "home" : "landing";
  } else if (section === "blog" && pageKey !== "blog" && pageKey !== "blog/index") {
    styleName = "post";
  }

  return `../scss/${locale}/${styleName}.scss`;
}

function createHandlebarsHelpers(srcDir) {
  return {
    eq: (left, right) => left === right,
    includes: (list, value) => Array.isArray(list) && list.includes(value),
    array: (...values) => values.slice(0, -1),
    concat: (...values) => values.slice(0, -1).join(""),
    json: (name, targetPath, options) => readJsonHelper(srcDir, name, targetPath, options),
    jsonBlock: jsonBlockHelper,
    localeHomePath: resolveLocaleHomePath,
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
