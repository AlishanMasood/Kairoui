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

export {
  THEME_ATTRIBUTE,
  DENSITY_ATTRIBUTE,
  THEME_DATASET_KEY,
  DENSITY_DATASET_KEY,
  themeSelector,
  densitySelector,
  ROOT_THEME_SELECTOR,
  DARK_THEME_SELECTOR,
  VALID_THEME_VALUES,
  VALID_DENSITY_VALUES,
} from "./selectors";

export type {
  CssVariables,
  CssVariableDuplicate,
  CssVariableError,
  CssVariableOptions,
} from "./css-variables";

export { generateCssVariables } from "./css-variables";

export type { PreferenceSource, TrackedPreference, VersionedPreference } from "./preference";

export {
  validateMode,
  validateDensity,
  validateResolvedMode,
  isValidPreference,
  parsePreference,
  parseVersionedPreference,
  toVersionedPreference,
  coercePreference,
  DEFAULT_PREFERENCE,
  PREFERENCE_VERSION,
} from "./preference";

export type { ThemeStorageAdapter, MemoryAdapterOptions } from "./storage";

export { createMemoryAdapter, noopStorageAdapter } from "./storage";

export type {
  ResolutionInputs,
  ResolvedPreference,
  PreferenceResolutionWarning,
} from "./resolve-preference";

export { resolvePreference } from "./resolve-preference";
