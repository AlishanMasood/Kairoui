/**
 * JSON Token Manifest Generator
 *
 * Produces a machine-readable JSON manifest of all tokens.
 * Consumers: documentation, Storybook visualization, Figma tooling,
 * theme editors, framework adapters.
 */

import { tokenPathToCssVar } from "../naming";

// ─── Manifest Schema ────────────────────────────────────────────────

/** Schema version — increment on breaking changes to manifest structure */
export const MANIFEST_SCHEMA_VERSION = "1.0.0";

export interface ManifestToken {
  readonly path: string;
  readonly cssVariable: string;
  readonly layer: "primitive" | "semantic" | "density";
  readonly category: string;
  readonly value: string;
  readonly themes?: readonly string[];
  readonly densityApplicable?: boolean;
  readonly deprecated?: boolean;
}

export interface TokenManifestJson {
  readonly $schema: string;
  readonly version: string;
  readonly generatedAt: string;
  readonly themes: readonly string[];
  readonly densities: readonly string[];
  readonly tokenCount: number;
  readonly tokens: readonly ManifestToken[];
}

// ─── Generation ──────────────────────────────────────────────────────

export interface GenerateManifestOptions {
  readonly layer: "primitive" | "semantic" | "density";
  readonly themes?: readonly string[];
  readonly densityApplicable?: boolean;
}

/**
 * Flatten a token object into ManifestToken entries.
 */
export function flattenToManifest(
  obj: Record<string, unknown>,
  options: GenerateManifestOptions,
  prefix = "",
): ManifestToken[] {
  const tokens: ManifestToken[] = [];
  const keys = Object.keys(obj).sort();

  for (const key of keys) {
    const value = obj[key];
    const path = prefix ? `${prefix}.${key}` : key;

    if (
      value !== null &&
      value !== undefined &&
      typeof value === "object" &&
      !Array.isArray(value)
    ) {
      tokens.push(...flattenToManifest(value as Record<string, unknown>, options, path));
    } else if (typeof value === "string" || typeof value === "number") {
      const category = path.split(".")[0] ?? "";
      const entry: ManifestToken = {
        path,
        cssVariable: tokenPathToCssVar(path),
        layer: options.layer,
        category,
        value: String(value),
      };

      if (options.themes && options.themes.length > 0) {
        (entry as { themes: readonly string[] }).themes = options.themes;
      }
      if (options.densityApplicable === true) {
        (entry as { densityApplicable: boolean }).densityApplicable = true;
      }

      tokens.push(entry);
    }
  }

  return tokens;
}

/**
 * Build a complete token manifest from multiple token sets.
 */
export function buildManifest(
  tokenSets: { tokens: Record<string, unknown>; options: GenerateManifestOptions }[],
): TokenManifestJson {
  const allTokens: ManifestToken[] = [];

  for (const { tokens, options } of tokenSets) {
    allTokens.push(...flattenToManifest(tokens, options));
  }

  allTokens.sort((a, b) => a.path.localeCompare(b.path));

  return {
    $schema: `https://kairoui.dev/schemas/token-manifest/${MANIFEST_SCHEMA_VERSION}.json`,
    version: MANIFEST_SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    themes: ["light", "dark"],
    densities: ["comfortable", "standard", "compact"],
    tokenCount: allTokens.length,
    tokens: allTokens,
  };
}
