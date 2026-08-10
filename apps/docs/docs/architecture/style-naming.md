---
sidebar_position: 12
title: Style Naming Conventions
---

# Style Naming Conventions

Canonical naming rules for all KairoUI component classes, CSS custom properties, and style metadata.

---

## Class Name Format

All KairoUI classes use the `kui-` prefix with BEM-inspired structure:

```text
.kui-{component}                    ← Root element
.kui-{component}__{slot}            ← Slot element (BEM element)
.kui-{component}--{modifier}        ← Variant/size modifier (BEM modifier)
```

### Casing Rules

| Segment        | Casing           | Example                               |
| -------------- | ---------------- | ------------------------------------- |
| Prefix         | Lowercase `kui-` | `kui-`                                |
| Component name | kebab-case       | `button`, `text-field`, `date-picker` |
| Slot name      | kebab-case       | `start-icon`, `loading-indicator`     |
| Modifier value | kebab-case       | `primary`, `extra-large`              |

---

## Component Root

Every component has a root class:

```css
.kui-button {
}
.kui-text-field {
}
.kui-dialog {
}
.kui-dropdown-menu {
}
```

The root class is always applied to the outermost element rendered by the component.

---

## Slot Classes

Slots use the `__` separator (BEM element):

```css
.kui-button__start-icon {
}
.kui-button__content {
}
.kui-button__end-icon {
}
.kui-button__loading-indicator {
}
.kui-text-field__label {
}
.kui-text-field__input {
}
.kui-text-field__helper-text {
}
```

### Slot Name Mapping

Slot names in TypeScript are camelCase. CSS class names convert to kebab-case:

| TypeScript Slot    | CSS Class                       |
| ------------------ | ------------------------------- |
| `startIcon`        | `kui-button__start-icon`        |
| `endIcon`          | `kui-button__end-icon`          |
| `loadingIndicator` | `kui-button__loading-indicator` |
| `helperText`       | `kui-text-field__helper-text`   |

---

## State Styling

State is expressed via **data attributes**, not classes:

```css
/* Component state */
.kui-button[data-state="disabled"] {
}
.kui-button[data-state="loading"] {
}
.kui-button[data-state="active"] {
}

/* Boolean state presence */
.kui-button[data-disabled] {
}
.kui-button[data-loading] {
}
.kui-button[data-focused] {
}
.kui-button[data-pressed] {
}
```

### Why Data Attributes Over State Classes

- Data attributes are set by the composition layer automatically
- No risk of class name collisions with consumer classes
- Attribute selectors provide clear semantic intent
- Compatible with CSS `:has()` and sibling selectors

### Available State Attributes

| Attribute            | Meaning               | Set by                               |
| -------------------- | --------------------- | ------------------------------------ |
| `data-state`         | Primary state string  | Factory (`ComponentState.dataState`) |
| `data-disabled`      | Functionally disabled | Factory (`ComponentState.disabled`)  |
| `data-loading`       | Loading/pending       | Factory (`ComponentState.loading`)   |
| `data-kui-component` | Component identity    | Factory (always)                     |
| `data-kui-slot`      | Slot identity         | Slot system (always)                 |

---

## Variant Modifiers

Variants use the `--` separator (BEM modifier):

```css
/* Appearance variants */
.kui-button--solid {
}
.kui-button--outlined {
}
.kui-button--ghost {
}
.kui-button--link {
}

/* Color variants */
.kui-button--primary {
}
.kui-button--secondary {
}
.kui-button--danger {
}
.kui-button--success {
}

/* Size variants */
.kui-button--xs {
}
.kui-button--sm {
}
.kui-button--md {
}
.kui-button--lg {
}
.kui-button--xl {
}
```

### Compound Modifiers

When a variant has multiple axes, each is a separate modifier class:

```html
<button class="kui-button kui-button--solid kui-button--primary kui-button--md">Save</button>
```

Never combine axes into a single modifier:

```css
/* ✗ Wrong: compound modifier */
.kui-button--solid-primary-md {
}

/* ✓ Correct: separate modifiers */
.kui-button--solid {
}
.kui-button--primary {
}
.kui-button--md {
}
```

---

## Density

Density is **not** a class. It flows through CSS custom properties via the `[data-kui-density]` attribute on an ancestor element:

```css
/* No density classes on components */
/* ✗ .kui-button--compact { } */

/* ✓ Density handled by token variables changing automatically */
.kui-button {
  height: var(--kui-control-height-md); /* Changes with density context */
}
```

---

## CSS Custom Properties

### Component-Scoped Custom Properties

Components may define scoped custom properties for consumer override:

```css
.kui-button {
  --kui-button-bg: var(--kui-color-interactive-default);
  --kui-button-fg: var(--kui-color-text-on-interactive);
  --kui-button-height: var(--kui-control-height-md);
  --kui-button-radius: var(--kui-border-radius-sm);

  background: var(--kui-button-bg);
  color: var(--kui-button-fg);
  height: var(--kui-button-height);
  border-radius: var(--kui-button-radius);
}
```

### Naming Pattern

```text
--kui-{component}-{property}
```

| Example                   | Purpose                    |
| ------------------------- | -------------------------- |
| `--kui-button-bg`         | Button background override |
| `--kui-button-fg`         | Button foreground override |
| `--kui-button-height`     | Button height override     |
| `--kui-text-field-border` | Text field border color    |

### Rules

- Component custom properties reference global tokens as defaults
- Consumers can override per-component without affecting other components
- Variant styles override the component custom property, not the global token

---

## Internal Classes

Classes that are implementation details (not part of the public API):

```css
/* Internal: subject to change without notice */
._kui-button-ripple {
}
._kui-dialog-backdrop-fade {
}
```

### Convention

- Prefix: `._kui-` (underscore + kui)
- Not covered by semver
- Consumers should not target these

---

## Public Customization Hooks

The public styling API for consumers:

| Hook                           | Stability | Example                         |
| ------------------------------ | --------- | ------------------------------- |
| `.kui-{component}`             | Stable    | `.kui-button`                   |
| `.kui-{component}__{slot}`     | Stable    | `.kui-button__content`          |
| `.kui-{component}--{modifier}` | Stable    | `.kui-button--primary`          |
| `[data-state]`                 | Stable    | `[data-state="disabled"]`       |
| `[data-kui-component]`         | Stable    | `[data-kui-component="Button"]` |
| `[data-kui-slot]`              | Stable    | `[data-kui-slot="content"]`     |
| `--kui-{component}-*`          | Stable    | `--kui-button-bg`               |
| `._kui-*`                      | Unstable  | Internal implementation         |

---

## Summary Table

| Purpose           | Pattern                     | Example                         |
| ----------------- | --------------------------- | ------------------------------- |
| Root              | `.kui-{component}`          | `.kui-button`                   |
| Slot              | `.kui-{component}__{slot}`  | `.kui-button__start-icon`       |
| Variant           | `.kui-{component}--{value}` | `.kui-button--primary`          |
| Size              | `.kui-{component}--{size}`  | `.kui-button--sm`               |
| State             | `[data-state="value"]`      | `[data-state="disabled"]`       |
| Boolean state     | `[data-{state}]`            | `[data-disabled]`               |
| Component ID      | `[data-kui-component]`      | `[data-kui-component="Button"]` |
| Slot ID           | `[data-kui-slot]`           | `[data-kui-slot="content"]`     |
| Component CSS var | `--kui-{component}-{prop}`  | `--kui-button-bg`               |
| Global token var  | `--kui-{category}-{path}`   | `--kui-color-bg-page`           |
| Internal class    | `._kui-{detail}`            | `._kui-button-ripple`           |
