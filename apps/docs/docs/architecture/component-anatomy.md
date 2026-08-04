---
sidebar_position: 7
title: Component Anatomy and Slot Terminology
---

# Component Anatomy and Slot Terminology

This document defines the canonical vocabulary for component sub-parts (slots) across all KairoUI components. Every future component must use this terminology consistently.

---

## Naming Rules

### In Sub-Component APIs (dot notation)

Slot names are **PascalCase** when exposed as sub-components:

```tsx
<Dialog.Trigger />
<Dialog.Content />
<Card.Header />
```

### In Slot Props and Configuration Objects

Slot names are **camelCase** when used as object keys:

```tsx
<Component slots={{ root: CustomRoot, content: CustomContent }} />
```

### General Rules

- Use a **single canonical term** for each responsibility across all components.
- Prefer **semantic** names (what it does) over **visual** names (how it looks).
- Slot names must be **component-agnostic** — the same term means the same thing everywhere.
- Never introduce a new term if an existing term already covers the responsibility.
- Never use abbreviations in slot names (`Desc` → use `Description`).

---

## Canonical Terminology

### Structural Slots

| Term          | Definition                                                                                                | Use When                                                                        | Do Not Use When                                  | Category   | Public | Replaceable | Owns                     |
| ------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------ | ---------- | ------ | ----------- | ------------------------ |
| **Root**      | The outermost element of a component. Receives forwarded ref, merged props, and data attributes.          | Every component has exactly one Root.                                           | —                                                | Structural | Yes    | Yes         | ref, events, ARIA        |
| **Container** | A non-semantic layout wrapper used purely for positioning or grouping. Adds no ARIA semantics.            | Layout spacing is required around content but no semantic boundary exists.      | A semantic grouping is needed (use Group).       | Structural | Rarely | Yes         | ref                      |
| **Surface**   | A visually distinct elevated area (card, popover body, tooltip body). Implies background, border, shadow. | The element represents a visually elevated region with its own background.      | The element is flush/inline with its parent.     | Structural | Yes    | Yes         | ref, ARIA                |
| **Content**   | The primary content area within a component. Contains the main body of information.                       | The component has a distinct wrapper around its main content.                   | The component IS the content (use Root).         | Structural | Yes    | Yes         | ref                      |
| **Header**    | The top section of a structured content area. Typically contains title and actions.                       | A component has distinct top/body/bottom sections.                              | Only one section exists (use Content).           | Structural | Yes    | Yes         | ref                      |
| **Body**      | The main scrollable/expandable section between Header and Footer.                                         | Distinct from header and footer sections.                                       | No header/footer exists (use Content).           | Structural | Yes    | Yes         | ref                      |
| **Footer**    | The bottom section of a structured content area. Typically contains actions.                              | A component has distinct top/body/bottom sections.                              | Only one section exists (use Content).           | Structural | Yes    | Yes         | ref                      |
| **Section**   | A thematic grouping within content that adds semantic boundaries.                                         | Content is divided into meaningful sub-sections (fieldsets, collapsible areas). | Items are list-like (use Group + Item).          | Structural | Yes    | Yes         | ref, ARIA                |
| **Group**     | A semantic collection of related sibling items (radio group, button group, menu group).                   | A set of items share a common role or purpose.                                  | Items are unrelated (use Container for layout).  | Structural | Yes    | Yes         | ref, ARIA (role=group)   |
| **Item**      | A single element within a Group or list. Has identity, may be selectable/focusable.                       | The element is one of many siblings in a collection.                            | The element is standalone (use Root or Content). | Structural | Yes    | Yes         | ref, events, state, ARIA |

### Text and Form Slots

| Term             | Definition                                                                                 | Use When                                                                | Do Not Use When                                                                       | Category      | Public | Replaceable | Owns           |
| ---------------- | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ------------- | ------ | ----------- | -------------- |
| **Label**        | Text that identifies/names a control. Linked via `aria-labelledby` or `<label>`.           | A form control needs an accessible name.                                | Decorative text with no control relationship.                                         | Accessibility | Yes    | Yes         | ref, ARIA (id) |
| **Description**  | Supplementary text providing guidance. Linked via `aria-describedby`.                      | Additional context helps the user beyond the label.                     | The text IS the label (use Label).                                                    | Accessibility | Yes    | Yes         | ref, ARIA (id) |
| **ErrorMessage** | Validation error text. Linked via `aria-errormessage`. Shown only when invalid.            | A field has a validation error to communicate.                          | General help text (use Description).                                                  | Accessibility | Yes    | Yes         | ref, ARIA (id) |
| **Value**        | The rendered representation of a component's current value (select display, date display). | A control needs to display its selected value in non-editable form.     | The value is an input element (use native input).                                     | Behavioral    | Yes    | Yes         | ref            |
| **Placeholder**  | Content shown when a component has no value.                                               | A control is empty and needs a visual hint.                             | The control has a value (show Value).                                                 | Visual        | Yes    | Yes         | ref            |
| **Text**         | Generic inline text content within a component.                                            | Simple text inside a button, badge, or tag that needs no semantic role. | The text has an accessibility relationship (use Label, Description, or ErrorMessage). | Visual        | Rarely | Yes         | ref            |

