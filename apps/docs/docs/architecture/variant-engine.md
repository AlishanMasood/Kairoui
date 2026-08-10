---
sidebar_position: 14
title: Variant Engine Architecture
---

# Variant Engine Architecture

This document defines how KairoUI resolves component variants into CSS class names and style properties. The variant engine is static-CSS compatible — all variant combinations are pre-generated at build time.

---

## Overview

```text
Component Props → Variant Resolution → CSS Class Names → Visual Appearance
```

The variant engine:

1. Receives variant props from consumer JSX
2. Applies defaults for unspecified axes
3. Resolves compound variants for specific combinations
4. Returns deterministic CSS class names

**No runtime style generation occurs.** All variant combinations produce pre-defined class names that map to pre-built CSS rules.

---

## Variant Definitions

A component declares its variant axes with allowed values:

```typescript
defineVariants("button", {
  appearance: ["solid", "outlined", "ghost", "link"],
  color: ["primary", "secondary", "danger", "success", "neutral"],
  size: ["xs", "sm", "md", "lg", "xl"],
});
```

Each axis is independent. Consumers select one value per axis:

```tsx
<Button appearance="solid" color="primary" size="md">
  Save
</Button>
```

---

## Variant Values

### String Variants

Standard variants with named values:

```typescript
appearance: ["solid", "outlined", "ghost"];
```

Generates: `.kui-button--solid`, `.kui-button--outlined`, `.kui-button--ghost`

### Boolean Variants

Variants with only true/false state:

```typescript
fullWidth: [true, false];
```

Generates: `.kui-button--full-width` (applied when `fullWidth={true}`)

Boolean variants don't generate a class for the `false` case — the absence of the class IS the false state.

---

## Default Variants

Every axis must have a default value:

```typescript
defaultVariants: {
  appearance: "solid",
  color: "primary",
  size: "md",
  fullWidth: false,
}
```

When a consumer omits a variant prop, the default is used:

```tsx
<Button>Save</Button>
// Resolves to: appearance="solid" color="primary" size="md" fullWidth=false
```

---

## Compound Variants

Compound variants apply additional styles when multiple axes match:

```typescript
compoundVariants: [
  {
    condition: { appearance: "solid", color: "danger" },
    className: "kui-button--solid-danger",
  },
  {
    condition: { appearance: "ghost", size: "xs" },
    className: "kui-button--ghost-xs",
  },
];
```

### Resolution Rules

- All conditions in a compound must match for it to apply
- Multiple compounds can match simultaneously
- Compound classes are applied AFTER individual axis classes
- Later compounds in the array override earlier ones for conflicting properties

---

## Slot Variants

Variants can affect specific slots:

```typescript
slotVariants: {
  startIcon: {
    size: {
      xs: "kui-button__start-icon--xs",
      sm: "kui-button__start-icon--sm",
      md: "kui-button__start-icon--md",
    },
  },
}
```

This allows icon sizing to respond to the button's size variant without extra CSS complexity.

---

## Resolution Lifecycle

```text
1. Consumer passes variant props
2. Fill missing props with defaultVariants
3. For each axis: resolve to class name
4. For each compound: check if all conditions match
5. For each slot variant: resolve per-slot class names
6. Return final class name string(s)
```

### Deterministic Output

The same variant inputs always produce the same class names in the same order:

```
Base class → Axis classes (alphabetical) → Compound classes (declaration order)
```

Example output:

```
"kui-button kui-button--solid kui-button--primary kui-button--md"
```

---

## CSS Class Generation

### Per-Axis Classes

Each variant value generates a CSS rule:

```css
.kui-button--solid {
  --kui-button-bg: var(--kui-color-interactive-default);
  --kui-button-fg: var(--kui-color-text-on-interactive);
  --kui-button-border: transparent;
}

.kui-button--outlined {
  --kui-button-bg: transparent;
  --kui-button-fg: var(--kui-color-interactive-default);
  --kui-button-border: currentColor;
}
```

### Compound Classes

Compound variants use combined selectors or dedicated classes:

