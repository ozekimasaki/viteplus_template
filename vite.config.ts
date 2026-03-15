import { readFile, writeFile } from "node:fs/promises";
import { cwd, env } from "node:process";
import { glob } from "glob";
import { defineConfig, type Plugin } from "vite-plus";
import pugPlugin from "vite-pug-static-builder";
import globInput from "vite-plugin-glob-input";
import sassGlobImports from "vite-plugin-sass-glob-import";
import imageSizes from "vite-plugin-image-sizes";
import {
  createTemplateLocals,
  normalizeBasePath,
  normalizeBooleanFlag,
  normalizeHashMode,
  resolveOutputDirectory,
  rewriteHtmlAssetUrls,
} from "./build-utils.js";
import config from "./config.js";

// 環境変数優先でハッシュ付与方式を決定
const envHashMode = normalizeHashMode(env.VITE_HASH_MODE) ?? normalizeHashMode(env.HASH_MODE);
const resolvedHashMode = envHashMode ?? config.hashMode;
const resolvedSourceMap = normalizeBooleanFlag(env.VITE_SOURCEMAP) ?? config.sourceMap ?? false;
const resolvedBasePath = normalizeBasePath(env.VITE_BASE_PATH ?? config.basePath);
const resolvedOutputDir = resolveOutputDirectory({
  projectRoot: cwd(),
  rootDir: config.rootDir,
  outDir: config.outDir,
});
const pugLocals = createTemplateLocals(resolvedBasePath);

// hashMode に基づいてファイル名のハッシュサフィックスを決定
// 'filename' の場合のみファイル名にハッシュを含める
const hashSuffix = resolvedHashMode === "filename" ? ".[hash]" : "";

// カスタムプラグイン：ビルド後のHTMLにクエリパラメータを追加
const queryHashPlugin = (): Plugin => {
  return {
    name: "query-hash",
    apply: "build",
    // closeBundle: すべてのプラグイン処理完了後に実行
    async closeBundle() {
      const htmlFiles = await glob("**/*.html", {
        absolute: true,
        cwd: resolvedOutputDir,
        nodir: true,
      });

      // 並列処理でHTMLファイルを更新
      await Promise.all(
        htmlFiles.map(async (file) => {
          const html = await readFile(file, "utf-8");
          const newHtml = await rewriteHtmlAssetUrls(html, {
            outputDir: resolvedOutputDir,
            basePath: resolvedBasePath,
            versionedExtensions: [
              ...config.imageExtensions,
              ...config.videoExtensions,
              "css",
              "js",
            ],
          });
          if (html !== newHtml) {
            await writeFile(file, newHtml, "utf-8");
          }
        }),
      );
    },
  };
};

const plugins = [
  ...pugPlugin({
    build: {
      options: {
        basedir: `./${config.rootDir}`,
      },
      locals: pugLocals,
    },
    serve: {
      options: {
        basedir: `./${config.rootDir}`,
      },
      locals: pugLocals,
    },
  }),
  globInput({
    patterns: `${config.rootDir}/**/[^_]*.pug`,
  }),
  sassGlobImports(),
  imageSizes({
    addLazyLoading: true,
  }),
  ...(resolvedHashMode === "query" ? [queryHashPlugin()] : []),
];

export default defineConfig({
  test: {
    include: ["**/*.test.js"],
  },
  run: {
    tasks: {
      quality: {
        command: "vp check && vp test && vp run format:templates:check",
        cache: false,
      },
      ci: {
        command: "vp run quality && vp run build:dist",
        cache: false,
      },
    },
  },
  staged: {
    "**/*.{js,mjs,cjs,jsx,ts,tsx,scss,css,html,json}": "vp check --fix",
    "**/*.pug": "vp exec prettier --plugin=@prettier/plugin-pug --write",
    "**/*.{md,mdc,MD}": "vp exec prettier --write",
    "README.MD": "vp exec prettier --write",
  },
  lint: {
    plugins: ["unicorn", "oxc"],
    categories: {
      correctness: "error",
      suspicious: "warn",
    },
    rules: {
      "getter-return": "error",
      "no-case-declarations": "error",
      "no-empty": "error",
      "no-fallthrough": "error",
      "no-prototype-builtins": "error",
      "no-redeclare": "error",
      "no-regex-spaces": "error",
      "no-undef": "error",
      "no-unexpected-multiline": "error",
      "no-unreachable": "error",
      "no-console": "warn",
    },
    env: {
      builtin: true,
      es2026: true,
      browser: true,
    },
    globals: {
      AudioWorkletGlobalScope: "readonly",
      AudioWorkletProcessor: "readonly",
      currentFrame: "readonly",
      currentTime: "readonly",
      registerProcessor: "readonly",
      sampleRate: "readonly",
      WorkletGlobalScope: "readonly",
    },
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  root: config.rootDir,
  base: resolvedBasePath,
  server: {
    port: config.port,
    watch: {
      usePolling: env.VITE_USE_POLLING === "true",
    },
  },
  build: {
    outDir: config.outDir,
    emptyOutDir: true,
    sourcemap: resolvedSourceMap,
    minify: config.jsMinify ? "oxc" : false,
    cssMinify: config.cssMinify,
    assetsInlineLimit: config.assetsInlineLimit,
    rolldownOptions: {
      output: {
        entryFileNames: `${config.assetPaths.js}[name]${hashSuffix}.js`,
        chunkFileNames: `${config.assetPaths.js}[name]${hashSuffix}.js`,
        assetFileNames: (assetInfo) => {
          const name = assetInfo.name ?? assetInfo.names?.[0] ?? "";
          // Prevent emitting standalone SVGs under src/_svg/; they are inlined via Pug
          if (name && name.includes("_svg/")) {
            return `${config.assetPaths.other}[name]${hashSuffix}.[ext]`;
          }
          if (name && config.imageExtensions.some((ext) => name.endsWith(`.${ext}`))) {
            return `${config.assetPaths.img}[name]${hashSuffix}.[ext]`;
          }
          if (name && name.endsWith(".css")) {
            return `${config.assetPaths.css}[name]${hashSuffix}.[ext]`;
          }
          if (name && config.videoExtensions.some((ext) => name.endsWith(`.${ext}`))) {
            return `${config.assetPaths.video}[name]${hashSuffix}.[ext]`;
          }
          return `${config.assetPaths.other}[name]${hashSuffix}.[ext]`;
        },
      },
    },
  },
  plugins,
});
