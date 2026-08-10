---
sidebar_position: 3
title: Component Authoring Guide
---

# Component Authoring Guide

This guide covers how to build KairoUI components using the Phase 5 composition infrastructure. All examples are derived from validated proof components (Box, Text, Button).

---

## Workflow

```text
1. Define component anatomy (slots)
2. Define public props
3. Define owner state
4. Define default elements
5. Use createComponent factory
6. Resolve slot props
7. Apply accessibility behavior
8. Compose refs and events
9. Render
10. Test
```

---

## Simple Component (Box Pattern)

Components with no own props, no slots, and no state:

```tsx
import { createComponent } from "@kairoui/core/composition";

export const Box = createComponent<Record<string, unknown>, "div">({
  displayName: "Box",
  defaultElement: "div",
  useComponent: ({ ref }) => ({
    rootProps: { ref },
  }),
});
```

The factory handles: `forwardRef`, `displayName`, `data-kui-component`, polymorphic `as`, `asChild`, consumer prop merging, and ref assignment.

---

## Semantic Component (Text Pattern)

Components that add internal styles or typography:

```tsx
import { createComponent } from "@kairoui/core/composition";

export const Text = createComponent<Record<string, unknown>, "span">({
  displayName: "Text",
  defaultElement: "span",
  useComponent: ({ ref }) => ({
    rootProps: {
      ref,
      style: {
        fontFamily: "var(--kui-typography-body-font-family, inherit)",
        fontSize: "var(--kui-typography-body-font-size, 0.875rem)",
      },
    },
  }),
});
```

Consumer `style` is merged per-property on top of internal style (consumer wins per CSS property).

---

## Interactive Component (Button Pattern)

Components with slots, state, accessibility, and disabled/loading behavior:

### Step 1: Define Slots

```tsx
import { defineSlots } from "@kairoui/core/composition";

type ButtonSlotNames = "root" | "startIcon" | "content" | "endIcon" | "loadingIndicator";

const buttonSlots = defineSlots({
  root: { defaultElement: "button", required: true, public: true, role: "button" },
  startIcon: { defaultElement: "span", required: false, public: true },
  content: { defaultElement: "span", required: true, public: true },
  endIcon: { defaultElement: "span", required: false, public: true },
  loadingIndicator: { defaultElement: "span", required: false, public: false },
});
```

### Step 2: Define Props

```tsx
import type { ReactNode } from "react";
import type { SlotConsumerProps } from "@kairoui/core/composition";

export interface ButtonOwnProps extends SlotConsumerProps<ButtonSlotNames> {
  children?: ReactNode;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  loading?: boolean;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}
```

Use `SlotConsumerProps<Names>` to add typed `slots` and `slotProps` props automatically.

### Step 3: Create Component

```tsx
import { createComponent } from "@kairoui/core/composition";
import { resolveAllSlotProps } from "@kairoui/core/composition";
import { renderSlot, renderOptionalSlot } from "@kairoui/core/composition";
import {
  resolveDisabledProps,
  resolveButtonType,
  computeComponentState,
} from "@kairoui/core/composition";

export const Button = createComponent<ButtonOwnProps, "button">({
  displayName: "Button",
  defaultElement: "button",
  useComponent: ({ props, ref, element }) => {
    const {
      children,
      startIcon,
      endIcon,
      loading = false,
      disabled = false,
      type = "button",
      slots: slotOverrides,
      slotProps: slotPropsOverrides,
    } = props;

    const state = computeComponentState({ disabled, loading });

    const resolved = resolveAllSlotProps({
      definitions: buttonSlots,
      internalProps: {
        startIcon: { "aria-hidden": "true" },
        content: {},
        endIcon: { "aria-hidden": "true" },
        loadingIndicator: { "aria-hidden": "true" },
      },
      overrides: { slots: slotOverrides, slotProps: slotPropsOverrides },
    });

    return {
      rootProps: { ref },
      consumedProps: ["startIcon", "endIcon", "loading", "disabled", "type", "slots", "slotProps"],
      state,
      accessibilityProps: {
        ...resolveButtonType(element, type),
        ...resolveDisabledProps(element, state.disabled, state.loading),
      },
      children: (
        <>
          {renderOptionalSlot(resolved.startIcon, startIcon != null, startIcon)}
          {renderSlot(resolved.content, children)}
          {renderOptionalSlot(resolved.endIcon, endIcon != null, endIcon)}
          {renderOptionalSlot(resolved.loadingIndicator, loading, "Loading…")}
        </>
      ),
    };
  },
});
```

---

## Key Concepts

### Prop Ownership

Props arrive from multiple sources with defined precedence:

| Priority | Source              | Example                               |
| -------- | ------------------- | ------------------------------------- |
| Lowest   | Internal base props | `data-kui-component`, internal styles |
| ↓        | Accessibility props | `type`, `disabled`, `aria-busy`       |
| ↓        | State-derived attrs | `data-state`, `data-disabled`         |
| Highest  | Consumer props      | `className`, `onClick`, `aria-label`  |

**The consumer wins** for all scalar props they explicitly provide.

### consumedProps

List own prop keys that should NOT pass to the DOM:

```tsx
consumedProps: ["startIcon", "endIcon", "loading", "disabled", "type", "slots", "slotProps"],
```

