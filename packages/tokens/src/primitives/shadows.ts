/**
 * KairoUI Elevation and Shadow Scale — Primitive Tokens
 *
 * A restrained shadow scale for enterprise UIs. Shadows indicate
 * temporary elevation (menus, popovers, dialogs) — NOT permanent surfaces.
 *
 * ## Border-First Surface Philosophy
 *
 * KairoUI uses **borders** (not shadows) to define permanent surface boundaries:
 * - Cards, panels, and sidebars use border tokens for edge definition
 * - Shadows are reserved for **temporary** or **floating** surfaces
 * - This produces a calmer, flatter visual hierarchy suitable for
 *   data-dense enterprise UIs
 *
 * ## When Shadows Are Appropriate
 *
 * - Dropdown menus (raised above page content)
 * - Popovers and tooltips (floating above triggers)
 * - Dialogs and modals (overlaying the page)
 * - Toast notifications (floating at viewport edge)
 * - Drawers (sliding over content)
 * - Drag-and-drop elements (lifted from surface)
 *
 * ## When Shadows Are Prohibited
 *
 * - Permanent cards and panels (use borders)
 * - Navigation bars (use borders or background contrast)
 * - Table rows (use borders or alternating backgrounds)
 * - Buttons (use background/border changes for state)
 * - Section dividers (use border or spacing)
 *
 * ## Elevation ↔ Z-Index Relationship
 *
 * Higher shadow levels correlate with higher z-index layers, but shadows
 * and z-indices are defined separately. Shadows are visual; z-index is
 * stacking context. They are composed at the component/semantic layer.
 *
 * | Shadow Level | Typical Z-Index Layer | Example             |
 * | ------------ | --------------------- | ------------------- |
 * | none         | base                  | Page content        |
 * | xs           | dropdown              | Small popover       |
 * | sm           | dropdown              | Menu                |
 * | md           | overlay               | Drawer              |
 * | lg           | modal                 | Dialog              |
 * | xl           | modal                 | Stacked modal       |
 * | 2xl          | toast                 | Toast notification  |
 *
 * ## Dark Theme Shadow Considerations
 *
 * In dark themes, shadows are less visible against dark backgrounds.
 * Dark themes should:
 * - Increase shadow opacity slightly (handled by semantic tokens)
 * - Use lighter border edges on elevated surfaces for definition
 * - Rely more on background lightness differences for elevation
 *
 * These primitives define the shadow shapes. The semantic layer and theme
 * definitions may adjust opacity or add supplementary borders for dark themes.
 */

import type { PrimitiveShadows } from "../types/primitives";

/**
 * Shadow scale.
 *
 * Uses subtle, cool-toned shadows (black with low opacity) that
 * pair well with the neutral palette's slight blue-gray tint.
 *
 * Multiple shadow layers create realistic soft shadows without heaviness.
 */
export const shadow: PrimitiveShadows = {
  none: "none",
  xs: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
  sm: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)",
  md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)",
  lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)",
  xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
  "2xl": "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
  inner: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)",
} as const;
