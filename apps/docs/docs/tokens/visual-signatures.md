# Visual Signatures

KairoUI defines five **visual signatures** — recurring patterns that give the system its recognizable identity. Each signature is built entirely from the token system and must never introduce raw values.

## 1. Kairo Focus Frame

**Purpose:** A high-visibility focus indicator that communicates keyboard focus unambiguously on both light and dark surfaces.

### Token Dependencies

| Token                  | Source                               |
| ---------------------- | ------------------------------------ |
| `focusRing.width`      | `primitives/borders` → `"2px"`       |
| `focusRing.offset`     | `primitives/borders` → `"2px"`       |
| `color.border.focus`   | Semantic → `blue.600` / `blue.400`   |
| `focus.innerRingColor` | Semantic → `#ffffff` / `neutral.900` |

### Specification

The Kairo Focus Frame is a **double-ring** design:

1. **Outer ring** — brand accent color (`color.border.focus`), 2 px wide.
2. **Inner gap** — contrasting color (`focus.innerRingColor`) at the offset, ensuring the ring is visible regardless of background.

```css
outline: var(--kui-focus-ring-width) solid var(--kui-color-border-focus);
outline-offset: var(--kui-focus-ring-offset);
box-shadow: 0 0 0 var(--kui-focus-ring-offset) var(--kui-focus-inner-ring-color);
```

### Approved Use Cases

- All interactive controls (buttons, inputs, checkboxes, links)
- Custom interactive widgets
- Dialog close buttons and toolbar actions

### Prohibited Use Cases

- Decorative elements
- Non-interactive containers
- Scroll containers (use inner-focus on scrollable children instead)

### Light-Theme Behavior

Outer ring: `#4f46e5` (blue.600). Inner ring: `#ffffff`. High contrast against white, gray, and colored surfaces.

### Dark-Theme Behavior

Outer ring: `#818cf8` (blue.400). Inner ring: `#1e2433` (neutral.900). Lightened accent ensures visibility on dark backgrounds.

### Accessibility Rules

- Contrast ratio of focus indicator vs. adjacent background ≥ 3:1 (WCAG 2.2 SC 2.4.13).
- Inner ring guarantees contrast when the element background matches the accent.
- Never hidden via `outline: none` without a visible replacement.

### Density Considerations

Ring width and offset remain constant across density modes. Focus visibility must never be sacrificed for compactness.

### Future Component Examples

Button, Input, Checkbox, Link, Tab, MenuItem, Dialog actions.

---

## 2. Kairo Active Rail

**Purpose:** A compact indicator that marks the currently active item in tab bars, navigation, and selection regions.

### Token Dependencies

| Token                            | Source                               |
| -------------------------------- | ------------------------------------ |
| `activeRail.thickness`           | Component tokens → `"2px"`           |
| `activeRail.color`               | Component tokens → `blue.600`        |
| `activeRail.radius`              | Component tokens → `radius.full`     |
| `activeRail.offset`              | Component tokens → `"0"`             |
| `activeRail.transition.duration` | Component tokens → `duration.normal` |
| `activeRail.transition.easing`   | Component tokens → `easing.out`      |

### Specification

A 2 px rounded bar positioned at the bottom (horizontal) or leading edge (vertical) of the active element. Animates position on selection change.

### Approved Use Cases

- Tab bars (bottom rail)
- Vertical navigation (leading rail)
- Segmented controls (bottom rail)
- Stepped indicators

### Prohibited Use Cases

- Buttons or standalone actions
- Tree-view selection (use Selected Surface instead)
- Checkboxes or radio buttons

### Light-Theme Behavior

Rail color: `#4f46e5` (blue.600) against neutral or white surfaces.

### Dark-Theme Behavior

Rail color: `#818cf8` (blue.400) — lighter accent for visibility on dark surfaces.

### Accessibility Rules

- Must have ≥ 3:1 contrast against the adjacent background.
- Active state must also be communicated via `aria-selected` or `aria-current`; the rail alone is insufficient.

### Density Considerations

Rail thickness is fixed at 2 px. Spacing between the rail and the label adapts to the density's inline spacing tokens.

### Future Component Examples

Tabs, VerticalNav, SegmentedControl.

---

## 3. Kairo Selected Surface

**Purpose:** A subtle tinted background that communicates selection without overwhelming the content.

### Token Dependencies

| Token                             | Source                                         |
| --------------------------------- | ---------------------------------------------- |
| `interaction.selected.background` | Semantic → `blue.50` / `rgba(99,102,241,0.15)` |
| `interaction.selected.border`     | Semantic → `blue.200` / `rgba(99,102,241,0.3)` |
| `interaction.selected.text`       | Semantic → `blue.800` / `blue.200`             |
| `interaction.selected.icon`       | Semantic → `blue.600` / `blue.400`             |
| `color.border.interactive`        | Semantic → `blue.500`                          |

### Specification

Selected state = tinted background + strengthened border:

1. Background shifts to a low-opacity accent tint.
2. Border transitions from `color.border.default` to `interaction.selected.border`.
3. Text and icons shift to accent-tinted variants for reinforcement (but remain legible).

### Approved Use Cases

- List item selection (single and multi-select)
- Tree-view selected nodes
- Table row selection
- Card selection in grid layouts

### Prohibited Use Cases

- Hover states (use `background.hover` instead)
- Active/pressed states (use `background.active`)
- Focus indication (use Kairo Focus Frame)

### Light-Theme Behavior

Background: `#eef2ff` (blue.50). Border: `#c7d2fe` (blue.200). Barely visible tint that layers cleanly over white surfaces.

### Dark-Theme Behavior

Background: `rgba(99,102,241,0.15)`. Border: `rgba(99,102,241,0.3)`. Semi-transparent tint adapts to any dark surface tone.

