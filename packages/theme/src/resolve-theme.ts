import type { DensityMode, ResolvedThemeMode, ThemeDefinition } from "./types";

/** Metadata about how a theme was resolved. */
export interface ResolvedThemeMetadata {
  readonly name: string;
  readonly base: ResolvedThemeMode;
  readonly resolvedMode: ResolvedThemeMode;
  readonly density: DensityMode;
  readonly appliedOverrideGroups: readonly string[];
  readonly tokenCount: number;
  readonly warnings: readonly ResolutionWarning[];
}

/** A non-blocking warning encountered during resolution. */
export interface ResolutionWarning {
  readonly path: string;
  readonly message: string;
  readonly type: "unknown_key" | "invalid_value" | "invalid_type";
}

/** The complete result of theme resolution. */
export interface ResolvedTheme {
  readonly tokens: Readonly<Record<string, unknown>>;
  readonly metadata: ResolvedThemeMetadata;
}

/** Options controlling resolution behavior. */
export interface ResolveThemeOptions {
  readonly definition: ThemeDefinition;
  readonly density?: DensityMode;
}

// Lazy-loaded token references to avoid import-time coupling issues
type SemanticTokens = Record<string, unknown>;
type DensityTokens = { spacing: Record<string, unknown>; control: Record<string, unknown> };

interface TokensModule {
  lightTheme: SemanticTokens;
  darkTheme: SemanticTokens;
  densities: Record<string, DensityTokens>;
}

let cachedTokens: TokensModule | null = null;

async function loadTokens(): Promise<TokensModule> {
  if (cachedTokens) return cachedTokens;
  const mod = await import("@kairoui/tokens");
  cachedTokens = {
    lightTheme: mod.lightTheme as unknown as SemanticTokens,
    darkTheme: mod.darkTheme as unknown as SemanticTokens,
    densities: mod.densities as unknown as Record<string, DensityTokens>,
  };
  return cachedTokens;
}

// Synchronous access for environments where tokens are already loaded
function getTokensSync(): TokensModule {
  if (!cachedTokens) {
    throw new Error(
      "Tokens not loaded. Call resolveTheme() (async) or use resolveThemeSync() after initialization.",
    );
  }
  return cachedTokens;
}

function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return [...obj] as unknown as T;
  const clone: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    clone[key] = deepClone((obj as Record<string, unknown>)[key]);
  }
  return clone as T;
}

function deepMerge(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
  warnings: ResolutionWarning[],
  pathPrefix: string,
): Record<string, unknown> {
  const result = { ...target };

  for (const key of Object.keys(source)) {
    const path = pathPrefix ? `${pathPrefix}.${key}` : key;
    const sourceVal = source[key];

    if (!(key in target)) {
      warnings.push({
        path,
        message: `Unknown key "${key}" in override — skipped.`,
        type: "unknown_key",
      });
      continue;
    }

    const targetVal = target[key];

    if (
      typeof sourceVal === "object" &&
      sourceVal !== null &&
      !Array.isArray(sourceVal) &&
      typeof targetVal === "object" &&
      targetVal !== null &&
      !Array.isArray(targetVal)
    ) {
      result[key] = deepMerge(
        targetVal as Record<string, unknown>,
        sourceVal as Record<string, unknown>,
        warnings,
        path,
      );
    } else if (typeof sourceVal === "string" || typeof sourceVal === "number") {
      result[key] = sourceVal;
    } else {
      warnings.push({
        path,
        message: `Invalid override value type "${typeof sourceVal}" — expected string or number.`,
        type: "invalid_value",
      });
    }
  }

  return result;
}

function countLeaves(obj: unknown): number {
  if (obj === null || typeof obj !== "object") return 1;
  let count = 0;
  for (const value of Object.values(obj as Record<string, unknown>)) {
    count += countLeaves(value);
  }
  return count;
}

function applyOverrides(
  base: Record<string, unknown>,
  overrides: Record<string, unknown>,
  warnings: ResolutionWarning[],
): Record<string, unknown> {
  let result = base;

  for (const [groupKey, groupValue] of Object.entries(overrides)) {
    if (typeof groupValue !== "object" || groupValue === null || !(groupKey in result)) {
      if (groupValue !== undefined && !(groupKey in result)) {
        warnings.push({
          path: groupKey,
          message: `Unknown override group "${groupKey}" — skipped.`,
          type: "unknown_key",
        });
      }
      continue;
    }

    const targetSection = result[groupKey];
    if (typeof targetSection === "object" && targetSection !== null) {
      result = {
        ...result,
        [groupKey]: deepMerge(
          targetSection as Record<string, unknown>,
          groupValue as Record<string, unknown>,
          warnings,
          groupKey,
        ),
      };
    }
  }

  return result;
}

function resolveWithTokens(tokens: TokensModule, options: ResolveThemeOptions): ResolvedTheme {
  const { definition, density } = options;
  const effectiveDensity = density ?? definition.defaultDensity;
  const warnings: ResolutionWarning[] = [];

  // 1. Load base theme (deep clone to avoid mutation)
  const baseTheme =
    definition.base === "light" ? deepClone(tokens.lightTheme) : deepClone(tokens.darkTheme);

  let resolved: Record<string, unknown> = baseTheme;

  // 2. Apply density overrides (spacing + control only)
  const densityTokens = tokens.densities[effectiveDensity];
  if (densityTokens) {
    resolved = {
      ...resolved,
      spacing: deepClone(densityTokens.spacing),
      control: deepClone(densityTokens.control),
    };
  }

  // 3. Apply consumer overrides
  const appliedGroups: string[] = [];
  const overrideEntries = definition.overrides as Record<string, unknown>;
  for (const key of Object.keys(overrideEntries)) {
    if (overrideEntries[key] !== undefined) {
      appliedGroups.push(key);
    }
  }
  if (appliedGroups.length > 0) {
    resolved = applyOverrides(resolved, overrideEntries, warnings);
  }

  // 4. Verify no unresolved placeholders
  verifyNoUnresolved(resolved, warnings, "");

  const metadata: ResolvedThemeMetadata = {
    name: definition.name,
    base: definition.base,
    resolvedMode: definition.base,
    density: effectiveDensity,
    appliedOverrideGroups: appliedGroups,
    tokenCount: countLeaves(resolved),
    warnings,
  };

  return { tokens: Object.freeze(resolved), metadata };
}

function verifyNoUnresolved(obj: unknown, warnings: ResolutionWarning[], path: string): void {
  if (obj === null || obj === undefined) {
    warnings.push({
      path,
      message: "Unresolved null/undefined token value.",
      type: "invalid_value",
    });
    return;
  }
  if (typeof obj === "object" && !Array.isArray(obj)) {
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      verifyNoUnresolved(value, warnings, path ? `${path}.${key}` : key);
    }
  }
}

/**
 * Resolve a theme definition into a complete token set.
 *
 * Loads the base theme from `@kairoui/tokens`, applies density overrides,
 * then applies consumer overrides. The result is an immutable, complete
 * token object with resolution metadata.
 */
export async function resolveTheme(options: ResolveThemeOptions): Promise<ResolvedTheme> {
  const tokens = await loadTokens();
  return resolveWithTokens(tokens, options);
}

/**
 * Synchronous resolution for use after `resolveTheme` has been called at least once
 * (which loads and caches the tokens module).
 *
 * Throws if tokens haven't been loaded yet.
 */
export function resolveThemeSync(options: ResolveThemeOptions): ResolvedTheme {
  const tokens = getTokensSync();
  return resolveWithTokens(tokens, options);
}
