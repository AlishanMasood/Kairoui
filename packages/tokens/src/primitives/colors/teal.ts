/**
 * KairoUI Teal (Information) Color Scale — Primitive Tokens
 *
 * A cool teal palette for indicating informational states, tips,
 * and neutral-positive guidance in enterprise interfaces.
 *
 * ## Design Rationale
 *
 * **Hue:** ~185° (teal/cyan)
 * - Distinct from the indigo brand (238°) — information is not action
 * - Distinct from green (150°) — info is not success
 * - Cool and calm, appropriate for "FYI" states
 * - Professional without commanding urgency
 *
 * **Saturation:** Moderate (40-60%)
 * - Less saturated than brand/status colors — info is less important
 * - Still clearly colored (not confused with neutral gray)
 *
 * ## Recommended Usage Ranges
 *
 * | Step  | Purpose                                                   |
 * | ----- | --------------------------------------------------------- |
 * | 50    | Info background (tips, notes, callouts)                   |
 * | 100   | Hover on info backgrounds                                 |
 * | 200   | Info badges, help indicators                              |
 * | 300   | Info borders                                              |
 * | 400   | Dark-theme info accents                                   |
 * | 500   | Info icons                                                |
 * | 600   | Info links, indicators                                    |
 * | 700   | Info text on light backgrounds                            |
 * | 800   | High-contrast info text                                   |
 * | 900   | Dark-theme info backgrounds                               |
 * | 950   | Deep info background                                      |
 *
 * ## Accessibility Considerations
 *
 * - Step 600+ on white meets WCAG AA for normal text
 * - Light teal backgrounds (50-100) need dark text overlay
 * - Info states are lowest priority — ensure they don't compete
 *   visually with errors or warnings
 */

import type { ColorScale } from "../../types/primitives";

export const teal = {
  "50": "#f0fdfa",
  "100": "#ccfbf1",
  "200": "#99f6e4",
  "300": "#5eead4",
  "400": "#2dd4bf",
  "500": "#14b8a6",
  "600": "#0d9488",
  "700": "#0f766e",
  "800": "#115e59",
  "900": "#134e4a",
  "950": "#042f2e",
} as const satisfies ColorScale;
