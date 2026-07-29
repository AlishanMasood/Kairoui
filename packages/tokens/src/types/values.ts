/**
 * Token value types.
 *
 * These represent the resolved CSS-compatible values that tokens ultimately hold.
 * They are intentionally string-branded to prevent accidental mixing of incompatible units.
 */

/** A CSS color value (hex, rgb, hsl, oklch, etc.) */
export type ColorValue = string & { readonly __brand?: "color" };

/** A CSS length value (px, rem, em, etc.) */
export type LengthValue = string & { readonly __brand?: "length" };

/** A CSS duration value (ms, s) */
export type DurationValue = string & { readonly __brand?: "duration" };

/** A CSS font-weight value (numeric 100-900 or keyword) */
export type FontWeightValue = number | (string & { readonly __brand?: "fontWeight" });

/** A CSS shadow value (box-shadow or drop-shadow) */
export type ShadowValue = string & { readonly __brand?: "shadow" };

/** A CSS easing function (cubic-bezier, linear, ease, etc.) */
export type EasingValue = string & { readonly __brand?: "easing" };

/** A CSS opacity value (0-1 as string) */
export type OpacityValue = string & { readonly __brand?: "opacity" };

/** A numeric z-index value */
export type ZIndexValue = number;

/** A CSS breakpoint value (px or em) */
export type BreakpointValue = string & { readonly __brand?: "breakpoint" };

/** A unitless numeric scale value (e.g., line-height ratio) */
export type RatioValue = number | string;

/** A font-family stack */
export type FontFamilyValue = string & { readonly __brand?: "fontFamily" };

/** Union of all possible resolved token values */
export type TokenValue =
  | ColorValue
  | LengthValue
  | DurationValue
  | FontWeightValue
  | ShadowValue
  | EasingValue
  | OpacityValue
  | ZIndexValue
  | BreakpointValue
  | RatioValue
  | FontFamilyValue;