### Action and Interaction Slots

| Term        | Definition                                                                                                      | Use When                                                          | Do Not Use When                                        | Category   | Public | Replaceable | Owns                                                  |
| ----------- | --------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------ | ---------- | ------ | ----------- | ----------------------------------------------------- |
| **Trigger** | An element that activates/opens/expands another part (button that opens a dialog, anchor that shows a popover). | A user action reveals or activates associated content.            | The element submits or navigates (use Action).         | Behavioral | Yes    | Yes         | ref, events, ARIA (aria-expanded, aria-haspopup)      |
| **Action**  | An element that performs a primary operation (submit, save, delete).                                            | The element causes a side-effect or navigation.                   | The element toggles visibility (use Trigger).          | Behavioral | Yes    | Yes         | ref, events                                           |
| **Control** | An interactive input element that the user manipulates (checkbox input, slider thumb, switch track).            | The element is the primary interactive surface of a form control. | The element opens something (use Trigger).             | Behavioral | Yes    | Yes         | ref, events, state, ARIA                              |
| **Close**   | An element that dismisses/closes an opened component.                                                           | A dialog, popover, or panel has an explicit close affordance.     | Closing happens implicitly via Trigger toggle.         | Behavioral | Yes    | Yes         | ref, events                                           |
| **Clear**   | An element that resets a control to its empty/default state.                                                    | A field has a clearable value (search, multi-select).             | The operation is "undo" (use application-level logic). | Behavioral | Yes    | Yes         | ref, events                                           |
| **Toggle**  | An element that switches between exactly two states.                                                            | Binary state switching (on/off, show/hide, expand/collapse).      | More than two states exist (use Control).              | Behavioral | Yes    | Yes         | ref, events, state, ARIA (aria-pressed, aria-checked) |

### Visual Slots

| Term          | Definition                                                                               | Use When                                                  | Do Not Use When                                        | Category     | Public        | Replaceable | Owns      |
| ------------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------ | ------------ | ------------- | ----------- | --------- |
| **Icon**      | A visual icon element within a component. When only one icon exists.                     | The component has a single icon position.                 | Multiple icon positions exist (use StartIcon/EndIcon). | Visual       | Yes           | Yes         | ref       |
| **StartIcon** | An icon at the start (leading) position respecting text direction.                       | The component has both start and end icon positions.      | Only one icon slot exists (use Icon).                  | Visual       | Yes           | Yes         | ref       |
| **EndIcon**   | An icon at the end (trailing) position respecting text direction.                        | The component has both start and end icon positions.      | Only one icon slot exists (use Icon).                  | Visual       | Yes           | Yes         | ref       |
| **Indicator** | A visual element that represents component state (checkmark, radio dot, spinner, count). | The component needs a visual representation of its state. | The element is decorative only (use Icon).             | Visual/State | Yes           | Yes         | ref, ARIA |
| **Marker**    | A visual annotation or highlight (unread dot, status dot, new badge).                    | A lightweight status annotation is needed.                | A full badge component is appropriate (use Badge).     | Visual       | Yes           | Yes         | ref       |
| **Avatar**    | A user/entity representation (photo, initials).                                          | A person or entity is identified visually.                | A generic image is shown (use Image).                  | Visual       | Yes           | Yes         | ref       |
| **Image**     | A content image within a component.                                                      | Visual media is part of the component content.            | The image represents a person (use Avatar).            | Visual       | Yes           | Yes         | ref       |
| **Divider**   | A visual separator between sections or items.                                            | Visual distinction is needed between regions.             | Semantic section boundary exists (use Section).        | Visual       | No (internal) | Yes         | ref       |
| **Badge**     | A small status/count overlay attached to another element.                                | A count, status, or label decorates a parent element.     | The status is inline text (use Marker or Indicator).   | Visual       | Yes           | Yes         | ref       |

