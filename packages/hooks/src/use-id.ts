import { useId as useReactId } from "react";

export interface UseIdOptions {
  /** Prefix for the generated ID. Defaults to "kui". */
  prefix?: string;
}

/**
 * SSR-safe ID hook that wraps React's useId.
 *
 * - If `providedId` is defined, it is returned as-is (consumer owns the ID).
 * - If `providedId` is undefined, generates a stable ID using React's useId.
 * - Supports an optional prefix for namespacing.
 * - Deterministic on server and client (no hydration mismatch).
 * - Does not use global counters or random values.
 */
export function useId(providedId?: string, options: UseIdOptions = {}): string {
  const { prefix = "kui" } = options;
  const reactId = useReactId();

  if (providedId != null && providedId !== "") {
    return providedId;
  }

  // React's useId produces IDs like ":r1:" — strip colons and prefix
  const cleaned = reactId.replace(/:/g, "");
  return `${prefix}-${cleaned}`;
}
