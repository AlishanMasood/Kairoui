---
sidebar_position: 9
title: asChild Architecture
---

# asChild Architecture

This document defines KairoUI's `asChild` render delegation pattern — how components transfer their behavior, props, and accessibility to a consumer-provided child element.

**Status:** Finalized (KUI-COMP-025). Validated against Box, Text, and Button proof components.

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

### Mutual Exclusivity

`as` and `asChild` are **mutually exclusive**. When both are specified:

1. `asChild` takes precedence.
2. `as` is ignored.
3. A development warning is emitted: `[ComponentName]: Both \`as\` and \`asChild\` were provided. \`asChild\` takes precedence; \`as\` is ignored.`
4. No error is thrown — the component renders using `asChild` semantics.

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
└── Returns the enhanced child (via cloneElement)
```

The **child element owns the DOM**. KairoUI enhances it.

---

## Child Requirements

### Single-child requirement

`asChild` requires **exactly one** direct React element child.

### Supported child types

| Child type                                 | Supported | Behavior                                      |
| ------------------------------------------ | --------- | --------------------------------------------- |
| Single React element (`<div>`, `<MyComp>`) | ✓         | Props merged, refs composed, element returned |
| ForwardRef component                       | ✓         | Full ref forwarding support                   |
| Class component                            | ✓         | Instance ref support                          |
| Fragment (`<>...</>`)                      | ✗         | Dev warning, fallback to default rendering    |
| Text node (`"hello"`)                      | ✗         | Dev warning, fallback to default rendering    |
| Number                                     | ✗         | Dev warning, fallback to default rendering    |
| `null` / `undefined`                       | ✗         | Dev warning, fallback to default rendering    |
| Multiple children                          | ✗         | Dev warning, only first element used          |
| Boolean (`true`/`false`)                   | ✗         | Dev warning, fallback to default rendering    |

### Fragment handling

Fragments cannot receive props. If a fragment is passed as the child:

- Development warning is emitted.
- Component falls back to rendering its default element with internal props.
- The fragment's children are NOT unwrapped (that would change semantics).

### Null and conditional child handling

If `children` is `null`, `undefined`, or empty (after `Children.toArray`):

- Development warning: component requires a child when `asChild` is true.
- Component falls back to rendering its default element.
- This enables safe conditional patterns: `{show && <Comp asChild><Child /></Comp>}`

---

## Prop Merging Rules

When `asChild` is active, props are merged using `mergeProps` with three layers:

```
Layer 1: Internal props (component behavior — lowest priority)
Layer 2: Child props (from the child element — middle priority)
Layer 3: Consumer root props (from the wrapper component — highest priority)
```

### Per-category behavior

| Prop Category                                | Behavior                           | Winner for conflicts                           |
| -------------------------------------------- | ---------------------------------- | ---------------------------------------------- |
| `className`                                  | Merged (all concatenated)          | All preserved                                  |
| `style`                                      | Shallow-merged per-property        | Child → Consumer override per-property         |
| Event handlers (`on*`)                       | Composed in sequence               | Consumer can cancel via `preventDefault`       |
| `ref`                                        | Composed (all receive the element) | All refs called                                |
| ARIA token-lists (`aria-labelledby`, etc.)   | Reconciled (deduplicated union)    | All preserved                                  |
| ARIA scalars (`aria-label`, `aria-expanded`) | Override                           | Child wins                                     |
| `data-*` attributes                          | Override per-key                   | Child wins per-key                             |
| `role`                                       | Protected                          | Internal wins (dev warning if child conflicts) |
| `id`                                         | Override                           | Child wins                                     |
| `children`                                   | Child's children preserved         | Component does NOT inject                      |
| All other scalars                            | Override                           | Child wins                                     |

### Prop precedence detail

```
mergeProps(internalProps, childProps) → intermediateProps
mergeProps(intermediateProps, consumerRootProps) → finalProps
```

Consumer root props are those passed directly to the KairoUI component (excluding `children` and `asChild` which are consumed).

---

## Event Execution Order

With `asChild` active:

```
1. Consumer/child event handler runs first
2. Internal handler runs second (if event.defaultPrevented is false)
```

### `defaultPrevented` behavior

- Consumer/child calls `event.preventDefault()` → internal handler is skipped.
- This is the standard composition-layer contract per `composeEventHandlers`.
- The internal handler checks `event.defaultPrevented` before executing.
- This allows consumer cancellation of built-in behaviors (e.g., preventing dialog close).

### Event handler source precedence

When the same event handler exists on multiple layers:

```
composeEventHandlers(childHandler, internalHandler)
```

Then consumer root props merge on top:

```
composeEventHandlers(previousComposed, consumerRootHandler)
```

---

## Ref Ownership and Assignment Order

### Sources

| Ref source    | Purpose                                                     |
| ------------- | ----------------------------------------------------------- |
| Internal ref  | Component measurement, focus management, scroll             |
| Child ref     | Consumer's ref on the child element (`<Child ref={myRef}>`) |
| Forwarded ref | Parent component's ref passed via `React.forwardRef`        |

### Composition

All refs are composed using `composeRefs`. Assignment order:

```
1. Internal ref receives the element first
2. Child ref receives the element
3. Forwarded ref receives the element last
```

All receive `null` on unmount in the same order.

### Ref forwarding contract

If the child component does not forward refs (plain function component without `forwardRef`):

- Development warning: "Slot replacement does not appear to support ref forwarding."
- The internal ref still works (attached via the clone).
- The consumer's ref on the child may not receive the DOM element.

---

## Accessibility Responsibilities

### Protected attributes (internal wins)

These attributes are required for the component's accessibility pattern. Internal values take precedence, with a dev warning if the child conflicts:

- `role` (when the component defines a required role)
- `aria-expanded` / `aria-pressed` / `aria-checked` (when managed by component state)

### Reconciled attributes (both preserved)

- `aria-labelledby` — internal + child tokens merged, deduplicated
- `aria-describedby` — internal + child tokens merged, deduplicated
- `aria-controls` — internal + child tokens merged, deduplicated
- `aria-owns` — internal + child tokens merged, deduplicated

### Consumer-controlled attributes (child wins)

- `aria-label` — child's label overrides internal
- `aria-disabled` — child's value overrides (for explicit consumer control)
- `id` — child controls its own identity

### Disabled and interaction-state reconciliation

When `asChild` is used with a disabled/loading component:

- Internal disabled state props (`aria-disabled`, `data-disabled`) are merged onto child.
- Native `disabled` attribute only applied if child is a natively-disableable element.
- Event suppression for non-native disabled elements handled by the component (not by `asChild` itself).

---

## className and style Merging

### className

All classNames from all layers are concatenated:

```
result = cx(internalClassName, childClassName, consumerClassName)
```

No deduplication — CSS specificity handles conflicts.

### style

Shallow object merge with later layers winning per-property:

```
result = { ...internalStyle, ...childStyle, ...consumerStyle }
```

CSS custom properties (`--kui-*`) from internal are preserved unless explicitly overridden.

---

## Data Attribute Merging

Internal data attributes (e.g., `data-kui-component`, `data-state`) are applied first. Child data attributes override per-key. Consumer root props override per-key on top.

```
data-kui-component: always from internal (not overridable)
data-state: from internal state management
data-*: child wins, then consumer wins per-key
```

---

## Invalid Child Diagnostics

All diagnostics are development-only (no-op in production).

| Condition                  | Message                                                                                               | Behavior                   |
| -------------------------- | ----------------------------------------------------------------------------------------------------- | -------------------------- |
| Zero children              | `[Name]: \`asChild\` requires exactly one React element child, but received 0 children.`              | Fallback to default render |
| Multiple children          | `[Name]: \`asChild\` requires exactly one React element child, but received N children.`              | Use first valid element    |
| Text/number child          | `[Name]: \`asChild\` requires a React element child, but received [type].`                            | Fallback to default render |
| Fragment child             | `[Name]: \`asChild\` requires a React element child, but received a fragment.`                        | Fallback to default render |
| Both `as` and `asChild`    | `[Name]: Both \`as\` and \`asChild\` were provided. \`asChild\` takes precedence; \`as\` is ignored.` | Use asChild semantics      |
| Child doesn't forward refs | `[Name]: Child component does not appear to support ref forwarding.`                                  | Continue without child ref |

