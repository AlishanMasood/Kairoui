import type { StyleProperties, TokenReference } from "./style-contract";
import { warning, toKebabCase } from "@kairoui/utils";

// ─── Token Path Validation ──────────────────────────────────────────

/** Known top-level token categories. */
const VALID_CATEGORIES = new Set([
  "color",
  "spacing",
  "typography",
  "control",
  "border",
  "shadow",
  "interaction",
  "focus",
  "font",
  "line",
  "letter",
]);

/** Validates a token path has at least category.name structure. */
function isValidTokenPath(path: string): boolean {
  const parts = path.split(".");
  if (parts.length < 2) return false;
  const category = parts[0];
  return category !== undefined && VALID_CATEGORIES.has(category);
}

// ─── Token to CSS Variable Conversion ───────────────────────────────

/** Approved abbreviations matching @kairoui/tokens/naming. */
const ABBREVIATIONS: Readonly<Record<string, string>> = {
  background: "bg",
  foreground: "fg",
  spacing: "space",
};

/** Apply abbreviations to a path segment. */
function abbreviate(segment: string): string {
  const abbr = ABBREVIATIONS[segment];
  if (abbr !== undefined) {
    return abbr;
  }
  for (const [full, short] of Object.entries(ABBREVIATIONS)) {
    if (segment.startsWith(full) && segment.length > full.length) {
      return short + segment.slice(full.length);
    }
  }
  return segment;
}

/**
 * Converts a token path to a CSS custom property name.
 * Mirrors the algorithm in @kairoui/tokens/naming.
 */
export function tokenToVar(path: string): string {
  const segments = path.split(".");
  const transformed = segments.map((s) => toKebabCase(abbreviate(s)));
  return `--kui-${transformed.join("-")}`;
}

/**
 * Converts a token path to a CSS var() reference.
 * Includes optional fallback value.
 */
export function tokenToCssValue(path: string, fallback?: string): string {
  const varName = tokenToVar(path);
  if (fallback !== undefined) {
    return `var(${varName}, ${fallback})`;
  }
  return `var(${varName})`;
}

// ─── Token Reference Resolution ─────────────────────────────────────

/**
 * Resolves a TokenReference into a CSS var() string.
 * Emits a dev warning for invalid token paths.
 */
export function resolveTokenReference(ref: TokenReference, componentName?: string): string {
  warning(
    isValidTokenPath(ref.token),
    `${componentName ?? "Component"}: Invalid token path "${ref.token}". Token paths must start with a valid category (${[...VALID_CATEGORIES].join(", ")}).`,
  );

  return tokenToCssValue(ref.token, ref.fallback);
}

/**
 * Resolves all token references in a StyleProperties map to CSS var() strings.
 * String values pass through unchanged. TokenReference values are resolved.
 *
 * Returns a Record<string, string> suitable for CSS output.
 */
export function resolveStyleTokens(
  properties: StyleProperties,
  componentName?: string,
): Record<string, string> {
  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(properties)) {
    if (typeof value === "string") {
      result[key] = value;
    } else {
      result[key] = resolveTokenReference(value, componentName);
    }
  }

  return result;
}

/**
 * Resolves a component-scoped custom property map.
 * Converts token references to var() values while preserving string values.
 */
export function resolveCustomProperties(
  properties: Readonly<Record<string, string | TokenReference>>,
  componentName?: string,
): Record<string, string> {
  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(properties)) {
    if (typeof value === "string") {
      result[key] = value;
    } else {
      result[key] = resolveTokenReference(value, componentName);
    }
  }

  return result;
}
