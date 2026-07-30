# @kairoui/tokens

Design tokens for the KairoUI enterprise UI platform — colors, spacing, typography, borders, shadows, motion, and theming.

## Installation

```bash
pnpm add @kairoui/tokens
```

## Quick Start

### TypeScript

```ts
import { lightTheme, darkTheme, neutral, blue, spacing } from "@kairoui/tokens";

// Access semantic values
const pageBg = lightTheme.color.background.page; // "#f8f9fb"
const bodyFont = lightTheme.typography.body.fontSize; // "0.875rem"

// Access primitives directly
const gray500 = neutral["500"]; // "#6b7588"
const gap = spacing["4"]; // "1rem"
```

### CSS Custom Properties

```css
/* Import all tokens (light default + dark override + density overrides) */
@import "@kairoui/tokens/css";

/* Or import individual themes */
@import "@kairoui/tokens/css/light";
@import "@kairoui/tokens/css/dark";

/* Import density overrides */
@import "@kairoui/tokens/css/density/compact";
```

Use variables in your CSS:

```css
.card {
  background: var(--kui-color-bg-surface);
  color: var(--kui-color-text-primary);
  border: 1px solid var(--kui-color-border-default);
  border-radius: var(--kui-radius-lg);
  padding: var(--kui-space-content-card-padding);
}
```

## Token Architecture

Three layers with strict dependency direction:

```
Component Tokens → Semantic Tokens → Primitive Tokens
```

- **Primitives** — raw values (colors, spacing, sizes). Stable across themes.
- **Semantic** — purpose-driven roles (background.page, text.primary). Theme-switchable.
- **Component** — component-specific decisions (button.primary.background). Reference semantics.

## Themes

| Theme | Selector                             | Description                           |
| ----- | ------------------------------------ | ------------------------------------- |
| Light | `:root` / `[data-kui-theme="light"]` | Default. Neutral-first, professional. |
| Dark  | `[data-kui-theme="dark"]`            | Deep blue-gray, not pure black.       |

### Theme Overrides

```ts
import { resolveTheme, lightTheme } from "@kairoui/tokens";

const { theme } = resolveTheme({
  base: lightTheme,
  overrides: {
    color: { background: { page: "#ffffff" } },
  },
});
```

## Density

| Mode        | Selector                        | Use Case         |
| ----------- | ------------------------------- | ---------------- |
| Comfortable | Default                         | General UI       |
| Standard    | `[data-kui-density="standard"]` | Balanced         |
| Compact     | `[data-kui-density="compact"]`  | Data-dense views |

## CSS Variable Naming

Token paths convert to CSS variables with the `--kui-` prefix:

| TypeScript Path         | CSS Variable           |
| ----------------------- | ---------------------- |
| `color.background.page` | `--kui-color-bg-page`  |
| `spacing.4`             | `--kui-space-4`        |
| `fontSize.base`         | `--kui-font-size-base` |

## Exports

| Entry Point                     | Content                                     |
| ------------------------------- | ------------------------------------------- |
| `@kairoui/tokens`               | All TypeScript values, types, and utilities |
| `@kairoui/tokens/css`           | Combined CSS (light + dark + density)       |
| `@kairoui/tokens/css/light`     | Light theme CSS only                        |
| `@kairoui/tokens/css/dark`      | Dark theme CSS only                         |
| `@kairoui/tokens/css/density/*` | Per-density CSS                             |
| `@kairoui/tokens/manifest`      | JSON token manifest                         |

## Accessibility

- All text/background pairings meet WCAG AA (4.5:1) contrast
- Focus ring: 2px indigo ring with inner ring for visibility
- Status indicators use color + shape (never color alone)
- Disabled controls meet 2:1 readability floor

## Documentation

- [Token Architecture](../../docs/architecture/token-architecture.md)
- [Naming Standard](../../docs/architecture/token-naming.md)
