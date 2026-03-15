# Vite+ Pug Static Site Starter

`Vite+` を土台に、`Pug`、`SCSS`、`JavaScript` で静的サイトを構築するためのスターターテンプレートです。  
マルチページ出力、画像アセット処理、Sass partial、共通 JS エントリー、`vp` ベースの検証導線を最初から揃えています。

## 現在のツール解決結果

`vp --version` と lockfile 基準の現行解決値です。

- Node.js: `>=22`
- npm: `11.11.1`
- vite-plus: `0.1.11`
- vite: `8.0.0`
- rolldown: `1.0.0-rc.9`
- vitest: `4.1.0`

`vite-plus` / `vite-plus-core` / `vite-plus-test` は現時点の動作確認済みバージョンに固定しています。更新時は明示的にバージョンを上げ、`vp --version` と `vp check && vp test && vp build` で確認してください。

## 必要環境

- Node.js 22 系
- npm 11 系
- `vp` コマンドが使える環境

## クイックスタート

```bash
# 依存関係をインストール
vp install

# 開発サーバー
vp dev

# フォーマット / Lint / 型検査
vp check

# テスト
vp test

# 本番ビルド
vp build

# ビルド結果のプレビュー
vp preview
```

`npm run dev` / `npm run check` / `npm run test` / `npm run build` も用意していますが、このテンプレートの基本運用は `vp` を優先します。

## プロジェクト構成

```text
viteplus_template/
├── src/
│   ├── _layout.pug
│   ├── _partials/
│   ├── assets/
│   │   ├── css/
│   │   │   ├── main.scss
│   │   │   └── _partials/
│   │   ├── img/
│   │   └── js/
│   │       ├── main.js
│   │       └── components/
│   ├── dev/
│   │   └── index.pug
│   ├── build-system.test.js
│   └── index.pug
├── build-utils.js
├── config.js
├── scripts/
│   └── format-build-html.mjs
├── vite.config.ts
├── postcss.config.js
├── package.json
└── README.MD
```

## 開発フロー

### 1. ページを追加する

- 公開ページは `src/**/*.pug` に置きます
- `_` で始まる Pug ファイルは partial 扱いで単体出力されません
- 例:
  - `src/index.pug` → `/index.html`
  - `src/dev/index.pug` → `/dev/index.html`

### 2. レイアウトを使う

- 共通レイアウトは `src/_layout.pug`
- ヘッダーやフッターは `src/_partials/` に配置
- 各ページは `extends ./_layout.pug` で継承して `block contents` に中身を書きます

### 3. スタイルを追加する

- エントリーポイントは `src/assets/css/main.scss`
- ページ固有スタイルや共通 partial は `src/assets/css/_partials/` に分割します
- Sass glob import プラグインを使って partial をまとめて読み込めます

### 4. JavaScript を追加する

- エントリーポイントは `src/assets/js/main.js`
- 共通処理は `src/assets/js/components/` 以下に分割します
- 既定で GSAP / ScrollTrigger / Splide を導入済みです

## ビルドシステムの要点

### Vite+ ベース

- 設定ファイルは [vite.config.ts](./vite.config.ts)
- ビルドの共通ヘルパーは [build-utils.js](./build-utils.js)
- `defineConfig` は `vite-plus` から読み込みます
- 開発、検証、テスト、ビルドは `vp` コマンドで統一します

### Pug のマルチページ出力

- `vite-pug-static-builder` で Pug を静的 HTML に変換します
- `vite-plugin-glob-input` で `src/**/[^_]*.pug` を入力対象にしています
- `root` は `config.js` の `rootDir`、出力先は同じく `outDir` で管理します

### base path

- `config.js` の `basePath` で配備先のベースパスを管理します
- 既定値は `/` です
- `/preview/` のようなサブパス配備でも、Pug 内の `pathTo()` が内部リンクを追従します
- CSS / JS / 画像などのアセット URL は Vite の `base` 変換で追従します
- 必要なら `VITE_BASE_PATH=/preview/ vp build` のように環境変数で上書きできます

### アセット出力

- JS: `assets/js/`
- CSS: `assets/css/`
- 画像: `assets/img/`
- 動画: `assets/video/`
- その他: `assets/`

### ハッシュ付与

`config.js` の `hashMode` と環境変数で切り替えます。

- `filename`: 既定値。`main.HASH.js` のようにファイル名で付与
- `query`: `main.js?v=HASH` のようにコンテンツハッシュをクエリで付与
- `false` / `none` / `off`: ハッシュなし

優先順位は `VITE_HASH_MODE` / `HASH_MODE` > `config.js` です。

```bash
# ファイル名ハッシュに切り替える例
VITE_HASH_MODE=filename vp build
```

### 画像最適化

- `vite-plugin-image-sizes` を使って HTML 内の画像にサイズ属性を付与します
- `addLazyLoading: true` により `loading="lazy"` も付与します

### source map

- 既定では `build.sourcemap: false` です
- 公開ビルドで不要な内部情報を出さないことを優先しています
- 必要なときだけ `VITE_SOURCEMAP=true vp build` で有効化できます

### HTML 整形

`npm run build` は `vp build` の後に [scripts/format-build-html.mjs](./scripts/format-build-html.mjs) を実行し、`config.js` の `outDir` 配下にある HTML を整形します。  
配布物の HTML をざっと読みやすく保ちつつ、追加の整形ツール依存を増やさない構成です。

## 主要コマンド

| 目的 | 推奨コマンド | npm スクリプト |
|---|---|---|
| 依存関係インストール | `vp install` | なし |
| 開発サーバー | `vp dev` | `npm run dev` |
| 総合チェック | `vp check` | `npm run check` |
| テスト | `vp test` | `npm run test` |
| Lint のみ | `vp lint` | `npm run lint` |
| ビルド | `vp build` | `npm run build` |
| プレビュー | `vp preview` | `npm run preview` |

## CI

GitHub Actions は [.github/workflows/ci.yml](./.github/workflows/ci.yml) で管理しています。  
現在は Node.js 22 上で以下を実行します。

1. `npm ci`
2. `npm run check`
3. `npm run test`
4. `npm run build`

ローカル検証フローと CI の検証フローを揃えるため、`vp check` / `vp test` / `vp build` を npm スクリプト経由でも叩く構成にしています。
`src/build-system.test.js` では、base path、出力先解決、query ハッシュ付与の最低限の回帰を検証します。

## 現時点の運用メモ

- `vite-plus` 系の更新は明示的なバージョン更新で行ってください
- `baseline-browser-mapping` の更新警告が出る場合がありますが、現状はビルド失敗要因ではありません

## 変更時の確認手順

```bash
vp check
vp test
vp build
```

Pug / SCSS / JS / ビルド設定のどれを変更しても、この 3 つを最低ラインの確認手順にしてください。
