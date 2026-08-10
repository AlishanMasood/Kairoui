---
sidebar_position: 11
title: Component Styling Architecture
---

# Component Styling Architecture

This document defines how KairoUI components consume design tokens, apply styles, support variants, and enable consumer overrides — without introducing CSS-in-JS runtime overhead.

---

## Styling Flow

```text
┌──────────────┐     ┌─────────────────┐     ┌────────────────────────┐
│ @kairoui/    │     │ @kairoui/theme  │     │ Component Style        │
│ tokens       │────▶│                 │────▶│ Contract               │
│              │     │ Resolve + Apply │     │                        │
│ Primitives   │     │ CSS Variables   │     │ Variant Resolution     │
│ Semantic     │     │ Density Scope   │     │ Slot Style Resolution  │
│ Density      │     │ Theme Scope     │     │ State Styling          │
└──────────────┘     └─────────────────┘     └────────────────────────┘
                                                        │
                                              ┌─────────▼────────────┐
                                              │ Generated CSS        │
                                              │                      │
                                              │ Static classes       │
                                              │ CSS custom props     │
                                              │ Data-attr selectors  │
                                              └──────────┬───────────┘
                                                         │
                                              ┌──────────▼───────────┐
                                              │ Consumer Overrides   │
                                              │                      │
                                              │ className            │
                                              │ style                │
                                              │ slotProps.*.className│
                                              │ CSS custom props     │
                                              └──────────────────────┘
```

---

## Core Principles

### 1. Static CSS, Not Runtime Generation

Component styles are **pre-built CSS files** that reference CSS custom properties. No runtime style computation occurs in the browser. Theme and density changes happen via CSS cascade (data-attribute selectors), not JavaScript re-renders.

### 2. Tokens as the Single Source of Truth

Components never hard-code colors, spacing, or typography values. All visual properties come from `--kui-*` CSS variables. This ensures:

- Automatic theme switching (light/dark)
- Automatic density adaptation
- Consumer override capability

### 3. No CSS-in-JS

KairoUI does not use `styled-components`, `emotion`, or any runtime CSS generation library. The styling system produces:

- Static `.css` files (built at package build time)
- CSS custom properties for runtime theming
- Data-attribute selectors for state-based styling

### 4. Component Owns Its CSS

Each component owns a single CSS file that defines its visual contract. Components do not share style files. Component CSS is imported alongside the component.

---

## Responsibility Boundaries

| Layer             | Responsibility                                            | Does NOT Handle                   |
| ----------------- | --------------------------------------------------------- | --------------------------------- |
| `@kairoui/tokens` | Primitive values, semantic roles, density scales          | Component styling, variants       |
| `@kairoui/theme`  | CSS variable application, theme resolution, scoping       | Component-specific styles         |
| Component CSS     | Variant styles, state styles, slot styles                 | Token definitions, theme logic    |
| Component JS      | Variant resolution, className application, slot rendering | CSS generation, style computation |
| Consumer          | Override className/style, custom CSS layers               | Component internals               |

---

## Token Consumption

### Components Reference Variables, Not Values

```css
/* ✓ Correct: reference token variable */
.kui-button {
  background: var(--kui-color-interactive-default);
  height: var(--kui-control-height-md);
  padding: 0 var(--kui-space-inline-md);
}

/* ✗ Wrong: hard-coded value */
.kui-button {
  background: #0066cc;
  height: 36px;
  padding: 0 12px;
}
```

### Token Categories Available to Components

| Category       | Variable Pattern                       | Example                             |
| -------------- | -------------------------------------- | ----------------------------------- |
| Color          | `--kui-color-*`                        | `--kui-color-interactive-default`   |
| Spacing        | `--kui-space-*`                        | `--kui-space-inline-md`             |
| Control sizing | `--kui-control-height-*`               | `--kui-control-height-md`           |
| Typography     | `--kui-typography-*` or `--kui-font-*` | `--kui-font-size-base`              |
| Border         | `--kui-border-*`                       | `--kui-border-radius-sm`            |
| Shadow         | `--kui-shadow-*`                       | `--kui-shadow-md`                   |
| Motion         | `--kui-interaction-*`                  | `--kui-interaction-transition-fast` |
| Focus          | `--kui-focus-*`                        | `--kui-focus-ring-color`            |

