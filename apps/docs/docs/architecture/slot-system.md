---
sidebar_position: 10
title: Slot System Architecture
---

# Slot System Architecture

This document defines how KairoUI components expose replaceable sub-parts (slots) to consumers, enabling customization without breaking internal behavior or accessibility.

---

## Concepts

A **slot** is a named sub-part of a component that consumers can customize or replace. Slots separate what a component does (behavior, accessibility) from how it renders (structure, styling).

```tsx
// Consumer replaces the root slot with a custom element
<Button slots={{ root: "a" }} slotProps={{ root: { href: "/" } }}>
  Go Home
</Button>

// Or via compound composition
<Dialog>
  <Dialog.Trigger asChild><MyButton /></Dialog.Trigger>
  <Dialog.Content>...</Dialog.Content>
</Dialog>
```

---

## Slot Categories

| Category     | Description                                                | Example                          |
| ------------ | ---------------------------------------------------------- | -------------------------------- |
| **Public**   | Exposed to consumers. Covered by semver.                   | `root`, `content`, `label`       |
| **Internal** | Used only within the component. May change without notice. | `positioner`, layout `container` |
| **Required** | Must always render. Cannot be removed.                     | `root` (always exists)           |
| **Optional** | Renders only when content or state requires it.            | `description`, `errorMessage`    |

---

## Slot Ownership

| Owner           | Responsibility                                                                       |
| --------------- | ------------------------------------------------------------------------------------ |
| **Component**   | Defines which slots exist. Assigns default elements. Manages behavior/accessibility. |
| **Consumer**    | May replace slot elements, add props, or suppress optional slots.                    |
| **Slot system** | Merges component internals with consumer customizations.                             |

---

## Slot Lifecycle

```
1. Component declares slot definitions (names, defaults, requirements)
      ↓
2. Consumer provides overrides via `slots` and `slotProps`
      ↓
3. Slot resolver merges definitions with overrides
      ↓
4. For each slot:
   a. Determine element (default or consumer override)
   b. Merge internal props + consumer slotProps via mergeProps
   c. Compose refs (internal + consumer)
   d. Compose events (internal + consumer)
   e. Apply ARIA attributes
      ↓
5. Render resolved slots in component structure
```

---

## Slot Hierarchy

Slots form a tree within a component. Parent slots contain child slots.

```
Component
└── root (required)
    ├── startIcon (optional)
    ├── content (required)
    │   ├── label (optional)
    │   └── description (optional)
    ├── endIcon (optional)
    └── indicator (optional)
```

Hierarchy determines:

- Render order
- Accessibility relationships (label → content)
- Event bubbling paths

---

## API Design

### `slots` Prop

Allows consumers to replace the element used for each slot:

```tsx
interface ComponentProps {
  slots?: {
    root?: ElementType;
    content?: ElementType;
    label?: ElementType;
  };
}
```

Values:

- A string element name: `"a"`, `"div"`, `"span"`
- A React component: `MyCustomElement`
- Undefined: use the component's default

### `slotProps` Prop

Allows consumers to pass additional props to specific slots:

```tsx
interface ComponentProps {
  slotProps?: {
    root?: Record<string, unknown>;
    content?: Record<string, unknown>;
    label?: Record<string, unknown>;
  };
}
```

Props are merged via `mergeProps` with the component's internal props for that slot.

### Naming in APIs

- **`slots` and `slotProps` keys:** `camelCase` — `root`, `content`, `startIcon`
- **Compound sub-components:** `PascalCase` — `Dialog.Content`, `Button.Icon`

---

## Slot Definition (Internal)

Each component internally defines its slots:

```ts
// Conceptual — not the final implementation
interface SlotDefinition {
  name: string;
  defaultElement: ElementType;
  required: boolean;
  internalProps: Record<string, unknown>;
  ariaRole?: string;
}
```

---

## Integration with Composition Layer

### Prop Merging

Each slot's props are resolved via `mergeProps`:

