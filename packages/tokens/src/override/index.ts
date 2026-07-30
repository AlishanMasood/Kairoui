/**
 * Theme Override System
 *
 * Framework-independent utilities for applying partial overrides to themes.
 *
 * ## Precedence (lowest to highest)
 *
 * 1. Base theme (light or dark)
 * 2. Selected density overrides (spacing/control only)
 * 3. Consumer semantic overrides (partial color, typography, etc.)
 *
 * ## Guarantees
 *
 * - Base theme is never mutated
 * - Output is always a complete SemanticTokens object
 * - Unknown keys produce validation errors
 * - Deterministic: same inputs always produce same output
 */

import type { SemanticTokens } from "../types/semantic";
import type { DensityTokens } from "../density";

// ─── Types ───────────────────────────────────────────────────────────

/** Deep-partial version of SemanticTokens for consumer overrides */
export type PartialSemanticOverride = DeepPartial<SemanticTokens>;

/** Result of resolving a theme with overrides */
export interface ResolvedThemeResult {
  readonly theme: SemanticTokens;
  readonly errors: readonly ThemeOverrideError[];
}

/** Error produced when an override contains invalid structure */
export interface ThemeOverrideError {
  readonly path: string;
  readonly message: string;
  readonly type: "unknown_key" | "invalid_value" | "invalid_type";
}

/** Options for theme resolution */
export interface ResolveThemeOptions {
  readonly base: SemanticTokens;
  readonly density?: DensityTokens;
  readonly overrides?: PartialSemanticOverride;
}

// ─── Implementation ──────────────────────────────────────────────────

/**
 * Resolve a complete theme by applying density and consumer overrides to a base.
 *
 * - The base theme is never mutated.
 * - Density overrides apply to spacing and control only.
 * - Consumer overrides apply last (highest precedence).
 * - Unknown keys in overrides produce errors but don't block resolution.
 */
export function resolveTheme(options: ResolveThemeOptions): ResolvedThemeResult {
  const { base, density, overrides } = options;
  const errors: ThemeOverrideError[] = [];

  // Start with a deep copy of the base
  let result = deepClone(base);

  // Apply density (spacing + control only)
  if (density) {
    result = {
      ...result,
      spacing: deepClone(density.spacing),
      control: deepClone(density.control),
    };
  }

  // Apply consumer overrides
  if (overrides) {
    result = deepMergeWithValidation(result, overrides, errors, "");
  }

  return { theme: result, errors };
}

// ─── Internal Utilities ──────────────────────────────────────────────

function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return [...obj] as unknown as T;
  const clone = {} as Record<string, unknown>;
  for (const key of Object.keys(obj)) {
    clone[key] = deepClone((obj as Record<string, unknown>)[key]);
  }
  return clone as T;
}

function deepMergeWithValidation<T extends object>(
  target: T,
  source: object,
  errors: ThemeOverrideError[],
  pathPrefix: string,
): T {
  const result = { ...target } as Record<string, unknown>;

  for (const key of Object.keys(source)) {
    const path = pathPrefix ? `${pathPrefix}.${key}` : key;
    const sourceVal = (source as Record<string, unknown>)[key];

    // Check for unknown keys
    if (!(key in target)) {
      errors.push({
        path,
        message: `Unknown key "${key}" in override`,
        type: "unknown_key",
      });
      continue;
    }

    const targetVal = (target as Record<string, unknown>)[key];

    // Both objects: recurse
    if (
      typeof sourceVal === "object" &&
      sourceVal !== null &&
      typeof targetVal === "object" &&
      targetVal !== null &&
      !Array.isArray(sourceVal)
    ) {
      result[key] = deepMergeWithValidation(targetVal, sourceVal, errors, path);
    } else if (
      typeof sourceVal === typeof targetVal ||
      typeof sourceVal === "string" ||
      typeof sourceVal === "number"
    ) {
      // Leaf value override
      result[key] = sourceVal;
    } else {
      errors.push({
        path,
        message: `Invalid type: expected ${typeof targetVal}, got ${typeof sourceVal}`,
        type: "invalid_type",
      });
    }
  }

  return result as T;
}

// ─── Utility Type ────────────────────────────────────────────────────

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};
