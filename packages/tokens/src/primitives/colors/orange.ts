/**
 * KairoUI Orange (Warning) Color Scale — Primitive Tokens
 *
 * An amber-orange palette for indicating warnings, cautions,
 * and non-critical attention-required states.
 *
 * ## Design Rationale
 *
 * **Hue:** ~30-38° (amber/orange)
 * - Distinct from red (danger) — warnings are less severe
 * - Amber reads as "caution" rather than "stop"
 * - Warm and attention-getting without alarm
 *
 * **Saturation:** Moderate (50-70%)
 * - Visible without being garish
 * - Works well as background tint at lower steps
 *
 * ## Recommended Usage Ranges
 *
 * | Step  | Purpose                                                   |
 * | ----- | --------------------------------------------------------- |
 * | 50    | Warning background (notices, banners)                     |
 * | 100   | Hover on warning backgrounds                              |
 * | 200   | Warning badges, soft indicators                           |
 * | 300   | Warning borders                                           |
 * | 400   | Dark-theme warning accents                                |
 * | 500   | Warning icons, indicators                                 |
 * | 600   | Strong warning actions                                    |
 * | 700   | Warning text on light backgrounds                         |
 * | 800   | High-contrast warning text                                |
 * | 900   | Dark-theme warning backgrounds                            |
 * | 950   | Deep warning background                                   |
 *
 * ## Accessibility Considerations
 *
 * - Yellow/amber on white has POOR contrast — never use steps 50-400 as text
 * - Step 700+ on white achieves WCAG AA for normal text
 * - Warning backgrounds (50-100) require dark text (neutral 800-950) overlay
 * - In dark themes, use step 300-400 for visible indicators
 */

import type { ColorScale } from "../../types/primitives";

export const orange = {
  "50": "#fff7ed",
  "100": "#ffedd5",
  "200": "#fed7aa",
  "300": "#fdba74",
  "400": "#fb923c",
  "500": "#f97316",
  "600": "#ea580c",
  "700": "#c2410c",
  "800": "#9a3412",
  "900": "#7c2d12",
  "950": "#431407",
} as const satisfies ColorScale;
