// @kairoui/theme/dom — Browser-specific theme utilities
//
// Exports that require DOM APIs (document, window, matchMedia, localStorage).
// Never imported at module init on the server.

export type { ApplyThemeOptions, ApplyThemeResult } from "./apply-theme";

export { applyTheme, removeTheme, readThemeMode, readDensity } from "./apply-theme";

export type { ScopedThemeOptions, ScopedThemeResult } from "./scoped-theme";

export { applyScopedTheme, removeScopedTheme } from "./scoped-theme";

export type { CleanupResult } from "./cleanup";

export {
  trackAttribute,
  trackCssProperty,
  untrackCssProperty,
  cleanupTheme,
  hasThemeState,
  getManagedProperties,
  getManagedAttributes,
} from "./cleanup";

export type {
  ColorSchemeListener,
  ColorSchemeSubscription,
  MatchMediaProvider,
  ColorSchemeDetectorOptions,
} from "./system-color-scheme";

export {
  getSystemColorScheme,
  isColorSchemeSupported,
  subscribeToColorScheme,
} from "./system-color-scheme";

export type { ThemeStorageAdapter, LocalStorageAdapterOptions } from "./storage";

export { createLocalStorageAdapter } from "./storage";
