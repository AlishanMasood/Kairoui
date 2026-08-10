---
sidebar_position: 2
title: Package Architecture
---

# Package Architecture

## Package Dependency Graph

```text
@kairoui/core
  ├── @kairoui/tokens (indirect: CSS variable names only)
  ├── @kairoui/theme
  ├── @kairoui/hooks
  └── @kairoui/utils

@kairoui/theme
  └── @kairoui/tokens

@kairoui/icons
  └── @kairoui/core (peer)
```

## Package Responsibilities

### `@kairoui/tokens`

Design tokens: colors, spacing, typography, shadows, radii, breakpoints.

**CSS outputs:**

- `@kairoui/tokens/css` — all semantic token variables (`:root`)
- `@kairoui/tokens/css/light` — light theme scope (`[data-kui-theme="light"]`)
- `@kairoui/tokens/css/dark` — dark theme scope (`[data-kui-theme="dark"]`)
- `@kairoui/tokens/css/density/comfortable` — comfortable density
- `@kairoui/tokens/css/density/standard` — standard density
- `@kairoui/tokens/css/density/compact` — compact density

**Side effects:** CSS imports are side-effects (marked in `sideEffects` field).

### `@kairoui/core`

Foundation primitives, component composition, and component implementations.

**CSS ownership:** All component CSS lives in this package, co-located with component source. Published via `@kairoui/core/styles.css`.

**Entry points:**

- `@kairoui/core` — React components, providers, hooks
- `@kairoui/core/composition` — Composition utilities (mergeProps, slots, polymorphic, asChild)
- `@kairoui/core/styles.css` — All component styles (single CSS bundle)

**Side effects:** `@kairoui/core/styles.css` is a side-effect import.

### `@kairoui/theme`

Theming system: theme provider, theme creation, runtime switching.

**No CSS output.** Theme applies CSS variables via DOM attributes; the actual variable declarations live in `@kairoui/tokens`.

### `@kairoui/hooks`

Shared React hooks for accessibility, interactions, and state management.

**No CSS output.** Pure JavaScript/TypeScript.

### `@kairoui/icons`

SVG icon components optimized for tree-shaking.

**No CSS output.** Icons are inline SVG React components.

### `@kairoui/utils`

Shared utility functions, type helpers, and common abstractions.

**No CSS output.** Pure JavaScript/TypeScript. Server-safe (no DOM globals at module level).

---

## CSS Ownership Rules

### Rule 1: Component CSS lives with the component

```text
@kairoui/core/src/components/button/
├── button.tsx       ← Component logic
├── button.css       ← Component styles
└── index.ts         ← Barrel export
```

Component CSS is **not** a separate package. It ships as part of `@kairoui/core`.

### Rule 2: Token CSS lives in `@kairoui/tokens`

Token variable definitions (`:root { --kui-*: ... }`) are generated and published by the tokens package. Components reference these variables but do not define them.

### Rule 3: No dedicated styling package

A separate `@kairoui/styles` package is NOT needed because:

- Component CSS is tightly coupled to component structure (slots, states)
- Separating would create a circular dependency (styles need component knowledge, components need styles)
- Co-location improves maintainability

### Rule 4: CSS has zero runtime JavaScript dependency

Component CSS files reference `--kui-*` variable names as strings. They have no `import` from any package. The connection is purely by convention (same variable names).

### Rule 5: Single CSS entry point for consumers

Consumers import one CSS file for all component styles:

```tsx
import "@kairoui/tokens/css"; // Token variables
import "@kairoui/tokens/css/light"; // Light theme
import "@kairoui/tokens/css/dark"; // Dark theme
import "@kairoui/core/styles.css"; // Component styles
```

---

## Dependency Boundaries

### What CAN depend on what

| Package           | Can import from                                      |
| ----------------- | ---------------------------------------------------- |
| `@kairoui/utils`  | Nothing (leaf)                                       |
| `@kairoui/hooks`  | `@kairoui/utils`                                     |
| `@kairoui/tokens` | Nothing (leaf)                                       |
| `@kairoui/theme`  | `@kairoui/tokens`                                    |
| `@kairoui/core`   | `@kairoui/utils`, `@kairoui/hooks`, `@kairoui/theme` |
| `@kairoui/icons`  | `@kairoui/core` (peer dep)                           |

### What CANNOT happen

- `@kairoui/tokens` cannot import from `@kairoui/core` or `@kairoui/theme`
- `@kairoui/theme` cannot import from `@kairoui/core`
- `@kairoui/utils` cannot import React
- No circular dependencies between packages
- Component CSS cannot `@import` from other packages (references variables only)

---

## Tree-Shaking Expectations

| Asset             | Tree-shakeable? | Mechanism                                  |
| ----------------- | --------------- | ------------------------------------------ |
| Component JS      | ✓               | ESM exports, bundler dead-code elimination |
| Component CSS     | ✗ (side-effect) | Single bundle, all styles included         |
| Token CSS         | ✗ (side-effect) | Must be imported for variables to resolve  |
| Composition utils | ✓               | Individual named exports                   |
| Hooks             | ✓               | Individual named exports                   |
| Utils             | ✓               | Individual named exports                   |

Component CSS is not tree-shakeable per-component. This is intentional:

- CSS files are small (variable references, not inline values)
- Single import is simpler for consumers
- Bundler CSS splitting is unreliable across frameworks

---

## Server-Safe Modules

| Module                      | Server-safe? | Notes                                |
| --------------------------- | ------------ | ------------------------------------ |
| `@kairoui/utils`            | ✓            | No DOM globals at import time        |
| `@kairoui/hooks`            | ✓            | Hooks are lazy (no effect at import) |
| `@kairoui/tokens`           | ✓            | Pure data, no DOM                    |
| `@kairoui/theme`            | ✓ (main)     | DOM access only in `applyTheme()`    |
| `@kairoui/theme/dom`        | ✗            | DOM-specific utilities               |
| `@kairoui/theme/server`     | ✓            | Server-only utilities                |
| `@kairoui/core`             | ✓            | React components are SSR-safe        |
| `@kairoui/core/composition` | ✓            | No DOM globals                       |
| Component CSS               | N/A          | CSS files, not JavaScript            |

---

## CSS Publication

### Build-Time Flow

```text
1. @kairoui/tokens: pnpm build → dist/tokens.css, dist/themes/*.css, dist/density/*.css
2. @kairoui/core: pnpm build → dist/styles.css (component CSS bundle)
```

### Consumer Import

```tsx
// _app.tsx or root layout
import "@kairoui/tokens/css"; // Variable definitions
import "@kairoui/tokens/css/light"; // Light theme
import "@kairoui/tokens/css/dark"; // Dark theme
import "@kairoui/tokens/css/density/comfortable"; // Default density
import "@kairoui/core/styles.css"; // Component styles
```

### CSS Load Order

Token CSS **must** load before component CSS (variables must be defined before referenced). Import order in the consumer's entry file ensures this.

---

## Publishing Strategy

Packages use [Changesets](https://github.com/changesets/changesets) for versioning. Each package is independently versioned following semver.

### CSS Versioning

Component CSS is part of `@kairoui/core` and versioned with it. Token CSS is part of `@kairoui/tokens` and versioned with it. A major version bump in token variable names is a breaking change for both packages.
