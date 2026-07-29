/**
 * KairoUI Neutral Color Scale — Primitive Tokens
 *
 * A slightly cool-toned neutral palette designed for enterprise applications.
 * Optimized for:
 * - Clear distinction between adjacent steps used together
 * - Comfortable reading during extended work sessions
 * - Sufficient tonal range for both light and dark themes
 * - Professional, calm appearance
 *
 * ## Design Rationale
 *
 * The palette uses a subtle blue-gray tint (hue ~220°, saturation 5-15%)
 * rather than pure gray. This creates a more refined, modern appearance
 * while remaining neutral enough for diverse content types.
 *
 * Lightness distribution is non-linear:
 * - Steps 50-200: closely spaced for subtle surface differentiation (light themes)
 * - Steps 300-700: wider spacing for clear functional distinction (borders, text)
 * - Steps 800-950: closely spaced for dark theme surface differentiation
 *
 * ## Intended Usage Ranges (without assigning semantic roles)
 *
 * | Range    | Typical Application Domain                              |
 * | -------- | ------------------------------------------------------- |
 * | 50–100   | Light theme backgrounds, subtle surfaces                |
 * | 200–300  | Light theme borders, dividers, disabled backgrounds     |
 * | 400–500  | Placeholder text, disabled content, subtle icons        |
 * | 600–700  | Secondary text, icons, strong borders                   |
 * | 800–900  | Primary text in light theme, backgrounds in dark theme  |
 * | 950      | Headings, highest contrast text, deep dark backgrounds  |
 */

import type { ColorScale } from "../../types/primitives";

/**
 * KairoUI neutral color scale.
 *
 * All values are specified in hex format for consistency and tooling compatibility.
 * The slight blue-gray tint (oklch hue ~250°) provides a professional enterprise feel.
 */
export const neutral = {
  "50": "#f8f9fb",
  "100": "#f1f3f6",
  "200": "#e4e7ec",
  "300": "#cdd2da",
  "400": "#9ba3b0",
  "500": "#6b7588",
  "600": "#4e5768",
  "700": "#3d4555",
  "800": "#2c3344",
  "900": "#1e2433",
  "950": "#131822",
} as const satisfies ColorScale;
