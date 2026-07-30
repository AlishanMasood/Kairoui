/**
 * Token-to-CSS-Variable Conversion
 *
 * Deterministic, framework-independent utilities that convert token objects
 * to CSS custom property declarations. Does not manipulate the DOM.
 */

import { tokenPathToCssVar } from "../naming";

// ─── Types ───────────────────────────────────────────────────────────

/** A single CSS custom property declaration */
export interface CssDeclaration {
  readonly variable: string;
  readonly value: string;
  readonly path: string;
}

/** Result of generating CSS from tokens */
export interface CssGenerationResult {
  readonly css: string;
  readonly declarations: readonly CssDeclaration[];
  readonly errors: readonly CssGenerationError[];
  readonly metadata: CssGenerationMetadata;
}

/** Error detected during CSS generation */
export interface CssGenerationError {
  readonly path: string;
  readonly message: string;
  readonly type: "unresolved_reference" | "duplicate_variable" | "invalid_value";
}

/** Metadata about the generation result */
export interface CssGenerationMetadata {
  readonly totalVariables: number;
  readonly scope: string;
  readonly generatedAt: string;
}

/** Options for generating CSS */
export interface GenerateCssOptions {
  readonly scope?: string;
  readonly indent?: string;
}

// ─── Core Generator ──────────────────────────────────────────────────

/**
 * Generate CSS custom property declarations from a flat or nested token object.
 *
 * - Traverses nested objects to produce dot-path keys
 * - Converts paths to --kui-* variable names
 * - Produces deterministic output (sorted alphabetically by variable name)
 * - Detects duplicates and invalid values
 * - Wraps declarations in the specified scope selector
 */
export function generateCss(
  tokens: Record<string, unknown>,
  options: GenerateCssOptions = {},
): CssGenerationResult {
  const { scope = ":root", indent = "  " } = options;
  const errors: CssGenerationError[] = [];
  const declarations: CssDeclaration[] = [];
  const seenVariables = new Map<string, string>();

  // Flatten the token tree into declarations
  flattenTokens(tokens, "", declarations, errors);

  // Sort for deterministic output
  declarations.sort((a, b) => a.variable.localeCompare(b.variable));

  // Detect duplicates
  for (const decl of declarations) {
    const existing = seenVariables.get(decl.variable);
    if (existing !== undefined) {
      errors.push({
        path: decl.path,
        message: `Duplicate variable "${decl.variable}" (first defined at "${existing}")`,
        type: "duplicate_variable",
      });
    } else {
      seenVariables.set(decl.variable, decl.path);
    }
  }

  // Build CSS string
  const lines = declarations.map((d) => `${indent}${d.variable}: ${d.value};`);
  const css = lines.length > 0 ? `${scope} {\n${lines.join("\n")}\n}` : "";

  return {
    css,
    declarations,
    errors,
    metadata: {
      totalVariables: declarations.length,
      scope,
      generatedAt: new Date().toISOString(),
    },
  };
}

/**
 * Generate CSS for a specific theme scope.
 */
export function generateThemeCss(
  tokens: Record<string, unknown>,
  themeName: string,
  options: Omit<GenerateCssOptions, "scope"> = {},
): CssGenerationResult {
  return generateCss(tokens, {
    ...options,
    scope: `[data-kui-theme="${themeName}"]`,
  });
}

/**
 * Generate CSS for a specific density scope.
 */
export function generateDensityCss(
  tokens: Record<string, unknown>,
  densityName: string,
  options: Omit<GenerateCssOptions, "scope"> = {},
): CssGenerationResult {
  return generateCss(tokens, {
    ...options,
    scope: `[data-kui-density="${densityName}"]`,
  });
}

// ─── Internal ────────────────────────────────────────────────────────

function flattenTokens(
  obj: Record<string, unknown>,
  prefix: string,
  declarations: CssDeclaration[],
  errors: CssGenerationError[],
): void {
  // Sort keys for deterministic traversal
  const keys = Object.keys(obj).sort();

  for (const key of keys) {
    const value = obj[key];
    const path = prefix ? `${prefix}.${key}` : key;

    if (value === null || value === undefined) {
      errors.push({
        path,
        message: `Invalid value: ${String(value)}`,
        type: "invalid_value",
      });
      continue;
    }

    if (typeof value === "object" && !Array.isArray(value)) {
      flattenTokens(value as Record<string, unknown>, path, declarations, errors);
    } else if (typeof value === "string" || typeof value === "number") {
      const variable = tokenPathToCssVar(path);
      declarations.push({ variable, value: String(value), path });
    } else {
      errors.push({
        path,
        message: `Unsupported value type: ${typeof value}`,
        type: "invalid_value",
      });
    }
  }
}
