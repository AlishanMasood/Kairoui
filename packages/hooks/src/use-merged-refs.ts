import { useRef, useCallback, useEffect } from "react";
import { assignRef } from "@kairoui/utils";
import type { AssignableRef } from "@kairoui/utils";

/**
 * Merges multiple refs into a single stable callback ref.
 * Supports callback refs, object refs, and null/undefined refs.
 * Reuses `assignRef` from @kairoui/utils for assignment logic.
 *
 * The returned callback ref is always stable (same identity).
 * It always assigns to the latest set of refs provided.
 */
export function useMergedRefs<T>(
  ...refs: readonly AssignableRef<T>[]
): (instance: T | null) => void {
  const refsRef = useRef(refs);

  useEffect(() => {
    refsRef.current = refs;
  });

  return useCallback((instance: T | null) => {
    for (const ref of refsRef.current) {
      assignRef(ref, instance);
    }
  }, []);
}
