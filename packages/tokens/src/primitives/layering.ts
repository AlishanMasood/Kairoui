/**
 * KairoUI Opacity and Z-Index Tokens — Primitive Tokens
 *
 * ## Opacity Scale
 *
 * A percentage-based opacity scale (0–100) for controlling transparency.
 * Values are strings representing CSS opacity decimals.
 *
 * ### Recommended Usage
 *
 * | Opacity | Decimal | Use Case                                   |
 * | ------- | ------- | ------------------------------------------ |
 * | 0       | 0       | Fully transparent (hidden but in layout)   |
 * | 5       | 0.05    | Hover overlay on dark surfaces             |
 * | 10      | 0.1     | Pressed overlay, skeleton shimmer          |
 * | 20      | 0.2     | Subtle background masks                    |
 * | 30      | 0.3     | Dragging ghost element                     |
 * | 40      | 0.4     | Disabled content                           |
 * | 50      | 0.5     | Backdrop overlay (light)                   |
 * | 60      | 0.6     | Muted content                              |
 * | 70      | 0.7     | Backdrop overlay (medium)                  |
 * | 80      | 0.8     | Strong backdrop overlay                    |
 * | 90      | 0.9     | Nearly opaque overlay                      |
 * | 95      | 0.95    | Frosted/blur backdrop                      |
 * | 100     | 1       | Fully opaque (default)                     |
 *
 * ## Z-Index Scale
 *
 * A controlled stacking-context hierarchy. All z-index values in KairoUI
 * MUST come from this scale. Components must not invent arbitrary values.
 *
 * ### Stacking Rules
 *
 * 1. Each layer represents a conceptual stacking category.
 * 2. Within a layer, DOM order determines stacking (no sub-indices).
 * 3. Higher layers always render above lower layers.
 * 4. `hide` (-1) places elements behind normal flow (visually hidden but present).
 * 5. Portaled elements (dialogs, toasts) establish new stacking contexts.
 *
 * ### Ownership
 *
 * | Layer    | Value | Owner                                    |
 * | -------- | ----- | ---------------------------------------- |
 * | hide     | -1    | Visually hidden elements                 |
 * | base     | 0     | Normal page content (default)            |
 * | dropdown | 100   | Dropdowns, menus, popovers, tooltips     |
 * | sticky   | 200   | Sticky headers, fixed sidebars           |
 * | overlay  | 300   | Drawers, overlay panels                  |
 * | modal    | 400   | Dialog modals, confirmation sheets       |
 * | toast    | 500   | Toast notifications (always on top)      |
 *
 * ### Why These Values?
 *
 * - Gaps of 100 between layers allow internal layering if ever needed
 *   (e.g., dropdown shadow at 99, dropdown content at 100)
 * - Simple round numbers are debuggable in DevTools
 * - No 9999 or arbitrary large values
 * - `toast` is highest because notifications must never be obscured
 */

import type { PrimitiveOpacities, PrimitiveZIndices } from "../types/primitives";

// ─── Opacity ─────────────────────────────────────────────────────────

export const opacity: PrimitiveOpacities = {
  "0": "0",
  "5": "0.05",
  "10": "0.1",
  "20": "0.2",
  "30": "0.3",
  "40": "0.4",
  "50": "0.5",
  "60": "0.6",
  "70": "0.7",
  "80": "0.8",
  "90": "0.9",
  "95": "0.95",
  "100": "1",
} as const;

// ─── Z-Index ─────────────────────────────────────────────────────────

export const zIndex: PrimitiveZIndices = {
  hide: -1,
  base: 0,
  dropdown: 100,
  sticky: 200,
  overlay: 300,
  modal: 400,
  toast: 500,
} as const;
