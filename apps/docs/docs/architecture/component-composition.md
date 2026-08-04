---
sidebar_position: 6
title: Component Composition Architecture
---

# Component Composition Architecture

This document defines the official architectural blueprint for every KairoUI component. It establishes the composition model, lifecycle, terminology, dependency flow, and design principles that all future components must follow.

---

## 1. Component Philosophy

Every KairoUI component adheres to these principles:

### Composition over Configuration

Components expose composable sub-parts rather than monolithic prop surfaces. A `Dialog` is composed of `Dialog.Trigger`, `Dialog.Content`, `Dialog.Title` — not a single component with `title`, `content`, `footer` props.

**Why:** Configuration-heavy APIs become unmaintainable at scale. Composition allows consumers to arrange, extend, and replace parts independently.

### Explicit APIs

Every behavior is opt-in. Components do not make assumptions about context, styling, or interaction patterns. If a component needs a value, it receives it through props — not implicit globals.

**Why:** Implicit behavior produces unpredictable bugs in enterprise applications where multiple teams compose components.

### Accessibility by Default

ARIA attributes, keyboard interactions, and focus management are built into the default component behavior. Consumers receive accessible components without additional work.

**Why:** Accessibility cannot be an afterthought — retrofitting ARIA into components after release produces inconsistencies and regressions.

### Predictable Behavior

Components behave identically regardless of rendering context (SSR, concurrent mode, strict mode, portals). State transitions are deterministic. Side effects are explicit.

**Why:** Enterprise applications require components that work reliably across rendering strategies without debugging framework internals.

### Separation of Concerns

Logic, styling, accessibility, and rendering are architecturally separated. A component's behavior does not depend on its visual presentation.

**Why:** Theming, density modes, and design token changes must never break component logic.

### Enterprise Scalability

APIs support controlled and uncontrolled patterns, forwarded refs, custom render targets, and incremental adoption. Components work in isolation and in composition.

**Why:** Enterprise teams adopt component libraries incrementally — components must work in partial-adoption scenarios.

---

## 2. Component Lifecycle

Every KairoUI component processes data through a deterministic pipeline from consumer input to rendered output.

### Stage 1: Prop Resolution

Consumer props are received, merged with defaults, and validated. Controlled vs. uncontrolled ownership is determined. Invalid props produce development warnings.

### Stage 2: State Resolution

Internal state is derived from resolved props. State machines (if applicable) transition based on events. Computed values are derived from state + props.

### Stage 3: Accessibility Resolution

ARIA attributes are computed from state. ID relationships are established. Keyboard interaction handlers are bound. Role, state, and property attributes are resolved.

### Stage 4: Slot Resolution

Component anatomy is assembled. Consumer overrides for sub-parts are resolved. Default slot content is determined. Render functions or component replacements are applied.

### Stage 5: Rendering

Final JSX is produced. Event handlers are attached. Refs are forwarded. CSS class names and data attributes are computed. DOM output is committed.

```
Consumer Props
      ↓
┌─────────────────┐
│ Prop Resolution  │  defaults, validation, controlled/uncontrolled
└────────┬────────┘
         ↓
┌─────────────────┐
│ State Resolution │  internal state, computed values, transitions
└────────┬────────┘
         ↓
┌─────────────────┐
│ ARIA Resolution  │  roles, states, properties, keyboard
└────────┬────────┘
         ↓
┌─────────────────┐
│ Slot Resolution  │  anatomy assembly, consumer overrides
└────────┬────────┘
         ↓
┌─────────────────┐
│   Rendering      │  JSX, refs, classes, data-attributes, DOM
└─────────────────┘
```

---

## 3. Component Anatomy

Standard terminology for component sub-parts. Every component uses this vocabulary consistently.

| Term             | Definition                                        | Example                |
| ---------------- | ------------------------------------------------- | ---------------------- |
| **Root**         | The outermost wrapper element of a component      | `<Button>` itself      |
| **Trigger**      | An element that activates or opens another part   | `<Dialog.Trigger>`     |
| **Content**      | The primary content area of a component           | `<Dialog.Content>`     |
| **Header**       | Top section within content, typically titles      | `<Card.Header>`        |
| **Body**         | Main section within content                       | `<Card.Body>`          |
| **Footer**       | Bottom section, typically actions                 | `<Card.Footer>`        |
| **Label**        | Text that names/identifies a control              | `<Field.Label>`        |
| **Description**  | Supplementary text providing context              | `<Field.Description>`  |
| **ErrorMessage** | Validation error feedback                         | `<Field.ErrorMessage>` |
| **Icon**         | A visual icon element within a component          | `<Button.Icon>`        |
| **Indicator**    | A visual state indicator (checkbox mark, spinner) | `<Checkbox.Indicator>` |
| **Overlay**      | A backdrop/scrim behind elevated content          | `<Dialog.Overlay>`     |
| **Surface**      | A visually elevated container                     | `<Popover.Surface>`    |
| **Container**    | A layout wrapper that does not add semantics      | `<Menu.Container>`     |
| **Group**        | A semantic grouping of related items              | `<RadioGroup>`         |
| **Item**         | A single element within a collection              | `<Menu.Item>`          |

