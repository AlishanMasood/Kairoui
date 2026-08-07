---
sidebar_position: 9
title: asChild Architecture
---

# asChild Architecture

This document defines KairoUI's `asChild` render delegation pattern — how components transfer their behavior, props, and accessibility to a consumer-provided child element.

---

## Concept

`asChild` allows consumers to provide their own element while inheriting the component's behavior:

```tsx
// Component renders its own element (default)
<Dialog.Trigger>Open</Dialog.Trigger>

// Component delegates rendering to the child
<Dialog.Trigger asChild>
  <MyCustomButton>Open</MyCustomButton>
</Dialog.Trigger>
```

When `asChild` is true, the component:

- Does NOT render its default element.
- Passes its internal props, events, refs, and ARIA to the single child.
- The child becomes the rendered output.

---

## Relationship to `as` Prop

| Feature                              | `as` prop         | `asChild`         |
| ------------------------------------ | ----------------- | ----------------- |
| Changes element type                 | ✓                 | —                 |
| Consumer provides full element       | —                 | ✓                 |
| Consumer controls children/structure | —                 | ✓                 |
| Props merged onto target             | Component decides | Component decides |
| Works with third-party components    | Limited (typing)  | ✓                 |
| KairoUI owns the element             | ✓                 | ✗ (child owns)    |

`as` and `asChild` are **mutually exclusive**. A component may support both, but only one should be active at a time.

---

## Ownership Model

### Without `asChild` (default)

```
KairoUI Component
├── Creates the element (button, div, etc.)
├── Owns the ref
├── Attaches event handlers
├── Applies className, style, ARIA
└── Renders children inside
```

### With `asChild`

```
KairoUI Component
├── Does NOT create an element
├── Collects internal props, events, refs, ARIA
├── Merges them onto the single child element
└── Returns the enhanced child
```

The **child element owns the DOM**. KairoUI enhances it.

---

## Prop Merging Rules

When `asChild` is active, props are merged per KUI-COMP-003 precedence:

| Prop Category      | Behavior                                                                |
| ------------------ | ----------------------------------------------------------------------- |
| className          | Internal + child merged (child last)                                    |
| style              | Shallow-merged (child per-property wins)                                |
| Event handlers     | Composed (child handler runs first, internal respects defaultPrevented) |
| Refs               | Composed (child ref + internal ref both receive element)                |
| ARIA token-lists   | Reconciled (child tokens + internal tokens, deduplicated)               |
| ARIA scalars       | Child wins (override)                                                   |
| data-\* attributes | Merged (child wins per-key)                                             |
| role               | Internal wins (protected — dev warning if child conflicts)              |
| id                 | Child wins (consumer controls identity)                                 |
| children           | Child's children are preserved (component does NOT inject)              |

---

## Ref Merging

```
Child ref (consumer-provided) ← receives element
Internal ref (component needs) ← receives element
Forwarded ref (from parent)   ← receives element
```

All three are composed. The element is assigned to all refs on mount and null on unmount.

---

## Event Merging

Execution order with `asChild`:

```
1. Child's own event handler (consumer owns the child)
2. Component's internal handler (if not canceled via defaultPrevented)
```

This matches the standard composition-layer behavior where consumer/child runs first.

---

## Accessibility

### Required ARIA (protected)

Internal ARIA attributes required for the pattern (e.g., `aria-expanded` on a trigger) are always applied. If the child has a conflicting `aria-expanded`, the internal value wins with a development warning.

### Relationship attributes (reconciled)

`aria-labelledby`, `aria-describedby`, etc. are reconciled — both child and internal tokens are preserved.

### Role (protected)

If the component requires a specific role (e.g., `role="button"` for a non-button trigger), it is protected. Attempting to override produces a development warning.

---

## Child Validation

### Requirements

- `asChild` requires **exactly one** React element child.
- The child must be a valid React element (not a string, number, or fragment).
- Multiple children produce a development error.
- No children produces a development error.

### Validation Messages

```
[ComponentName]: `asChild` requires exactly one React element child, but received N children.
[ComponentName]: `asChild` requires a React element child, but received a string/number.
```

---

## API Shape

```tsx
interface ComponentProps {
  /** Delegate rendering to the single child element. */
  asChild?: boolean;
  children?: ReactNode;
}
```

When `asChild` is true:

1. Extract the single child element.
2. Validate it is a React element.
3. Collect internal props (from useProps/composition layer).
4. Merge internal props onto the child via `mergeProps`.
5. Clone the child with merged props and composed refs.
6. Return the cloned child.

---

## Implementation Pattern (Conceptual)

```tsx
// Pseudocode — NOT the final implementation
function Trigger({ asChild, children, ...consumerProps }) {
  const internalProps = useInternalBehavior();

  if (asChild) {
    const child = React.Children.only(children);
    return React.cloneElement(child, mergeProps(internalProps, child.props));
  }

  return <button {...mergeProps(internalProps, consumerProps)}>{children}</button>;
}
```

---

## Limitations

### Cannot wrap children

`asChild` does NOT wrap the child in additional elements. If the component needs a wrapper (e.g., for positioning), the wrapper must be separate from the `asChild` target.

### No multi-child support

Only one child element is supported. For components that need to enhance multiple children, use composition (compound components) instead.

### No string children

`asChild` does not work with text-only children. The child must be a React element that can receive props.

### Fragment children

`<>{...}</>` is not a valid child for `asChild`. Fragments cannot receive props.

### Third-party component compatibility

The child component must forward refs and spread additional props to its root DOM element. Components that don't forward refs will not receive the internal ref.

---

## Interaction with Slots

In the future, `asChild` may work with the slot system:

```tsx
<Dialog.Trigger asChild>
  <MyButton /> // Receives trigger behavior
</Dialog.Trigger>
```

The slot system provides the internal props; `asChild` delegates rendering to the child. They are complementary, not conflicting.

---

## Interaction with Polymorphism

`as` and `asChild` are mutually exclusive:

- `as="a"` — KairoUI renders an `<a>` element.
- `asChild` — KairoUI does NOT render; the child is the element.
- Both specified — `asChild` takes precedence; `as` is ignored (dev warning).

---

## Future Considerations

### Render functions

A future extension may support render functions as children:

```tsx
<Dialog.Trigger asChild>{(props) => <MyButton {...props} />}</Dialog.Trigger>
```

This is NOT part of the initial implementation but the architecture should not prevent it.

### Multiple slots with asChild

Future compound components may allow `asChild` on individual sub-parts:

```tsx
<Dialog>
  <Dialog.Trigger asChild>
    <MyButton />
  </Dialog.Trigger>
  <Dialog.Content asChild>
    <MyPanel />
  </Dialog.Content>
</Dialog>
```

Each sub-part independently supports `asChild`.
