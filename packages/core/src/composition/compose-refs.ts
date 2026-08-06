import { composeRefs, assignRef } from "@kairoui/utils";
import type { AssignableRef } from "@kairoui/utils";

export type { AssignableRef } from "@kairoui/utils";

/** Ref sources for composition-layer merging. */
export interface RefSources<T> {
  /** Consumer-forwarded ref (from React.forwardRef). */
  forwarded?: AssignableRef<T>;
  /** Internal component ref (for measurement, focus, etc.). */
  internal?: AssignableRef<T>;
  /** Future slot ref. */
  slot?: AssignableRef<T>;
  /** Future asChild child ref. */
  child?: AssignableRef<T>;
}

/**
 * Composes refs from multiple composition sources into a single callback ref.
 *
 * Assignment order: forwarded → internal → slot → child
 * All refs receive the element on mount and null on unmount.
 * Null/undefined refs are safely skipped.
 * Errors from callback refs propagate (not swallowed).
 *
 * Returns undefined if all sources are null/undefined (no ref needed).
 */
export function composeComponentRefs<T>(
  sources: RefSources<T>,
): ((instance: T | null) => void) | undefined {
  const refs: AssignableRef<T>[] = [];

  if (sources.forwarded != null) refs.push(sources.forwarded);
  if (sources.internal != null) refs.push(sources.internal);
  if (sources.slot != null) refs.push(sources.slot);
  if (sources.child != null) refs.push(sources.child);

  if (refs.length === 0) return undefined;
  if (refs.length === 1) {
    const single = refs[0];
    return (instance: T | null) => {
      assignRef(single, instance);
    };
  }

  return composeRefs(...refs);
}
