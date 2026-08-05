import { cx } from "@kairoui/utils";
import type { ClassValue } from "@kairoui/utils";

/**
 * Merges class names from multiple composition sources in deterministic order.
 *
 * Source order (stable, left to right):
 * 1. Base classes (component structural classes)
 * 2. State classes (data-state driven)
 * 3. Variant classes (future variant engine output)
 * 4. Theme classes (theme-derived classes)
 * 5. Internal classes (component-internal behavior)
 * 6. Consumer classes (from root props)
 * 7. Slot classes (from slot configuration)
 * 8. Child classes (future asChild child element classes)
 *
 * Duplicates are preserved (not deduplicated). Rationale:
 * - CSS specificity is not affected by duplicate class names.
 * - Deduplication adds runtime cost with no user-visible benefit.
 * - Tools like Tailwind rely on class order, not uniqueness.
 *
 * Falsy values (null, undefined, false, "") are skipped.
 * Empty output returns "".
 */
export function mergeClassNames(...sources: readonly ClassValue[]): string {
  return cx(...sources);
}

/** Named sources for clarity in component implementations. */
export interface ClassNameSources {
  base?: ClassValue;
  state?: ClassValue;
  variants?: ClassValue;
  theme?: ClassValue;
  internal?: ClassValue;
  consumer?: ClassValue;
  slot?: ClassValue;
  child?: ClassValue;
}

/**
 * Merges class names from named sources in the approved composition order.
 * More readable than positional arguments for complex components.
 */
export function mergeClassNameSources(sources: ClassNameSources): string {
  return cx(
    sources.base,
    sources.state,
    sources.variants,
    sources.theme,
    sources.internal,
    sources.consumer,
    sources.slot,
    sources.child,
  );
}
