/**
 * @kairoui/tokens — Public type contracts.
 *
 * This module re-exports all types intended for public consumption.
 * Internal implementation types are NOT exported here.
 */

// ─── Value Types ─────────────────────────────────────────────────────
export type {
  ColorValue,
  LengthValue,
  DurationValue,
  FontWeightValue,
  ShadowValue,
  EasingValue,
  OpacityValue,
  ZIndexValue,
  BreakpointValue,
  RatioValue,
  FontFamilyValue,
  TokenValue,
} from "./values";

// ─── Reference Types ─────────────────────────────────────────────────
export type {
  LiteralRef,
  PrimitiveRef,
  SemanticRef,
  ComponentRef,
  TokenRef,
  ResolvedToken,
} from "./references";
export { literal, primitiveRef, semanticRef, componentRef } from "./references";

// ─── Primitive Token Contracts ───────────────────────────────────────
export type {
  ColorScaleStep,
  ColorScale,
  PrimitiveColorHue,
  PrimitiveColors,
  SpacingKey,
  PrimitiveSpacing,
  FontSizeKey,
  FontWeightKey,
  LineHeightKey,
  LetterSpacingKey,
  PrimitiveFontSizes,
  PrimitiveFontWeights,
  PrimitiveLineHeights,
  PrimitiveLetterSpacings,
  PrimitiveFontFamilies,
  RadiusKey,
  PrimitiveRadii,
  ShadowKey,
  PrimitiveShadows,
  DurationKey,
  EasingKey,
  PrimitiveDurations,
  PrimitiveEasings,
  ZIndexKey,
  PrimitiveZIndices,
  OpacityKey,
  PrimitiveOpacities,
  BreakpointKey,
  PrimitiveBreakpoints,
  PrimitiveTokens,
} from "./primitives";

// ─── Semantic Token Contracts ────────────────────────────────────────
export type {
  SemanticBackgroundColors,
  SemanticTextColors,
  SemanticBorderColors,
  SemanticInteractiveColors,
  StatusRoles,
  SemanticStatusColors,
  SemanticFocusColors,
  SemanticDestructiveColors,
  SemanticColors,
  TypographyRole,
  NumericTypographyRole,
  SemanticTypography,
  SemanticSpacing,
  SemanticControlHeights,
  SemanticElevation,
  SemanticTokens,
} from "./semantic";

// ─── Component Token Contracts ───────────────────────────────────────
export type {
  InteractionState,
  ButtonTokens,
  InputTokens,
  DialogTokens,
  TabTokens,
  ComponentTokens,
} from "./component";

// ─── Theme Contracts ─────────────────────────────────────────────────
export type {
  ThemeName,
  ThemeDefinition,
  PartialThemeOverride,
  DensityName,
  DensityDefinition,
  PartialDensityOverride,
} from "./theme";

// ─── Validation Contracts ────────────────────────────────────────────
export type {
  ValidationSeverity,
  ValidationErrorCode,
  ValidationError,
  ValidationResult,
  TokenManifest,
  ManifestEntry,
} from "./validation";