### Naming Rules

- Sub-parts use dot notation: `Component.Part`
- Parts are PascalCase: `Dialog.CloseButton`, not `Dialog.closeButton`
- Semantic names, not structural: `Label` not `TopText`

---

## 4. Composition Pipeline

The composition pipeline defines how component internals process data at each stage.

### Prop Resolution

| Responsibility       | Description                                  |
| -------------------- | -------------------------------------------- |
| Default merging      | Merge consumer props with component defaults |
| Controlled detection | Determine ownership of each stateful prop    |
| Validation           | Warn on invalid prop combinations (dev only) |
| Ref extraction       | Separate ref from other props for forwarding |
| Event extraction     | Identify event handlers for composition      |

### State Resolution

| Responsibility         | Description                                          |
| ---------------------- | ---------------------------------------------------- |
| Internal state         | Manage uncontrolled state values                     |
| Derived state          | Compute values from props + state                    |
| State transitions      | Apply transition logic (open/close, select/deselect) |
| Side effect scheduling | Schedule DOM reads, focus moves, announcements       |

### Accessibility Resolution

| Responsibility      | Description                                     |
| ------------------- | ----------------------------------------------- |
| Role assignment     | Assign ARIA roles based on component semantics  |
| State attributes    | Set `aria-expanded`, `aria-selected`, etc.      |
| Property attributes | Set `aria-labelledby`, `aria-describedby`, etc. |
| ID generation       | Generate and link accessibility IDs             |
| Keyboard map        | Bind keyboard handlers per ARIA pattern         |

### Slot Resolution

| Responsibility        | Description                                         |
| --------------------- | --------------------------------------------------- |
| Part assembly         | Compose sub-parts into final structure              |
| Consumer overrides    | Apply `asChild`, render props, or slot replacements |
| Default content       | Provide fallback content for empty slots            |
| Conditional rendering | Show/hide parts based on state                      |

### Rendering

| Responsibility    | Description                                      |
| ----------------- | ------------------------------------------------ |
| Class composition | Merge base, state, variant, and consumer classes |
| Data attributes   | Apply `data-state`, `data-disabled`, etc.        |
| Event binding     | Attach composed event handlers                   |
| Ref forwarding    | Forward merged refs to DOM elements              |
| Output            | Produce final React elements                     |

---

## 5. Dependency Flow

Dependencies flow strictly downward. No layer may depend on a layer above it.

```
┌─────────────────────────────────────┐
│         Application Code            │
└──────────────────┬──────────────────┘
                   ↓
┌─────────────────────────────────────┐
│   Component Packages                │
│   (@kairoui/button, @kairoui/dialog)│
└──────────────────┬──────────────────┘
                   ↓
┌─────────────────────────────────────┐
│   @kairoui/core                     │
│   (composition primitives,          │
│    component factory, providers)    │
└──────────────────┬──────────────────┘
                   ↓
┌─────────────────────────────────────┐
│   @kairoui/hooks                    │
│   (useControlled, useMergedRefs,    │
│    useId, useMediaQuery, ...)       │
└──────────────────┬──────────────────┘
                   ↓
┌─────────────────────────────────────┐
│   @kairoui/utils                    │
│   (type guards, merge, cx,          │
│    events, DOM, ARIA, ...)          │
└──────────────────┬──────────────────┘
                   ↓
┌─────────────────────────────────────┐
│   @kairoui/theme                    │
│   (theme provider, mode switching,  │
│    CSS variable generation)         │
└──────────────────┬──────────────────┘
                   ↓
┌─────────────────────────────────────┐
│   @kairoui/tokens                   │
│   (color, spacing, typography,      │
│    density, semantic contracts)     │
└─────────────────────────────────────┘
```

### Why This Direction

- **Tokens** are the foundation — they define the design language with zero runtime dependencies.
- **Theme** consumes tokens to provide runtime theming, mode switching, and CSS variable generation.
- **Utils** provides framework-independent utilities. It has zero dependencies.
- **Hooks** provides React-specific patterns built on utils. It depends only on utils + React.
- **Core** provides composition primitives (providers, context, factories) that components use.
- **Component packages** implement specific UI components using everything below.
- **Applications** consume components.

### Forbidden Dependencies

| Package           | Must NOT depend on                              |
| ----------------- | ----------------------------------------------- |
| `@kairoui/tokens` | theme, utils, hooks, core, components           |
| `@kairoui/utils`  | tokens, theme, hooks, core, components          |
| `@kairoui/theme`  | utils, hooks, core, components                  |
| `@kairoui/hooks`  | theme, core, components                         |
| `@kairoui/core`   | individual component packages                   |
| Components        | other component packages (unless explicit peer) |

---

## 6. Package Responsibilities

### @kairoui/tokens

**Contains:** Design token values, scales, semantic contracts, CSS output.
**Does not contain:** Runtime logic, React code, theming logic.
**Dependencies:** None.

