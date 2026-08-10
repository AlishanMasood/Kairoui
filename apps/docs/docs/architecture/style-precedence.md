---
sidebar_position: 13
title: Style Precedence and Override Rules
---

# Style Precedence and Override Rules

This document defines how KairoUI resolves conflicting styles from multiple sources. These rules are deterministic, predictable, and consistent across all components.

---

## Style Source Layers

Styles arrive from multiple sources. Each has a defined priority in the CSS cascade:

```text
Lowest priority                                         Highest priority
     ↓                                                        ↓
┌──────────┬─────────┬─────────┬─────────┬─────────┬────────────────┐
│ Base     │ Theme   │ Density │ Variant │ State   │ Consumer       │
│ component│ overrides│ scale  │ modifier│ selector│ className +    │
│ styles   │         │         │         │         │ style prop     │
└──────────┴─────────┴─────────┴─────────┴─────────┴────────────────┘
```

---

## Layer Definitions

### Layer 1: Base Component Styles (Lowest)

The component's structural styles — layout, sizing, spacing references, and default visual appearance.

```css
.kui-button {
  display: inline-flex;
  align-items: center;
  gap: var(--kui-space-inline-sm);
  height: var(--kui-button-height);
  border-radius: var(--kui-button-radius);
  background: var(--kui-button-bg);
  color: var(--kui-button-fg);
}
```

### Layer 2: Theme Overrides

Theme-scoped values applied via CSS custom property cascade. Theme switching happens automatically through `[data-kui-theme]` selectors — no component CSS changes needed.

```css
[data-kui-theme="light"] {
  --kui-color-interactive-default: #0066cc;
}
[data-kui-theme="dark"] {
  --kui-color-interactive-default: #4da6ff;
}
```

**Mechanism:** Token variable values change; component CSS is unchanged.

### Layer 3: Density Scale

Density-responsive token values applied via `[data-kui-density]` selectors. Like themes, this changes variable values — not component CSS.

```css
[data-kui-density="compact"] {
  --kui-control-height-md: 28px;
  --kui-space-inline-md: 8px;
}
[data-kui-density="comfortable"] {
  --kui-control-height-md: 36px;
  --kui-space-inline-md: 12px;
}
```

**Mechanism:** Token variable values change; component CSS is unchanged.

### Layer 4: Variant Modifiers

Variant classes override component custom properties to change visual appearance:

```css
.kui-button--solid {
  --kui-button-bg: var(--kui-color-interactive-default);
  --kui-button-fg: var(--kui-color-text-on-interactive);
}
.kui-button--ghost {
  --kui-button-bg: transparent;
  --kui-button-fg: var(--kui-color-interactive-default);
}
.kui-button--primary {
  --kui-button-bg: var(--kui-color-primary);
}
.kui-button--sm {
  --kui-button-height: var(--kui-control-height-sm);
}
```

**Mechanism:** Modifier classes override component-scoped custom properties.

### Layer 5: State Selectors

State-based styles for disabled, loading, hover, focus, active, and other interaction states:

```css
.kui-button:hover {
  --kui-button-bg: var(--kui-color-interactive-hover);
}
.kui-button:active {
  --kui-button-bg: var(--kui-color-interactive-pressed);
}
.kui-button[data-disabled] {
  --kui-button-bg: var(--kui-color-interactive-disabled);
  --kui-button-fg: var(--kui-color-text-disabled);
  cursor: not-allowed;
  opacity: 0.6;
}
.kui-button:focus-visible {
  outline: 2px solid var(--kui-focus-ring-color);
  outline-offset: 2px;
}
```

**Mechanism:** Pseudo-classes and data-attribute selectors; higher specificity than base/variant.

### Layer 6: Consumer Overrides (Highest)

Consumer-provided `className` and `style` props. These always win for the properties they target.

```tsx
<Button className="my-button" style={{ borderRadius: "999px" }}>
  Rounded
</Button>
```

**Mechanism:** `className` is merged (appended after internal classes); `style` is merged per-property (consumer wins).

---

## Merge vs Override Behavior

| Layer                            | Behavior                  | What happens on conflict                 |
| -------------------------------- | ------------------------- | ---------------------------------------- |
| Base styles                      | Foundation                | Always present                           |
| Theme                            | Variable override         | Theme variable value replaces default    |
| Density                          | Variable override         | Density variable value replaces default  |
| Variant                          | Property override         | Variant sets component custom property   |
| State                            | Property override         | State overrides variant values           |
| Consumer `className`             | **Merge**                 | Consumer class appended (both present)   |
| Consumer `style`                 | **Override per-property** | Consumer property wins, others preserved |
| Consumer `slotProps.*.className` | **Merge**                 | Appended to slot's internal class        |
| Consumer `slotProps.*.style`     | **Override per-property** | Per-property on specific slot            |

