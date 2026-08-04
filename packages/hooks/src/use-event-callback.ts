import { useRef, useCallback, useEffect } from "react";

/**
 * Returns a stable function reference that always invokes the latest callback.
 *
 * Use this when you need to pass a callback to a child component or event listener
 * without causing re-renders due to identity changes, while always calling the
 * latest implementation (no stale closures).
 *
 * Note: `useStableCallback` and `useEventCallback` are the same concept.
 * We expose only `useEventCallback` to avoid duplicate APIs.
 * The name "event callback" communicates that the function should not be called
 * during render — only in event handlers, effects, or timeouts.
 *
 * SSR-safe: the returned function is stable but should not be called during SSR render.
 * Errors from the callback propagate — not swallowed.
 */
export function useEventCallback<T extends (...args: never[]) => unknown>(
  callback: T | undefined,
): (...args: Parameters<T>) => ReturnType<T> | undefined {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  });

  // Stable function that delegates to the latest callback
  return useCallback((...args: Parameters<T>): ReturnType<T> | undefined => {
    const fn = callbackRef.current;
    if (fn == null) return undefined;
    return fn(...args) as ReturnType<T>;
  }, []);
}