```
mergeProps(internalSlotProps, consumerSlotProps)
```

Per KUI-COMP-003: consumer slotProps override internal for scalars; events/refs/ARIA are composed/reconciled.

### Ref Composition

Each slot composes:

1. Component's internal ref for that slot
2. Consumer's ref from `slotProps.root.ref`
3. Forwarded ref (for the root slot)

### Event Composition

Consumer event handlers from `slotProps` are composed with internal handlers per the standard composition rules (consumer first, can cancel via defaultPrevented).

### Accessibility

- Internal ARIA attributes are always applied to the correct slot.
- Consumer `slotProps` can add additional ARIA but cannot remove required attributes (protected).
- ID relationships (`aria-labelledby`, etc.) are reconciled across slots.

### Polymorphic Rendering

When a consumer replaces a slot element via `slots.root = "a"`, the slot renders as that element. This is equivalent to local polymorphism scoped to one slot.

### asChild

`asChild` on a compound sub-component replaces that specific slot:

```tsx
<Dialog.Trigger asChild>
  <MyButton /> // Replaces the trigger slot element
</Dialog.Trigger>
```

This is semantically equivalent to `slots={{ trigger: MyButton }}` but with compound component ergonomics.

---

## Slot Replacement Rules

| Rule                    | Description                                                                              |
| ----------------------- | ---------------------------------------------------------------------------------------- |
| Element replacement     | Consumer provides an alternative element type via `slots`.                               |
| Prop extension          | Consumer provides additional props via `slotProps`.                                      |
| Behavioral preservation | Internal behavior (events, ARIA) is always applied regardless of replacement.            |
| Ref preservation        | Internal refs continue to work regardless of replacement.                                |
| Removal                 | Optional slots can be hidden by the component based on state (not by consumer deletion). |

### What Consumers CANNOT Do

- Remove a required slot
- Override protected ARIA on a slot
- Break accessibility relationships between slots
- Access internal-only slots

---

## Slot Metadata

Each rendered slot carries metadata via data attributes:

```html
<button data-kui-component="Button" data-kui-slot="root">
  <span data-kui-slot="startIcon">...</span>
  <span data-kui-slot="content">Click me</span>
</button>
```

Metadata is:

- Protected (`data-kui-*` cannot be overridden by consumers)
- Useful for testing (`getByTestId` alternatives)
- Useful for CSS targeting (`[data-kui-slot="content"]`)

---

## Compound Components vs. Slot Props

| Approach                           | Best For                                            | Example              |
| ---------------------------------- | --------------------------------------------------- | -------------------- |
| **Compound** (`Component.Part`)    | Complex components with consumer-arranged structure | Dialog, Menu, Tabs   |
| **Slot props** (`slots/slotProps`) | Simple components with fixed structure              | Button, Input, Badge |

A component may support both:

```tsx
// Slot prop approach (simple)
<Button slots={{ root: "a" }} slotProps={{ root: { href: "/" } }}>Go</Button>

// Compound approach (complex)
<Dialog>
  <Dialog.Trigger>Open</Dialog.Trigger>
  <Dialog.Content>...</Dialog.Content>
</Dialog>
```

---

## Rules for Adding Slots

1. A slot must have a canonical name from the component anatomy vocabulary.
2. Public slots are covered by semver — breaking changes require a major version.
3. Internal slots are not exported and may change freely.
4. Every public slot must document: name, default element, required/optional, ARIA role.
5. Slot names are component-agnostic (same term = same responsibility everywhere).

---

## Future Considerations

### Slot Render Functions

```tsx
<Button
  slotProps={{
    startIcon: { render: (props) => <MyIcon {...props} /> },
  }}
>
  Save
</Button>
```

### Slot Conditional Rendering

Components control whether optional slots render based on state and props. Consumers do not directly show/hide slots.

### Slot Context

In compound components, parent slots provide context to child slots (e.g., Menu provides selection state to Menu.Item).
