import { useContext, useState, useEffect, useRef } from "react";
import { KairoThemeContext, isOutsideProvider } from "./theme-context";
import type { ResolvedTheme } from "@kairoui/theme";
import { resolveTheme, createTheme } from "@kairoui/theme";

/**
 * Access the fully resolved theme token set.
 *
 * Returns `null` while the initial resolution is in progress, then the
 * complete `ResolvedTheme` object. The reference is stable and only updates
 * when mode, density, or theme definition changes.
 *
 * **Performance note:** For ordinary component styling, use CSS custom
 * variables (which are already applied to the DOM). This hook is intended
 * for cases where JavaScript needs programmatic access to resolved token
 * values — e.g. canvas rendering, chart libraries, or dynamic calculations.
 *
 * Must be used within a `<KairoProvider>`.
 */
export function useResolvedTheme(): ResolvedTheme | null {
  const ctx = useContext(KairoThemeContext);

  if (isOutsideProvider(ctx)) {
    throw new Error(
      "KairoUI: useResolvedTheme() must be used within a <KairoProvider>. " +
        "Wrap your component tree in <KairoProvider> to use theme hooks.",
    );
  }

  const { resolvedMode, density, definition } = ctx;
  const [resolved, setResolved] = useState<ResolvedTheme | null>(null);

  // Cache key to avoid redundant resolution
  const cacheKeyRef = useRef("");

  useEffect(() => {
    const key = `${resolvedMode}:${density}:${definition?.name ?? ""}`;
    if (key === cacheKeyRef.current) return;
    cacheKeyRef.current = key;

    let cancelled = false;

    const def = definition ?? createTheme({ name: "default", base: resolvedMode });

    void resolveTheme({ definition: def, density }).then((result) => {
      if (!cancelled) {
        setResolved(result);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [resolvedMode, density, definition]);

  return resolved;
}
