<!--VITE PLUS START-->

# Vite+ First Project Instructions

This repository is a Vite+ first static-site starter built with `Pug`, `SCSS`, and `JavaScript`.
Treat `vp` as the primary interface for runtime management, dependency installation, development, quality checks, hooks, CI, and production builds.

## Current Project Shape

- Runtime is pinned with `.node-version` to Node.js `22`
- Dependency installation is standardized on `vp install`
- Quality checks are standardized on `vp run quality`
- Distributable builds are standardized on `vp run build:dist`
- CI is standardized on `vp run ci`
- `CLAUDE.md` and `.cursor/rules/viteplus.mdc` point at this file

## Standard Workflow

Run these in order for normal local work:

1. `vp env install`
2. `vp install`
3. `vp dev`
4. `vp run quality`
5. `vp run build:dist`

If the runtime looks wrong, check it with `vp env current`.

## Task Map

These tasks are defined by the current repo configuration:

- `vp run quality`
  - Runs `vp check`
  - Runs `vp test`
  - Runs `vp run format:templates:check`
- `vp run build:dist`
  - Runs `vp build`
  - Runs `node scripts/format-build-html.mjs`
- `vp run ci`
  - Runs `vp run quality`
  - Runs `vp run build:dist`

## Formatting, Linting, and Testing

Use the tools according to file type:

- JS / SCSS / HTML
  - Use `vp check`, `vp lint`, and `vp fmt`
- Pug / Markdown
  - Use `vp run format:templates`
  - Use `vp run format:templates:check`

Important distinction:

- `vp build` is the raw Vite build
- `vp run build:dist` is the distributable build for this template

Do not replace `vp run build:dist` with `vp build` when the user is asking for the final deliverable build.

## Files That Matter Most

- `vite.config.ts`
  - Source of truth for `build`, `test`, `run`, and `staged`
- `config.js`
  - Build-time site options such as `basePath`, `hashMode`, and output paths
- `scripts/format-build-html.mjs`
  - Post-build formatter for `dist/**/*.html` only
- `.github/workflows/ci.yml`
  - Mirrors the local `vp` workflow in CI
- `package.json`
  - Provides the current `vp`-based script aliases

## Rules for Agents

- Always prefer `vp` over `npm`, `pnpm`, `yarn`, `npx`, or direct tool binaries when a Vite+ equivalent exists
- Do not install `vitest`, `oxlint`, `oxfmt`, or `tsdown` directly
- Do not use package-manager-specific install commands for normal project work; use `vp install`
- For CI-like validation, use `vp run ci`
- For normal pre-commit validation, use `vp run quality`
- For template-only formatting, use `vp run format:templates`
- Keep runtime assumptions aligned with `.node-version`
- If you add new workflow steps, prefer defining them in `vite.config.ts` `run.tasks` before inventing new ad hoc commands

## Common Pitfalls in This Repo

- Running `vp build` and assuming the build is ready for delivery
  - It is not; delivery uses `vp run build:dist`
- Sending Pug files through only `vp check`
  - Pug formatting is covered by the template formatting task, not by `vp check`
- Using direct `prettier` commands in documentation or workflow guidance
  - Prefer the existing `vp run format:templates` entry points
- Describing CI with `npm ci` or `npm run ...`
  - The current CI path is `vp install --frozen-lockfile` then `vp run ci`

## Review Checklist for Agents

- [ ] Run `vp env install` if the runtime may not match `.node-version`
- [ ] Run `vp install` after dependency or lockfile changes
- [ ] Run `vp run quality` for code, template, or config changes
- [ ] Run `vp run build:dist` when touching build, templates, assets, or delivery behavior
- [ ] Keep docs and examples aligned with `vp run quality`, `vp run build:dist`, and `vp run ci`

<!--VITE PLUS END-->
