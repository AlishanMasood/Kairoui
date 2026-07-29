# Token Naming Standard

> Formal naming specification for KairoUI design tokens.
> Referenced by: [Token Architecture](token-architecture.md)

## CSS Variable Prefix

All KairoUI CSS custom properties use the `--kui-` prefix:

```css
--kui-color-neutral-500
--kui-color-bg-page
--kui-space-4
```

This prefix is:

- Short enough for readability in DevTools
- Unique enough to avoid collisions with third-party CSS
- Never changed after publication

---

## Formats and Their Casing

| Format                 | Casing             | Separator    | Example                    |
| ---------------------- | ------------------ | ------------ | -------------------------- |
| TypeScript object path | camelCase segments | `.` (dot)    | `color.background.surface` |
| CSS custom property    | kebab-case         | `-` (hyphen) | `--kui-color-bg-surface`   |
| JSON property          | camelCase segments | `.` (dot)    | `color.background.surface` |

---

## Path-to-CSS Conversion

Token paths convert to CSS variables deterministically using these rules:

1. Start with the prefix `--kui-`.
2. Split the path on `.` separators.
3. Convert each camelCase segment to kebab-case.
4. Apply approved abbreviations (see [Abbreviation Table](#approved-abbreviations)).
5. Join all segments with `-`.

### Examples

| TypeScript Path                  | CSS Variable                     |
| -------------------------------- | -------------------------------- |
| `color.neutral.500`              | `--kui-color-neutral-500`        |
| `color.background.page`          | `--kui-color-bg-page`            |
| `color.background.surface`       | `--kui-color-bg-surface`         |
| `color.text.primary`             | `--kui-color-text-primary`       |
| `color.border.interactive`       | `--kui-color-border-interactive` |
| `color.interactive.hover`        | `--kui-color-interactive-hover`  |
| `spacing.4`                      | `--kui-space-4`                  |
| `spacing.16`                     | `--kui-space-16`                 |
| `radius.md`                      | `--kui-radius-md`                |
| `fontSize.lg`                    | `--kui-font-size-lg`             |
| `fontWeight.bold`                | `--kui-font-weight-bold`         |
| `lineHeight.tight`               | `--kui-line-height-tight`        |
| `shadow.md`                      | `--kui-shadow-md`                |
| `duration.fast`                  | `--kui-duration-fast`            |
| `easing.inOut`                   | `--kui-easing-in-out`            |
| `zIndex.modal`                   | `--kui-z-index-modal`            |
| `control.height.md`              | `--kui-control-height-md`        |
| `button.primary.background`      | `--kui-button-primary-bg`        |
| `button.primary.backgroundHover` | `--kui-button-primary-bg-hover`  |
| `input.border.focus`             | `--kui-input-border-focus`       |
| `dialog.shadow`                  | `--kui-dialog-shadow`            |

---

## Approved Abbreviations

Abbreviations are used **only in CSS variable names** to keep them concise. TypeScript paths use full words.

| Full Word      | CSS Abbreviation | Context                                   |
| -------------- | ---------------- | ----------------------------------------- |
| `background`   | `bg`             | Always abbreviated in CSS                 |
| `foreground`   | `fg`             | Always abbreviated in CSS                 |
| `spacing`      | `space`          | Category-level only                       |
| `fontSize`     | `font-size`      | camelCase → kebab-case (natural)          |
| `fontWeight`   | `font-weight`    | camelCase → kebab-case (natural)          |
| `lineHeight`   | `line-height`    | camelCase → kebab-case (natural)          |
| `zIndex`       | `z-index`        | camelCase → kebab-case (natural)          |
| `borderRadius` | `radius`         | Use short form `radius` at category level |

### When abbreviations are NOT allowed

- TypeScript object keys: always use full words (`background`, not `bg`).
- JSON output: mirrors TypeScript paths exactly.
- Documentation: always spell out the full name on first use.

---

## Primitive Token Names

### Categories

| Category     | Path Prefix           | CSS Prefix                   | Examples                                       |
| ------------ | --------------------- | ---------------------------- | ---------------------------------------------- |
| Color scales | `color.<hue>.<step>`  | `--kui-color-<hue>-<step>`   | `color.blue.500` → `--kui-color-blue-500`      |
| Spacing      | `spacing.<value>`     | `--kui-space-<value>`        | `spacing.4` → `--kui-space-4`                  |
| Font size    | `fontSize.<size>`     | `--kui-font-size-<size>`     | `fontSize.sm` → `--kui-font-size-sm`           |
| Font weight  | `fontWeight.<weight>` | `--kui-font-weight-<weight>` | `fontWeight.bold` → `--kui-font-weight-bold`   |
| Line height  | `lineHeight.<name>`   | `--kui-line-height-<name>`   | `lineHeight.tight` → `--kui-line-height-tight` |
| Radius       | `radius.<size>`       | `--kui-radius-<size>`        | `radius.md` → `--kui-radius-md`                |
| Shadow       | `shadow.<size>`       | `--kui-shadow-<size>`        | `shadow.lg` → `--kui-shadow-lg`                |
| Duration     | `duration.<speed>`    | `--kui-duration-<speed>`     | `duration.fast` → `--kui-duration-fast`        |
| Easing       | `easing.<name>`       | `--kui-easing-<name>`        | `easing.inOut` → `--kui-easing-in-out`         |
| Z-index      | `zIndex.<layer>`      | `--kui-z-index-<layer>`      | `zIndex.modal` → `--kui-z-index-modal`         |
| Opacity      | `opacity.<value>`     | `--kui-opacity-<value>`      | `opacity.50` → `--kui-opacity-50`              |
| Breakpoint   | `breakpoint.<size>`   | `--kui-breakpoint-<size>`    | `breakpoint.md` → `--kui-breakpoint-md`        |

---

## Semantic Token Names

### Categories

| Category    | Path Prefix                 | CSS Prefix                        | Examples                                                    |
| ----------- | --------------------------- | --------------------------------- | ----------------------------------------------------------- |
| Background  | `color.background.<role>`   | `--kui-color-bg-<role>`           | `color.background.page` → `--kui-color-bg-page`             |
| Text        | `color.text.<role>`         | `--kui-color-text-<role>`         | `color.text.primary` → `--kui-color-text-primary`           |
| Border      | `color.border.<role>`       | `--kui-color-border-<role>`       | `color.border.focus` → `--kui-color-border-focus`           |
| Interactive | `color.interactive.<state>` | `--kui-color-interactive-<state>` | `color.interactive.hover` → `--kui-color-interactive-hover` |
| Status      | `color.status.<type>`       | `--kui-color-status-<type>`       | `color.status.error` → `--kui-color-status-error`           |
| Focus       | `color.focus.<part>`        | `--kui-color-focus-<part>`        | `color.focus.ring` → `--kui-color-focus-ring`               |
| Spacing     | `spacing.<scope>.<role>`    | `--kui-space-<scope>-<role>`      | `spacing.component.gap` → `--kui-space-component-gap`       |
| Elevation   | `elevation.<level>`         | `--kui-elevation-<level>`         | `elevation.overlay` → `--kui-elevation-overlay`             |
| Control     | `control.height.<size>`     | `--kui-control-height-<size>`     | `control.height.md` → `--kui-control-height-md`             |

---

## Component Token Names

### Pattern

```
<component>.<variant>.<property><State>
```

| Example Path                     | CSS Variable                       |
| -------------------------------- | ---------------------------------- |
| `button.primary.background`      | `--kui-button-primary-bg`          |
| `button.primary.backgroundHover` | `--kui-button-primary-bg-hover`    |
| `button.primary.text`            | `--kui-button-primary-text`        |
| `button.secondary.border`        | `--kui-button-secondary-border`    |
| `input.default.background`       | `--kui-input-default-bg`           |
| `input.default.borderFocus`      | `--kui-input-default-border-focus` |
| `dialog.shadow`                  | `--kui-dialog-shadow`              |
| `dialog.background`              | `--kui-dialog-bg`                  |
| `tab.active.indicator`           | `--kui-tab-active-indicator`       |

---

## Approved State Terminology

Use these exact terms for interaction states:

| State      | Meaning                                         |
| ---------- | ----------------------------------------------- |
| `default`  | Resting state (may be omitted when unambiguous) |
| `hover`    | Pointer is over the element                     |
| `active`   | Element is being pressed/activated              |
| `focus`    | Element has keyboard focus                      |
| `selected` | Element is in a selected state                  |
| `disabled` | Element is non-interactive                      |
| `readOnly` | Element is visible but not editable             |
| `loading`  | Element is in a loading/pending state           |
| `invalid`  | Element has failed validation                   |
| `valid`    | Element has passed validation                   |
| `dragging` | Element is being dragged                        |

### State in token paths

States appear as a **camelCase suffix** on the property segment:

```
button.primary.backgroundHover     ← "Hover" suffixed to "background"
input.default.borderFocus          ← "Focus" suffixed to "border"
button.destructive.textDisabled    ← "Disabled" suffixed to "text"
```

In CSS, the suffix becomes a separate kebab segment:

```
--kui-button-primary-bg-hover
--kui-input-default-border-focus
--kui-button-destructive-text-disabled
```

---

## Approved Size Terminology

| Size | Usage                             |
| ---- | --------------------------------- |
| `xs` | Extra small                       |
| `sm` | Small                             |
| `md` | Medium (default where applicable) |
| `lg` | Large                             |
| `xl` | Extra large                       |

For extended scales, use numeric suffixes: `2xl`, `3xl`, `4xl` (or numeric values for spacing: `0`, `1`, `2`, `4`, `8`, `12`, `16`, …).

---

## Approved Density Terminology

| Density       | Purpose                                                    |
| ------------- | ---------------------------------------------------------- |
| `comfortable` | Default density. Generous spacing for general interfaces.  |
| `compact`     | Reduced spacing for data-dense views (tables, dashboards). |
| `spacious`    | Increased spacing for touch interfaces or marketing pages. |

---

## Approved Theme Names

| Theme   | Purpose                    |
| ------- | -------------------------- |
| `light` | Default light color scheme |
| `dark`  | Dark color scheme          |

Custom theme names (e.g., `highContrast`, `brand`) follow the same casing rules.

---

## Prohibited Names

The following patterns are **forbidden** in token names:

| Pattern                       | Reason                                              |
| ----------------------------- | --------------------------------------------------- |
| `normal`                      | Ambiguous — use `default` or `md`                   |
| `regularBlue`                 | Encodes raw color in semantic name                  |
| `lightColor` / `darkColor`    | Theme-specific — semantics must be theme-neutral    |
| `defaultBackground`           | Redundant — use `background.default`                |
| `primaryOne` / `secondaryTwo` | Meaningless ordinals                                |
| `misc` / `other` / `temp`     | Vague catch-all categories                          |
| `#2563eb` / `rgb(...)`        | Raw values in names                                 |
| `btn` / `txt` / `brd`         | Abbreviations not in the approved table             |
| `_internal` / `__private`     | Underscore prefixes — use module boundaries instead |

---

## Internal Token Names

Internal tokens (not exported from the package) follow the same naming rules but are prefixed with their owning module path in source code. They are never exposed as CSS variables.

```ts
// Internal — not exported, not in CSS output
const _internalTokens = {
  "button._computedMinWidth": "...",
};
```

Internal tokens:

- Use the same dot-notation path structure.
- Are NOT prefixed with `_` in CSS (they don't appear in CSS).
- Are identified by module export boundaries, not naming conventions.

---

## Deprecated Token Aliases

When a token is renamed, the old name is preserved as a deprecated alias for one major version:

```ts
/** @deprecated Use `color.background.surface` instead. Removed in v2.0.0. */
export const colorBgSurface = tokens.color.background.surface;
```

In CSS, both variables are emitted during the deprecation period:

```css
--kui-color-bg-surface: <value>;
--kui-color-surface-bg: var(--kui-color-bg-surface); /* deprecated alias */
```

---

## Conversion Algorithm

The canonical algorithm for converting a TypeScript token path to a CSS variable name:

1. Input: dot-separated path (e.g., `color.background.surface`)
2. Split on `.` → `["color", "background", "surface"]`
3. For each segment:
   a. Apply abbreviation map (`background` → `bg`, `spacing` → `space`, etc.)
   b. Convert camelCase to kebab-case (`fontSize` → `font-size`, `backgroundHover` → `bg-hover`)
4. Join with `-`
5. Prepend `--kui-`
6. Output: `--kui-color-bg-surface`

This algorithm is implemented in `@kairoui/tokens` and used by all generation scripts.
