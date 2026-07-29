# Design Token Architecture

> Architecture decision document for the KairoUI three-layer token system.

## Overview

KairoUI uses a strict three-layer token architecture. Each layer has a defined responsibility, and dependencies flow in one direction only.

```
┌─────────────────────────────────────────────────────────────────┐
│                        COMPONENT TOKENS                         │
│  Button.background, Input.borderFocus, Dialog.shadow, ...       │
│  (component-specific design decisions)                          │
├─────────────────────────────────────────────────────────────────┤
│                        SEMANTIC TOKENS                           │
│  color.background.page, color.text.primary, spacing.gap.md, ... │
│  (purpose-driven, theme-switchable)                             │
├─────────────────────────────────────────────────────────────────┤
│                        PRIMITIVE TOKENS                          │
│  blue.500, spacing.16, fontSize.14, radius.4, ...               │
│  (raw values, no business meaning)                              │
└─────────────────────────────────────────────────────────────────┘
```

## Dependency Direction

```
Component Tokens → Semantic Tokens → Primitive Tokens
```

### Allowed

- Component tokens MAY reference semantic tokens.
- Component tokens MAY reference primitive tokens (for values with no semantic equivalent).
- Semantic tokens MUST reference primitive tokens.

### Forbidden

- Primitive tokens MUST NOT reference semantic tokens.
- Primitive tokens MUST NOT reference component tokens.
- Semantic tokens MUST NOT reference component tokens.
- No layer may create circular references.

---

## Layer 1 — Primitive Tokens

Primitive tokens contain raw design values. They are the source material — the palette — from which all higher-level tokens draw.

### Characteristics

- **No business meaning** — A primitive like `blue.500` carries no information about _where_ or _why_ it is used.
- **Stable across themes** — Primitive values do not change between light and dark themes. They are the constant reference set.
- **Complete scales** — Each category provides a full, well-defined scale (e.g., color hues 50–950, spacing 0–96).
- **Framework-independent** — Plain values with no React, DOM, or runtime dependency.

### Categories

| Category         | Examples                                                            |
| ---------------- | ------------------------------------------------------------------- |
| Color scales     | `gray.50`…`gray.950`, `blue.50`…`blue.950`                          |
| Spacing          | `spacing.0`, `spacing.1`, `spacing.2`, … `spacing.96`               |
| Font sizes       | `fontSize.xs`, `fontSize.sm`, `fontSize.base`, … `fontSize.9xl`     |
| Font weights     | `fontWeight.normal`, `fontWeight.medium`, `fontWeight.bold`         |
| Line heights     | `lineHeight.tight`, `lineHeight.normal`, `lineHeight.relaxed`       |
| Border radii     | `radius.none`, `radius.sm`, `radius.md`, `radius.lg`, `radius.full` |
| Shadows          | `shadow.sm`, `shadow.md`, `shadow.lg`, `shadow.xl`                  |
| Motion durations | `duration.fast`, `duration.normal`, `duration.slow`                 |
| Motion easings   | `easing.default`, `easing.in`, `easing.out`, `easing.inOut`         |
| Breakpoints      | `breakpoint.sm`, `breakpoint.md`, `breakpoint.lg`, `breakpoint.xl`  |
| Z-indices        | `zIndex.dropdown`, `zIndex.modal`, `zIndex.toast`                   |
| Opacity          | `opacity.0`, `opacity.50`, `opacity.100`                            |

---

## Layer 2 — Semantic Tokens

Semantic tokens describe _purpose_, not appearance. They answer "what role does this value play?" rather than "what color is this?"

### Characteristics

- **Purpose-driven** — Names describe function (`background.page`, `text.primary`), not raw value (`gray.100`).
- **Theme-switchable** — Semantic tokens are the primary mechanism for theming. A light theme maps `background.page` → `white`, a dark theme maps it → `gray.900`.
- **Reference primitives** — Semantic tokens resolve to primitive token references, not duplicated raw values.
- **Density-aware** — Spacing and sizing semantics may vary by density mode.

### Categories

| Category    | Examples                                                                                  |
| ----------- | ----------------------------------------------------------------------------------------- |
| Background  | `color.background.page`, `color.background.surface`, `color.background.elevated`          |
| Text        | `color.text.primary`, `color.text.secondary`, `color.text.disabled`, `color.text.inverse` |
| Border      | `color.border.default`, `color.border.interactive`, `color.border.focus`                  |
| Interactive | `color.interactive.default`, `color.interactive.hover`, `color.interactive.active`        |
| Status      | `color.status.success`, `color.status.warning`, `color.status.error`, `color.status.info` |
| Focus       | `color.focus.ring`                                                                        |
| Spacing     | `spacing.component.gap`, `spacing.section.gap`, `spacing.page.margin`                     |
| Typography  | `typography.body`, `typography.heading`, `typography.caption`                             |
| Elevation   | `elevation.raised`, `elevation.overlay`, `elevation.modal`                                |

