import type { ThemeDefinition, DensityMode, ThemeOverrides } from "./types";

// ─── Types ───────────────────────────────────────────────────────────

/** Result of inspecting a theme definition. */
export interface ThemeInspectionReport {
  readonly name: string;
  readonly base: string;
  readonly description: string;
  readonly defaultDensity: DensityMode;
  readonly overrideGroups: readonly string[];
  readonly overrideCount: number;
  readonly metadataKeys: readonly string[];
  readonly warnings: readonly string[];
}

/** Result of inspecting a resolved theme. */
export interface ResolvedThemeInspectionReport {
  readonly name: string;
  readonly base: string;
  readonly resolvedMode: string;
  readonly density: DensityMode;
  readonly tokenCount: number;
  readonly tokenGroups: readonly string[];
  readonly warnings: readonly string[];
}

// ─── Helpers ─────────────────────────────────────────────────────────

function countLeaves(obj: unknown, depth = 0): number {
  if (depth > 20) return 0;
  if (obj === null || typeof obj !== "object" || Array.isArray(obj)) return 1;
  let count = 0;
  for (const value of Object.values(obj as Record<string, unknown>)) {
    count += countLeaves(value, depth + 1);
  }
  return count;
}

function getOverrideGroups(overrides: ThemeOverrides): string[] {
  const groups: string[] = [];
  const rec = overrides as unknown as Record<string, unknown>;
  for (const key of Object.keys(rec)) {
    if (rec[key] !== undefined && typeof rec[key] === "object" && rec[key] !== null) {
      groups.push(key);
    }
  }
  return groups.sort();
}

function countOverrideLeaves(overrides: ThemeOverrides): number {
  return countLeaves(overrides) - 1; // subtract the root object itself
}

// ─── Public API ──────────────────────────────────────────────────────

/**
 * Inspect a theme definition and produce a structured report.
 *
 * Does not resolve the theme or access any external APIs.
 * Safe for development logging. Deterministic output.
 */
export function inspectTheme(definition: ThemeDefinition): ThemeInspectionReport {
  const warnings: string[] = [];

  if (!definition.name) {
    warnings.push("Theme has no name.");
  }

  if (!definition.description) {
    warnings.push("Theme has no description.");
  }

  const overrideGroups = getOverrideGroups(definition.overrides);
  const overrideCount = overrideGroups.length > 0 ? countOverrideLeaves(definition.overrides) : 0;

  return {
    name: definition.name,
    base: definition.base,
    description: definition.description,
    defaultDensity: definition.defaultDensity,
    overrideGroups,
    overrideCount,
    metadataKeys: Object.keys(definition.metadata).sort(),
    warnings,
  };
}

/**
 * Inspect a resolved theme (token object + metadata) and produce a report.
 *
 * Accepts the shape returned by `resolveTheme()`.
 */
export function inspectResolvedTheme(resolved: {
  tokens: Readonly<Record<string, unknown>>;
  metadata: {
    name: string;
    base: string;
    resolvedMode: string;
    density: DensityMode;
    tokenCount: number;
    warnings: readonly { path: string; message: string }[];
  };
}): ResolvedThemeInspectionReport {
  const warnings: string[] = resolved.metadata.warnings.map((w) => `${w.path}: ${w.message}`);

  return {
    name: resolved.metadata.name,
    base: resolved.metadata.base,
    resolvedMode: resolved.metadata.resolvedMode,
    density: resolved.metadata.density,
    tokenCount: resolved.metadata.tokenCount,
    tokenGroups: Object.keys(resolved.tokens).sort(),
    warnings,
  };
}
