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
