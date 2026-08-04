import { useSyncExternalStore, useCallback } from "react";
import { canUseDOM } from "@kairoui/utils";

export interface UseMediaQueryOptions {
  /** Value to return on the server or when matchMedia is unavailable. Defaults to false. */
  defaultMatches?: boolean;
}

/**
 * SSR-safe hook that subscribes to a CSS media query.
 *
 * - Returns `defaultMatches` on the server (no matchMedia available).
 * - Uses useSyncExternalStore for tear-free reads.
 * - Cleans up subscription on unmount or query change.
 * - Does not access `window` during import.
 */
export function useMediaQuery(query: string, options: UseMediaQueryOptions = {}): boolean {
  const { defaultMatches = false } = options;

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (!canUseDOM() || typeof window.matchMedia !== "function") return () => {};
      const mql = window.matchMedia(query);

      if (typeof mql.addEventListener === "function") {
        mql.addEventListener("change", onStoreChange);
        return () => {
          mql.removeEventListener("change", onStoreChange);
        };
      }

      // Legacy fallback
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      mql.addListener(onStoreChange);
      return () => {
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        mql.removeListener(onStoreChange);
      };
    },
    [query],
  );

  const getSnapshot = useCallback((): boolean => {
    if (!canUseDOM() || typeof window.matchMedia !== "function") return defaultMatches;
    return window.matchMedia(query).matches;
  }, [query, defaultMatches]);

  const getServerSnapshot = useCallback((): boolean => {
    return defaultMatches;
  }, [defaultMatches]);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
