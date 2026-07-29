/**
 * Primitive token collection contracts.
 *
 * Primitives are raw design values with no business meaning.
 * They are stable across themes and provide the full palette.
 */

import type {
  BreakpointValue,
  ColorValue,
  DurationValue,
  EasingValue,
  FontFamilyValue,
  FontWeightValue,
  LengthValue,
  OpacityValue,
  RatioValue,
  ShadowValue,
  ZIndexValue,
} from "./values";

// ─── Color Scale ─────────────────────────────────────────────────────

/** Standard color scale steps (50–950) */
export type ColorScaleStep =
  "50" | "100" | "200" | "300" | "400" | "500" | "600" | "700" | "800" | "900" | "950";

/** A complete color scale from 50 to 950 */
export type ColorScale = Record<ColorScaleStep, ColorValue>;

/** Required primitive color hue names */
export type PrimitiveColorHue =
  "neutral" | "blue" | "purple" | "green" | "red" | "orange" | "yellow" | "teal" | "pink";

/** Primitive color collection: all hue scales plus absolute colors */
export interface PrimitiveColors {
  readonly [hue: string]: ColorScale | ColorValue;
  readonly neutral: ColorScale;
  readonly blue: ColorScale;
  readonly purple: ColorScale;
  readonly green: ColorScale;
  readonly red: ColorScale;
  readonly orange: ColorScale;
  readonly yellow: ColorScale;
  readonly teal: ColorScale;
  readonly pink: ColorScale;
  readonly white: ColorValue;
  readonly black: ColorValue;
  readonly transparent: ColorValue;
}

// ─── Spacing ─────────────────────────────────────────────────────────

/** Standard spacing scale keys */
export type SpacingKey =
  | "0"
  | "0.5"
  | "1"
  | "1.5"
  | "2"
  | "2.5"
  | "3"
  | "3.5"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "10"
  | "11"
  | "12"
  | "14"
  | "16"
  | "20"
  | "24"
  | "28"
  | "32"
  | "36"
  | "40"
  | "44"
  | "48"
  | "52"
  | "56"
  | "60"
  | "64"
  | "72"
  | "80"
  | "96";

/** Primitive spacing collection */
export type PrimitiveSpacing = Record<SpacingKey, LengthValue>;

// ─── Typography ──────────────────────────────────────────────────────

/** Font size scale keys */
export type FontSizeKey =
  | "xs"
  | "sm"
  | "base"
  | "lg"
  | "xl"
  | "2xl"
  | "3xl"
  | "4xl"
  | "5xl"
  | "6xl"
  | "7xl"
  | "8xl"
  | "9xl";

/** Font weight keys */
export type FontWeightKey =
  | "thin"
  | "extralight"
  | "light"
  | "normal"
  | "medium"
  | "semibold"
  | "bold"
  | "extrabold"
  | "black";

/** Line height keys */
export type LineHeightKey = "none" | "tight" | "snug" | "normal" | "relaxed" | "loose";

/** Letter spacing keys */
export type LetterSpacingKey = "tighter" | "tight" | "normal" | "wide" | "wider" | "widest";

/** Primitive font size collection */
export type PrimitiveFontSizes = Record<FontSizeKey, LengthValue>;

/** Primitive font weight collection */
export type PrimitiveFontWeights = Record<FontWeightKey, FontWeightValue>;

/** Primitive line height collection */
export type PrimitiveLineHeights = Record<LineHeightKey, RatioValue>;

/** Primitive letter spacing collection */
export type PrimitiveLetterSpacings = Record<LetterSpacingKey, LengthValue>;

/** Primitive font family collection */
export interface PrimitiveFontFamilies {
  readonly sans: FontFamilyValue;
  readonly serif: FontFamilyValue;
  readonly mono: FontFamilyValue;
}

// ─── Radius ──────────────────────────────────────────────────────────

/** Border radius keys */
export type RadiusKey = "none" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "full";

/** Primitive radius collection */
export type PrimitiveRadii = Record<RadiusKey, LengthValue>;

// ─── Shadows ─────────────────────────────────────────────────────────

/** Shadow keys */
export type ShadowKey = "none" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "inner";

/** Primitive shadow collection */
export type PrimitiveShadows = Record<ShadowKey, ShadowValue>;

// ─── Motion ──────────────────────────────────────────────────────────

/** Duration keys */
export type DurationKey = "instant" | "fast" | "normal" | "slow" | "slower";

/** Easing keys */
export type EasingKey = "default" | "linear" | "in" | "out" | "inOut";

/** Primitive duration collection */
export type PrimitiveDurations = Record<DurationKey, DurationValue>;

/** Primitive easing collection */
export type PrimitiveEasings = Record<EasingKey, EasingValue>;

// ─── Z-Index ─────────────────────────────────────────────────────────

/** Z-index layer keys */
export type ZIndexKey = "hide" | "base" | "dropdown" | "sticky" | "overlay" | "modal" | "toast";

/** Primitive z-index collection */
export type PrimitiveZIndices = Record<ZIndexKey, ZIndexValue>;

// ─── Opacity ─────────────────────────────────────────────────────────

/** Opacity keys */
export type OpacityKey =
  "0" | "5" | "10" | "20" | "30" | "40" | "50" | "60" | "70" | "80" | "90" | "95" | "100";

/** Primitive opacity collection */
export type PrimitiveOpacities = Record<OpacityKey, OpacityValue>;

// ─── Breakpoints ─────────────────────────────────────────────────────

/** Breakpoint keys */
export type BreakpointKey = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

/** Primitive breakpoint collection */
export type PrimitiveBreakpoints = Record<BreakpointKey, BreakpointValue>;

// ─── Full Primitive Collection ───────────────────────────────────────

/** Complete primitive token collection */
export interface PrimitiveTokens {
  readonly color: PrimitiveColors;
  readonly spacing: PrimitiveSpacing;
  readonly fontSize: PrimitiveFontSizes;
  readonly fontWeight: PrimitiveFontWeights;
  readonly fontFamily: PrimitiveFontFamilies;
  readonly lineHeight: PrimitiveLineHeights;
  readonly letterSpacing: PrimitiveLetterSpacings;
  readonly radius: PrimitiveRadii;
  readonly shadow: PrimitiveShadows;
  readonly duration: PrimitiveDurations;
  readonly easing: PrimitiveEasings;
  readonly zIndex: PrimitiveZIndices;
  readonly opacity: PrimitiveOpacities;
  readonly breakpoint: PrimitiveBreakpoints;
}
