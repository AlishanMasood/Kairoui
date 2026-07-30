---
sidebar_position: 3
title: Theme Engine
---

# Theme Engine Architecture

The theme engine transforms KairoUI's static design tokens into a runtime theming system. It is split across three packages with a strict dependency direction:

```
@kairoui/tokens   →   @kairoui/theme   →   @kairoui/core
(static values)        (engine logic)        (React provider)
```

## Package Responsibilities

### @kairoui/tokens

Owns all design token values, type contracts, CSS generation, and validation. Has zero runtime dependencies. Produces pre-built CSS files that the theme engine switches between at runtime.

### @kairoui/theme

Owns the framework-independent theme engine: composition, resolution, CSS-variable application, system preference detection, preference persistence, cross-tab synchronization, scoped theming, and the no-flash initialization script.

Does not depend on React. All module-level code is SSR-safe (no browser globals at import time).

### @kairoui/core

Owns the React integration: `KairoProvider`, typed hooks (`useTheme`, `useDensity`), scoped providers, SSR rendering, and hydration.

## Core Concepts

### Theme Mode

| Mode     | Behavior                                       |
| -------- | ---------------------------------------------- |
| `light`  | Always use light theme                         |
| `dark`   | Always use dark theme                          |
| `system` | Follow operating system `prefers-color-scheme` |

### Density

Three spatial modes — `comfortable` (default), `standard`, `compact` — control heights, padding, and gaps without affecting colors or typography.

### Theme Scope

Any DOM sub-tree can have its own theme or density via `data-kui-theme` and `data-kui-density` attributes. CSS custom properties cascade naturally.

### No-Flash Initialization

An inline script runs before the main bundle to set theme attributes synchronously, preventing a flash of the wrong theme on page load.

## Runtime Theme Switching

The engine does **not** generate CSS at runtime. It switches themes by changing `data-kui-theme` on the target element. The browser's CSS cascade applies the correct variable values from the pre-built stylesheets.

## SSR and Hydration

1. Server renders with a default theme (typically `light`).
2. The no-flash script patches the DOM before React hydrates.
3. `KairoProvider` reads the current DOM attributes on mount.
4. React state matches the DOM — no hydration mismatch.

## Persistence

Theme preferences are stored via a **storage adapter** interface. The default uses `localStorage` with `storage` events for cross-tab synchronization. A no-op adapter is provided for SSR, and a memory adapter for tests.

## Full Specification

See the complete architecture document at [`docs/architecture/theme-engine.md`](https://github.com/AliShanMasood/Kairoui/blob/main/docs/architecture/theme-engine.md) for:

- Detailed lifecycle diagrams (resolution, runtime, provider, SSR)
- Public vs internal API tables
- Consumer override patterns
- CSS architecture
- Testing strategy
- Architectural constraints
