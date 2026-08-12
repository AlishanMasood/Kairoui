import type { CSSProperties } from "react";

/** Style object supporting both React CSS properties and CSS custom properties. */
export type StyleObject = CSSProperties & Record<`--${string}`, string | number>;

/** A style source that may be undefined or a style object. */
export type StyleSource = StyleObject | undefined | null;

/**
 * Merges multiple style objects with later sources overriding earlier ones (per-property).
 *
 * Precedence (left to right, later wins per-property):
 * 1. Internal base styles
 * 2. State-derived styles
 * 3. Theme-derived inline styles
 * 4. Consumer root styles
 * 5. Slot styles
 * 6. Child styles (future asChild)
 *
 * - Shallow merge only (no deep nesting).
 * - CSS custom properties (--*) are preserved from all sources.
 * - Inputs are never mutated.
 * - Returns undefined if all sources are empty/undefined (avoids empty object allocation).
 * - Returns the single source directly if only one is non-empty (no unnecessary copy).
 */
export function mergeStyles(...sources: readonly StyleSource[]): StyleObject | undefined {
  let result: Record<string, unknown> | undefined;
  let single: StyleObject | undefined;
  let count = 0;

  for (const source of sources) {
    if (source == null) continue;
    let hasKeys = false;
    for (const key in source) {
      if (!Object.prototype.hasOwnProperty.call(source, key)) continue;
      hasKeys = true;
      if (count >= 1) {
        if (!result) result = { ...(single as Record<string, unknown>) };
        result[key] = (source as Record<string, unknown>)[key];
      }
    }
    if (hasKeys) {
      if (count === 0) single = source;
      count++;
    }
  }

  if (count === 0) return undefined;
  if (count === 1) return single;
  return result as StyleObject;
}
