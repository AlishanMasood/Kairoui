import { useContext, useMemo } from "react";
import { KairoThemeContext, isOutsideProvider } from "./theme-context";
import type { ThemeMode, DensityMode } from "@kairoui/theme";

/** Public return type of the useTheme hook. */
export interface UseThemeResult {
  readonly themeName: string;
  readonly mode: ThemeMode;
  readonly resolvedMode: "light" | "dark";
  readonly density: DensityMode;
  readonly isNested: boolean;
  readonly setMode: (mode: ThemeMode) => void;
  readonly setDensity: (density: DensityMode) => void;
}

/**
 * Access the current KairoUI theme state and controls.
 *
 * Must be used within a `<KairoProvider>`. Throws if called outside.
 */
export function useTheme(): UseThemeResult {
  const ctx = useContext(KairoThemeContext);

  if (isOutsideProvider(ctx)) {
    throw new Error(
      "KairoUI: useTheme() must be used within a <KairoProvider>. " +
        "Wrap your component tree in <KairoProvider> to use theme hooks.",
    );
  }

  return useMemo<UseThemeResult>(
    () => ({
      themeName: ctx.themeName,
      mode: ctx.mode,
      resolvedMode: ctx.resolvedMode,
      density: ctx.density,
      isNested: ctx.isNested,
      setMode: ctx.setMode,
      setDensity: ctx.setDensity,
    }),
    [
      ctx.themeName,
      ctx.mode,
      ctx.resolvedMode,
      ctx.density,
      ctx.isNested,
      ctx.setMode,
      ctx.setDensity,
    ],
  );
}
