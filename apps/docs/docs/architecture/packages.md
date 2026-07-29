---
sidebar_position: 2
title: Package Architecture
---

# Package Architecture

:::note[Placeholder]
Detailed package API documentation will be generated and integrated here.
:::

## Package Dependency Graph

```
@kairoui/core
  ├── @kairoui/tokens
  ├── @kairoui/theme
  ├── @kairoui/hooks
  └── @kairoui/utils

@kairoui/theme
  └── @kairoui/tokens

@kairoui/icons
  └── @kairoui/core (peer)
```

## Package Responsibilities

### `@kairoui/core`

Foundation primitives, base component architecture, and core abstractions.

### `@kairoui/tokens`

Design tokens: colors, spacing, typography, shadows, radii, breakpoints.

### `@kairoui/theme`

Theming system: theme provider, theme creation, runtime switching.

### `@kairoui/hooks`

Shared React hooks for accessibility, interactions, and state management.

### `@kairoui/icons`

SVG icon components optimized for tree-shaking.

### `@kairoui/utils`

Shared utility functions, type helpers, and common abstractions.

## Publishing Strategy

Packages use [Changesets](https://github.com/changesets/changesets) for versioning. Each package is independently versioned following semver.
