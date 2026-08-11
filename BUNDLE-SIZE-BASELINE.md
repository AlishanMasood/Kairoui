# KairoUI Bundle Size Baseline

Generated: 2026-08-11

## Package Output Sizes

### @kairoui/utils

| File      | Raw      | Minified | Gzip    |
| --------- | -------- | -------- | ------- |
| index.js  | 16.58 KB | 9.20 KB  | 2.96 KB |
| dom.js    | 10.10 KB | 5.44 KB  | 2.01 KB |
| events.js | 3.97 KB  | 2.37 KB  | 897 B   |

### @kairoui/tokens

| File            | Raw      | Minified | Gzip    |
| --------------- | -------- | -------- | ------- |
| index.js        | 61.87 KB | 33.53 KB | 8.82 KB |
| tokens.css      | 29.22 KB | 27.41 KB | 2.91 KB |
| light.css       | 13.75 KB | 12.90 KB | 1.99 KB |
| dark.css        | 14.02 KB | 13.15 KB | 2.03 KB |
| comfortable.css | 844 B    | 712 B    | 244 B   |
| standard.css    | 848 B    | 715 B    | 243 B   |
| compact.css     | 834 B    | 701 B    | 238 B   |

### @kairoui/theme

| File      | Raw      | Minified | Gzip    |
| --------- | -------- | -------- | ------- |
| index.js  | 46.06 KB | 24.60 KB | 7.00 KB |
| dom.js    | 15.63 KB | 6.77 KB  | 2.18 KB |
| server.js | 5.40 KB  | 3.34 KB  | 1.13 KB |

### @kairoui/hooks

| File     | Raw     | Minified | Gzip    |
| -------- | ------- | -------- | ------- |
| index.js | 6.42 KB | 3.05 KB  | 1.37 KB |

### @kairoui/icons

| File     | Raw  | Minified | Gzip |
| -------- | ---- | -------- | ---- |
| index.js | 68 B | 14 B     | 34 B |

### @kairoui/core

| File           | Raw      | Minified | Gzip    |
| -------------- | -------- | -------- | ------- |
| index.js       | 14.09 KB | 6.90 KB  | 2.29 KB |
| composition.js | 28.98 KB | 14.83 KB | 5.20 KB |
| styles.css     | 4.54 KB  | 3.75 KB  | 1.01 KB |

### Totals

|              | Raw       | Minified  | Gzip     |
| ------------ | --------- | --------- | -------- |
| All packages | 273.16 KB | 169.33 KB | 42.51 KB |

## Consumer Bundle Sizes (tree-shaken, minified)

Simulated consumer importing specific APIs, bundled with esbuild.

| Scenario         | Minified | Gzip     |
| ---------------- | -------- | -------- |
| single-utility   | 72 B     | 92 B     |
| single-hook      | 1.09 KB  | 623 B    |
| theme-only       | 37.59 KB | 10.34 KB |
| composition-only | 4.01 KB  | 1.64 KB  |
| styling-only     | 3.83 KB  | 1.57 KB  |

## CSS Size Breakdown

| File                 | Raw      | Minified | Gzip    |
| -------------------- | -------- | -------- | ------- |
| Component styles     | 4.54 KB  | 3.75 KB  | 1.01 KB |
| Token variables      | 29.22 KB | 27.41 KB | 2.91 KB |
| Light theme          | 13.75 KB | 12.90 KB | 1.99 KB |
| Dark theme           | 14.02 KB | 13.15 KB | 2.03 KB |
| Density: comfortable | 844 B    | 712 B    | 244 B   |
| Density: standard    | 848 B    | 715 B    | 243 B   |
| Density: compact     | 834 B    | 701 B    | 238 B   |

## Largest JS Modules

| Package         | File           | Raw      | Minified | Gzip    |
| --------------- | -------------- | -------- | -------- | ------- |
| @kairoui/tokens | index.js       | 61.87 KB | 33.53 KB | 8.82 KB |
| @kairoui/theme  | index.js       | 46.06 KB | 24.60 KB | 7.00 KB |
| @kairoui/core   | composition.js | 28.98 KB | 14.83 KB | 5.20 KB |
| @kairoui/utils  | index.js       | 16.58 KB | 9.20 KB  | 2.96 KB |
| @kairoui/theme  | dom.js         | 15.63 KB | 6.77 KB  | 2.18 KB |
| @kairoui/core   | index.js       | 14.09 KB | 6.90 KB  | 2.29 KB |
| @kairoui/utils  | dom.js         | 10.10 KB | 5.44 KB  | 2.01 KB |
| @kairoui/hooks  | index.js       | 6.42 KB  | 3.05 KB  | 1.37 KB |
| @kairoui/theme  | server.js      | 5.40 KB  | 3.34 KB  | 1.13 KB |
| @kairoui/utils  | events.js      | 3.97 KB  | 2.37 KB  | 897 B   |

## Key Observations

### Tree-shaking is effective

Single-utility import: **72 B** minified (vs 9.20 KB full utils). Single-hook import: **1.09 KB** (vs 3.05 KB full hooks). This confirms named exports and sideEffects declarations are working correctly.

### Largest contributors

1. **@kairoui/tokens index.js** (33.53 KB min / 8.82 KB gz) — contains all token definitions, validation logic, and theme data structures. Expected to be large as it carries the full design system vocabulary.
2. **@kairoui/theme index.js** (24.60 KB min / 7.00 KB gz) — theme engine with creation, resolution, composition, merge, validation, serialization, selectors, and CSS variable generation.
3. **@kairoui/core composition.js** (14.83 KB min / 5.20 KB gz) — composition infrastructure including prop merging, slots, polymorphic rendering, variants, CSS generation.

### CSS compresses very well

Token variables CSS: 29.22 KB raw → 2.91 KB gzip (90% compression). Component styles: 4.54 KB raw → 1.01 KB gzip. CSS custom properties are highly repetitive and compress extremely well.

### No unexpected dependencies

Consumer bundle analysis confirms no unintended dependency inclusion. The `composition-only` bundle (4.01 KB) and `styling-only` bundle (3.83 KB) show clean separation — they don't pull in React, theme, or tokens.

### theme-only bundle pulls in tokens

The `theme-only` consumer bundle is 37.59 KB because `@kairoui/theme` depends on `@kairoui/tokens`. This is by design — the theme engine needs token definitions. Consumers who only need tokens can import `@kairoui/tokens` directly (tree-shakeable to individual token categories).

## Optimization Opportunities (not acted on — measurement only)

| Opportunity                                    | Impact | Notes                                                                 |
| ---------------------------------------------- | ------ | --------------------------------------------------------------------- |
| Token data could be split into subpath exports | Medium | Would allow importing only color tokens, only typography tokens, etc. |
| Theme validation could be lazy-loaded          | Low    | Only needed during theme creation, not at runtime                     |
| Composition entry could be further split       | Low    | Already 14.83 KB min — reasonable for the feature set                 |
| CSS minification in build pipeline             | Low    | 3.75 KB → ~3.75 KB — CSS is already compact                           |
