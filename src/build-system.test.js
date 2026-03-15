import { Buffer } from "node:buffer";
import { afterEach, describe, expect, test } from "vite-plus/test";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  createContentHash,
  createTemplateLocals,
  resolveOutputDirectory,
  rewriteHtmlAssetUrls,
} from "../build-utils.js";

const tempDirs = [];

afterEach(async () => {
  await Promise.all(
    tempDirs.splice(0).map(async (directory) => {
      await rm(directory, { recursive: true, force: true });
    }),
  );
});

describe("build system helpers", () => {
  test("createTemplateLocals joins internal paths with the configured base path", () => {
    const locals = createTemplateLocals("/preview");

    expect(locals.basePath).toBe("/preview/");
    expect(locals.pathTo("/")).toBe("/preview/");
    expect(locals.pathTo("/dev/")).toBe("/preview/dev/");
    expect(locals.pathTo("assets/js/main.js")).toBe("/preview/assets/js/main.js");
    expect(locals.pathTo("#section")).toBe("#section");
  });

  test("resolveOutputDirectory keeps output resolution tied to rootDir and outDir", () => {
    const projectRoot = path.join(path.sep, "workspace", "example");
    const outputDir = resolveOutputDirectory({
      projectRoot,
      rootDir: "src",
      outDir: "../public",
    });

    expect(outputDir).toBe(path.resolve(projectRoot, "src", "../public"));
  });

  test("rewriteHtmlAssetUrls appends stable content hashes for base-prefixed assets", async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "viteplus-build-system-"));
    tempDirs.push(tempDir);

    const outputDir = path.join(tempDir, "dist");
    await mkdir(path.join(outputDir, "assets/js"), { recursive: true });
    await mkdir(path.join(outputDir, "assets/css"), { recursive: true });
    await mkdir(path.join(outputDir, "assets/img"), { recursive: true });

    const jsSource = "console.log('main');";
    const cssSource = "body { color: #111; }";
    const imageSource = Buffer.from("image-binary");

    await writeFile(path.join(outputDir, "assets/js/main.js"), jsSource, "utf-8");
    await writeFile(path.join(outputDir, "assets/css/main.css"), cssSource, "utf-8");
    await writeFile(path.join(outputDir, "assets/img/img_sample.jpg"), imageSource);

    const html = [
      '<script src="/preview/assets/js/main.js"></script>',
      '<link rel="stylesheet" href="/preview/assets/css/main.css">',
      '<img src="/preview/assets/img/img_sample.jpg" srcset="/preview/assets/img/img_sample.jpg 1x">',
      '<a href="https://example.com/app.css">external</a>',
    ].join("");

    const rewritten = await rewriteHtmlAssetUrls(html, {
      outputDir,
      basePath: "/preview/",
      versionedExtensions: ["jpg", "css", "js"],
    });

    expect(rewritten).toContain(
      `/preview/assets/js/main.js?v=${createContentHash(Buffer.from(jsSource))}`,
    );
    expect(rewritten).toContain(
      `/preview/assets/css/main.css?v=${createContentHash(Buffer.from(cssSource))}`,
    );
    expect(rewritten).toContain(
      `/preview/assets/img/img_sample.jpg?v=${createContentHash(imageSource)} 1x`,
    );
    expect(rewritten).toContain('href="https://example.com/app.css"');
  });
});
