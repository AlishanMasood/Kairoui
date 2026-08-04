/** Minimal Node-like interface for outside detection — no DOM dependency. */
export interface NodeLike {
  contains?: (other: NodeLike | null) => boolean;
  parentNode?: NodeLike | null;
}

/** Minimal Event-like interface with optional composed path support. */
export interface OutsideEventLike {
  target?: NodeLike | null;
  composedPath?: () => NodeLike[];
}

export interface IsOutsideOptions {
  /** Elements considered "inside". Event targets within these are not outside. */
  insideElements: readonly (NodeLike | null | undefined)[];
  /** Additional elements to exclude from "outside" detection (e.g., portals). */
  excludeElements?: readonly (NodeLike | null | undefined)[];
}

/**
 * Determines if an event target is outside all specified elements.
 *
 * Checks:
 * 1. The event's composed path (Shadow DOM aware) if available.
 * 2. Falls back to `element.contains(target)` for each inside/exclude element.
 * 3. Falls back to walking `parentNode` if `contains` is unavailable.
 * 4. Detached targets (no parent chain reaching an inside element) are outside.
 */
export function isEventOutside(event: OutsideEventLike, options: IsOutsideOptions): boolean {
  const { insideElements, excludeElements = [] } = options;

  const allElements = [...insideElements, ...excludeElements].filter(
    (el): el is NodeLike => el != null,
  );

  if (allElements.length === 0) return true;

  // Try composed path first (Shadow DOM aware)
  if (typeof event.composedPath === "function") {
    const path = event.composedPath();
    for (const pathNode of path) {
      for (const el of allElements) {
        if (pathNode === el) return false;
      }
    }
    // If composed path exists and no match found, it's outside
    if (path.length > 0) return true;
  }

  const target = event.target;
  if (target == null) return true;

  return isNodeOutside(target, allElements);
}

/**
 * Determines if a node is outside all specified elements.
 * Uses `contains` if available, otherwise walks the parent chain.
 */
export function isNodeOutside(node: NodeLike, elements: readonly NodeLike[]): boolean {
  for (const el of elements) {
    if (el === node) return false;
    if (typeof el.contains === "function" && el.contains(node)) return false;
  }

  // Fallback: walk parent chain if contains was not available on any element
  let current: NodeLike | null | undefined = node;
  while (current != null) {
    for (const el of elements) {
      if (current === el) return false;
    }
    current = current.parentNode;
  }

  return true;
}
