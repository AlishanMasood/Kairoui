import { useContext } from "react";
import { KairoThemeContext, isOutsideProvider } from "./theme-context";
import type { ThemeMode, ResolvedThemeMode, DensityMode } from "@kairoui/theme";

function useThemeContext() {
  const ctx = useContext(KairoThemeContext);
  if (isOutsideProvider(ctx)) {
    throw new Error("KairoUI: Theme selector hooks must be used within a <KairoProvider>.");
  }
  return ctx;
}

/** Returns only the theme name. */
export function useThemeName(): string {
  return useThemeContext().themeName;
}

/** Returns only the requested mode ("light" | "dark" | "system"). */
export function useRequestedMode(): ThemeMode {
  return useThemeContext().mode;
}

/** Returns only the resolved mode ("light" | "dark"). */
export function useResolvedMode(): ResolvedThemeMode {
  return useThemeContext().resolvedMode;
}

/** Returns only the density. */
export function useCurrentDensity(): DensityMode {
  return useThemeContext().density;
}

/** Returns whether the current provider is a nested scope. */
export function useIsNested(): boolean {
  return useThemeContext().isNested;
}

/** Returns whether the requested mode is "system". */
export function useIsSystemMode(): boolean {
  return useThemeContext().mode === "system";
}
