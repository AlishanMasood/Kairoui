import { useContext, useCallback, useMemo } from "react";
import { KairoThemeContext, isOutsideProvider } from "./theme-context";
import type { ThemeMode, ResolvedThemeMode } from "@kairoui/theme";

/** Return type of the useThemeMode hook. */
export interface UseThemeModeResult {
  readonly mode: ThemeMode;
  readonly resolvedMode: ResolvedThemeMode;
  readonly setMode: (mode: ThemeMode) => void;
  /** Toggle between light and dark. When current mode is "system", switches to explicit dark or light based on the resolved mode. */
  readonly toggleMode: () => void;
}

/**
 * Access and control the current theme mode.
 *
 * Toggle behavior:
 * - "light" → "dark"
 * - "dark" → "light"
 * - "system" → switches to the opposite of the current resolved mode
 *   (e.g., if system resolved to "light", toggle sets "dark")
 *
 * Must be used within a `<KairoProvider>`.
 */
export function useThemeMode(): UseThemeModeResult {
  const ctx = useContext(KairoThemeContext);

  if (isOutsideProvider(ctx)) {
    throw new Error(
      "KairoUI: useThemeMode() must be used within a <KairoProvider>. " +
        "Wrap your component tree in <KairoProvider> to use theme hooks.",
    );
  }

  const { mode, resolvedMode, setMode } = ctx;

  const toggleMode = useCallback(() => {
    if (mode === "light") {
      setMode("dark");
    } else if (mode === "dark") {
      setMode("light");
    } else {
      // mode === "system": toggle to the opposite of resolved
      setMode(resolvedMode === "light" ? "dark" : "light");
    }
  }, [mode, resolvedMode, setMode]);

  return useMemo<UseThemeModeResult>(
    () => ({ mode, resolvedMode, setMode, toggleMode }),
    [mode, resolvedMode, setMode, toggleMode],
  );
}