---

## Layer 3 — Component Tokens

Component tokens encode design decisions specific to individual UI components. They bridge the gap between the design system's semantic language and a component's visual requirements.

### Characteristics

- **Component-scoped** — Each token is namespaced to its component (e.g., `button.primary.background`).
- **References semantic tokens** — Where possible, component tokens point to semantic tokens. This ensures theme changes propagate automatically.
- **May reference primitives** — For values that have no meaningful semantic (e.g., a specific border-radius unique to one component), direct primitive references are allowed.
- **Not theme values** — Component tokens define the _mapping_, not the _value_. The value is resolved at theme time through the semantic layer.
- **Contract-only in Phase 2** — Component tokens define the interface (what decisions a component needs) without implementing the component itself.

### Examples

| Component Token                  | Resolves To                 |
| -------------------------------- | --------------------------- |
| `button.primary.background`      | `color.interactive.default` |
| `button.primary.backgroundHover` | `color.interactive.hover`   |
| `button.primary.text`            | `color.text.inverse`        |
| `input.border.default`           | `color.border.default`      |
| `input.border.focus`             | `color.border.focus`        |
| `input.background`               | `color.background.surface`  |
| `dialog.shadow`                  | `elevation.overlay`         |
| `dialog.background`              | `color.background.elevated` |
| `tab.indicator.active`           | `color.interactive.default` |
| `tab.indicator.width`            | `spacing.component.gap`     |

---

## Theming

Themes are **value sets** applied to semantic tokens. A theme does not change primitives or component token mappings — it only reassigns which primitives the semantic tokens resolve to.

### Responsibilities

| Concern                           | Owner                           |
| --------------------------------- | ------------------------------- |
| Define raw values                 | Primitive tokens                |
| Assign purpose to values          | Semantic tokens                 |
| Provide theme-specific mappings   | Theme definitions (light, dark) |
| Define component design decisions | Component tokens                |
| Apply theme at runtime            | `@kairoui/theme` (Phase 3)      |

### Theme structure

```
theme/
├── light.ts    — Semantic token → primitive token mapping for light mode
└── dark.ts     — Semantic token → primitive token mapping for dark mode
```

A theme file maps every semantic token to a primitive token reference:

```ts
// Conceptual example (not implementation)
const lightTheme = {
  "color.background.page": primitives.white,
  "color.background.surface": primitives.gray[50],
  "color.text.primary": primitives.gray[900],
  "color.text.secondary": primitives.gray[600],
};
```

---

## Density

Density modes control spatial relationships — padding, gap, height, font size — without changing color or visual identity.

### Three modes

| Mode          | Purpose                                                         |
| ------------- | --------------------------------------------------------------- |
| `comfortable` | Default. Generous whitespace for general UI.                    |
| `compact`     | Reduced spacing for data-dense interfaces (tables, dashboards). |
| `spacious`    | Increased spacing for touch interfaces or marketing pages.      |

### Responsibilities

- Density adjusts **spacing semantic tokens** and select **sizing tokens**.
- Density does NOT change colors, typography families, shadows, or border radii.
- Density and theme are orthogonal — any theme works with any density.

---

## Public vs Internal Tokens

| Visibility   | Description                                                                 | Stability                                      |
| ------------ | --------------------------------------------------------------------------- | ---------------------------------------------- |
| **Public**   | Exported from `@kairoui/tokens` root. Consumers may use them.               | Breaking changes require a major version bump. |
| **Internal** | Used within `@kairoui/*` packages only. Not exported from the package root. | May change in minor/patch versions.            |

### Rules

- All **primitive tokens** are public (designers and consumers reference them).
- All **semantic tokens** are public (consumers use them for custom components).
- **Component tokens** are internal by default (owned by the component package). They may be promoted to public if documented and stabilized.

---

## Naming Convention

Tokens follow a structured dot-notation pattern:

```
<category>.<subcategory>.<variant>.<state>
```

### Examples

```
color.background.page
color.text.primary
color.border.interactive
color.interactive.hover
spacing.component.gap
button.primary.background
button.primary.backgroundHover
input.border.focus
```

### Rules

