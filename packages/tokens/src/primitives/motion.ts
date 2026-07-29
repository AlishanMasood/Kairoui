/**
 * KairoUI Motion Tokens — Primitive Tokens
 *
 * Duration and easing primitives for fast, purposeful, subtle animations.
 * Enterprise motion should feel responsive and intentional — never decorative.
 *
 * ## Motion Philosophy
 *
 * - **Fast** — Transitions complete before the user notices them starting
 * - **Purposeful** — Every animation communicates spatial relationship or state
 * - **Subtle** — Motion supports the interface, never distracts from content
 * - **Responsive** — UI feels alive without feeling slow
 *
 * ## Duration Scale
 *
 * | Key      | ms   | Use Case                                         |
 * | -------- | ---- | ------------------------------------------------ |
 * | instant  | 0    | Immediate state change, no transition            |
 * | fast     | 100  | Hover/focus states, color changes, opacity       |
 * | normal   | 200  | Menu open, tooltip appear, small transforms      |
 * | slow     | 300  | Dialog entrance, drawer slide, panel expand      |
 * | slower   | 500  | Full-page transitions, complex choreography      |
 *
 * ## Easing Curves
 *
 * | Key      | Curve                      | Use Case                         |
 * | -------- | -------------------------- | -------------------------------- |
 * | default  | cubic-bezier(0.4, 0, 0.2, 1) | General-purpose transitions   |
 * | linear   | linear                     | Progress bars, opacity fades     |
 * | in       | cubic-bezier(0.4, 0, 1, 1)   | Exit animations (accelerate out)|
 * | out      | cubic-bezier(0, 0, 0.2, 1)   | Entrance animations (decelerate)|
 * | inOut    | cubic-bezier(0.4, 0, 0.2, 1) | Symmetric transitions           |
 *
 * ## Intended Usage
 *
 * | Interaction        | Duration  | Easing    |
 * | ------------------ | --------- | --------- |
 * | Hover transitions  | fast      | default   |
 * | Focus transitions  | fast      | default   |
 * | Menu entrance      | normal    | out       |
 * | Menu exit          | fast      | in        |
 * | Dialog entrance    | slow      | out       |
 * | Dialog exit        | normal    | in        |
 * | Drawer slide in    | slow      | out       |
 * | Drawer slide out   | normal    | in        |
 * | Toast entrance     | normal    | out       |
 * | Toast exit         | fast      | in        |
 * | Loading indicators | —         | linear    |
 *
 * ## Reduced Motion Strategy
 *
 * When `prefers-reduced-motion: reduce` is active:
 * - Replace all durations with `instant` (0ms)
 * - Keep opacity changes (they don't trigger motion sickness)
 * - Remove transforms, slides, and scale animations
 * - This is handled at the semantic/component layer, not here
 *
 * The `instant` duration (0ms) is provided as the reduced-motion fallback.
 * Components should use `@media (prefers-reduced-motion: reduce)` to swap
 * their duration token to `instant`.
 */

import type { PrimitiveDurations, PrimitiveEasings } from "../types/primitives";

// ─── Durations ───────────────────────────────────────────────────────

export const duration: PrimitiveDurations = {
  instant: "0ms",
  fast: "100ms",
  normal: "200ms",
  slow: "300ms",
  slower: "500ms",
} as const;

// ─── Easings ─────────────────────────────────────────────────────────

export const easing: PrimitiveEasings = {
  default: "cubic-bezier(0.4, 0, 0.2, 1)",
  linear: "linear",
  in: "cubic-bezier(0.4, 0, 1, 1)",
  out: "cubic-bezier(0, 0, 0.2, 1)",
  inOut: "cubic-bezier(0.4, 0, 0.2, 1)",
} as const;
