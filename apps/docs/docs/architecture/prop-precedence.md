---
sidebar_position: 8
title: Prop Ownership and Precedence
---

# Prop Ownership and Precedence

This document defines how KairoUI components resolve props from multiple sources. The rules are deterministic, predictable, and consistent across all components.

---

## Prop-Source Categories

Props arrive at a component from multiple sources. Each source has a defined priority.

| #   | Source                       | Description                                              |
| --- | ---------------------------- | -------------------------------------------------------- |
| 1   | Component defaults           | Hardcoded defaults in the component implementation       |
| 2   | Theme defaults               | Defaults injected from the active theme context          |
| 3   | Internal base props          | Props the component generates for correct behavior       |
| 4   | Accessibility-required props | ARIA attributes required for the component's pattern     |
| 5   | State-derived props          | Props computed from internal or controlled state         |
| 6   | Consumer root props          | Props passed directly by the consumer on the component   |
| 7   | Consumer slot props          | Props passed via slot configuration (`slots.root`, etc.) |
| 8   | Polymorphic target props     | Props from the `asChild` target or `as` element          |
| 9   | Child props (future)         | Props from the child element in `asChild` composition    |

---

## Precedence Order

Higher numbers win for simple scalar props. Special merge strategies apply for composable props.

```
Lowest priority                              Highest priority
     ↓                                              ↓
┌──────────┬─────────┬──────────┬──────────┬────────────────┐
│Component │ Theme   │Internal  │State-    │Consumer        │
│defaults  │defaults │base +    │derived   │root + slot     │
│          │         │a11y      │          │props           │
└──────────┴─────────┴──────────┴──────────┴────────────────┘
```

**The consumer wins** for all props they explicitly provide — with exceptions only for accessibility-critical attributes and internal state synchronization.

---

## Merge Strategies

### Override

The highest-priority source completely replaces lower-priority values.

**Used for:** Scalar props (`disabled`, `placeholder`, `type`, `role`, `tabIndex`, scalar ARIA).

```
Result = consumer ?? state ?? internal ?? theme ?? default
```

### Merge

Values from multiple sources are combined into a single output.

**Used for:** `className`, `style`, `data-*` attributes.

```
className: internal + state + consumer (all concatenated, space-separated)
style: { ...internal, ...state, ...consumer } (consumer overrides per-property)
data-*: { ...internal, ...state, ...consumer }
```

### Compose

Multiple handlers from different sources are called in sequence.

**Used for:** Event handlers (`onClick`, `onKeyDown`, `onFocus`, etc.).

```
Execution order:
1. Consumer handler runs first
2. If consumer calls event.preventDefault(), internal handler is skipped
3. Otherwise, internal handler runs
```

### Reconcile

Multiple values are combined with deduplication into a single token list.

**Used for:** `aria-labelledby`, `aria-describedby`, `aria-controls`, `aria-owns`.

```
Result = deduplicate(consumer tokens + internal tokens)
Consumer tokens appear first (preserved priority).
```

### Protect

The internal value cannot be overridden. Consumer attempts produce a development warning.

**Used for:** Critical accessibility attributes that, if removed, would break the component's ARIA pattern.

```
Result = internal value (always)
Consumer override → dev warning
```

---

## Per-Prop Strategy Table

| Prop Category                                             | Strategy  | Consumer Wins? | Notes                                                         |
| --------------------------------------------------------- | --------- | -------------- | ------------------------------------------------------------- |
| **Scalar props** (`type`, `name`, `placeholder`)          | Override  | Yes            | Consumer fully controls                                       |
| **`className`**                                           | Merge     | Additive       | Consumer classes added to internal classes                    |
| **`style`**                                               | Merge     | Per-property   | Consumer style properties override internal ones              |
| **Event handlers** (`onClick`, `onKeyDown`, etc.)         | Compose   | Conditional    | Consumer runs first; can cancel internal via `preventDefault` |
| **Refs**                                                  | Compose   | Combined       | All refs receive the element (consumer + internal)            |
| **`aria-labelledby`**                                     | Reconcile | Additive       | Consumer tokens + internal tokens, deduplicated               |
| **`aria-describedby`**                                    | Reconcile | Additive       | Consumer tokens + internal tokens, deduplicated               |
| **`aria-controls`**                                       | Reconcile | Additive       | Consumer tokens + internal tokens, deduplicated               |
| **`aria-owns`**                                           | Reconcile | Additive       | Consumer tokens + internal tokens, deduplicated               |
| **`aria-errormessage`**                                   | Override  | Yes            | Consumer can replace the error reference                      |
| **Boolean ARIA** (`aria-disabled`, `aria-expanded`, etc.) | Override  | Yes            | Consumer can override state representation                    |
| **`role`**                                                | Protect   | No             | Changing role breaks the ARIA pattern. Dev warning.           |
| **`tabIndex`**                                            | Override  | Yes            | Consumer may need to remove from tab order                    |
| **`id`**                                                  | Override  | Yes            | Consumer-provided ID always wins                              |
| **`data-*` attributes**                                   | Merge     | Additive       | Consumer data attrs merged with internal state attrs          |
| **`disabled`**                                            | Override  | Yes            | Consumer controls disabled state                              |
| **`readOnly`**                                            | Override  | Yes            | Consumer controls read-only state                             |
| **`children`**                                            | Override  | Yes            | Consumer always owns children                                 |

---

## Protected Props