- Use **camelCase** for individual segments.
- Use **dot separation** between hierarchy levels.
- Keep names **descriptive but concise**.
- Prefer **adjectives after nouns** (`text.primary`, not `primary.text`).
- Never include raw values in names (`color.blue500` is forbidden — use `color.interactive.default` instead).

---

## Generated Output

`@kairoui/tokens` produces multiple output formats from the same source definitions:

| Output                | Format                  | Purpose                                  |
| --------------------- | ----------------------- | ---------------------------------------- |
| TypeScript constants  | `.ts` / `.js` + `.d.ts` | Type-safe access in component code       |
| CSS custom properties | `.css`                  | Runtime theming, direct CSS usage        |
| JSON                  | `.json`                 | Tooling, documentation, design tool sync |

### Requirements

- All outputs are **generated deterministically** from the TypeScript source.
- Outputs are **reproducible** — the same source always produces the same output.
- CSS variable names map 1:1 to token names: `color.background.page` → `--kui-color-background-page`.
- The `--kui-` prefix namespaces all variables to avoid collisions.

---

## Framework Independence

`@kairoui/tokens` must work without React, without a DOM, and without any runtime framework.

- **No React dependency** — not even as a peer dependency.
- **No DOM APIs** — tokens are data, not runtime behavior.
- **Pure TypeScript** — the package exports typed objects and generates static files.
- **Build-time output** — CSS and JSON are produced at build time, not runtime.

Runtime theme application (injecting CSS variables, reacting to theme changes) is the responsibility of `@kairoui/theme` in Phase 3.

---

## Override Rules

1. **Themes override semantic mappings** — a dark theme remaps `color.background.page` from `white` to `gray.900`.
2. **Density overrides spacing mappings** — compact density remaps `spacing.component.gap` from `spacing.16` to `spacing.8`.
3. **Component tokens are fixed** — they always point to the same semantic tokens. The resolved value changes because the semantic layer changes, not because the component mapping changes.
4. **Consumer overrides** — Consumers may override individual CSS variables. This is an escape hatch, not a primary mechanism.

---

## Deprecation and Breaking Changes

| Action                          | Semver impact | Process                                              |
| ------------------------------- | ------------- | ---------------------------------------------------- |
| Add a new token                 | Patch/minor   | No process required                                  |
| Rename a token                  | Major         | Deprecate old name for 1 major version               |
| Remove a token                  | Major         | Deprecate for 1 major version, then remove           |
| Change a token's resolved value | Patch         | Allowed (themes change values freely)                |
| Change a token's layer          | Major         | Redefining a semantic token as primitive is breaking |

---

## Dependency Diagram

```
┌─────────────────────────────┐
│     @kairoui/core           │  consumes component tokens
│     @kairoui/hooks          │  (no direct token dependency)
│     @kairoui/icons          │  (no direct token dependency)
└──────────────┬──────────────┘
               │ imports
               ▼
┌─────────────────────────────┐
│   @kairoui/theme (Phase 3)  │  applies themes at runtime
│   - ThemeProvider            │  injects CSS variables
│   - useTheme()              │
└──────────────┬──────────────┘
               │ imports
               ▼
┌─────────────────────────────────────────────────────────────┐
│                     @kairoui/tokens                          │
│                                                             │
│  ┌───────────────┐   ┌───────────────┐   ┌──────────────┐  │
│  │  Component    │──▶│   Semantic    │──▶│  Primitive   │  │
│  │  Tokens       │   │   Tokens      │   │  Tokens      │  │
│  └───────────────┘   └───────────────┘   └──────────────┘  │
│                                                             │
│  Outputs: TypeScript (.js/.d.ts) │ CSS (.css) │ JSON        │
└─────────────────────────────────────────────────────────────┘
```

---

## Example: End-to-End Token Resolution

**Scenario:** Resolve `button.primary.background` in a light theme.

```
button.primary.background
  → references: color.interactive.default     (component → semantic)
    → light theme maps to: blue.600           (semantic → primitive via theme)
      → raw value: #2563eb                    (primitive → CSS value)

CSS output: --kui-button-primary-background: var(--kui-color-interactive-default);
            --kui-color-interactive-default: #2563eb;  (set by light theme)
```

**Same token in dark theme:**

```
button.primary.background
  → references: color.interactive.default     (unchanged)
    → dark theme maps to: blue.400            (different primitive)
      → raw value: #60a5fa                    (different CSS value)

CSS output: --kui-color-interactive-default: #60a5fa;  (set by dark theme)
```

The component token mapping never changes. Only the semantic-to-primitive resolution changes per theme.
