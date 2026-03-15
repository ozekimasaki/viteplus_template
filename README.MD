# Vite+ Pug Static Site Starter

`Vite+` を主導線に、`Pug`、`SCSS`、`JavaScript` で静的サイトを構築するスターターテンプレートです。  
マルチページ出力、画像アセット処理、Sass partial、共通 JS エントリーに加え、runtime 管理、品質チェック、CI、hook を `vp` ベースで揃えています。

## Vite+ を使う利点

- runtime 管理、依存同期、dev、check、test、build、CI までを `vp` に寄せられる
- `vite.config.ts` に build だけでなく `run` と `staged` も集約できる
- ローカル、pre-commit、CI の判定基準を同じコマンドに揃えやすい
- `vp build` とテンプレート独自の `vp run build:dist` を分離し、責務を混ぜずに済む
- package manager を直接意識しない運用へ寄せられる

## このテンプレートの方針

- runtime は `.node-version` で Node 22 系に固定
- 依存関係管理は `vp install` を標準導線に統一
- JS / SCSS / HTML 系の品質確認は `vp check`
- `Pug` と `Markdown` の整形は `vp run format:templates(:check)`
- 純粋な build は `vp build`
- 配布用 build は `vp run build:dist`
- CI は `vp install --frozen-lockfile` と `vp run ci`

## エコシステム最大活用ポイント

このテンプレートでは、Vite+ の主要機能を次の役割で使い分けます。

- `vp env`
  - Node version を `.node-version` と同期し、ローカル差分を抑える
- `vp install`
  - lockfile と `packageManager` を基準に依存関係同期の入口を一本化する
- `vp check` / `vp test`
  - JS / SCSS / HTML 系の品質確認を Vite+ 側へ寄せる
- `run.tasks`
  - `quality` と `ci` を task 化して、日常運用の標準コマンドを短く保つ
- `staged`
  - staged file ごとに Vite+ と Prettier の役割を分ける
- `setup-vp`
  - GitHub Actions でもローカルと同じ入口を使う

この方針により、「ページ制作のテンプレート」ではなく「制作フロー込みのテンプレート」として扱えるようにしています。

## 現在のツール解決結果

`vp --version` と lockfile 基準の現行解決値です。

- Node.js: `22`
- npm: `11.11.1`
- vite-plus: `0.1.11`
- vite: `8.0.0`
- rolldown: `1.0.0-rc.9`
- vitest: `4.1.0`

`vite-plus` / `vite-plus-core` / `vite-plus-test` は動作確認済みバージョンに固定しています。更新時は明示的にバージョンを上げ、`vp run ci` で確認してください。

## 必要環境

- `vp` コマンドが使える環境
- `.node-version` に従って Node.js 22 系を使えること

## クイックスタート

```bash
# .node-version に合わせて Node.js を導入
vp env install

# 依存関係を同期
vp install

# 開発サーバー
vp dev

# 品質チェック一式
vp run quality

# 配布用ビルド
vp run build:dist
```

低レベルコマンドとして `vp check` / `vp test` / `vp build` も使えます。  
このテンプレートでは、日常運用は `vp run quality` と `vp run build:dist` を基準にする想定です。

## 標準コマンドの考え方

- `vp dev`
  - 実装中の通常導線
- `vp run quality`
  - commit 前に通す品質ゲート
- `vp run build:dist`
  - 納品物や preview 前の配布 build
- `vp run ci`
  - CI 相当のフルフロー確認

単発で個別確認したいときだけ `vp check`、`vp test`、`vp build` を直接使います。

## プロジェクト構成

```text
viteplus_template/
├── src/
│   ├── _layout.pug
│   ├── _partials/
│   ├── assets/
│   │   ├── css/
│   │   ├── img/
│   │   └── js/
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
├── .node-version
└── README.MD
```

## 主要ワークフロー

### 1. runtime を揃える

```bash
vp env install
```

- `.node-version` に合わせて Node.js を導入します
- `vp env current` で現在の解決結果を確認できます
- runtime を固定しておくと、`vite.config.ts` や plugin 解決の差分を追いにくくなりません

### 2. 依存関係を同期する

```bash
vp install
```