---

## Component CSS Ownership

Each component produces a CSS file co-located with its source:

```
packages/core/src/components/button/
├── button.tsx           ← Component logic
├── button.css           ← Component styles
├── button.test.tsx      ← Tests
└── index.ts             ← Barrel export
```

The CSS file is:

- Imported by the component (side-effect import for bundler)
- Included in the package `dist/` output
- Tree-shakeable at the component level

---

## Slot Styling

### Each Slot Has a Scoped Class

```css
.kui-button {
  /* root slot */
}
.kui-button__start-icon {
  /* startIcon slot */
}
.kui-button__content {
  /* content slot */
}
.kui-button__end-icon {
  /* endIcon slot */
}
.kui-button__loading {
  /* loadingIndicator slot */
}
```

### Naming Convention

```
.kui-{component}__{slot-name}
```

- Component: kebab-case component name
- Slot: kebab-case slot name
- Separator: `__` (BEM element convention)

### Consumer Slot Style Override

Consumers override slot styles via `slotProps`:

```tsx
<Button slotProps={{ content: { className: "my-label" } }}>Save</Button>
```

The consumer className is **merged** with the internal slot className (never replaces).

---

## State Styling

### Data-Attribute Selectors

Component state is reflected via `data-*` attributes (set by the composition layer). CSS uses these as selectors:

```css
.kui-button[data-state="disabled"] {
  opacity: 0.5;
  cursor: not-allowed;
}

.kui-button[data-state="loading"] {
  cursor: wait;
}

.kui-button[data-disabled] {
  pointer-events: none;
}
```

### Available State Attributes

| Attribute            | Source                     | Values                                         |
| -------------------- | -------------------------- | ---------------------------------------------- |
| `data-state`         | `ComponentState.dataState` | `"default"`, `"disabled"`, `"loading"`, custom |
| `data-disabled`      | `ComponentState.disabled`  | Present/absent                                 |
| `data-loading`       | `ComponentState.loading`   | Present/absent                                 |
| `data-kui-component` | Factory                    | Component display name                         |
| `data-kui-slot`      | Slot system                | Slot name                                      |

---

## Density Styling

### Density-Responsive Spacing

Components do NOT define separate density classes. Instead, they reference density-responsive tokens:

```css
.kui-button {
  /* These variables change automatically when density context changes */
  height: var(--kui-control-height-md);
  padding: 0 var(--kui-space-inline-md);
  gap: var(--kui-space-inline-sm);
}
```

When `[data-kui-density="compact"]` is set on an ancestor, the token values automatically shrink. No component JS or additional CSS rules needed.

### What Density Changes

- Control heights (`--kui-control-height-*`)
- Inline spacing (`--kui-space-inline-*`)
- Form gaps (`--kui-space-form-*`)
- Content padding (`--kui-space-content-*`)

### What Density Does NOT Change

- Colors
- Typography (font-size, line-height)
- Border radius
- Shadows
- Focus rings
- Motion timing

---

## Variant Styling

### Variant Resolution Flow

```text
Component Props → Variant Key → CSS Class → Visual Appearance
```

### CSS Class Convention

```css
/* Base component */
.kui-button { ... }

/* Variant modifier */
.kui-button--primary { ... }
.kui-button--secondary { ... }
.kui-button--ghost { ... }

/* Size modifier */
.kui-button--sm { ... }
.kui-button--md { ... }
.kui-button--lg { ... }
```

### Naming Convention

```
.kui-{component}--{variant-value}
```

- Base: `.kui-{component}` (always applied)
- Modifier: `.kui-{component}--{value}` (conditionally applied)
- Separator: `--` (BEM modifier convention)

### Variant Resolution (Component JS Responsibility)

The component resolves variant props to class names. The styling engine provides a utility:

```tsx
// Conceptual — implemented in later tasks
const className = resolveVariants("button", {
  variant: "primary",
  size: "md",
});
// → "kui-button kui-button--primary kui-button--md"
```

---

## Consumer Overrides

### Supported Override Mechanisms

