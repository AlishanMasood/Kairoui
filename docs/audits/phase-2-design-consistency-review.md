# Phase 2 Design Consistency Review

**Date:** 2026-07-30
**Reviewer:** Automated (KUI-TOK-041)
**Scope:** Full token system — primitives, themes, density, controls, components, visual signatures

---

## Visual Identity

### Is the brand accent recognizable without being overused?

**Verdict: PASS**

The indigo accent (blue.600 = #4f46e5) appears only on interactive elements, focus rings, and active states. Surfaces, text, and borders use the neutral palette. The accent is distinctive (238° hue differentiates from generic corporate blue ~210°) without overwhelming the interface.

### Do neutrals feel calm and professional?

**Verdict: PASS**

The neutral scale uses a subtle blue-gray tint (hue ~220°, saturation 5–15%) rather than pure gray. The non-linear lightness distribution provides gentle surface differentiation at the extremes and clear functional distinction in the middle range.

### Does the system avoid looking like a Material UI or shadcn/ui copy?

**Verdict: PASS**

- Indigo hue (238°) vs Material's blue (210°) and shadcn's zinc neutrals
- Double-ring focus treatment (Kairo Focus Frame) is unique
- Active rail signature is system-specific
- Border-first surface philosophy (shadow only for floating layers) differs from Material's elevation-first approach
- No predefined "outlined/filled/tonal" variant naming from Material

---

## Theme Contrast

### Are light-theme surfaces clearly separated?

**Verdict: PASS (with observation)**
**Severity: Informational**

| Pairing                               | Contrast |
| ------------------------------------- | -------- |
| Page (#f8f9fb) vs Surface (#ffffff)   | 1.05:1   |
| Surface (#ffffff) vs Raised (#ffffff) | 1.00:1   |

Surface and raised share the same background in light theme. Separation relies on borders and shadow (`elevation.raised`), not color difference. This is the intended "border-first" philosophy — surfaces are flat by default and only gain shadow when floating. The HTML fixture confirms the visual layering is perceptible.

### Are dark-theme surfaces clearly separated?

**Verdict: PASS**

| Pairing                               | Contrast |
| ------------------------------------- | -------- |
| Page (#131822) vs Surface (#1e2433)   | 1.15:1   |
| Surface (#1e2433) vs Raised (#2c3344) | 1.23:1   |

Dark theme uses progressively lighter backgrounds (inverted hierarchy), providing stronger separation than light theme. Combined with borders, layering is clear.

---

## Text Readability

### Is primary text readable?

**Verdict: PASS**

| Context                   | Contrast | Requirement  |
| ------------------------- | -------- | ------------ |
| Light: primary on surface | 15.49:1  | ≥ 4.5:1 (AA) |
| Light: primary on page    | 14.71:1  | ≥ 4.5:1      |
| Dark: primary on surface  | 14.71:1  | ≥ 4.5:1      |
| Dark: primary on page     | 16.87:1  | ≥ 4.5:1      |

All exceed WCAG AAA (7:1).

### Is secondary text sufficiently visible?

**Verdict: PASS**

| Context                     | Contrast |
| --------------------------- | -------- |
| Light: secondary on surface | 7.27:1   |
| Light: muted on surface     | 4.64:1   |
| Dark: secondary on surface  | 10.20:1  |
| Dark: muted on surface      | 6.09:1   |

All pass WCAG AA (4.5:1). Light muted is at 4.64:1 — barely above threshold but compliant. Muted text is used only for de-emphasized hints, not critical content.

---

## Borders

### Are borders visible without becoming heavy?

**Verdict: PASS (with advisory)**
**Severity: Low**

| Border  | Light on surface | Dark on surface |
| ------- | ---------------- | --------------- |
| subtle  | 1.11:1           | 1.23:1          |
| default | 1.24:1           | 1.61:1          |
| strong  | 2.54:1           | —               |

`border.subtle` is nearly invisible (1.11:1). This is by design — it's for hairline separators where maximum subtlety is desired. Structural borders use `border.default` or `border.strong`.

**Advisory:** If any border conveys meaningful structure (e.g., table cell boundaries, required field indicators), use `border.default` or stronger. `border.subtle` should only be used for purely decorative dividers.

No change required — the three-tier system provides the right border for each context.

---

## Status Colors

### Are status colors controlled?

**Verdict: PASS**

| Status  | Text on subtle bg |
| ------- | ----------------- |
| Success | 4.79:1            |
| Warning | 4.88:1            |
| Error   | 5.91:1            |
| Info    | 5.25:1            |

All pass WCAG AA (4.5:1). Status tokens consistently provide subtle/muted/emphasis/border/text/icon variants across all four statuses plus neutral.

### Is the Status Marker understandable without color?

**Verdict: PASS**

The status badge component contract requires a dot + text, never color alone. Alert contracts include icon + text. The visual signatures documentation mandates at least one redundant non-color signal (icon, border, shape, or text) alongside color.

---

## Density

### Is compact density still usable?

**Verdict: PASS**

Compact minimum control height: 1.5rem (24px) — meets WCAG 2.5.8 minimum target size (24×24 CSS px). Compact `md` maps to 2rem (32px), providing comfortable interaction for most controls.

### Is comfortable density appropriate for enterprise software?

**Verdict: PASS**

Comfortable is the default mode. Control heights range from 1.5rem (xs) to 3.5rem (xl), with `md` at 2.5rem (40px). Form spacing (1rem field gap, 0.375rem label gap) provides comfortable reading and interaction for long-form enterprise workflows.

---

## Visual Signatures

### Is the Focus Frame recognizable and accessible?

**Verdict: PASS**

| Surface       | Focus ring contrast |
| ------------- | ------------------- |
| Light surface | 4.47:1              |
| Dark surface  | 5.19:1              |

Both exceed WCAG 2.2 SC 2.4.13 focus-indicator contrast (3:1). The double-ring design (outer accent + inner contrasting ring) ensures visibility on any background. Width (2px) and offset (2px) are fixed across densities — focus is never sacrificed for compactness.

### Is the Active Rail distinctive but restrained?

**Verdict: PASS**

The rail is 2px thick with full radius, using the brand accent. It appears only on tabs, navigation, and segmented controls. It does not appear on buttons, checkboxes, or other controls — placement is controlled and intentional.

### Is the Selected Surface visually clear?

**Verdict: PASS**

Selected state uses accent-tinted background (#eef2ff in light) + stronger border (#c7d2fe) + shifted text color (#3730a3). Selected text on selected background achieves 8.88:1 contrast. The combination of three signals (background + border + text color) makes selection unambiguous without being heavy.

---

## Token Architecture

### Are token names purpose-driven?

**Verdict: PASS**

Names follow the pattern `{category}.{subcategory}.{property}` → `--kui-{category}-{subcategory}-{property}`. Semantic tokens use purpose-based names (`color.text.primary`, `color.background.surface`) rather than appearance names (`color.darkGray`, `color.white`). Component tokens use component-role naming (`button.primary.background`).

### Are component contracts broad enough for future components?

**Verdict: PASS**

- **Button**: 5 variants × 6 states × 3 sizes covers all standard button patterns
- **Form controls**: 8 control types with 8 states each, extensible to new input types
- **Surfaces**: 7 surface types spanning the full elevation hierarchy
- **Navigation**: 8 component contracts from tabs to alerts

No prematurely narrow contracts were identified.

### Are any component contracts prematurely specific?

**Verdict: PASS (with observation)**
**Severity: Informational**

The switch component contract specifies exact track dimensions (2.5rem × 1.5rem, thumb 1.25rem). These dimensions may need revision if a different switch style is desired. However, since these are token values (not hard-coded), they can be adjusted without API changes.

### Are there duplicated or conflicting token roles?

**Verdict: PASS (with observation)**
**Severity: Informational**

Two intentional overlaps were identified:

1. **`color.background.selected` vs `interaction.selected.background`** — Same value (#eef2ff). By design: `color.background.*` provides simple one-off values; `interaction.*` provides full state bundles (bg + border + text + icon + opacity + transition). Different abstraction levels, not duplication.

2. **`color.border.focus` vs `color.focus.ring`** — Different values (blue.600 vs blue.500). These serve distinct purposes: `border.focus` is the border color an input element gets when focused; `focus.ring` is the outline ring drawn around any focused element. Different use cases warrant different values.

Neither overlap creates ambiguity for consumers. The interaction bundles are documented as the preferred way to apply state styling.

### Are all values generated from a single source of truth?

**Verdict: PASS**

All semantic values derive from the primitive palette. CSS output is generated programmatically from the same TypeScript objects. The JSON manifest is built from the same source. Build is deterministic (verified by hash comparison in KUI-TOK-039).

### Are all public contracts documented?

**Verdict: PASS**

- Token overview in Docusaurus docs
- Visual signatures specification
- Storybook stories for colors, semantic colors, scales, density, and visual signatures
- README with architecture overview
- TypeScript declarations with JSDoc on key exports

---

## Findings Summary

| #   | Finding                                                         | Severity      | Status                                                              |
| --- | --------------------------------------------------------------- | ------------- | ------------------------------------------------------------------- |
| 1   | Light surface and raised share identical backgrounds            | Informational | By design (border-first philosophy)                                 |
| 2   | `border.subtle` has 1.11:1 contrast on light surfaces           | Low           | By design — advisory added to use `default`+ for structural borders |
| 3   | Light muted text at 4.64:1 (barely above AA threshold)          | Low           | Acceptable — muted text is for de-emphasized hints only             |
| 4   | `color.border.focus` / `color.focus.ring` naming proximity      | Informational | Different purposes documented                                       |
| 5   | `color.background.*` / `interaction.*.background` value overlap | Informational | Different abstraction levels, documented                            |
| 6   | Switch track dimensions are specific                            | Informational | Token-based, adjustable without API change                          |

**Blocking issues: 0**
**Changes required: 0**

---

## Phase 3 Implications

1. **Theme provider** must apply `data-kui-theme` and `data-kui-density` attributes to enable the CSS variable system.
2. **Component implementations** should consume interaction state bundles (e.g., `--kui-interaction-hover-*`) rather than individual color tokens for consistency.
3. **Custom themes** via `resolveTheme()` should validate contrast ratios using the existing `checkAllContrasts()` utility.
4. **border.subtle** usage in components should be reviewed during component implementation — reserve it for decorative dividers only.
5. **Focus behavior** must apply the double-ring pattern consistently across all interactive components.
6. **Density switching** should be supported at page level and optionally at section level via nested `data-kui-density` attributes.

---

## Deferred Items

| Item                             | Reason                                                                                    | Target                 |
| -------------------------------- | ----------------------------------------------------------------------------------------- | ---------------------- |
| High-contrast mode theme         | Requires separate palette with 7:1+ minimum contrasts                                     | Phase 3+               |
| RTL layout token considerations  | Density spacing is symmetric; no RTL issues in tokens                                     | Phase 3 component work |
| Motion-reduced preference tokens | Current motion tokens are subtle; `prefers-reduced-motion` handling belongs in components | Phase 3                |
| Print-specific token overrides   | Not relevant until print styling is scoped                                                | Unscheduled            |