---

## SSR Behavior

`asChild` uses `React.cloneElement` which is fully SSR-compatible:

- `renderToString` produces the child element with merged props in the HTML output.
- No DOM globals are accessed during the merge.
- No `useLayoutEffect` or browser-only APIs are required.
- Hydration works correctly because the server output matches the client render.

---

## Strict Mode Behavior

- `cloneElement` is compatible with React Strict Mode.
- Composed refs are called correctly (mount → unmount → mount in development).
- Event handlers fire exactly once per user interaction.
- No side effects during render (all prop computation is pure).

---

## Interaction with the Slot System

`asChild` and the slot system are complementary:

```tsx
// Slot system: component controls all elements, consumer overrides props per slot
<Button slotProps={{ root: { className: "custom" } }}>Save</Button>

// asChild: consumer provides their own root element entirely
<Button asChild>
  <a href="/save">Save</a>
</Button>
```

### Precedence when both are used

If a component supports both slots and `asChild`:

- `asChild` applies to the **root slot only**.
- Non-root slots (startIcon, content, endIcon) render normally.
- The child element replaces what would have been the root slot's element.
- Root slot internal props are still merged onto the child.

### Slot props with asChild

Consumer `slotProps.root` are merged as consumer root props (Layer 3) when `asChild` is active. They do NOT override child props — they layer on top per `mergeProps` rules.

