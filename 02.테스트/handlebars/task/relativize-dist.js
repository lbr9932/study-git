import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { extname, resolve, relative, dirname, sep } from "node:path";

const distDir = resolve(process.cwd(), "dist");

function walk(dir) {
  const files = [];

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = resolve(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...walk(fullPath));
      continue;
    }

    if (entry.isFile()) {
      files.push(fullPath);
    }
  }

  return files;
}

function toRelativePath(fromFile, targetUrl) {
  if (!targetUrl.startsWith("/") || targetUrl.startsWith("//")) {
    return targetUrl;
  }

  const currentDir = dirname(fromFile);
  const normalizedTarget = targetUrl === "/" ? "/index.html" : targetUrl;
  const targetPath = resolve(distDir, `.${normalizedTarget}`);
  const isDirectoryLike = normalizedTarget.endsWith("/");

  if (!existsSync(targetPath) && !existsSync(`${targetPath}.html`) && !existsSync(targetPath)) {
    return targetUrl;
  }

  const actualTarget = existsSync(targetPath) ? targetPath : `${targetPath}.html`;
  let output = relative(currentDir, actualTarget).split(sep).join("/");

  if (!output) {
    output = "./";
  } else if (!output.startsWith(".") && !output.startsWith("..")) {
    output = `./${output}`;
  }

  if (isDirectoryLike && !output.endsWith("/")) {
    output = `${output}/`;
  }

  return output;
}

function rewriteHtml(filePath) {
  const original = readFileSync(filePath, "utf8");
  const updated = original
    .replace(/\s+crossorigin(?=(\s|>|\/>))/g, "")
    .replace(
      /\b(href|src|action|poster)=("([^"]*)"|'([^']*)')/g,
      (match, attr, quoted, doubleQuoted, singleQuoted) => {
        const value = doubleQuoted ?? singleQuoted ?? "";
        const rewritten = toRelativePath(filePath, value);
        if (rewritten === value) {
          return match;
        }

        return `${attr}=${quoted[0]}${rewritten}${quoted[0]}`;
      },
    );

  if (updated !== original) {
    writeFileSync(filePath, updated);
  }
}

function rewriteCss(filePath) {
  const original = readFileSync(filePath, "utf8");
  const updated = original.replace(/url\((['"]?)(\/[^)'"]+)\1\)/g, (match, quote, value) => {
    const rewritten = toRelativePath(filePath, value);
    if (rewritten === value) {
      return match;
    }

    return `url(${quote}${rewritten}${quote})`;
  });

  if (updated !== original) {
    writeFileSync(filePath, updated);
  }
}

for (const filePath of walk(distDir)) {
  const extension = extname(filePath);

  if (extension === ".html") {
    rewriteHtml(filePath);
  } else if (extension === ".css") {
    rewriteCss(filePath);
  }
}
