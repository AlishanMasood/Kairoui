---
title: Primitive Component Architecture
sidebar_position: 20
---

# Primitive Component Architecture

Defines the rules and conventions for KairoUI primitive components.

## Purpose

Primitives are the foundational building blocks of the component library. They establish the language that all higher-level components use and provide the essential layout, typography, and structural patterns that consumers compose into applications.

## Phase 7 Primitives

| Component      | Default Element | Purpose                                             |
| -------------- | --------------- | --------------------------------------------------- |
| Box            | `div`           | Generic polymorphic container with reset styles     |
| Text           | `span`          | Inline/block text with typography token consumption |
| Heading        | `h2`            | Semantic heading (h1–h6) with typography scale      |
| Flex           | `div`           | Flexbox container with direction/gap/align          |
| Stack          | `div`           | Vertical flex shorthand (spacing children)          |
| Grid           | `div`           | CSS grid with columns/gap                           |
| Container      | `div`           | Max-width centered content area                     |
| Surface        | `div`           | Elevated panel with background/border/shadow        |
| Divider        | `hr`            | Semantic separator line                             |
| Spacer         | `div`           | Explicit whitespace control                         |
| Center         | `div`           | Center content horizontally and/or vertically       |
| AspectRatio    | `div`           | Fixed aspect ratio wrapper                          |
| VisuallyHidden | `span`          | Screen-reader-only content                          |
| Icon           | `svg`           | Accessible SVG icon wrapper                         |

## Component Factory

All primitives use `createComponent` from the composition engine:

```tsx
export const MyPrimitive = createComponent<OwnProps, "div">({
  displayName: "MyPrimitive",
  defaultElement: "div",
  useComponent: (ctx) => ({
    rootProps: { ref: ctx.ref, className: componentClass(styleContract.name) },
    consumedProps: ["myProp"],
  }),
});
```

## Public API Conventions

### Props

- **Own props** are component-specific (e.g., `direction` on Flex, `level` on Heading)
- **className** — always merged with internal class (consumer appends, never replaces)
- **style** — always merged per-property (consumer overrides individual properties)
- **as** — polymorphic element type override
- **asChild** — render delegation to child element
- **ref** — forwarded to the root DOM element
- **children** — standard React children

### Naming

- Component names: PascalCase (`Flex`, `Stack`, `VisuallyHidden`)
- Props: camelCase (`direction`, `alignItems`, `maxWidth`)
- No abbreviations in public API (`direction` not `dir`)
- Boolean props: positive form (`inline` not `notBlock`)

### Prop Design Rules

1. **No arbitrary CSS-as-props.** Primitives do NOT expose every CSS property.
2. **Intent over implementation.** Props express layout intent (`direction="column"`) not raw CSS (`flexDirection="column"`).
3. **Token-backed values.** Where props accept sizing/spacing values, they reference the token scale (e.g., `gap="md"` maps to `spacing.inline.md`).
4. **Enums over strings.** Constrained props use union types, not arbitrary strings.
5. **Style contract override.** For values outside the prop API, consumers use `className` or `style`.

### What Does NOT Belong in Props

- Individual CSS properties (margin, padding, color, font-size)
- Responsive breakpoint arrays
- Conditional styling logic
- Theme variant selection (use CSS custom properties or className)

## Polymorphic Rendering

All primitives support `as` for element type override:

```tsx
<Box as="section">...</Box>
<Text as="label" htmlFor="input-1">Name</Text>
<Heading as="h1">Page Title</Heading>
```

Rules:

- Default element is chosen for correct semantics
- `as` changes only the rendered element, not behavior
- Native element props flow through correctly (e.g., `href` for `as="a"`)
- Ref type follows the element type

## Style Architecture

### Style Contracts

Every primitive defines a `ComponentStyleContract`:

```ts
export const flexStyleContract: ComponentStyleContract = {
  name: "flex",
  slots: { root: { base: { display: "flex", ... } } },
};
```

### CSS Custom Properties

Primitives expose behavior through custom properties for consumer override:

```css
.kui-flex {
  --kui-flex-direction: row;
  --kui-flex-gap: var(--kui-space-inline-md, 16px);
  display: flex;
  flex-direction: var(--kui-flex-direction);
  gap: var(--kui-flex-gap);
}
```

### Class Names

- Root class: `kui-{component}` (e.g., `kui-flex`, `kui-stack`)
- No variant modifier classes for simple primitives
- Generated via `componentClass(contract.name)`

### Consumer Overrides

Consumer `className` and `style` always compose (never replace):

```tsx
<Flex className="app-nav" style={{ maxWidth: "1200px" }}>
```

## Token Consumption

Primitives reference design tokens through the style contract:

- **Spacing:** `spacing.inline.*`, `spacing.content.*`
- **Typography:** `typography.body.*`, `typography.pageTitle.*`
- **Colors:** `color.surface.*`, `color.foreground.*`
- **Borders:** `border.radius.*`, `border.width.*`
- **Elevation:** `shadow.*`

Token values flow through CSS custom properties — consumers override via CSS, not props.

## Responsive Behavior

Phase 7 primitives do **not** implement responsive props (e.g., `gap={[4, 8, 16]}`).

Responsive behavior is achieved through:

1. CSS custom properties that respond to container/viewport queries
2. Consumer media queries applied via `className`
3. Future responsive API (Phase 8+)

## Accessibility

### Requirements for All Primitives

- Semantic HTML by default (correct element choices)
- `ref` forwarding for focus management
- No ARIA attributes unless semantically justified
- Native element semantics preserved with `as`

### Component-Specific

| Component      | A11y Requirement                                                   |
| -------------- | ------------------------------------------------------------------ |
| Heading        | Must render h1–h6 (correct heading hierarchy)                      |
| Divider        | `role="separator"` when decorative                                 |
| VisuallyHidden | Visually hidden but announced by screen readers                    |
| Icon           | `aria-hidden="true"` when decorative; `aria-label` when meaningful |

## Bundle Size

### Budget Per Primitive

- Layout primitives (Box, Flex, Stack, Grid, etc.): < 500B minified each
- Typography primitives (Text, Heading): < 500B minified each
- Utility primitives (VisuallyHidden, Spacer): < 200B minified each
- Total Phase 7 primitives: < 5KB minified addition to composition.js

### Why Small

Primitives are thin wrappers around the composition engine. The engine does the work; primitives just configure it.

## Package Location

All primitives live in `@kairoui/core`:

```
packages/core/src/primitives/
  box.tsx
  box.styles.ts
  text.tsx
  text.styles.ts
  heading.tsx
  heading.styles.ts
  flex.tsx
  flex.styles.ts
  ...
```

Exported from a new subpath: `@kairoui/core/primitives`

## What Belongs in Later Phases

| Category               | Examples               | Phase    |
| ---------------------- | ---------------------- | -------- |
| Interactive primitives | Button, Link, Input    | Phase 8  |
| Composite components   | Menu, Dialog, Select   | Phase 9+ |
| Data display           | Table, List, Card      | Phase 9+ |
| Feedback               | Toast, Alert, Progress | Phase 9+ |
| Navigation             | Tabs, Breadcrumb, Nav  | Phase 9+ |
| Responsive prop API    | `gap={[4, 8]}`         | Phase 8+ |
| Animation system       | transitions, motion    | Phase 8+ |