---

## Interaction with Polymorphism

When a component supports both `as` and `asChild`:

| State             | Behavior                                  |
| ----------------- | ----------------------------------------- |
| Neither specified | Render default element                    |
| `as="a"` only     | Render as `<a>` with internal props       |
| `asChild` only    | Delegate to single child                  |
| Both specified    | `asChild` wins, `as` ignored, dev warning |

The polymorphic type system does not affect `asChild` behavior — when `asChild` is true, the element type is determined entirely by the child.

---

## API Shape

```tsx
interface ComponentProps {
  /** Delegate rendering to the single child element. */
  asChild?: boolean;
  children?: ReactNode;
  // ... other props
}
```

### TypeScript: consumer type narrowing

When `asChild` is true, the component's native element props (e.g., `href` for an anchor default) should not be required. The child controls which props it accepts.

---

## Implementation Contract

The `renderAsChild` utility in `@kairoui/core/composition` implements this contract:

```typescript
renderAsChild({
  asChild: boolean,
  defaultElement: ElementType,
  internalProps: Record<string, unknown>,
  consumerProps: Record<string, unknown>,
  children: ReactNode,
  componentName: string,
  internalRef?: AssignableRef<unknown>,
}): ReactElement
```

### Guarantees

1. When `asChild=false`: behaves identically to standard polymorphic rendering.
2. When `asChild=true`: merges props onto the single valid child via `cloneElement`.
3. All prop merging uses the shared `mergeProps` utility (no duplication).
4. All ref composition uses the shared `composeRefs` utility.
5. Invalid states produce dev warnings, never throw in production.
6. The function is pure (no side effects, no hooks, no state).

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

### No render function children (current)

Render-as-props (`{(props) => <MyElement {...props} />}`) is not currently supported. The architecture does not prevent future addition.

---

## Future Considerations

### Render functions

A future extension may support render functions as children:

```tsx
<Dialog.Trigger asChild>{(props) => <MyButton {...props} />}</Dialog.Trigger>
```

This is NOT part of the initial implementation but the architecture does not prevent it.

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

---

## Readiness Assessment

The `asChild` contract is validated and ready for runtime implementation:

- Prop merging: validated by `mergeProps` (composition layer, 100% test coverage)
- Ref composition: validated by `composeRefs` and proof components
- Event composition: validated by Button proof component (consumer cancellation confirmed)
- ARIA reconciliation: validated by slot system tests and proof components
- SSR: validated by all proof component SSR tests (renderToString)
- Strict Mode: validated by all proof component Strict Mode tests
- Existing implementation (`renderAsChild`): functional and tested, aligned with this contract
