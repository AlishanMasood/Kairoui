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
  let count = 0;
  let single: StyleObject | undefined;

  for (const source of sources) {
    if (source == null || Object.keys(source).length === 0) continue;
    count++;
    single = source;
  }

  if (count === 0) return undefined;
  if (count === 1) return single;

  const result: Record<string, unknown> = {};
  for (const source of sources) {
    if (source == null) continue;
    for (const key of Object.keys(source)) {
      result[key] = (source as Record<string, unknown>)[key];
    }
  }

  return result as StyleObject;
}
