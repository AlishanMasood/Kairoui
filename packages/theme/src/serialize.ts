import type { ResolvedTheme, ResolvedThemeMetadata } from "./resolve-theme";
import type { ThemeDefinition } from "./types";

// ─── Types ───────────────────────────────────────────────────────────

/** Schema version for serialized theme output. */
export const THEME_SERIALIZATION_VERSION = "1.0.0" as const;

/** Serialized theme JSON structure. */
export interface SerializedTheme {
  readonly $schema: string;
  readonly version: typeof THEME_SERIALIZATION_VERSION;
  readonly name: string;
  readonly base: string;
  readonly density: string;
  readonly tokenCount: number;
  readonly tokens: Record<string, unknown>;
  readonly metadata: Omit<ResolvedThemeMetadata, "warnings">;
}

/** Serialized theme definition (unresolved). */
export interface SerializedDefinition {
  readonly $schema: string;
  readonly version: typeof THEME_SERIALIZATION_VERSION;
  readonly definition: {
    readonly name: string;
    readonly base: string;
    readonly description: string;
    readonly defaultDensity: string;
    readonly overrides: Record<string, unknown>;
    readonly metadata: Record<string, string>;
  };
}

/** CSS variable record: maps token paths to CSS variable declarations. */
export interface CssVariableRecord {
  readonly variables: Readonly<Record<string, string>>;
  readonly count: number;
}

/** Debug manifest for development inspection. */
export interface DebugManifest {
  readonly version: typeof THEME_SERIALIZATION_VERSION;
  readonly name: string;
  readonly base: string;
  readonly density: string;
  readonly tokenCount: number;
  readonly overrideGroups: readonly string[];
  readonly warnings: readonly { path: string; message: string }[];
  readonly tokenPaths: readonly string[];
}

// ─── Helpers ─────────────────────────────────────────────────────────

function sortKeys(obj: unknown): unknown {
  if (obj === null || typeof obj !== "object" || Array.isArray(obj)) return obj;
  const sorted: Record<string, unknown> = {};
  const record = obj as Record<string, unknown>;
  for (const key of Object.keys(record).sort()) {
    sorted[key] = sortKeys(record[key]);
  }
  return sorted;
}

function collectPaths(obj: unknown, prefix: string, paths: string[]): void {
  if (obj === null || typeof obj !== "object" || Array.isArray(obj)) {
    paths.push(prefix);
    return;
  }
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    collectPaths(value, prefix ? `${prefix}.${key}` : key, paths);
  }
}

function flattenToCssVars(obj: unknown, prefix: string, result: Record<string, string>): void {
  if (obj === null || typeof obj !== "object" || Array.isArray(obj)) {
    if (typeof obj === "string" || typeof obj === "number") {
      result[`--kui-${prefix}`] = String(obj);
    }
    return;
  }
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const segment = key.replace(/([A-Z])/g, "-$1").toLowerCase();
    flattenToCssVars(value, prefix ? `${prefix}-${segment}` : segment, result);
  }
}

// ─── Public API ──────────────────────────────────────────────────────

/**
 * Serialize a resolved theme to a stable JSON-compatible object.
 * Property ordering is deterministic (sorted keys).
 */
export function serializeTheme(resolved: ResolvedTheme): SerializedTheme {
  const sorted = sortKeys(resolved.tokens) as Record<string, unknown>;
  return {
    $schema: `https://kairoui.dev/schemas/theme/${THEME_SERIALIZATION_VERSION}.json`,
    version: THEME_SERIALIZATION_VERSION,
    name: resolved.metadata.name,
    base: resolved.metadata.base,
    density: resolved.metadata.density,
    tokenCount: resolved.metadata.tokenCount,
    tokens: sorted,
    metadata: {
      name: resolved.metadata.name,
      base: resolved.metadata.base,
      resolvedMode: resolved.metadata.resolvedMode,
      density: resolved.metadata.density,
      appliedOverrideGroups: resolved.metadata.appliedOverrideGroups,
      tokenCount: resolved.metadata.tokenCount,
    },
  };
}

/**
 * Serialize a theme definition (unresolved) to a stable JSON object.
 */
export function serializeDefinition(definition: ThemeDefinition): SerializedDefinition {
  return {
    $schema: `https://kairoui.dev/schemas/theme-definition/${THEME_SERIALIZATION_VERSION}.json`,
    version: THEME_SERIALIZATION_VERSION,
    definition: {
      name: definition.name,
      base: definition.base,
      description: definition.description,
      defaultDensity: definition.defaultDensity,
      overrides: sortKeys(definition.overrides) as Record<string, unknown>,
      metadata: { ...definition.metadata },
    },
  };
}

/**
 * Convert a resolved theme to a deterministic JSON string.
 * Stable across repeated calls with the same input.
 */
export function serializeThemeToJson(resolved: ResolvedTheme): string {
  const serialized = serializeTheme(resolved);
  return JSON.stringify(serialized, null, 2);
}

/**
 * Parse a serialized theme JSON string back into a SerializedTheme object.
 * Validates the schema version.
 */
export function parseSerializedTheme(json: string): SerializedTheme {
  const parsed: unknown = JSON.parse(json);
  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("Invalid serialized theme: not an object.");
  }
  const obj = parsed as Record<string, unknown>;
  if (obj["version"] !== THEME_SERIALIZATION_VERSION) {
    throw new Error(
      `Unsupported schema version "${String(obj["version"])}". Expected "${THEME_SERIALIZATION_VERSION}".`,
    );
  }
  return obj as unknown as SerializedTheme;
}

/**
 * Extract CSS variable records from a resolved theme.
 * Each token path is converted to a CSS custom property name.
 */
export function toCssVariableRecord(resolved: ResolvedTheme): CssVariableRecord {
  const variables: Record<string, string> = {};
  flattenToCssVars(resolved.tokens, "", variables);
  const sorted: Record<string, string> = {};
  for (const key of Object.keys(variables).sort()) {
    const val = variables[key];
    if (val !== undefined) sorted[key] = val;
  }
  return { variables: sorted, count: Object.keys(sorted).length };
}

/**
 * Generate a debug manifest for development inspection.
 * Includes all token paths and warnings.
 */
export function toDebugManifest(resolved: ResolvedTheme): DebugManifest {
  const paths: string[] = [];
  collectPaths(resolved.tokens, "", paths);
  paths.sort();

  return {
    version: THEME_SERIALIZATION_VERSION,
    name: resolved.metadata.name,
    base: resolved.metadata.base,
    density: resolved.metadata.density,
    tokenCount: resolved.metadata.tokenCount,
    overrideGroups: [...resolved.metadata.appliedOverrideGroups],
    warnings: resolved.metadata.warnings.map((w) => ({
      path: w.path,
      message: w.message,
    })),
    tokenPaths: paths,
  };
}
