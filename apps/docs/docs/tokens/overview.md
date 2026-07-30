---
title: Token System
sidebar_position: 1
---

# KairoUI Token System

KairoUI uses a three-layer design token architecture to power all visual decisions.

## Quick Start

### CSS

```css
@import "@kairoui/tokens/css";
```

This imports all tokens as CSS custom properties with light theme as the default, plus dark theme and density overrides via data attributes.

### TypeScript

```ts
import { lightTheme, neutral, spacing } from "@kairoui/tokens";
```

## Architecture

```
┌──────────────────────────────────────┐
│         Component Tokens             │
│  button.primary.background, etc.     │
├──────────────────────────────────────┤
│          Semantic Tokens             │
│  color.background.page, etc.         │
├──────────────────────────────────────┤
│          Primitive Tokens            │
│  neutral.500, spacing.4, etc.        │
└──────────────────────────────────────┘
```

Dependencies flow downward only: Component → Semantic → Primitive.

## Primitives

Raw design values with no business meaning.

| Category   | Example          | CSS Variable              |
| ---------- | ---------------- | ------------------------- |
| Colors     | `neutral["500"]` | `--kui-color-neutral-500` |
| Spacing    | `spacing["4"]`   | `--kui-space-4`           |
| Typography | `fontSize.base`  | `--kui-font-size-base`    |
| Radius     | `radius.md`      | `--kui-radius-md`         |
| Shadow     | `shadow.md`      | `--kui-shadow-md`         |
| Motion     | `duration.fast`  | `--kui-duration-fast`     |

## Semantic Tokens

Purpose-driven values that change between themes.

```css
.page {
  background: var(--kui-color-bg-page);
  color: var(--kui-color-text-primary);
}
```

### Color Roles

- **Background**: page, surface, muted, raised, inverse, overlay, hover, active, selected
- **Text**: primary, secondary, muted, disabled, inverse, link, linkHover
- **Border**: subtle, default, strong, interactive, focus, disabled
- **Interactive**: default, hover, active, selected, subtle, subtleHover
- **Status**: success, warning, error, info, neutral (each with 7 sub-roles)
- **Focus**: ring, innerRing
- **Destructive**: default, hover, active, subtle, text

## Themes

### Light Theme (Default)

```css
@import "@kairoui/tokens/css/light";
```

- Page: subtle cool-gray (#f8f9fb)
- Surfaces: white cards on gray page
- Text: high-contrast neutral tones
- Accent: indigo (brand blue)

### Dark Theme

```css
@import "@kairoui/tokens/css/dark";
```

Apply via data attribute:

```html
<html data-kui-theme="dark"></html>
```

- Page: deep blue-gray (#131822), not pure black
- Surfaces: lighter than page for hierarchy
- Text: light neutrals, not pure white

## Density

Three spacing modes — orthogonal to theme:

```html
<div data-kui-density="compact">
  <!-- Tighter spacing for data-dense views -->
</div>
```

| Mode        | Default Control Height | Use Case           |
| ----------- | ---------------------- | ------------------ |
| Comfortable | 40px (2.5rem)          | General UI         |
| Standard    | 32px (2rem)            | Balanced           |
| Compact     | 32px (2rem)            | Tables, dashboards |

Density changes spacing and control heights. It does **not** change colors, typography, or shadows.

## Theme Overrides

```ts
import { resolveTheme, lightTheme } from "@kairoui/tokens";

const { theme, errors } = resolveTheme({
  base: lightTheme,
  overrides: {
    color: {
      background: { page: "#ffffff" },
      interactive: { default: "#0066cc" },
    },
  },
});
// theme is a complete SemanticTokens with your overrides applied
// errors reports any unknown keys
```

## CSS Variable Naming

| TypeScript Path             | CSS Variable               |
| --------------------------- | -------------------------- |
| `color.background.page`     | `--kui-color-bg-page`      |
| `color.text.primary`        | `--kui-color-text-primary` |
| `spacing.4`                 | `--kui-space-4`            |
| `fontSize.base`             | `--kui-font-size-base`     |
| `button.primary.background` | `--kui-button-primary-bg`  |

Abbreviations: `background` → `bg`, `spacing` → `space`.

## Accessibility

- All text/background pairings meet WCAG AA (4.5:1 for normal text)
- Focus indicators meet 3:1 non-text contrast
- Status indicators use color + shape (dot, icon) — never color alone
- Disabled controls are exempt from WCAG contrast but maintain 2:1 readability

## Generated Outputs

| Output        | Path                       | Purpose                |
| ------------- | -------------------------- | ---------------------- |
| CSS           | `@kairoui/tokens/css`      | Runtime theming        |
| TypeScript    | `@kairoui/tokens`          | Type-safe access       |
| JSON Manifest | `@kairoui/tokens/manifest` | Tooling, documentation |

## Adding a New Token

1. Add the value to the appropriate primitive/semantic file
2. Export from `src/index.ts`
3. Add tests verifying format, ordering, and public import
4. Run `pnpm check` — all gates must pass
5. CSS variables are generated automatically at build time

## Deprecation Policy

- Adding a token: patch/minor (non-breaking)
- Renaming a token: major version (provide alias for 1 major version)
- Removing a token: major version (deprecate for 1 major version first)
- Changing a resolved value: patch (themes change values freely)
