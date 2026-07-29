/**
 * KairoUI Spacing Scale — Primitive Tokens
 *
 * A predictable spacing scale built on a 4px base rhythm (0.25rem).
 * Each key represents a multiplier: key "4" = 4 × 4px = 16px = 1rem.
 *
 * ## Design Rationale
 *
 * **Base unit:** 4px (0.25rem)
 * - The 4px grid is the industry standard for enterprise UI (Material, Ant, Atlassian)
 * - Provides enough granularity for tight controls without excessive options
 * - Scales cleanly at common browser zoom levels
 *
 * **Unit:** rem
 * - Respects user font-size preferences (accessibility)
 * - Assumed root: 16px (browser default)
 * - 1rem = 16px, 0.25rem = 4px
 *
 * **Scale structure:**
 * - Keys 0–3.5: micro spacing (0–14px) — icon gaps, compact controls
 * - Keys 4–6: control spacing (16–24px) — form fields, toolbar content
 * - Keys 7–12: component spacing (28–48px) — cards, dialogs, sections
 * - Keys 14–24: section spacing (56–96px) — page regions, large gaps
 * - Keys 28–96: page spacing (112–384px) — hero sections, max widths
 *
 * ## Recommended Usage Bands
 *
 * | Band              | Keys    | Pixels   | Use Cases                                   |
 * | ----------------- | ------- | -------- | ------------------------------------------- |
 * | Micro             | 0–2     | 0–8px    | Icon margins, tight inline gaps             |
 * | Control           | 2.5–5   | 10–20px  | Input padding, button padding, small gaps   |
 * | Component         | 6–12    | 24–48px  | Card padding, dialog padding, form gaps     |
 * | Section           | 14–24   | 56–96px  | Page section spacing, large layout gaps     |
 * | Page              | 28–96   | 112–384px| Page margins, hero spacing, max widths      |
 */

import type { PrimitiveSpacing } from "../types/primitives";

/**
 * KairoUI spacing scale.
 *
 * Values in rem (base: 1rem = 16px, unit step: 0.25rem = 4px).
 * Key "N" = N × 0.25rem = N × 4px.
 */
export const spacing = {
  "0": "0",
  "0.5": "0.125rem",
  "1": "0.25rem",
  "1.5": "0.375rem",
  "2": "0.5rem",
  "2.5": "0.625rem",
  "3": "0.75rem",
  "3.5": "0.875rem",
  "4": "1rem",
  "5": "1.25rem",
  "6": "1.5rem",
  "7": "1.75rem",
  "8": "2rem",
  "9": "2.25rem",
  "10": "2.5rem",
  "11": "2.75rem",
  "12": "3rem",
  "14": "3.5rem",
  "16": "4rem",
  "20": "5rem",
  "24": "6rem",
  "28": "7rem",
  "32": "8rem",
  "36": "9rem",
  "40": "10rem",
  "44": "11rem",
  "48": "12rem",
  "52": "13rem",
  "56": "14rem",
  "60": "15rem",
  "64": "16rem",
  "72": "18rem",
  "80": "20rem",
  "96": "24rem",
} as const satisfies PrimitiveSpacing;
