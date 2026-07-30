# @kairoui/tokens — Package Output Audit Report

**Date:** 2026-07-30
**Package:** `@kairoui/tokens@0.0.0`
**Tarball size:** 86.5 kB (compressed), 537.4 kB (unpacked)

## Summary

All audit criteria pass. No blocking issues identified.

## Findings

### Framework Independence

| Check                          | Result                                                                           |
| ------------------------------ | -------------------------------------------------------------------------------- |
| React not a runtime dependency | PASS — not in package.json dependencies                                          |
| React not bundled              | PASS — `Select-String "react" dist/index.js` returns 0 matches                   |
| No DOM dependency              | PASS — no `document.`, `window.`, `HTMLElement`, `querySelector` in bundle       |
| No Node.js APIs bundled        | PASS — `writeFileSync`, `mkdirSync` etc. not in bundle                           |
| External config correct        | PASS — tsup externalizes `react`, `react-dom`, `react/jsx-runtime`, `@kairoui/*` |

### Package Exports

| Export Path                 | Target File                             | Exists |
| --------------------------- | --------------------------------------- | ------ |
| `.`                         | `./dist/index.js` + `./dist/index.d.ts` | Yes    |
| `./css`                     | `./dist/tokens.css`                     | Yes    |
| `./css/light`               | `./dist/themes/light.css`               | Yes    |
| `./css/dark`                | `./dist/themes/dark.css`                | Yes    |
| `./css/density/comfortable` | `./dist/density/comfortable.css`        | Yes    |
| `./css/density/standard`    | `./dist/density/standard.css`           | Yes    |
| `./css/density/compact`     | `./dist/density/compact.css`            | Yes    |
| `./manifest`                | `./dist/tokens.json`                    | Yes    |
| `./package.json`            | `./package.json`                        | Yes    |

### Generated Files Validity

| File                    | Validation                             |
| ----------------------- | -------------------------------------- |
| `dist/tokens.json`      | Valid JSON (parsed successfully)       |
| `dist/tokens.css`       | Contains `:root` declaration block     |
| `dist/themes/light.css` | 250 lines, valid CSS custom properties |
| `dist/themes/dark.css`  | 250 lines, valid CSS custom properties |
| `dist/density/*.css`    | 24 lines each, scoped density tokens   |

### Type Declarations

- `dist/index.d.ts`: 110.6 kB, covers all 67 named exports
- Key exports verified present: `lightTheme`, `darkTheme`, `blue`, `neutral`, `spacing`, `focusRing`, `activeRail`, `buttonTokens`, `surfaceTokens`

### Security & Privacy

| Check                                            | Result                     |
| ------------------------------------------------ | -------------------------- |
| No machine-specific paths in bundle              | PASS                       |
| No `import.meta.dirname`                         | PASS                       |
| No filesystem paths (`C:\`, `/home/`, `/Users/`) | PASS                       |
| Sourcemap does not expose private source         | PASS (relative paths only) |

### Bundle Quality

| Metric              | Value                                                |
| ------------------- | ---------------------------------------------------- |
| Format              | ESM only                                             |
| Default exports     | 0 (tree-shake friendly)                              |
| Named exports       | 67                                                   |
| Tree-shakeable      | Yes — all named exports, `sideEffects: ["**/*.css"]` |
| Build deterministic | Yes — identical hashes on consecutive builds         |
| Splitting           | Disabled (single entry, single chunk)                |

### Published Files

13 files included via `"files": ["dist"]`:

- `README.md` (auto-included by npm)
- `package.json` (auto-included by npm)
- `dist/index.js` — main ESM bundle (63.4 kB)
- `dist/index.js.map` — sourcemap (226.3 kB)
- `dist/index.d.ts` — TypeScript declarations (110.6 kB)
- `dist/index.css` — tsup artifact, `@import "./tokens.css"` (85 B)
- `dist/tokens.css` — combined CSS custom properties (29.9 kB)
- `dist/tokens.json` — machine-readable manifest (70.8 kB)
- `dist/themes/light.css` — light theme variables (14.1 kB)
- `dist/themes/dark.css` — dark theme variables (14.4 kB)
- `dist/density/comfortable.css` — comfortable density (844 B)
- `dist/density/compact.css` — compact density (834 B)
- `dist/density/standard.css` — standard density (848 B)

### Side Effects

`"sideEffects": ["**/*.css"]` — correctly marks CSS files as side-effectful while allowing JS to be tree-shaken.

### Dependencies

- **Runtime dependencies:** None (empty `dependencies`)
- **Undeclared imports in source:** None in production code
  - `vitest` import in `color-test-utils.ts` — test-only file, excluded from build
  - `node:fs`/`node:path` in `generate-css.ts` — build script, not bundled

### Metadata

| Field     | Value                          | Status                                          |
| --------- | ------------------------------ | ----------------------------------------------- |
| `name`    | `@kairoui/tokens`              | OK                                              |
| `version` | `0.0.0`                        | OK (pre-release)                                |
| `private` | `true`                         | OK (not published yet)                          |
| `license` | `SEE LICENSE IN ../../LICENSE` | OK — LICENSE file exists at repo root           |
| `type`    | `module`                       | OK — ESM package                                |
| `main`    | `./dist/index.js`              | OK — fallback for tools that don't read exports |
| `module`  | `./dist/index.js`              | OK — bundler hint                               |
| `types`   | `./dist/index.d.ts`            | OK — fallback for older TS                      |

## Non-Blocking Observations

1. **`dist/index.css` (85 bytes):** tsup generates this from CSS `@import` statements in source. Contains only `@import "./tokens.css"`. Harmless — consumers use the exports map, not direct file access. Not worth suppressing as it doesn't bloat the package.

2. **Sourcemap size (226.3 kB):** Larger than the JS itself. Acceptable for a design token package — aids debugging token references. Could be excluded from published package in future if size becomes a concern.

3. **Bundle size (63.4 kB JS):** Reasonable for 67 exported token objects including validation utilities, contrast checking, and CSS generation helpers. Tree-shaking allows consumers to import only what they need.

## Changes Made

No blocking issues required changes to the package structure. The audit confirms the package is ready for its first publish when the time comes.
