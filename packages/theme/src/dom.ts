// @kairoui/theme/dom — Browser-specific theme utilities
//
// Exports that require DOM APIs (document, window, matchMedia, localStorage).
// Never imported at module init on the server.

export type { ApplyThemeOptions, ApplyThemeResult } from "./apply-theme";

export { applyTheme, removeTheme, readThemeMode, readDensity } from "./apply-theme";