### @kairoui/utils

**Contains:** Pure TypeScript utilities, type guards, object/array/string helpers, DOM guards, event composition, ARIA helpers, ref utilities, class composition.
**Does not contain:** React hooks, components, theme logic, design tokens.
**Dependencies:** None.

### @kairoui/theme

**Contains:** Theme provider, theme creation, mode switching, CSS variable generation, no-flash script, server utilities.
**Does not contain:** Component logic, hooks (beyond its own internal hooks), utilities.
**Dependencies:** @kairoui/tokens.

### @kairoui/hooks

**Contains:** React hooks for state, refs, events, media queries, accessibility, focus, lifecycle.
**Does not contain:** Components, JSX, theme logic, design tokens.
**Dependencies:** @kairoui/utils, react (peer).

### @kairoui/core

**Contains:** Composition primitives, component factory infrastructure, provider context, slot system primitives, prop merging infrastructure.
**Does not contain:** Specific UI components (Button, Input, etc.), styling engine, variant engine.
**Dependencies:** @kairoui/theme, @kairoui/hooks, @kairoui/utils, react (peer).

### Component Packages (future)

**Contains:** One component family per package (e.g., `@kairoui/button`), stories, tests, documentation.
**Does not contain:** Other components, shared infrastructure.
**Dependencies:** @kairoui/core, react (peer).

---

## 7. Public API Philosophy

### Props Follow React Conventions

```tsx
// ✓ Standard React patterns
<Button disabled onClick={handleClick} ref={buttonRef}>
  Save
</Button>

// ✓ Controlled/uncontrolled
<Dialog open={isOpen} onOpenChange={setIsOpen}>
<Dialog defaultOpen>
```

### Composition via Sub-Components

```tsx
// ✓ Composable parts
<Card>
  <Card.Header>
    <Card.Title>Dashboard</Card.Title>
  </Card.Header>
  <Card.Body>Content here</Card.Body>
  <Card.Footer>
    <Button>Action</Button>
  </Card.Footer>
</Card>
```

### Render Delegation

```tsx
// ✓ asChild pattern for custom elements
<Dialog.Trigger asChild>
  <MyCustomButton>Open</MyCustomButton>
</Dialog.Trigger>
```

### Callback Naming

```tsx
// ✓ on[Thing]Change for state changes
onOpenChange = { setOpen };
onValueChange = { setValue };
onCheckedChange = { setChecked };

// ✓ on[Event] for DOM events forwarded
onClick = { handleClick };
onKeyDown = { handleKey };
```

### Ref Forwarding

Every component forwards refs to its root DOM element. No exceptions.

### Data Attributes for Styling

```tsx
// Components expose state via data attributes
<button data-state="open" data-disabled="">
```

### No Style Props

Components do not accept `style`, `className` for internal styling. Consumers style via tokens, themes, and data-attribute selectors.

---

## 8. Internal Architecture (Concepts)

These are architectural concepts that will be implemented in future phases. They are defined here to guide implementation decisions.

### Component Factory

A standardized creation function that produces components with consistent behavior: ref forwarding, display name, prop merging, and accessibility defaults.

### Prop Resolver

A pipeline stage that merges consumer props with defaults, detects controlled/uncontrolled ownership, and produces the final prop record for downstream stages.

### Slot Resolver

A system for declaring component anatomy and allowing consumers to replace or augment individual parts. Supports `asChild`, render functions, and component overrides.

### State Resolver

A pattern for managing component state that supports controlled, uncontrolled, and derived values with predictable update semantics.

### Accessibility Resolver

A stage that computes complete ARIA attributes from component state, linking IDs, setting roles, and binding keyboard interaction handlers.

---

## 9. Architectural Constraints

### No CSS-in-JS Runtime

KairoUI components are styled via CSS custom properties (tokens) and CSS classes. No runtime CSS generation, no styled-components, no Emotion.

### No Global State

Components do not share state through global stores. Communication happens through React context (scoped), callbacks, and composition.

### No Implicit Side Effects

Components do not perform side effects on mount without explicit consumer opt-in. No automatic focus, no automatic scroll, no automatic announcements unless the component's ARIA pattern requires it.

### No Internal Component Dependencies

`@kairoui/button` must never import from `@kairoui/dialog`. If two components need shared behavior, that behavior belongs in `@kairoui/core` or `@kairoui/hooks`.

### Strict Versioning Boundaries

Public APIs are covered by semver. Internal APIs (not exported from package entry points) may change without notice. Consumers must never import from `/src/` paths.

---

## 10. Extension Points

### Theme Customization

Components respond to theme tokens and density modes. Custom themes change appearance without component code changes.

### Slot Replacement

Every named part of a component can be replaced by consumers via the slot system (future implementation).

### Event Interception

All event handlers are composable — consumer handlers run first, internal handlers respect `defaultPrevented`.

### Data Attribute Selectors

Components expose their state via data attributes, enabling CSS-only style customization without JavaScript.
