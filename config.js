// config.js
export default {
  rootDir: "src",
  port: 3000,
  // basePath: 静的サイトを配置するベースパス
  // - "/": ドメイン直下に配備
  // - "/preview/": サブパス配備
  basePath: "/",
  outDir: "../dist",
  jsMinify: true, //jsファイルのminify
  cssMinify: true, //cssファイルのminify
  // hashMode: ハッシュの付与方式
  // - 'filename': ファイル名にハッシュを含める（既定、推奨）
  // - 'query': クエリパラメータでコンテンツハッシュを付与
  // - false: ハッシュを付与しない
  // - 環境変数 HASH_MODE または VITE_HASH_MODE を指定すると上書き可能
  hashMode: "filename",
  // sourceMap: 本番ビルドのソースマップ出力
  // - false: 出力しない（既定）
  // - true: 出力する
  // - 環境変数 VITE_SOURCEMAP=true|false で上書き可能
  sourceMap: false,
  assetsInlineLimit: 4096,
  imageExtensions: ["gif", "jpeg", "jpg", "png", "svg", "webp"],
  videoExtensions: ["mp4", "webm", "ogm", "mov"],
  assetPaths: {
    css: "assets/css/",
    js: "assets/js/",
    img: "assets/img/",
    video: "assets/video/",
    other: "assets/",
  },
};