- `packageManager` と lockfile を見て適切な package manager を選びます
- CI では `vp install --frozen-lockfile` を使います
- package manager を直接叩かない前提にしておくと、README と運用ルールがぶれません

### 3. 開発する

```bash
vp dev
```

- `src/**/*.pug` を静的 HTML として扱います
- `_` で始まる Pug は partial 扱いで単体出力されません
- `src/assets/css/main.scss` と `src/assets/js/main.js` が入口です
- `src/dev/index.pug` はサブディレクトリ出力の確認用です

### 4. 品質を確認する

```bash
vp run quality
```

内部では次を実行します。

1. `vp check`
2. `vp test`
3. `vp run format:templates:check`

`vp check` は JS / SCSS / HTML 系の format, lint, type check をまとめて確認します。  
`Pug` と `Markdown` は `vp run format:templates:check` で補完します。

この分離により、Oxfmt / Oxlint と Prettier の責務を混ぜずに運用できます。

### 5. 配布用に build する

```bash
vp run build:dist
```

- `vp build` で Vite build を実行します
- その後 `scripts/format-build-html.mjs` で `dist/**/*.html` だけを整形します
- 生成済みの JS / CSS は minified のまま維持します
- `config.js` の `basePath`、`hashMode`、`sourceMap` は build 時の振る舞いをまとめて制御します

`vp build` は純粋な Vite build、`vp run build:dist` はこのテンプレート向けの配布 build です。

## フォーマット方針

### Vite+ 側

- `vp check`
- `vp lint`
- `vp fmt`

これらを JS / SCSS / HTML 系の標準導線にします。

### Prettier 側

```bash
vp run format:templates
vp run format:templates:check
```

- `src/**/*.pug`
- `README.MD`
- `*.{md,mdc}`

だけを対象にします。  
JS / SCSS を Prettier に戻さず、Oxfmt / Oxlint と責務を分けています。

## Git Hooks

- `prepare` で `vp config` を実行します
- pre-commit は `.vite-hooks/pre-commit` から `vp staged` を呼びます
- staged ファイルは [vite.config.ts](./vite.config.ts) の `staged` 設定で振り分けます

## このテンプレートを進化させるなら

- `vite.config.ts`
  - `run.tasks` を増やして、画像生成や配布前チェックなどの運用を `vp run` に寄せる
- `config.js`
  - 環境差分を増やしたい場合でも、build オプションはここに集約して分散を防ぐ
- `src/`
  - ページ追加や partial 分割を進めても、運用コマンドは変えずに済む
- `.github/workflows/ci.yml`
  - deploy job を追加しても `vp run ci` を前段に固定しやすい

## 主要コマンド

| 目的                    | 推奨コマンド                    | 補足                            |
| ----------------------- | ------------------------------- | ------------------------------- |
| runtime 導入            | `vp env install`                | `.node-version` を参照          |
| 依存関係同期            | `vp install`                    | CI は `--frozen-lockfile`       |
| 開発サーバー            | `vp dev`                        |                                 |
| 品質チェック一式        | `vp run quality`                | `check + test + template check` |
| JS / SCSS / HTML の確認 | `vp check`                      |                                 |
| テンプレート整形確認    | `vp run format:templates:check` | `Pug / Markdown` 用             |
| 純粋な build            | `vp build`                      | Vite build のみ                 |
| 配布用 build            | `vp run build:dist`             | HTML 整形込み                   |
| CI 相当の実行           | `vp run ci`                     |                                 |
| プレビュー              | `vp preview`                    |                                 |

## CI

GitHub Actions は `.github/workflows/ci.yml` で管理しています。  
`voidzero-dev/setup-vp@v1` を使い、以下の順に実行します。

1. `vp install --frozen-lockfile`
2. `vp run ci`

`vp run ci` は `quality` と `build:dist` をまとめて実行します。

## npm スクリプトについて

`package.json` には互換用の npm scripts も残していますが、標準運用は `vp` を優先します。

- `npm run build` は `vp run build:dist` の alias
- `npm run format` は `vp run format:templates` の alias
- `npm run format:check` は `vp run format:templates:check` の alias

## 変更時の最低確認手順

```bash
vp run quality
vp run build:dist
```

Pug / SCSS / JS / ビルド設定のどれを変更しても、この 2 つを最低ラインの確認手順にしてください。
