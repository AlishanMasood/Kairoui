import { useRef, useCallback, useEffect } from "react";

/**
 * Returns a stable function that reports whether the component is currently mounted.
 *
 * - Returns false before the first commit (SSR-safe).
 * - Returns true after mount.
 * - Returns false after unmount.
 * - The function reference is stable (never changes).
 * - Does not cause re-renders — uses a ref internally.
 *
 * Use this to guard state updates in async callbacks that may resolve
 * after unmount. This is NOT a substitute for proper cleanup (cancel
 * subscriptions, abort controllers, etc.).
 */
export function useIsMounted(): () => boolean {
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return useCallback(() => mountedRef.current, []);
}
