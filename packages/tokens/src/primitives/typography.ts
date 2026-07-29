/**
 * KairoUI Typography Scale — Primitive Tokens
 *
 * Typography primitives for enterprise applications: readable, professional,
 * suitable for dense data displays and long-form content alike.
 *
 * ## Font Stack Philosophy
 *
 * KairoUI uses system font stacks — no proprietary fonts required.
 * This ensures:
 * - Zero download overhead (instant rendering)
 * - Native look and feel on each platform
 * - Consistent metrics across OS environments
 * - No licensing requirements for consumers
 *
 * The sans-serif stack prioritizes:
 * 1. Inter (popular open-source UI font, if installed)
 * 2. System UI fonts (SF Pro, Segoe UI, etc.)
 * 3. Generic sans-serif fallback
 *
 * The monospace stack targets:
 * 1. JetBrains Mono / Fira Code (popular dev fonts)
 * 2. System monospace fonts
 * 3. Generic monospace fallback
 *
 * ## Fallback Behavior
 *
 * All font stacks end with a generic family keyword. If all named fonts
 * are unavailable, the browser's default for that category is used.
 * No layout shift occurs because line-height and spacing are defined
 * independently of the font.
 *
 * ## Numeric Alignment
 *
 * For financial data, tables, and dashboards, use the monospace stack or
 * apply `font-variant-numeric: tabular-nums` to the sans stack. This
 * ensures columns of numbers align vertically.
 *
 * Tabular-number use cases:
 * - Price columns
 * - Date/time displays
 * - Status counts and metrics
 * - Table numeric cells
 *
 * ## Minimum Readable Sizes
 *
 * - `xs` (0.75rem / 12px): minimum for non-essential metadata only
 * - `sm` (0.8125rem / 13px): minimum for readable body content in dense UIs
 * - `base` (0.875rem / 14px): default body text for enterprise applications
 *
 * Note: Enterprise UIs commonly use 13-14px body text (not 16px) for
 * information density. The `base` size reflects this convention.
 *
 * ## Internationalization
 *
 * - CJK (Chinese, Japanese, Korean) characters render larger than Latin
 *   at the same font-size. Test with CJK content at `sm` and `xs`.
 * - RTL (Arabic, Hebrew) scripts may require different letter-spacing.
 * - Line heights account for accents and descenders in European languages.
 * - The system font stack includes appropriate CJK and RTL fallbacks
 *   via the browser's font-matching algorithm.
 *
 * ## Why Semantic Roles Are Created Later
 *
 * These primitives define raw typographic values. Semantic roles like
 * "page heading", "body text", or "caption" will be defined in the
 * semantic token layer, mapping to these primitives with additional
 * constraints (max-width, color, spacing).
 */

import type {
  PrimitiveFontSizes,
  PrimitiveFontWeights,
  PrimitiveLineHeights,
  PrimitiveLetterSpacings,
  PrimitiveFontFamilies,
} from "../types/primitives";

// ─── Font Families ───────────────────────────────────────────────────

export const fontFamily: PrimitiveFontFamilies = {
  sans: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
  serif: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
  mono: '"JetBrains Mono", "Fira Code", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
} as const;

// ─── Font Sizes ──────────────────────────────────────────────────────

/**
 * Font size scale.
 *
 * Enterprise-optimized: base is 14px (0.875rem), not 16px.
 * Heading sizes are restrained — suitable for application UIs, not marketing.
 *
 * | Key  | rem    | px   | Use Case                          |
 * | ---- | ------ | ---- | --------------------------------- |
 * | xs   | 0.75   | 12   | Metadata, timestamps, badges      |
 * | sm   | 0.8125 | 13   | Dense tables, secondary labels    |
 * | base | 0.875  | 14   | Default body text                 |
 * | lg   | 1      | 16   | Emphasized body, large labels     |
 * | xl   | 1.125  | 18   | Sub-section headings              |
 * | 2xl  | 1.25   | 20   | Section headings                  |
 * | 3xl  | 1.5    | 24   | Page headings                     |
 * | 4xl  | 1.875  | 30   | Major page titles                 |
 * | 5xl  | 2.25   | 36   | Dashboard hero metrics            |
 * | 6xl  | 3      | 48   | Large display (rare)              |
 * | 7xl  | 3.75   | 60   | Display (marketing only)          |
 * | 8xl  | 4.5    | 72   | Display (marketing only)          |
 * | 9xl  | 6      | 96   | Display (marketing only)          |
 */
export const fontSize: PrimitiveFontSizes = {
  xs: "0.75rem",
  sm: "0.8125rem",
  base: "0.875rem",
  lg: "1rem",
  xl: "1.125rem",
  "2xl": "1.25rem",
  "3xl": "1.5rem",
  "4xl": "1.875rem",
  "5xl": "2.25rem",
  "6xl": "3rem",
  "7xl": "3.75rem",
  "8xl": "4.5rem",
  "9xl": "6rem",
} as const;

// ─── Font Weights ────────────────────────────────────────────────────

export const fontWeight: PrimitiveFontWeights = {
  thin: 100,
  extralight: 200,
  light: 300,
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
  black: 900,
} as const;

// ─── Line Heights ────────────────────────────────────────────────────

/**
 * Line height scale.
 *
 * Values are unitless ratios (multiplied by font-size).
 * - "none" (1): headings with tight stacking
 * - "tight" (1.25): compact headings
 * - "snug" (1.375): sub-headings
 * - "normal" (1.5): default body text (WCAG recommendation)
 * - "relaxed" (1.625): long-form reading
 * - "loose" (2): spacious display text
 */
export const lineHeight: PrimitiveLineHeights = {
  none: 1,
  tight: 1.25,
  snug: 1.375,
  normal: 1.5,
  relaxed: 1.625,
  loose: 2,
} as const;

// ─── Letter Spacing ──────────────────────────────────────────────────

/**
 * Letter spacing scale.
 *
 * Negative values tighten (headings), positive values loosen (small caps, labels).
 */
export const letterSpacing: PrimitiveLetterSpacings = {
  tighter: "-0.05em",
  tight: "-0.025em",
  normal: "0em",
  wide: "0.025em",
  wider: "0.05em",
  widest: "0.1em",
} as const;