| Mechanism                                   | Scope          | Specificity                         |
| ------------------------------------------- | -------------- | ----------------------------------- |
| `className` prop                            | Root element   | Merges with internal                |
| `style` prop                                | Root element   | Merges per-property (consumer wins) |
| `slotProps.*.className`                     | Specific slot  | Merges with slot class              |
| `slotProps.*.style`                         | Specific slot  | Merges per-property                 |
| Custom CSS targeting `[data-kui-component]` | External       | Depends on selector                 |
| CSS custom properties on ancestor           | Scoped subtree | Cascade inheritance                 |

### What Consumers Cannot Override

- `data-kui-component` metadata (always present)
- `data-kui-slot` metadata (always present)
- `data-state` (driven by component state)
- Internal ARIA attributes (protected by composition layer)

---

## Static CSS vs Runtime

### Static (Build Time)

- Component CSS files (all variant/state combinations)
- Token CSS files (all theme/density combinations)
- No browser-side CSS generation

### Runtime (JavaScript)

- Variant prop → className resolution (string concatenation only)
- Theme mode switching (data-attribute toggle)
- Density switching (data-attribute toggle)
- Consumer style merge (per mergeProps)

### What is NOT Runtime

- No style injection
- No CSS-in-JS
- No dynamic CSS generation
- No style tag creation
- No CSS object serialization

---

## Theme Interaction

### CSS Cascade for Theme Switching

```css
/* Default (light) values defined in :root or [data-kui-theme="light"] */
[data-kui-theme="light"] {
  --kui-color-interactive-default: #0066cc;
}

/* Dark theme overrides */
[data-kui-theme="dark"] {
  --kui-color-interactive-default: #4da6ff;
}
```

Components reference `var(--kui-color-interactive-default)` — they don't know which theme is active.

### Scoped Theme Nesting

Themes can be nested via `KairoScopeProvider`:

```html
<html data-kui-theme="light">
  <!-- Light colors -->
  <div data-kui-theme="dark">
    <!-- Dark colors (CSS cascade handles it) -->
  </div>
</html>
```

---

## Dependency Direction

```text
@kairoui/tokens       ← Standalone, no dependencies
       ↓
@kairoui/theme        ← Depends on tokens
       ↓
@kairoui/core         ← Depends on theme, tokens, utils, hooks
       ↓
Component CSS         ← References --kui-* variables (no package import)
```

Component CSS has **zero runtime dependency** on the token or theme packages. It only references CSS variable names (strings). The connection is:

- Token package defines the variable names and values
- Theme package applies them to the DOM
- Component CSS reads them via `var(--kui-*)`

---

## Public vs Internal Styling APIs

### Public (Consumer-Facing)

| API                             | Package       | Purpose               |
| ------------------------------- | ------------- | --------------------- |
| `className` prop                | Per component | Root element override |
| `style` prop                    | Per component | Inline style override |
| `slotProps.*.className`         | Per component | Slot override         |
| `@kairoui/tokens/css`           | Import        | Load token variables  |
| `@kairoui/tokens/css/light`     | Import        | Load light theme      |
| `@kairoui/tokens/css/dark`      | Import        | Load dark theme       |
| `@kairoui/tokens/css/density/*` | Import        | Load density scale    |

### Internal (Component-Author)

| API                            | Package           | Purpose           |
| ------------------------------ | ----------------- | ----------------- |
| Variant resolution utility     | `@kairoui/core`   | Props → className |
| CSS class naming convention    | Documentation     | Consistent naming |
| `data-state` / `data-disabled` | Composition layer | State selectors   |
| `data-kui-slot`                | Slot system       | Slot targeting    |

---

## CSS Generation Lifecycle

```text
1. Design tokens defined (TypeScript objects)
2. Token build generates CSS files (pnpm build in @kairoui/tokens)
3. Component author writes .css referencing --kui-* variables
4. Component build includes .css in dist/
5. Consumer imports component → CSS included via bundler
6. Consumer imports @kairoui/tokens/css → variables defined
7. Runtime: theme/density data-attributes toggle variable values
8. CSS cascade applies correct values — no JS re-render needed
```

---

## File Structure (Future Component)

```
packages/core/src/components/button/
├── button.tsx              ← Component implementation
├── button.css              ← Static styles (variants, states, slots)
├── button.types.ts         ← Public prop types
├── button.test.tsx         ← Runtime + accessibility tests
├── button.stories.tsx      ← Storybook examples
└── index.ts                ← Barrel export
```
