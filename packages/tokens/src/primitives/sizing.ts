/**
 * KairoUI Sizing Scale — Primitive Tokens
 *
 * Generic sizing primitives for control heights, icon dimensions, content widths,
 * and interaction targets. These are raw values — not tied to specific components.
 *
 * ## Design Rationale
 *
 * Sizing tokens use rem for scalability and accessibility. They represent
 * physical dimensions rather than spacing (gap/margin/padding).
 *
 * ## Categories
 *
 * ### Control Heights
 * Standard heights for interactive controls (inputs, buttons, selects).
 * Used as a reference by the semantic `control.height` tokens.
 *
 * | Size | rem   | px   | Use Case                        |
 * | ---- | ----- | ---- | ------------------------------- |
 * | xs   | 1.5   | 24   | Compact inline actions, chips   |
 * | sm   | 2     | 32   | Compact form controls           |
 * | md   | 2.5   | 40   | Default form controls           |
 * | lg   | 3     | 48   | Prominent actions, touch targets|
 * | xl   | 3.5   | 56   | Hero CTAs, large touch targets  |
 *
 * ### Icon Sizes
 * Standard icon rendering dimensions.
 *
 * | Size | rem   | px   | Use Case                        |
 * | ---- | ----- | ---- | ------------------------------- |
 * | xs   | 0.75  | 12   | Inline indicators               |
 * | sm   | 1     | 16   | Standard inline icons           |
 * | md   | 1.25  | 20   | Default icons                   |
 * | lg   | 1.5   | 24   | Emphasized icons                |
 * | xl   | 2     | 32   | Large standalone icons          |
 *
 * ### Content Widths
 * Common maximum widths for content regions.
 *
 * | Name     | rem   | px    | Use Case                        |
 * | -------- | ----- | ----- | ------------------------------- |
 * | reading  | 40    | 640   | Optimal reading line length     |
 * | content  | 56    | 896   | Standard content column         |
 * | wide     | 72    | 1152  | Wide content with sidebar       |
 * | max      | 90    | 1440  | Maximum application width       |
 *
 * ## Accessibility — Minimum Touch Targets
 *
 * Per WCAG 2.5.8 (Target Size), interactive elements should have a minimum
 * target area of 24×24 CSS pixels. The recommended target is 44×44 CSS pixels.
 *
 * - `controlHeight.xs` (24px) meets the WCAG minimum but not the recommendation.
 *   Use only where space is severely constrained and provide adequate spacing.
 * - `controlHeight.md` (40px) and above meet the 44px recommendation at all
 *   densities except compact.
 *
 * ## Density Interaction
 *
 * Density modes may remap semantic sizing tokens to different primitive values:
 * - `compact` density might use `controlHeight.sm` where `md` is default
 * - `spacious` density might use `controlHeight.lg` where `md` is default
 *
 * This remapping happens in the semantic/density layer, not here.
 *
 * ## What Waits for Component Contracts
 *
 * The following dimensions are NOT defined here — they belong to component tokens:
 * - Dialog specific widths (sm/md/lg/xl dialog)
 * - Sidebar widths (collapsed/expanded)
 * - Navigation bar height
 * - Table row heights
 * - Avatar sizes (mapped from icon sizes but component-scoped)
 */

import type { LengthValue } from "../types/values";

// ─── Size Label Type ─────────────────────────────────────────────────

/** Standard size labels used across sizing categories */
export type SizeLabel = "xs" | "sm" | "md" | "lg" | "xl";

// ─── Control Heights ─────────────────────────────────────────────────

export const controlHeight: Record<SizeLabel, LengthValue> = {
  xs: "1.5rem",
  sm: "2rem",
  md: "2.5rem",
  lg: "3rem",
  xl: "3.5rem",
} as const;

// ─── Icon Sizes ──────────────────────────────────────────────────────

export const iconSize: Record<SizeLabel, LengthValue> = {
  xs: "0.75rem",
  sm: "1rem",
  md: "1.25rem",
  lg: "1.5rem",
  xl: "2rem",
} as const;

// ─── Content Widths ──────────────────────────────────────────────────

export interface ContentWidths {
  readonly reading: LengthValue;
  readonly content: LengthValue;
  readonly wide: LengthValue;
  readonly max: LengthValue;
}

export const contentWidth: ContentWidths = {
  reading: "40rem",
  content: "56rem",
  wide: "72rem",
  max: "90rem",
} as const;

// ─── Minimum Touch Target ────────────────────────────────────────────

/** WCAG 2.5.8 minimum touch target (24px) */
export const minTouchTarget: LengthValue = "1.5rem" as const;

/** WCAG 2.5.8 recommended touch target (44px ≈ 2.75rem) */
export const recommendedTouchTarget: LengthValue = "2.75rem" as const;