### Accessibility Rules

- Text on selected surface must maintain ≥ 4.5:1 contrast (normal text) or ≥ 3:1 (large text).
- Selection must also be communicated by `aria-selected`; visual alone is insufficient.
- Selected + focused must show both signatures (surface + focus frame).

### Density Considerations

Surface padding adapts to the current density's `spacing.content.tableCell` or `spacing.inline` tokens. Tint intensity remains constant.

### Future Component Examples

ListItem, TreeItem, TableRow, SelectableCard.

---

## 4. Kairo Status Marker

**Purpose:** Communicate operational status through color combined with at least one non-color signal (shape, icon, border, or text).

### Token Dependencies

| Status  | Subtle BG   | Emphasis     | Border       | Text         | Icon         |
| ------- | ----------- | ------------ | ------------ | ------------ | ------------ |
| success | `green.50`  | `green.600`  | `green.300`  | `green.700`  | `green.600`  |
| warning | `orange.50` | `orange.600` | `orange.300` | `orange.700` | `orange.500` |
| error   | `red.50`    | `red.600`    | `red.300`    | `red.700`    | `red.600`    |
| info    | `teal.50`   | `teal.600`   | `teal.300`   | `teal.700`   | `teal.600`   |

### Specification

Every status indication must use **color + at least one redundant signal**:

- Color + icon (preferred)
- Color + border (inline alerts)
- Color + shape (badges with distinct shape)
- Color + text label (always acceptable as an additional channel)

**Never rely on color alone.**

### Approved Use Cases

- Alert banners
- Form validation messages
- Badge/pill indicators
- Toast notifications
- Status dots in data tables (must include tooltip or label)

### Prohibited Use Cases

- Decorative color accents
- Brand expression
- Navigation highlighting (use Active Rail or Selected Surface)

### Light-Theme Behavior

Subtle backgrounds (`green.50`, etc.) provide gentle status coloring. Text uses darker shade (`green.700`) for readability. Icon uses mid-emphasis shade.

### Dark-Theme Behavior

Same hue families with adjusted values from `darkTheme.color.status`. Subtle backgrounds shift to low-opacity tints. Text and icons use lighter shades for contrast.

### Accessibility Rules

- Color must never be the sole differentiator (WCAG 1.4.1).
- Status text must have ≥ 4.5:1 contrast against its background.
- Status icons must have ≥ 3:1 contrast against their background.
- Always include a text label or aria-label describing the status.

### Density Considerations

Marker size (icon, dot) remains constant. Surrounding padding adapts to density. Compact mode may abbreviate but never remove the redundant signal.

### Future Component Examples

Alert, FormMessage, Badge, Toast, StatusDot.

---

## 5. Kairo Surface Hierarchy

**Purpose:** Establish a predictable visual depth relationship between page, surface, raised elements, borders, and elevation.

### Token Dependencies

| Layer            | Light                     | Dark                                    |
| ---------------- | ------------------------- | --------------------------------------- |
| Page             | `neutral.50` = `#f8f9fb`  | `neutral.950` = `#131822`               |
| Surface          | `#ffffff`                 | `neutral.900` = `#1e2433`               |
| Raised           | `#ffffff` + `shadow.sm`   | `neutral.800` = `#2c3344` + `shadow.sm` |
| Muted            | `neutral.100` = `#f1f3f6` | `neutral.800` = `#2c3344`               |
| Border (subtle)  | `neutral.100`             | varies                                  |
| Border (default) | `neutral.200`             | varies                                  |
| Border (strong)  | `neutral.400`             | varies                                  |

**Elevation tokens:**

| Level               | Shadow      |
| ------------------- | ----------- |
| `elevation.raised`  | `shadow.sm` |
| `elevation.overlay` | `shadow.md` |
| `elevation.modal`   | `shadow.lg` |
| `elevation.toast`   | `shadow.xl` |

### Specification

Depth hierarchy (back to front):

1. **Page** — outermost canvas, lightest/darkest neutral.
2. **Surface** — primary content area, sits above page.
3. **Raised surface** — cards and panels with subtle shadow.
4. **Overlay** — dropdowns and popovers with medium shadow.
5. **Modal** — dialogs and sheets with heavy shadow + scrim.

Borders reinforce separation where shadow is insufficient (flat design at rest). Shadow is additive, used for interactive layers that float.

### Approved Use Cases

- Page layout backgrounds
- Card and panel containers
- Dropdown menus and popovers
- Modal dialogs
- Toast notifications

### Prohibited Use Cases

- Arbitrary shadow values not in the elevation scale
- Mixing shadow levels (e.g., `shadow.xl` on a card)
- Using raised background without corresponding elevation token
- Skip levels (e.g., placing an overlay directly on page without a surface)

### Light-Theme Behavior

Depth is communicated primarily through subtle value shifts (white on near-white) plus borders. Shadows reinforce floating layers. Border-first philosophy keeps surfaces clean at rest.

### Dark-Theme Behavior

Depth is communicated through stepped neutral values (lighter = closer). Shadows are less visible on dark, so background shifts carry more weight. Borders remain essential separators.

### Accessibility Rules

- Adjacent layers must have ≥ 3:1 contrast for their borders or ≥ distinguishable background difference.
- Text on any surface must maintain minimum contrast ratios (4.5:1 normal, 3:1 large).
- Overlay scrim (`background.overlay`) must dim content sufficiently to direct focus.

### Density Considerations

Surface padding adapts to density tokens. Hierarchy structure (number of levels, shadow values) is density-independent. Compact mode reduces padding, never collapses layers.

### Future Component Examples

Card, Dialog, Popover, Dropdown, Sheet, Toast, PageLayout.
