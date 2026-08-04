import { useMediaQuery } from "./use-media-query";

/**
 * Returns true when the user prefers reduced motion.
 *
 * SSR-safe: defaults to false on the server (assume motion is acceptable).
 * Subscribes to system changes and updates reactively.
 *
 * Consumer responsibilities:
 * - Use this to conditionally reduce or remove animations/transitions.
 * - Do not disable ALL motion — subtle, non-decorative motion may still be appropriate.
 * - Apply reduced-motion alternatives (e.g., instant transitions, opacity fades).
 */
export function useReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)", {
    defaultMatches: false,
  });
}