Without this, React warns about unknown DOM attributes.

### Polymorphic `as`

The factory automatically supports `as`:

```tsx
<Button as="a" href="/page">
  Link
</Button>
```

The `element` in `useComponent` context reflects the resolved target. Use it to adjust ARIA:

```tsx
accessibilityProps: {
  ...resolveButtonType(element, type),       // type only for native <button>
  ...resolveDisabledProps(element, disabled, loading), // disabled vs aria-disabled
},
```

### `asChild`

Components that support `asChild` must include it in their own props:

```tsx
interface MyProps {
  asChild?: boolean;
  // ...
}
```

The factory handles the rendering delegation automatically.

### Ref Forwarding

Always include `ref` in `rootProps`:

```tsx
rootProps: { ref },
```

The factory assigns it to the rendered element.

### Event Composition

Consumer event handlers are automatically composed with internal handlers via `mergeProps`:

- Consumer handler runs first
- Consumer can cancel internal via `event.preventDefault()`
- Both handlers fire unless canceled

### ARIA Composition

| Attribute type                                     | Behavior                             |
| -------------------------------------------------- | ------------------------------------ |
| Token-list (`aria-labelledby`, `aria-describedby`) | Both internal and consumer preserved |
| Scalar (`aria-label`, `aria-expanded`)             | Consumer overrides                   |
| Protected (`role`)                                 | Internal wins                        |

### Data Attributes

The factory generates automatically:

- `data-kui-component="ComponentName"` — always
- `data-state="default|disabled|loading"` — from `state.dataState`
- `data-disabled` — from `state.disabled`
- `data-loading` — from `state.loading`

Consumer `data-*` attributes are merged (consumer wins per key).

---

## Slot Guidelines

### When to Use Slots

- Component has multiple visual parts (icon, label, indicator)
- Consumers need to override individual sub-elements
- Different sub-elements need different ARIA attributes

### When NOT to Use Slots

- Component has a single root element (use simple factory)
- Sub-elements are purely structural (use plain JSX)
- No consumer override is needed

### Public vs Internal Slots

| Type                         | `public: true` | `public: false` |
| ---------------------------- | -------------- | --------------- |
| Consumer can replace element | ✓              | ✗               |
| Consumer can pass slotProps  | ✓              | ✗               |
| Covered by semver            | ✓              | ✗               |

Internal slots (like `loadingIndicator`) are implementation details. They can change without a breaking change.

---

## When NOT to Use

### Don't Use the Factory When

- The component is a simple wrapper with no composition needs
- You need full manual control over rendering
- The component doesn't benefit from `as`/`asChild`/metadata

Plain `forwardRef` + `mergeProps` is always valid.

### Don't Use `asChild` When

- The component always renders a specific element
- The child doesn't accept arbitrary props
- The component needs wrapper DOM for layout

### Don't Use Polymorphic `as` When

- The component is semantically tied to one element (e.g., `<input>`)
- Type inference isn't needed for native props
- The component is a layout primitive that always renders `<div>`

---

## Testing

### Runtime Tests

```tsx
it("renders default element", () => {
  render(<Button data-testid="btn">Click</Button>);
  expect(screen.getByTestId("btn").tagName).toBe("BUTTON");
});

it("forwards ref", () => {
  const ref = createRef<HTMLButtonElement>();
  render(<Button ref={ref}>Click</Button>);
  expect(ref.current).toBeInstanceOf(HTMLButtonElement);
});

it("applies disabled state", () => {
  render(
    <Button data-testid="btn" disabled>
      Click
    </Button>,
  );
  expect(screen.getByTestId("btn").hasAttribute("disabled")).toBe(true);
  expect(screen.getByTestId("btn").getAttribute("data-state")).toBe("disabled");
});
```

### SSR Tests

```tsx
it("renders to string", () => {
  const html = renderToString(<Button>Save</Button>);
  expect(html).toContain("<button");
  expect(html).toContain('data-kui-component="Button"');
});
```

### Strict Mode Tests

```tsx
it("works in StrictMode", () => {
  render(
    <StrictMode>
      <Button data-testid="s">OK</Button>
    </StrictMode>,
  );
  expect(screen.getByTestId("s").textContent).toContain("OK");
});
```

---

## Anti-Patterns

### ❌ Duplicating merge logic

```tsx
// WRONG: manual merging
const merged = { ...internalProps, ...consumerProps };
```

Use `mergeProps` or the factory — they handle className, style, events, refs, and ARIA correctly.

### ❌ Hiding behavior in configuration

```tsx
// WRONG: magic configuration object
createComponent({ autoDisable: true, autoFocus: true, ... })
```

Keep behavior explicit in `useComponent`. The factory handles infrastructure, not behavior.

### ❌ Leaking own props to DOM

```tsx
// WRONG: missing consumedProps
return { rootProps: { ref } }; // "loading" prop leaks to <button loading>
```

Always list own prop keys in `consumedProps`.

### ❌ Checking element type with string comparison for accessibility

```tsx
// WRONG: fragile
if (element === "button") { ... }
```

Use `resolveDisabledProps(element, ...)` and `resolveButtonType(element, ...)` which handle all natively-disableable elements.
