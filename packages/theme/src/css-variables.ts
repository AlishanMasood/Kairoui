import { tokenPathToCssVar } from "@kairoui/tokens";
import type { ResolvedTheme } from "./resolve-theme";

// ─── Types ───────────────────────────────────────────────────────────

/** A CSS variable record with validation results. */
export interface CssVariables {
  readonly variables: Readonly<Record<string, string>>;
  readonly count: number;
  readonly duplicates: readonly CssVariableDuplicate[];
  readonly invalid: readonly CssVariableError[];
}

/** A detected duplicate CSS variable name. */
export interface CssVariableDuplicate {
  readonly name: string;
  readonly paths: readonly string[];
}

/** A detected invalid CSS variable entry. */
export interface CssVariableError {
  readonly name: string;
  readonly path: string;
  readonly message: string;
}

/** Options for CSS variable generation. */
export interface CssVariableOptions {
  readonly filter?: "all" | "theme" | "density";
}

// ─── Helpers ─────────────────────────────────────────────────────────

function flattenTokens(
  obj: unknown,
  prefix: string,
  result: Array<{ path: string; value: string }>,
): void {
  if (obj === null || obj === undefined) return;
  if (typeof obj === "object" && !Array.isArray(obj)) {
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      flattenTokens(value, prefix ? `${prefix}.${key}` : key, result);
    }
    return;
  }
  if (typeof obj === "string" || typeof obj === "number") {
    result.push({ path: prefix, value: String(obj) });
  }
}

const CSS_VAR_NAME_PATTERN = /^--[a-z][a-z0-9-]*$/;

// Theme-only top-level keys (exclude density-controlled keys)
const THEME_KEYS = new Set(["color", "elevation", "interaction", "typography"]);
// Density-controlled top-level keys
const DENSITY_KEYS = new Set(["spacing", "control"]);

// ─── Public API ──────────────────────────────────────────────────────

/**
 * Generate a CSS variable record from a resolved theme.
 *
 * Uses Phase 2 naming rules (`tokenPathToCssVar` from @kairoui/tokens)
 * to produce deterministic, sorted CSS custom property name-value pairs.
 *
 * Detects duplicates and invalid values. Does not mutate the input.
 */
export function generateCssVariables(
  resolved: ResolvedTheme,
  options: CssVariableOptions = {},
): CssVariables {
  const filter = options.filter ?? "all";
  const entries: Array<{ path: string; value: string }> = [];

  const tokens = resolved.tokens;
  for (const [topKey, topValue] of Object.entries(tokens)) {
    if (filter === "theme" && !THEME_KEYS.has(topKey)) continue;
    if (filter === "density" && !DENSITY_KEYS.has(topKey)) continue;
    flattenTokens(topValue, topKey, entries);
  }

  const variables: Record<string, string> = {};
  const duplicates: CssVariableDuplicate[] = [];
  const invalid: CssVariableError[] = [];
  const nameToPath = new Map<string, string[]>();

  for (const entry of entries) {
    const cssName = tokenPathToCssVar(entry.path);

    // Validate the generated CSS variable name
    if (!CSS_VAR_NAME_PATTERN.test(cssName)) {
      invalid.push({
        name: cssName,
        path: entry.path,
        message: `Invalid CSS variable name "${cssName}".`,
      });
      continue;
    }

    // Track duplicates
    const existing = nameToPath.get(cssName);
    if (existing) {
      existing.push(entry.path);
    } else {
      nameToPath.set(cssName, [entry.path]);
    }

    variables[cssName] = entry.value;
  }

  // Collect duplicates
  for (const [name, paths] of nameToPath) {
    if (paths.length > 1) {
      duplicates.push({ name, paths });
    }
  }

  // Sort for deterministic output
  const sorted: Record<string, string> = {};
  for (const key of Object.keys(variables).sort()) {
    sorted[key] = variables[key] ?? "";
  }

  return {
    variables: sorted,
    count: Object.keys(sorted).length,
    duplicates,
    invalid,
  };
}
