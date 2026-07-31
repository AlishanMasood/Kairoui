import { useSyncExternalStore } from "react";
import type { ResolvedThemeMode } from "@kairoui/theme";

/** Options for the useSystemColorScheme hook. */
export interface UseSystemColorSchemeOptions {
  /** Value returned during SSR or when matchMedia is unavailable. */
  readonly serverFallback?: ResolvedThemeMode;
}

const isBrowser = typeof window !== "undefined";
const DARK_QUERY = "(prefers-color-scheme: dark)";

function getSnapshot(): ResolvedThemeMode {
  try {
    return window.matchMedia(DARK_QUERY).matches ? "dark" : "light";
  } catch {
    return "light";
  }
}

/**
 * Subscribe to the operating system's color scheme preference.
 *
 * Returns `"light"` or `"dark"` based on `prefers-color-scheme`.
 * Updates reactively when the OS preference changes.
 *
 * SSR-safe: returns the `serverFallback` (default: `"light"`) during
 * server rendering. Uses `useSyncExternalStore` for hydration safety.
 *
 * This hook does NOT require `<KairoProvider>` — it can be used standalone.
 */
export function useSystemColorScheme(options: UseSystemColorSchemeOptions = {}): ResolvedThemeMode {
  const fallback = options.serverFallback ?? "light";

  if (!isBrowser) return fallback;

  // useSyncExternalStore ensures no hydration mismatch and proper subscription
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useSyncExternalStore(subscribeToMediaQuery, getSnapshot, () => fallback);
}

function subscribeToMediaQuery(onStoreChange: () => void): () => void {
  let mql: MediaQueryList;
  try {
    mql = window.matchMedia(DARK_QUERY);
  } catch {
    return () => {};
  }

  const handler = () => {
    onStoreChange();
  };

  mql.addEventListener("change", handler);
  return () => {
    mql.removeEventListener("change", handler);
  };
}