```css
/* Option A: dedicated compound class */
.kui-button--solid-danger {
  --kui-button-bg: var(--kui-color-danger);
  --kui-button-fg: white;
}

/* Option B: combined selector (higher specificity) */
.kui-button--solid.kui-button--danger {
  --kui-button-bg: var(--kui-color-danger);
}
```

KairoUI uses **Option A** (dedicated classes) to maintain flat specificity.

---

## Interaction with State

Variant classes set component custom properties. State selectors read and override them:

```css
/* Variant sets the property */
.kui-button--solid {
  --kui-button-bg: var(--kui-color-interactive-default);
}

/* State overrides the property */
.kui-button:hover {
  --kui-button-bg: var(--kui-color-interactive-hover);
}

.kui-button[data-disabled] {
  --kui-button-bg: var(--kui-color-interactive-disabled);
}
```

**State always wins over variant** because state selectors have higher specificity (attribute selector adds specificity) and come later in source order.

---

## Interaction with Density

Variants do NOT directly interact with density. Density flows through tokens:

```css
.kui-button--md {
  /* References density-responsive token */
  --kui-button-height: var(--kui-control-height-md);
}
```

When density changes, `--kui-control-height-md` changes automatically. The variant class doesn't change.

---

## Interaction with Owner State

The variant engine resolves class names from props. Owner state is separate:

| Concern | Source          | Mechanism            |
| ------- | --------------- | -------------------- |
| Variant | Consumer props  | CSS modifier classes |
| State   | Component logic | Data attributes      |
| Density | Context         | CSS variable cascade |
| Theme   | Context         | CSS variable cascade |

They don't interfere because they use different CSS mechanisms.

---

## Validation

### Build-Time Validation

- All variant axes must have at least 2 values (or be boolean)
- All default values must be valid members of their axis
- Compound conditions must reference valid axes and values
- Slot variant axes must match the component's slot names

### Runtime Validation (Development Only)

- Unknown variant values produce dev warnings
- Missing required axes (without defaults) produce dev warnings
- Invalid compound conditions produce dev warnings

---

## Static CSS Compatibility

The variant engine is designed for static CSS:

| Feature                   | Static? | Notes                                |
| ------------------------- | ------- | ------------------------------------ |
| Axis class resolution     | ✓       | String concatenation only            |
| Compound matching         | ✓       | Simple object comparison             |
| Slot variant resolution   | ✓       | Lookup table                         |
| CSS generation            | ✓       | All combinations known at build time |
| Runtime style computation | ✗       | Not used                             |

### Why Static

- All variant values are known at definition time
- All combinations are finite and enumerable
- Class names are deterministic strings
- No runtime CSS injection needed

---

## API Shape (Conceptual)

```typescript
// Definition
const buttonVariants = defineVariants("button", {
  variants: {
    appearance: ["solid", "outlined", "ghost", "link"],
    color: ["primary", "secondary", "danger"],
    size: ["xs", "sm", "md", "lg", "xl"],
    fullWidth: [true, false],
  },
  defaultVariants: {
    appearance: "solid",
    color: "primary",
    size: "md",
    fullWidth: false,
  },
  compoundVariants: [
    { condition: { appearance: "solid", color: "danger" }, className: "kui-button--solid-danger" },
  ],
});

// Resolution
const className = buttonVariants.resolve({
  appearance: "ghost",
  size: "lg",
});
// → "kui-button kui-button--ghost kui-button--primary kui-button--lg"
```

---

## Variant Props Type Generation

The variant definition generates component prop types:

```typescript
type ButtonVariantProps = {
  appearance?: "solid" | "outlined" | "ghost" | "link";
  color?: "primary" | "secondary" | "danger";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  fullWidth?: boolean;
};
```

All variant props are optional (defaults fill gaps).

---

## Limitations

### No Responsive Variants

Responsive variant switching (e.g., `size={{ sm: "sm", lg: "lg" }}`) is not part of the initial implementation. It may be added in a future phase.

### No Dynamic Variant Functions

Variants cannot be computed from arbitrary functions. All values must be statically enumerable for CSS generation.

### No Per-Instance Variant CSS

Each variant produces a fixed class name. Per-instance computed styles use the `style` prop override, not the variant system.
