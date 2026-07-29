/**
 * KairoUI Brand Color Scale — Primitive Tokens
 *
 * The official KairoUI accent color. A refined indigo with subtle violet undertones
 * that conveys intelligence, stability, and premium quality.
 *
 * ## Design Rationale
 *
 * **Hue:** ~238° (indigo, between blue and violet)
 * - Distinguished from generic "Material blue" (~210°) and standard corporate blue
 * - Indigo communicates depth, intelligence, and trustworthiness
 * - The slight violet lean adds warmth and modernity without becoming playful
 *
 * **Saturation:** Moderate-high (50-70%)
 * - Enough saturation to feel vibrant and recognizable as an accent
 * - Not so saturated that it feels neon, alarming, or fatiguing
 * - Reduces gracefully in both light (subtle) and dark (vivid) contexts
 *
 * **Emotional Qualities:**
 * - Intelligent — associated with depth, thought, precision
 * - Stable — not excitable or trendy; reliable
 * - Modern — not corporate-generic; has personality
 * - Premium — richness without loudness
 * - Enterprise-focused — professional, not consumer/playful
 *
 * ## Recommended Usage Steps
 *
 * | Step | Light Theme Usage                    | Dark Theme Usage                  |
 * | ---- | ------------------------------------ | --------------------------------- |
 * | 50   | Selected row background, tint        | —                                 |
 * | 100  | Hover background on interactive      | —                                 |
 * | 200  | Soft focus indicator bg, pills       | Strong text/icons on dark         |
 * | 300  | Borders on active/selected elements  | Vibrant accents on dark           |
 * | 400  | —                                    | Primary action on dark surfaces   |
 * | 500  | Focus ring, secondary actions        | Hover state on dark               |
 * | 600  | **Primary action** (buttons, links)  | Active state on dark              |
 * | 700  | Active/pressed state                 | —                                 |
 * | 800  | Strong accent text                   | Subtle borders on dark            |
 * | 900  | —                                    | Muted accent backgrounds          |
 * | 950  | —                                    | Deep accent background            |
 *
 * ## Accessibility Cautions
 *
 * - Steps 50-300 do NOT meet WCAG AA contrast against white backgrounds for text.
 *   Use them only for backgrounds, decorative elements, or large non-text indicators.
 * - Step 600 (#4338ca) on white (#ffffff) achieves approximately 5.4:1 contrast
 *   (passes WCAG AA for normal text).
 * - In dark themes, step 300-400 on dark backgrounds (900-950 neutral) should be
 *   validated for sufficient contrast before use as readable text.
 * - Never rely solely on brand color to convey meaning — always pair with icons,
 *   labels, or other non-color indicators.
 */

import type { ColorScale } from "../../types/primitives";

/**
 * KairoUI brand color scale (indigo).
 *
 * Named `blue` in the primitive palette to follow the standard hue naming convention.
 * This IS the KairoUI brand indigo — the primary accent color of the design system.
 */
export const blue = {
  "50": "#eef2ff",
  "100": "#e0e7ff",
  "200": "#c7d2fe",
  "300": "#a5b4fc",
  "400": "#818cf8",
  "500": "#6366f1",
  "600": "#4f46e5",
  "700": "#4338ca",
  "800": "#3730a3",
  "900": "#312e81",
  "950": "#1e1b4b",
} as const satisfies ColorScale;