### Overlay Slots

| Term           | Definition                                                                                   | Use When                                                           | Do Not Use When                                     | Category    | Public        | Replaceable | Owns        |
| -------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | --------------------------------------------------- | ----------- | ------------- | ----------- | ----------- |
| **Portal**     | A React portal boundary that renders content outside the DOM hierarchy.                      | Content must escape parent overflow/stacking context.              | Content renders in-place (no Portal needed).        | Structural  | Rarely        | No          | —           |
| **Backdrop**   | A full-screen overlay that blocks interaction with underlying content. Implies `aria-modal`. | A modal dialog or blocking interaction pattern is used.            | Content is non-modal (use Overlay or nothing).      | Visual/A11y | Yes           | Yes         | ref, events |
| **Overlay**    | A semi-transparent layer behind elevated content. Non-blocking.                              | A visual dimming effect is needed but content remains interactive. | Interaction must be blocked (use Backdrop).         | Visual      | Yes           | Yes         | ref         |
| **Positioner** | A zero-size anchoring element that positions floating content relative to a trigger.         | Floating content (popover, tooltip, dropdown) needs positioning.   | Content is inline or modal (no positioning needed). | Structural  | No (internal) | Rarely      | ref         |
| **Popup**      | The floating content container that appears above the page.                                  | A non-modal floating panel is shown (menu, popover, tooltip).      | The content is modal (use Content + Backdrop).      | Structural  | Yes           | Yes         | ref, ARIA   |
| **Arrow**      | A visual pointer connecting floating content to its trigger.                                 | Floating content needs a directional indicator.                    | The relationship is obvious without an arrow.       | Visual      | Yes           | Yes         | ref         |

---

## Public vs. Internal Slots

### Public Slots

- Exposed as sub-components (`Component.SlotName`) or slot configuration props.
- Covered by semver — breaking changes require a major version.
- Must have stable naming and documented behavior.
- Consumers may replace or extend them.

### Internal Slots

- Not exported from the package entry point.
- Used only within the component's implementation.
- May change without notice.
- Examples: `Positioner`, `Divider` (when purely cosmetic), layout `Container`.

### Guidance

| Signal                          | Likely Public | Likely Internal |
| ------------------------------- | ------------- | --------------- |
| Consumer needs to style it      | ✓             |                 |
| Consumer needs to replace it    | ✓             |                 |
| Has accessibility relationships | ✓             |                 |
| Pure layout/positioning         |               | ✓               |
| Implementation detail           |               | ✓               |
| Refs needed by consumers        | ✓             |                 |

---

## Slot Hierarchy

Slots form a predictable nesting hierarchy:

```
Root
├── Header
│   ├── Label
│   ├── Description
│   └── Action / Close
├── Body / Content
│   ├── Group
│   │   └── Item (×n)
│   ├── Section
│   │   └── ...
│   └── Value / Placeholder
├── Footer
│   └── Action (×n)
├── Indicator
├── StartIcon / EndIcon
└── (overlays — rendered via Portal)
    ├── Backdrop
    ├── Positioner
    │   ├── Popup / Surface
    │   │   └── Content
    │   └── Arrow
    └── ...
```

Not every component uses every slot. Simple components (Badge, Divider) may only have Root.

---

## Anti-Patterns

### Prohibited Terms

| Term        | Why Prohibited                               | Use Instead                                     |
| ----------- | -------------------------------------------- | ----------------------------------------------- |
| `Wrapper`   | Vague — everything is a wrapper              | `Root`, `Container`, or `Surface`               |
| `Inner`     | Positional, not semantic                     | `Content`, `Body`                               |
| `Outer`     | Positional, not semantic                     | `Root`, `Container`                             |
| `Box`       | Too generic — no semantic meaning            | `Surface`, `Container`, `Content`               |
| `Title`     | Ambiguous with HTML `<title>`                | `Label` (for form), heading element in `Header` |
| `Subtitle`  | Non-standard hierarchy                       | `Description`                                   |
| `Info`      | Vague                                        | `Description`, `ErrorMessage`, `Text`           |
| `Slot`      | Meta-term — a slot is not itself a slot name | Use the specific slot term                      |
| `Component` | Too abstract                                 | Name the specific part                          |
| `Element`   | Too generic                                  | Name the specific semantic role                 |

### Naming Anti-Patterns

