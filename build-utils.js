import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const normalizeHashMode = (mode) => {
  if (mode === undefined) return undefined;
  const normalized = String(mode).toLowerCase();

  if (normalized === "filename" || normalized === "query") {
    return normalized;
  }

  if (normalized === "false" || normalized === "none" || normalized === "off") {
    return false;
  }

  return undefined;
};

export const normalizeBooleanFlag = (value) => {
  if (value === undefined) return undefined;

  const normalized = String(value).toLowerCase();
  if (normalized === "true" || normalized === "1" || normalized === "on") {
    return true;
  }

  if (normalized === "false" || normalized === "0" || normalized === "off") {
    return false;
  }

  return undefined;
};

export const normalizeBasePath = (value = "/") => {
  let normalized = String(value).trim().replace(/\\/g, "/");

  if (normalized === "") {
    return "/";
  }

  if (!normalized.startsWith("/")) {
    normalized = `/${normalized}`;
  }

  normalized = normalized.replace(/\/{2,}/g, "/");

  if (!normalized.endsWith("/")) {
    normalized = `${normalized}/`;
  }

  return normalized;
};

const isExternalUrl = (value) => /^(?:[a-z]+:)?\/\//i.test(value);

export const withBasePath = (basePath, targetPath = "/") => {
  const normalizedBasePath = normalizeBasePath(basePath);
  const normalizedTargetPath = String(targetPath).trim().replace(/\\/g, "/");

  if (
    normalizedTargetPath === "" ||
    normalizedTargetPath === "/" ||
    normalizedTargetPath === "./"
  ) {
    return normalizedBasePath;
  }

  if (
    isExternalUrl(normalizedTargetPath) ||
    normalizedTargetPath.startsWith("#") ||
    normalizedTargetPath.startsWith("mailto:") ||
    normalizedTargetPath.startsWith("tel:")
  ) {
    return normalizedTargetPath;
  }

  const relativeTarget = normalizedTargetPath.replace(/^\/+/, "");
  if (normalizedBasePath === "/") {
    return `/${relativeTarget}`;
  }

  return `${normalizedBasePath}${relativeTarget}`;
};

export const createTemplateLocals = (basePath) => {
  const normalizedBasePath = normalizeBasePath(basePath);

  return {
    basePath: normalizedBasePath,
    pathTo: (targetPath = "/") => withBasePath(normalizedBasePath, targetPath),
  };
};

export const resolveOutputDirectory = ({ projectRoot, rootDir, outDir }) =>
  path.resolve(projectRoot, rootDir, outDir);

export const createContentHash = (source) =>
  createHash("sha256").update(source).digest("hex").slice(0, 10);

const splitUrlParts = (url) => {
  const hashIndex = url.indexOf("#");
  const hash = hashIndex === -1 ? "" : url.slice(hashIndex);
  const withoutHash = hashIndex === -1 ? url : url.slice(0, hashIndex);
  const queryIndex = withoutHash.indexOf("?");

  return {
    pathname: queryIndex === -1 ? withoutHash : withoutHash.slice(0, queryIndex),
    query: queryIndex === -1 ? "" : withoutHash.slice(queryIndex + 1),
    hash,
  };
};

const appendVersionQuery = (url, version) => {
  const { pathname, query, hash } = splitUrlParts(url);
  const params = new URLSearchParams(query);
  params.set("v", version);
  const serialized = params.toString();

  return serialized === "" ? `${pathname}${hash}` : `${pathname}?${serialized}${hash}`;
};

const resolveVersionedAssetFile = (url, { basePath, outputDir, versionedExtensions }) => {
  if (url === "" || isExternalUrl(url) || url.startsWith("data:") || url.startsWith("#")) {
    return null;
  }

  const { pathname } = splitUrlParts(url);
  if (pathname === "" || pathname.endsWith("/")) {
    return null;
  }

  const normalizedBasePath = normalizeBasePath(basePath);
  const normalizedPathname = pathname.replace(/\\/g, "/");

  let relativePath;
  if (normalizedPathname.startsWith("/")) {
    if (normalizedBasePath === "/") {
      relativePath = normalizedPathname.slice(1);
    } else if (normalizedPathname.startsWith(normalizedBasePath)) {
      relativePath = normalizedPathname.slice(normalizedBasePath.length);
    } else {
      return null;
    }
  } else {
    return null;
  }

  const extension = path.extname(relativePath).slice(1).toLowerCase();
  if (!versionedExtensions.has(extension)) {
    return null;
  }

  return path.resolve(outputDir, relativePath);
};

const replaceAsync = async (input, pattern, replacer) => {
  const matches = [...input.matchAll(pattern)];
  if (matches.length === 0) {
    return input;
  }

  const replacements = await Promise.all(
    matches.map((match) => replacer(...match, match.index, match.input)),
  );

  let result = "";
  let lastIndex = 0;
  matches.forEach((match, index) => {
    const start = match.index ?? 0;
    result += input.slice(lastIndex, start);
    result += replacements[index];
    lastIndex = start + match[0].length;
  });
  result += input.slice(lastIndex);

  return result;
};

const rewriteSrcsetValue = async (value, rewriteUrl) => {
  const candidates = value
    .split(",")
    .map((candidate) => candidate.trim())
    .filter(Boolean);

  const rewritten = await Promise.all(
    candidates.map(async (candidate) => {
      const [url, ...descriptor] = candidate.split(/\s+/);
      const nextUrl = await rewriteUrl(url);
      return [nextUrl, ...descriptor].join(" ");
    }),
  );

  return rewritten.join(", ");
};

export const rewriteHtmlAssetUrls = async (html, { outputDir, basePath, versionedExtensions }) => {
  const extensions = new Set(
    [...versionedExtensions].map((extension) => String(extension).toLowerCase()),
  );
  const versionCache = new Map();

  const rewriteUrl = async (url) => {
    const assetFile = resolveVersionedAssetFile(url, {
      basePath,
      outputDir,
      versionedExtensions: extensions,
    });

    if (!assetFile) {
      return url;
    }

    let version = versionCache.get(assetFile);
    if (!version) {
      const source = await readFile(assetFile);
      version = createContentHash(source);
      versionCache.set(assetFile, version);
    }

    return appendVersionQuery(url, version);
  };

  const attrPattern = /\b(src|href|poster)=(["'])([^"']+)\2/gi;
  const srcsetPattern = /\bsrcset=(["'])([^"']+)\1/gi;

  const withAttrs = await replaceAsync(html, attrPattern, async (match, attr, quote, url) => {
    const nextUrl = await rewriteUrl(url);
    return `${attr}=${quote}${nextUrl}${quote}`;
  });

  return replaceAsync(withAttrs, srcsetPattern, async (match, quote, value) => {
    const nextValue = await rewriteSrcsetValue(value, rewriteUrl);
    return `srcset=${quote}${nextValue}${quote}`;
  });
};
