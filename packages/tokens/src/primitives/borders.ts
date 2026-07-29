/**
 * KairoUI Border and Radius Scale — Primitive Tokens
 *
 * Structured, restrained shape tokens for enterprise applications.
 * The shape language is modern and slightly rounded — never aggressively
 * rounded or fully pill-shaped by default.
 *
 * ## Design Rationale
 *
 * **Border widths** use px (absolute, not affected by font-size):
 * - Borders are decorative/structural, not content — px is appropriate
 * - Thin borders (1px) remain crisp at all zoom levels
 *
 * **Radii** use rem for scalability:
 * - Subtle rounding that scales with content
 * - "full" (9999px) provided only for pills/avatars that genuinely need it
 *
 * ## Recommended Usage
 *
 * | Category          | Radius    | Border Width | Use Case                         |
 * | ----------------- | --------- | ------------ | -------------------------------- |
 * | Small controls    | xs–sm     | thin         | Chips, tags, small badges        |
 * | Standard controls | sm–md     | default      | Inputs, buttons, selects         |
 * | Cards/surfaces    | md–lg     | default      | Cards, panels, popovers         |
 * | Overlays          | lg–xl     | none         | Dialogs, dropdowns, tooltips     |
 * | Circular elements | full      | —            | Avatars, round icon buttons      |
 * | Pills             | full      | default      | Pill badges, toggle handles      |
 */

import type { LengthValue } from "../types/values";
import type { PrimitiveRadii } from "../types/primitives";

// ─── Border Widths ───────────────────────────────────────────────────

/** Border width scale */
export interface BorderWidths {
  readonly none: LengthValue;
  readonly thin: LengthValue;
  readonly default: LengthValue;
  readonly thick: LengthValue;
}

export const borderWidth: BorderWidths = {
  none: "0",
  thin: "1px",
  default: "1px",
  thick: "2px",
} as const;

// ─── Border Styles ───────────────────────────────────────────────────

/** Approved border styles */
export type BorderStyle = "none" | "solid" | "dashed" | "dotted";

/** Default border styles available as tokens */
export interface BorderStyles {
  readonly none: BorderStyle;
  readonly solid: BorderStyle;
  readonly dashed: BorderStyle;
  readonly dotted: BorderStyle;
}

export const borderStyle: BorderStyles = {
  none: "none",
  solid: "solid",
  dashed: "dashed",
  dotted: "dotted",
} as const;

// ─── Border Radii ────────────────────────────────────────────────────

/**
 * Border radius scale.
 *
 * Progresses from zero rounding to full pill/circle.
 * Default enterprise controls use `sm` or `md` — never large radii by default.
 */
export const radius: PrimitiveRadii = {
  none: "0",
  xs: "0.125rem",
  sm: "0.25rem",
  md: "0.375rem",
  lg: "0.5rem",
  xl: "0.75rem",
  "2xl": "1rem",
  "3xl": "1.5rem",
  full: "9999px",
} as const;

// ─── Focus Ring ──────────────────────────────────────────────────────

/** Focus ring dimensional tokens (not colors — colors are semantic) */
export interface FocusRingDimensions {
  readonly width: LengthValue;
  readonly offset: LengthValue;
}

/**
 * Focus ring width and offset.
 * - Width: 2px ring provides clear visibility without being heavy
 * - Offset: 2px gap between element and ring for clarity
 */
export const focusRing: FocusRingDimensions = {
  width: "2px",
  offset: "2px",
} as const;
