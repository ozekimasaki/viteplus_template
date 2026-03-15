import { readFile, writeFile } from "node:fs/promises";
import { cwd } from "node:process";
import { glob } from "glob";
import prettier from "prettier";
import { resolveOutputDirectory } from "../build-utils.js";
import config from "../config.js";

const outputDir = resolveOutputDirectory({
  projectRoot: cwd(),
  rootDir: config.rootDir,
  outDir: config.outDir,
});

const htmlFiles = await glob("**/*.html", {
  absolute: true,
  cwd: outputDir,
  nodir: true,
});

// Keep built JS/CSS minified; only normalize distributed HTML for inspection.
await Promise.all(
  htmlFiles.map(async (filePath) => {
    const source = await readFile(filePath, "utf-8");
    const resolvedOptions = (await prettier.resolveConfig(filePath)) ?? {};
    const formatted = await prettier.format(source, {
      ...resolvedOptions,
      filepath: filePath,
    });

    if (formatted !== source) {
      await writeFile(filePath, formatted, "utf-8");
    }
  }),
);
