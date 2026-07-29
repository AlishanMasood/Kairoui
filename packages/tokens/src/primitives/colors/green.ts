/**
 * KairoUI Green (Success) Color Scale — Primitive Tokens
 *
 * A balanced green palette for indicating positive outcomes, completion,
 * and successful operations in enterprise interfaces.
 *
 * ## Design Rationale
 *
 * **Hue:** ~150° (teal-green, slightly cool)
 * - Avoids the "cheap" feel of pure lime/neon green
 * - Cool-leaning green harmonizes with the indigo brand and neutral palette
 * - Reads as professional and reassuring rather than celebratory
 *
 * **Saturation:** Moderate (40-60%)
 * - Controlled enough for extended display (success banners, status indicators)
 * - Not so muted that it loses its positive connotation
 *
 * ## Recommended Usage Ranges
 *
 * | Step  | Purpose                                                   |
 * | ----- | --------------------------------------------------------- |
 * | 50    | Subtle success background (toasts, banners)               |
 * | 100   | Hover state on success backgrounds                        |
 * | 200   | Success badges, soft indicators                           |
 * | 300   | Borders on success elements                               |
 * | 400   | Dark-theme success accents                                |
 * | 500   | Icons, indicators in light theme                          |
 * | 600   | Strong success actions, primary success indicators        |
 * | 700   | Success text on light backgrounds                         |
 * | 800   | High-contrast success text                                |
 * | 900   | Dark-theme success backgrounds                            |
 * | 950   | Deep success background                                   |
 *
 * ## Accessibility Considerations
 *
 * - Step 700+ on white achieves WCAG AA for normal text
 * - Step 50-100 backgrounds must pair with 700+ text for readability
 * - Never use green alone to indicate success — always pair with icons/labels
 */

import type { ColorScale } from "../../types/primitives";

export const green = {
  "50": "#f0fdf4",
  "100": "#dcfce7",
  "200": "#bbf7d0",
  "300": "#86efac",
  "400": "#4ade80",
  "500": "#22c55e",
  "600": "#16a34a",
  "700": "#15803d",
  "800": "#166534",
  "900": "#14532d",
  "950": "#052e16",
} as const satisfies ColorScale;