These props produce development warnings if the consumer attempts to override them:

| Prop                          | Reason                              | Warning Message Pattern                                                                                 |
| ----------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `role`                        | Changing role breaks ARIA semantics | "[ComponentName]: Overriding `role` is not supported. The component requires role=X for accessibility." |
| Required `aria-*` for pattern | Pattern-critical attributes         | "[ComponentName]: The `aria-X` attribute is managed internally for accessibility."                      |

**Note:** Protection is narrow. Only props where incorrect values would break accessibility are protected. Most ARIA props are overridable.

---

## Consumer-Controlled Props

These props are always fully consumer-controlled:

- `id`
- `className` (additive)
- `style` (per-property override)
- `children`
- `disabled`
- `readOnly`
- `tabIndex`
- `name`
- `placeholder`
- `type` (where applicable)
- All `data-*` attributes (additive)
- `aria-label` (overrides internal labelling)
- `aria-errormessage`
- `aria-describedby` (additive)

---

## Event Handler Composition Rules

```
1. Consumer handler is called first with the original event
2. If event.defaultPrevented === true after consumer handler:
   → Internal handler is SKIPPED
3. Otherwise:
   → Internal handler is called with the same event
4. Errors in consumer handler propagate (not swallowed)
5. Internal handler errors propagate (not swallowed)
```

### Example

```tsx
// Consumer prevents internal behavior
<Dialog.Trigger
  onClick={(e) => {
    if (someCondition) e.preventDefault(); // blocks dialog open
  }}
>
  Open
</Dialog.Trigger>
```

---

## Ref Composition Rules

All refs from all sources are composed and each receives the DOM element:

```
1. Consumer ref (callback or object)
2. Internal ref(s) (for measurement, focus management, etc.)
3. Slot refs (if slot replacement provides a ref)
```

All refs receive the element on mount and `null` on unmount.

---

## Slot Prop Precedence

When consumers provide slot-level props via configuration:

```tsx
<Button slots={{ root: { className: "custom" } }}>Save</Button>
```

Precedence within the slot:

```
Component defaults < Theme defaults < Internal < State < Slot config < Root props
```

Root props (direct props on the component) have highest priority. Slot config props override internal behavior but are overridden by direct root props.

---

## Future `asChild` Precedence

When `asChild` is used, the child element provides the render target:

```tsx
<Dialog.Trigger asChild>
  <MyButton className="custom" onClick={myHandler}>
    Open
  </MyButton>
</Dialog.Trigger>
```

Precedence:

```
Internal + a11y + state props are merged ONTO the child element
Child's own props are treated as "consumer props" (highest priority for scalars)
Event handlers are composed (child handler first, then internal)
className/style are merged (child + internal)
Refs are composed (child ref + internal ref)
```

The child always "wins" for visual/behavioral props. Internal accessibility props are reconciled to ensure correctness.

---

## Unknown Prop Forwarding

### Rules

1. Props not recognized by the component are forwarded to the root DOM element.
2. Props that are invalid HTML attributes produce a development warning and are NOT forwarded.
3. When a polymorphic target changes (e.g., `as="a"`), props valid for the new target are forwarded; props invalid for the new target are warned.
4. Custom `data-*` attributes are always forwarded.
5. `aria-*` attributes are always forwarded.
6. Event handlers (`on*`) matching valid DOM events are always forwarded.

### Invalid Prop Handling

```tsx
// ❌ href is not valid on a <button> — dev warning
<Button href="/page">Go</Button>

// ✓ href is valid on an <a> — forwarded correctly
<Button as="a" href="/page">Go</Button>
```

---

## Anti-Patterns

### ❌ Silently dropping consumer props

```tsx
// BAD: Internal handler completely replaces consumer handler
element.onClick = internalHandler; // consumer's onClick is lost
```

### ❌ Overwriting consumer ARIA

```tsx
// BAD: Internal aria-label overwrites consumer's
{ "aria-label": internalLabel } // consumer's aria-label ignored
```

### ❌ Protecting non-critical props

```tsx
// BAD: Protecting className from consumer override
// className is always additive — never protect it
```

### ❌ Implicit prop consumption

```tsx
// BAD: Consuming "size" prop but not forwarding to DOM
// If "size" is a known component prop, document it.
// If not, forward it (or warn if invalid for the target).
```

### ✓ Correct composition

```tsx
// GOOD: Events composed, consumer can cancel
const handleClick = composeEventHandlers(consumerOnClick, internalOnClick);

// GOOD: Classes merged
const className = cx(internalClasses, stateClasses, consumerClassName);

// GOOD: Refs composed
const ref = useMergedRefs(internalRef, consumerRef);

// GOOD: ARIA tokens reconciled
const labelledBy = mergeAriaLabelledBy(consumerLabelledBy, internalLabelId);
```

---

## Development Warnings

Warnings are produced in development for:

| Condition                                               | Warning                                         |
| ------------------------------------------------------- | ----------------------------------------------- |
| Consumer overrides protected `role`                     | "Overriding role is not supported"              |
| Consumer passes invalid HTML attribute                  | "Prop X is not a valid attribute for element Y" |
| Consumer removes required ARIA attribute                | "aria-X is required for accessibility"          |
| Controlled/uncontrolled switching                       | "Switching between controlled and uncontrolled" |
| Unknown prop on custom component (no forwarding target) | "Unknown prop X — will not be rendered"         |

Warnings never fire in production builds.
