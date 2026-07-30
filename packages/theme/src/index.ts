// @kairoui/theme — Entry point
export type {
  ThemeMode,
  ResolvedThemeMode,
  DensityMode,
  ThemePreference,
  ThemeOverrides,
  ThemeDefinition,
  ThemeScope,
  ThemeTarget,
  StorageAdapter,
  ThemeEngine,
  CreateThemeInput,
  ThemeValidationError,
  ThemeValidationResult,
  DeepPartial,
} from "./types";

export { createTheme, validateTheme } from "./create-theme";

export type {
  ResolvedTheme,
  ResolvedThemeMetadata,
  ResolutionWarning,
  ResolveThemeOptions,
} from "./resolve-theme";

export { resolveTheme, resolveThemeSync } from "./resolve-theme";

export type {
  CompositionLayer,
  CompositionMetadata,
  CompositionError,
  CompositionResult,
} from "./compose-themes";

export { composeThemes } from "./compose-themes";

export type { MergeError, MergeResult } from "./merge";

export {
  mergeThemeOverrides,
  mergeColorOverrides,
  mergeTypographyOverrides,
  mergeSpacingOverrides,
  mergeElevationOverrides,
  mergeMetadata,
  applyPartialOverride,
} from "./merge";

export type { ValidationCategory, ValidationDiagnostic, ValidationReport } from "./validate";

export {
  validateThemeDefinition,
  validateOverrides,
  validateResolvedTheme,
  validateThemeName,
  validateBaseMode,
  validateDensityValue,
  THEME_CONSTANTS,
} from "./validate";

export type {
  SerializedTheme,
  SerializedDefinition,
  CssVariableRecord,
  DebugManifest,
} from "./serialize";

export {
  serializeTheme,
  serializeDefinition,
  serializeThemeToJson,
  parseSerializedTheme,
  toCssVariableRecord,
  toDebugManifest,
  THEME_SERIALIZATION_VERSION,
} from "./serialize";
