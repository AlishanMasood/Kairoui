---
sidebar_position: 15
title: CSS Generation Strategy
---

# CSS Generation Strategy

This document defines how KairoUI converts component style contracts into distributable CSS files.

---

## Principles

1. **Static generation** — All CSS is produced at build time. No runtime `<style>` injection.
2. **CSS custom properties** — Theme/density adaptation through variable cascade, not class swapping.
3. **Deterministic output** — Same style contract always produces identical CSS.
4. **No CSS-in-JS runtime** — No styled-components, emotion, or runtime CSS generation library.

---

## Generation Pipeline

```text
┌──────────────────────┐
│ Component Style      │     pnpm build
│ Contract (TS)        │─────────────────┐
│                      │                 │
│ • Base styles        │                 ▼
│ • State styles       │     ┌───────────────────────┐
│ • Variant styles     │     │ CSS Generator (Node)   │
│ • Slot styles        │     │                        │
│ • Custom properties  │     │ • Read style contracts │
│ • Compound variants  │     │ • Generate CSS rules   │
└──────────────────────┘     │ • Write .css files     │
                             └───────────┬───────────┘
                                         │
                                         ▼
                             ┌───────────────────────┐
                             │ dist/styles.css        │
                             │                        │
                             │ • Component classes    │
                             │ • Variant modifiers    │
                             │ • State selectors      │
                             │ • Custom properties    │
                             └───────────────────────┘
```

---

## CSS File Structure

### Single Output File

All component styles are bundled into one CSS file per package:

```
@kairoui/core/dist/styles.css
```

This is the consumer entry point:

```tsx
import "@kairoui/core/styles.css";
```

### Internal Organization

The generator produces CSS in a deterministic order:

```css
/* 1. Component custom properties */
.kui-button {
  --kui-button-bg: var(--kui-color-interactive-default);
  --kui-button-fg: var(--kui-color-text-on-interactive);
  --kui-button-height: var(--kui-control-height-md);
}

/* 2. Base slot styles */
.kui-button { ... }
.kui-button__start-icon { ... }
.kui-button__content { ... }
.kui-button__end-icon { ... }

/* 3. Variant modifiers (alphabetical by axis, then value) */
.kui-button--solid { ... }
.kui-button--outlined { ... }
.kui-button--ghost { ... }
.kui-button--primary { ... }
.kui-button--danger { ... }
.kui-button--sm { ... }
.kui-button--md { ... }
.kui-button--lg { ... }

/* 4. Boolean variant modifiers */
.kui-button--full-width { ... }

/* 5. Compound variant classes */
.kui-button--solid-danger { ... }

/* 6. Slot variant modifiers */
.kui-button__start-icon--sm { ... }
.kui-button__start-icon--lg { ... }

/* 7. State selectors (highest specificity) */
.kui-button:hover { ... }
.kui-button:active { ... }
.kui-button:focus-visible { ... }
.kui-button[data-disabled] { ... }
.kui-button[data-loading] { ... }
```

---

## Class Name Generation

### From Style Contract

| Contract Element                        | CSS Output                    |
| --------------------------------------- | ----------------------------- |
| Component name `"button"`               | `.kui-button`                 |
| Slot `"startIcon"`                      | `.kui-button__start-icon`     |
| Variant `appearance: "solid"`           | `.kui-button--solid`          |
| Boolean variant `fullWidth: true`       | `.kui-button--full-width`     |
| Compound `solid+danger`                 | `.kui-button--solid-danger`   |
| Slot variant `startIcon` + `size: "sm"` | `.kui-button__start-icon--sm` |

### Naming Algorithm

```text
1. Component: "kui-" + kebab(componentName)
2. Slot: componentClass + "__" + kebab(slotName)
3. Variant: componentClass + "--" + kebab(value)
4. Boolean: componentClass + "--" + kebab(axisName)  (true only)
5. Compound: componentClass + "--" + kebab(value1) + "-" + kebab(value2)
6. Slot variant: slotClass + "--" + kebab(value)
```

---

## CSS Custom Properties

### Component-Scoped Properties

Generated from the contract's `customProperties`:

```css
.kui-button {
  --kui-button-bg: var(--kui-color-interactive-default);
  --kui-button-fg: var(--kui-color-text-on-interactive);
  --kui-button-height: var(--kui-control-height-md);
  --kui-button-radius: var(--kui-border-radius-sm);
}
```

### Token Reference Resolution