---

## CSS Specificity Design

KairoUI uses a predictable specificity escalation:

| Selector                           | Specificity | Layer                                        |
| ---------------------------------- | ----------- | -------------------------------------------- |
| `.kui-button`                      | (0, 1, 0)   | Base                                         |
| `.kui-button--primary`             | (0, 1, 0)   | Variant (same specificity, later in source)  |
| `.kui-button:hover`                | (0, 2, 0)   | State (pseudo-class adds specificity)        |
| `.kui-button[data-disabled]`       | (0, 2, 0)   | State (attribute selector)                   |
| `.kui-button:focus-visible`        | (0, 2, 0)   | Focus                                        |
| `.kui-button[data-disabled]:hover` | (0, 3, 0)   | State + interaction (disabled hover = no-op) |

### Source Order Rule

When specificities are equal, **source order wins** (later rule in the CSS file). KairoUI CSS is ordered:

```css
/* 1. Base styles */
.kui-button { ... }

/* 2. Variant styles (order: appearance → color → size) */
.kui-button--solid { ... }
.kui-button--primary { ... }
.kui-button--sm { ... }

/* 3. State styles (always after variants) */
.kui-button:hover { ... }
.kui-button[data-disabled] { ... }
```

---

## Consumer Override Guarantees

### Consumers CAN Always Override

| What                                         | How                                          |
| -------------------------------------------- | -------------------------------------------- |
| Visual appearance (colors, shadows, borders) | `className` or CSS targeting `.kui-button`   |
| Spacing and sizing                           | `style={{ padding: "..." }}` or CSS          |
| Border radius                                | `style={{ borderRadius: "..." }}` or CSS     |
| Typography                                   | `className` with font overrides              |
| Transitions/animations                       | CSS targeting the component class            |
| Component custom properties                  | CSS: `.kui-button { --kui-button-bg: red; }` |

### Consumers CANNOT Override (Protected)

| What                             | Reason                          |
| -------------------------------- | ------------------------------- |
| `data-kui-component`             | Component identity metadata     |
| `data-kui-slot`                  | Slot identity metadata          |
| `data-state`                     | Driven by component state logic |
| `data-disabled` / `data-loading` | Driven by component state       |
| Internal ARIA attributes         | Accessibility contract          |

### `!important` Policy

- KairoUI internal CSS **never** uses `!important`
- Consumers may use `!important` in their own overrides if specificity battles occur
- If a consumer needs `!important`, it indicates the override mechanism is working as designed (consumer always wins)

---

## Slot Style Precedence

Each slot follows the same precedence as the root, scoped to its element:

```text
Internal slot class → Variant (if applicable) → State → Consumer slotProps
```

Example:

```css
/* Internal slot style */
.kui-button__start-icon {
  display: flex;
  align-items: center;
}

/* State affects slot via parent */
.kui-button[data-disabled] .kui-button__start-icon {
  opacity: 0.5;
}
```

Consumer override via slotProps:

```tsx
<Button slotProps={{ startIcon: { className: "my-icon", style: { color: "red" } } }}>Save</Button>
```

---

## Component Custom Property Override Pattern

Components expose scoped custom properties as the **recommended consumer override**:

```css
/* Consumer can override without specificity concerns */
.my-special-button {
  --kui-button-bg: purple;
  --kui-button-fg: white;
  --kui-button-height: 48px;
}
```

This is preferred over targeting internal implementation because:

- No specificity battles
- Stable API (custom property names are semver-protected)
- Works with variants (variant sets the property, consumer overrides it)
- Works with state (state uses the same property, consumer value persists)

---

## Future: Theme Component Overrides

A future theme extension may allow per-component style overrides at the theme level:

```tsx
const theme = createTheme({
  components: {
    Button: {
      defaultVariant: "solid",
      defaultColor: "primary",
      styles: {
        "--kui-button-radius": "999px",
      },
    },
  },
});
```

**Precedence (future):** Between density (Layer 3) and variant (Layer 4). Theme component overrides set defaults that variants can still override.

---

## Summary: Complete Precedence Stack

```text
1. Base component CSS (.kui-button)           ← structural foundation
2. Theme variables ([data-kui-theme])         ← color scheme
3. Density variables ([data-kui-density])     ← spacing scale
4. [Future] Theme component overrides         ← per-component theme defaults
5. Variant modifier (.kui-button--primary)    ← visual variant
6. Compound variant (combines multiple axes)  ← specific combinations
7. State selector ([data-disabled], :hover)   ← interaction state
8. Consumer className (appended)              ← consumer additions
9. Consumer style prop (per-property)         ← consumer inline overrides
10. Consumer slotProps (per slot)             ← slot-level overrides
```

**The consumer always has the final word** for visual properties they explicitly target.
