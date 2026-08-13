import type { RegisteredItem } from "./use-collection";
import type { NavigationDirection } from "./collection-types";

/**
 * Resolves the next item to highlight given a direction and current highlight.
 * Skips disabled items. Wraps around at boundaries.
 */
export function resolveNextItem(
  items: readonly RegisteredItem[],
  currentValue: string | undefined,
  direction: NavigationDirection,
): RegisteredItem | undefined {
  const enabled = items.filter((i) => !i.disabled);
  if (enabled.length === 0) return undefined;

  if (direction === "first") return enabled[0];
  if (direction === "last") return enabled[enabled.length - 1];

  if (currentValue === undefined) {
    return direction === "next" ? enabled[0] : enabled[enabled.length - 1];
  }

  const currentIndex = enabled.findIndex((i) => i.value === currentValue);
  if (currentIndex === -1) {
    return enabled[0];
  }

  if (direction === "next") {
    const nextIndex = (currentIndex + 1) % enabled.length;
    return enabled[nextIndex];
  }

  // previous
  const prevIndex = (currentIndex - 1 + enabled.length) % enabled.length;
  return enabled[prevIndex];
}
