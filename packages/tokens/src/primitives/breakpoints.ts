/**
 * KairoUI Breakpoint Tokens — Primitive Tokens
 *
 * Framework-independent viewport breakpoints for responsive design.
 * These are pure data values — not React hooks, not media query utilities.
 *
 * ## Mobile-First Assumptions
 *
 * KairoUI breakpoints are designed for mobile-first (min-width) queries:
 *
 *   @media (min-width: 640px)  -- sm: tablet
 *   @media (min-width: 768px)  -- md: small desktop
 *   @media (min-width: 1024px) -- lg: desktop
 *   @media (min-width: 1280px) -- xl: wide desktop
 *   @media (min-width: 1536px) -- 2xl: ultra-wide
 *
 * ## Breakpoint Scale
 *
 * | Key  | px    | Target                                            |
 * | ---- | ----- | ------------------------------------------------- |
 * | xs   | 480   | Large phones (landscape)                          |
 * | sm   | 640   | Small tablets, large phones in landscape           |
 * | md   | 768   | Tablets, small laptops                             |
 * | lg   | 1024  | Standard desktop, laptop                           |
 * | xl   | 1280  | Wide desktop, enterprise monitors                  |
 * | 2xl  | 1536  | Ultra-wide, data-dense enterprise screens          |
 *
 * ## Why Breakpoints Are Tokens
 *
 * - **Single source of truth** — CSS, documentation, and tools reference the same values
 * - **Framework-independent** — Works in CSS media queries, Tailwind config, Storybook viewports
 * - **No runtime cost** — Breakpoints are build-time constants
 * - **Consistent naming** — All KairoUI packages use the same breakpoint vocabulary
 *
 * ## Future Usage
 *
 * - CSS: `@media (min-width: var(--kui-breakpoint-md))` (or generated utility classes)
 * - Documentation: Storybook viewport presets reference these values
 * - Testing: Visual regression tests use these as standard viewport sizes
 * - Responsive hooks (Phase 3): `useBreakpoint()` will read from these tokens
 *
 * ## Container Widths
 *
 * Container widths (max-width for content regions) are defined in `sizing.ts`
 * as `contentWidth.reading`, `contentWidth.content`, `contentWidth.wide`, and
 * `contentWidth.max`. They are independent of breakpoints — a container may be
 * narrower than the viewport at any breakpoint.
 */

import type { PrimitiveBreakpoints } from "../types/primitives";

/**
 * Viewport breakpoints.
 *
 * Values in px — breakpoints are absolute viewport measurements,
 * not relative to font-size.
 */
export const breakpoint: PrimitiveBreakpoints = {
  xs: "480px",
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
} as const;