`TokenReference` objects are resolved to `var()` strings:

```typescript
// Contract
{ token: "color.interactive.default", fallback: "#0066cc" }

// Generated CSS
var(--kui-color-interactive-default, #0066cc)
```

---

## State Selector Generation

States from `SlotStyleDefinition.states` map to CSS selectors:

| State Name     | CSS Selector       |
| -------------- | ------------------ |
| `disabled`     | `[data-disabled]`  |
| `loading`      | `[data-loading]`   |
| `hovered`      | `:hover`           |
| `focused`      | `:focus`           |
| `focusVisible` | `:focus-visible`   |
| `pressed`      | `:active`          |
| `selected`     | `[data-selected]`  |
| `checked`      | `[data-checked]`   |
| `expanded`     | `[data-expanded]`  |
| `open`         | `[data-open]`      |
| `invalid`      | `[data-invalid]`   |
| `readOnly`     | `[data-read-only]` |

### Pseudo-Class vs Data-Attribute

- **CSS pseudo-classes** (`hover`, `focus`, `active`, `focus-visible`) — browser-native
- **Data-attribute selectors** (`[data-disabled]`, `[data-loading]`) — set by the component factory

---

## Deduplication

### Property-Level

If multiple variant values set the same property, the later variant (alphabetical axis order) produces the CSS rule. No duplicate properties within a single rule.

### Rule-Level

Empty rules (no properties) are not emitted. Variant values with identical style output are NOT deduplicated (each gets its own class for correct specificity).

---

## CSS Layers (Future)

A future enhancement may use CSS `@layer` for predictable cascade:

```css
@layer kui.base, kui.variants, kui.compounds, kui.states;

@layer kui.base {
  .kui-button { ... }
}

@layer kui.variants {
  .kui-button--solid { ... }
}
```

This is NOT part of the initial implementation. Current specificity management relies on source order.

---

## Development vs Production

| Aspect      | Development                        | Production                     |
| ----------- | ---------------------------------- | ------------------------------ |
| Formatting  | Pretty-printed, indented           | Minified (by consumer bundler) |
| Comments    | Component/section markers          | None                           |
| Source maps | Generated (`.css.map`)             | Consumer bundler handles       |
| Validation  | Dev warnings for invalid contracts | No validation overhead         |
| File size   | Larger (readable)                  | Smaller (minified)             |

KairoUI produces development-friendly CSS. Minification is the consumer's bundler responsibility (Vite, webpack, etc.).

---

## Consumer Import Strategy

### Required Imports

```tsx
// 1. Token variables (must load first)
import "@kairoui/tokens/css";
import "@kairoui/tokens/css/light";
import "@kairoui/tokens/css/dark";
import "@kairoui/tokens/css/density/comfortable";

// 2. Component styles (references token variables)
import "@kairoui/core/styles.css";
```

### Load Order

Token CSS **must** load before component CSS. Import order in the consumer's entry file ensures this. Both are side-effect imports.

---

## SSR Behavior

- CSS files are static — no server-side generation needed
- `renderToString` produces HTML that references CSS classes
- CSS is linked via `<link>` tag or bundler injection
- No flash-of-unstyled-content if CSS loads before HTML renders
- Hydration does not affect CSS (classes already match)

---

## Tree-Shaking

Component CSS is **not** tree-shakeable per-component. The entire `styles.css` is a single import.

**Why this is acceptable:**

- Component CSS is small (variable references, not inline values)
- Total CSS for all components is typically < 50KB unminified
- Per-component CSS splitting is unreliable across bundler ecosystems
- Single import is simpler for consumers

### Future: Per-Component CSS

If CSS grows significantly, a future enhancement could split by component:

```tsx
import "@kairoui/core/styles/button.css";
import "@kairoui/core/styles/input.css";
```

This is NOT part of the initial implementation.

---

## Build Integration

### Generator Script

```bash
# Part of the package build process
pnpm build  →  tsup (JS/TS)  +  generate-styles (CSS)
```

The CSS generator:

1. Imports all component style contracts
2. Resolves token references
3. Generates CSS rules
4. Writes `dist/styles.css`
5. Writes `dist/styles.css.map` (source map)

### Build Output

```
packages/core/dist/
├── index.js          ← Component JS (ESM)
├── index.d.ts        ← Type declarations
├── composition.js    ← Composition utilities (ESM)
├── composition.d.ts  ← Composition type declarations
└── styles.css        ← All component styles
```