- ❌ `ButtonIcon` — slot names must not be component-prefixed
- ❌ `LeftIcon` — use directional `StartIcon`/`EndIcon` (RTL-safe)
- ❌ `Desc` — no abbreviations
- ❌ `Btn` — no abbreviations
- ❌ `closeBtn` — use `Close` (the slot IS the concept)
- ❌ `mainContent` — use `Content` (it's already the main area)

---

## Rules for Introducing New Slot Names

When a component requires a slot not listed above:

1. **Check existing terms first.** Can an existing term cover the responsibility?
2. **Is it reusable?** Will other components need this slot? If yes, add it to this document.
3. **Is it component-specific?** If only one component will ever need it, it may be component-scoped (e.g., `DataGrid.ColumnHeader`). Document it in that component's spec.
4. **Follow naming rules.** Semantic, no abbreviations, PascalCase for sub-components, camelCase for slot config keys.
5. **Document it.** Add to this document with definition, usage, and anti-pattern guidance.
6. **Review accessibility implications.** Does it need ARIA relationships? IDs? Role?

---

## Rules for Compound Components

Compound components (multi-part components using sub-component composition):

- Each public sub-part is a named slot exposed via dot notation.
- Sub-parts maintain their own refs and event handlers.
- Parent-child communication uses React context (not prop drilling).
- Slot order in JSX determines render order — no implicit reordering.
- Each sub-part can be used independently where architecturally valid.

```tsx
// Compound component using canonical terminology
<Dialog>
  <Dialog.Trigger>Open</Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Backdrop />
    <Dialog.Content>
      <Dialog.Header>
        <Dialog.Close />
      </Dialog.Header>
      <Dialog.Body>...</Dialog.Body>
      <Dialog.Footer>
        <Dialog.Action>Confirm</Dialog.Action>
      </Dialog.Footer>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog>
```

---

## Rules for Simple Components

Components that do not need compound composition (Button, Badge, Divider):

- Expose only the Root slot via the component itself.
- Internal anatomy exists but is not exposed as sub-components.
- Slot props (`slots={{ icon: CustomIcon }}`) may be used for simple customization.
- No compound sub-components unless the anatomy genuinely warrants it.

```tsx
// Simple component — Root is the component itself
<Button startIcon={<SaveIcon />}>Save</Button>

// NOT compound — Button doesn't need sub-components
// ❌ <Button><Button.Icon><SaveIcon /></Button.Icon>Save</Button>
```

---

## Slot Capability Matrix

| Slot         | Ref | State | Events | ARIA | Children | Replaceable |
| ------------ | --- | ----- | ------ | ---- | -------- | ----------- |
| Root         | ✓   | —     | ✓      | ✓    | ✓        | ✓           |
| Container    | ✓   | —     | —      | —    | ✓        | ✓           |
| Surface      | ✓   | —     | —      | ✓    | ✓        | ✓           |
| Content      | ✓   | —     | —      | ✓    | ✓        | ✓           |
| Header       | ✓   | —     | —      | —    | ✓        | ✓           |
| Body         | ✓   | —     | —      | —    | ✓        | ✓           |
| Footer       | ✓   | —     | —      | —    | ✓        | ✓           |
| Group        | ✓   | —     | —      | ✓    | ✓        | ✓           |
| Item         | ✓   | ✓     | ✓      | ✓    | ✓        | ✓           |
| Label        | ✓   | —     | —      | ✓    | ✓        | ✓           |
| Description  | ✓   | —     | —      | ✓    | ✓        | ✓           |
| ErrorMessage | ✓   | —     | —      | ✓    | ✓        | ✓           |
| Trigger      | ✓   | —     | ✓      | ✓    | ✓        | ✓           |
| Control      | ✓   | ✓     | ✓      | ✓    | —        | ✓           |
| Close        | ✓   | —     | ✓      | ✓    | ✓        | ✓           |
| Toggle       | ✓   | ✓     | ✓      | ✓    | —        | ✓           |
| Indicator    | ✓   | —     | —      | ✓    | ✓        | ✓           |
| Icon         | ✓   | —     | —      | —    | ✓        | ✓           |
| Backdrop     | ✓   | —     | ✓      | ✓    | —        | ✓           |
| Popup        | ✓   | —     | —      | ✓    | ✓        | ✓           |
| Arrow        | ✓   | —     | —      | —    | —        | ✓           |
| Positioner   | ✓   | —     | —      | —    | ✓        | Rarely      |
| Portal       | —   | —     | —      | —    | ✓        | No          |
