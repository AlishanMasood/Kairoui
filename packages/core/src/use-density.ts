import { useContext, useMemo } from "react";
import { KairoThemeContext, isOutsideProvider } from "./theme-context";
import type { DensityMode } from "@kairoui/theme";

/** Return type of the useDensity hook. */
export interface UseDensityResult {
  readonly density: DensityMode;
  readonly setDensity: (density: DensityMode) => void;
}

/**
 * Access and control the current density mode.
 *
 * Must be used within a `<KairoProvider>`.
 */
export function useDensity(): UseDensityResult {
  const ctx = useContext(KairoThemeContext);

  if (isOutsideProvider(ctx)) {
    throw new Error(
      "KairoUI: useDensity() must be used within a <KairoProvider>. " +
        "Wrap your component tree in <KairoProvider> to use theme hooks.",
    );
  }

  const { density, setDensity } = ctx;

  return useMemo<UseDensityResult>(() => ({ density, setDensity }), [density, setDensity]);
}
