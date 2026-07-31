// @kairoui/core — Entry point
export type { KairoThemeContextValue, InternalThemeContextValue } from "./theme-context";

export { KairoThemeContext, isOutsideProvider } from "./theme-context";

export type { KairoProviderProps, ThemeTarget, ServerState } from "./kairo-provider";

export { KairoProvider } from "./kairo-provider";

export type { KairoScopeProviderProps } from "./kairo-scope-provider";

export { KairoScopeProvider } from "./kairo-scope-provider";

export type { UseThemeResult } from "./use-theme";

export { useTheme } from "./use-theme";

export type { UseThemeModeResult } from "./use-theme-mode";

export { useThemeMode } from "./use-theme-mode";

export type { UseDensityResult } from "./use-density";

export { useDensity } from "./use-density";

export { useResolvedTheme } from "./use-resolved-theme";

export type { UseSystemColorSchemeOptions } from "./use-system-color-scheme";

export { useSystemColorScheme } from "./use-system-color-scheme";

export {
  useThemeName,
  useRequestedMode,
  useResolvedMode,
  useCurrentDensity,
  useIsNested,
  useIsSystemMode,
} from "./selectors";
