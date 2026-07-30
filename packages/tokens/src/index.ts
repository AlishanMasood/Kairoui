// @kairoui/tokens — Entry point

// Naming utilities
export { tokenPathToCssVar, camelToKebab, cssVarToTokenSlug } from "./naming";

// Primitive token values
export { neutral, blue, green, red, orange, teal } from "./primitives";
export { spacing } from "./primitives";
export {
  controlHeight,
  iconSize,
  contentWidth,
  minTouchTarget,
  recommendedTouchTarget,
} from "./primitives";
export type { SizeLabel } from "./primitives";
export { borderWidth, borderStyle, radius, focusRing } from "./primitives";
export type { BorderStyle } from "./primitives";
export { fontFamily, fontSize, fontWeight, lineHeight, letterSpacing } from "./primitives";
export { shadow } from "./primitives";
export { duration, easing } from "./primitives";
export { opacity, zIndex } from "./primitives";
export { breakpoint } from "./primitives";

// Theme definitions
export { lightTheme, darkTheme } from "./themes";

// Density definitions
export { comfortable, standard, compact, densities } from "./density";
export type { DensityTokens } from "./density";

// Shared control tokens
export { sharedControlTokens } from "./controls";
export type {
  SharedControlTokens,
  ControlSizeTokens,
  ControlBorderTokens,
  ControlFocusTokens,
  ControlDisabledTokens,
  ControlReadOnlyTokens,
  ControlLoadingTokens,
  ControlTransitionTokens,
} from "./controls";

// Component token contracts
export { buttonTokens } from "./components";
export type {
  ButtonContract,
  ButtonVariantTokens,
  ButtonStateColors,
  ButtonSizeTokens,
} from "./components";
export { formControlTokens } from "./components";
export type {
  FormControlContracts,
  FormControlStates,
  FormControlStateColors,
  InputContract,
  InputSizeTokens,
  SelectContract,
  CheckboxContract,
  RadioContract,
  SwitchContract,
  FormFieldContract,
} from "./components";

// Theme override utilities
export { resolveTheme } from "./override";
export type {
  PartialSemanticOverride,
  ResolvedThemeResult,
  ThemeOverrideError,
  ResolveThemeOptions,
} from "./override";

// CSS variable generation
export { generateCss, generateThemeCss, generateDensityCss } from "./css";
export type {
  CssDeclaration,
  CssGenerationResult,
  CssGenerationError,
  CssGenerationMetadata,
  GenerateCssOptions,
} from "./css";

// JSON manifest generation
export { flattenToManifest, buildManifest, MANIFEST_SCHEMA_VERSION } from "./manifest";
export type { ManifestToken, TokenManifestJson, GenerateManifestOptions } from "./manifest";

// Public type contracts
export type {
  // Value types
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
  // Reference types
  LiteralRef,
  PrimitiveRef,
  SemanticRef,
  ComponentRef,
  TokenRef,
  ResolvedToken,
  // Primitive contracts
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
  // Semantic contracts
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
  InteractionStateVisuals,
  SemanticInteractionStates,
  SemanticTokens,
  // Component contracts
  InteractionState,
  ButtonTokens,
  InputTokens,
  DialogTokens,
  TabTokens,
  ComponentTokens,
  // Theme contracts
  ThemeName,
  ThemeDefinition,
  PartialThemeOverride,
  DensityName,
  DensityDefinition,
  PartialDensityOverride,
  // Validation contracts
  ValidationSeverity,
  ValidationErrorCode,
  ValidationError,
  ValidationResult,
  TokenManifest,
  ManifestEntry,
} from "./types";

// Reference factory functions
export { literal, primitiveRef, semanticRef, componentRef } from "./types";
