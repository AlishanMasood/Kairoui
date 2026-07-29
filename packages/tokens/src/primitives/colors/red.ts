/**
 * KairoUI Red (Danger) Color Scale — Primitive Tokens
 *
 * A warm red palette for indicating errors, destructive actions,
 * and critical warnings in enterprise interfaces.
 *
 * ## Design Rationale
 *
 * **Hue:** ~0° (true red)
 * - Universal association with danger, errors, and critical states
 * - Warm red (not orange-red) ensures immediate recognition
 * - Slightly desaturated at lighter steps for comfortable backgrounds
 *
 * **Saturation:** Moderate-high (50-70%)
 * - Enough urgency to command attention
 * - Not so aggressive that it causes alarm fatigue in data-dense UIs
 *
 * ## Recommended Usage Ranges
 *
 * | Step  | Purpose                                                   |
 * | ----- | --------------------------------------------------------- |
 * | 50    | Error background (form fields, inline validation)         |
 * | 100   | Hover state on danger backgrounds                         |
 * | 200   | Error badges, soft danger indicators                      |
 * | 300   | Danger borders                                            |
 * | 400   | Dark-theme danger accents                                 |
 * | 500   | Danger icons, indicators                                  |
 * | 600   | Destructive actions, error indicators                     |
 * | 700   | Error text on light backgrounds                           |
 * | 800   | High-contrast error text                                  |
 * | 900   | Dark-theme error backgrounds                              |
 * | 950   | Deep danger background                                    |
 *
 * ## Accessibility Considerations
 *
 * - Step 600+ on white achieves WCAG AA for normal text
 * - Never rely on red alone for error states — include descriptive text
 * - Red-green color blindness affects ~8% of males; always provide
 *   secondary indicators (icons, text, patterns)
 */

import type { ColorScale } from "../../types/primitives";

export const red = {
  "50": "#fef2f2",
  "100": "#fee2e2",
  "200": "#fecaca",
  "300": "#fca5a5",
  "400": "#f87171",
  "500": "#ef4444",
  "600": "#dc2626",
  "700": "#b91c1c",
  "800": "#991b1b",
  "900": "#7f1d1d",
  "950": "#450a0a",
} as const satisfies ColorScale;
