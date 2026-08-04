import { useRef, useEffect } from "react";

/**
 * Returns the value from the previous render.
 *
 * Timing:
 * - On first render, returns `undefined` (no previous value exists).
 * - After each commit (useEffect), stores the current value for next render.
 * - SSR-safe: returns undefined on the server (no effect runs).
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);

  useEffect(() => {
    ref.current = value;
  });

  // Reading ref during render is intentional — usePrevious returns stale value by design
  // eslint-disable-next-line react-hooks/refs
  return ref.current;
}

/**
 * Returns a stable ref object whose `.current` always holds the latest value.
 *
 * Timing:
 * - The ref is updated in useEffect (after commit), not during render.
 * - On first render, `.current` is the initial value.
 * - The ref object identity is stable across renders.
 * - SSR-safe: ref is initialized with the value (no effect runs on server).
 */
export function useLatest<T>(value: T): { readonly current: T } {
  const ref = useRef(value);

  useEffect(() => {
    ref.current = value;
  });

  return ref;
}
