/**
 * Token naming utilities for @kairoui/tokens.
 *
 * Implements the canonical conversion between TypeScript token paths
 * and CSS custom property names as defined in the Token Naming Standard.
 */

const CSS_PREFIX = "--kui-";

/**
 * Approved abbreviations applied during path-to-CSS conversion.
 * Only these substitutions are allowed.
 */
const ABBREVIATIONS: Record<string, string> = {
  background: "bg",
  foreground: "fg",
  spacing: "space",
};

/**
 * Convert a camelCase string to kebab-case.
 *
 * @example
 * camelToKebab("fontSize") // "font-size"
 * camelToKebab("backgroundHover") // "background-hover"
 * camelToKebab("inOut") // "in-out"
 */
export function camelToKebab(str: string): string {
  return str.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

/**
 * Apply approved abbreviations to a single path segment.
 * Handles both standalone words and camelCase prefixes
 * (e.g., "backgroundHover" → "bgHover").
 */
function abbreviate(segment: string): string {
  // Check for exact match first
  if (ABBREVIATIONS[segment] !== undefined) {
    return ABBREVIATIONS[segment];
  }

  // Check if the segment starts with an abbreviation-eligible word (camelCase compound)
  for (const [full, short] of Object.entries(ABBREVIATIONS)) {
    if (segment.startsWith(full) && segment.length > full.length) {
      const rest = segment.slice(full.length);
      return short + rest;
    }
  }

  return segment;
}

/**
 * Convert a TypeScript token path to a CSS custom property name.
 *
 * Implements the canonical algorithm:
 * 1. Split on "."
 * 2. Abbreviate each segment
 * 3. Convert camelCase to kebab-case
 * 4. Join with "-"
 * 5. Prepend "--kui-"
 *
 * @example
 * tokenPathToCssVar("color.background.page") // "--kui-color-bg-page"
 * tokenPathToCssVar("spacing.4") // "--kui-space-4"
 * tokenPathToCssVar("button.primary.backgroundHover") // "--kui-button-primary-bg-hover"
 */
export function tokenPathToCssVar(path: string): string {
  const segments = path.split(".");
  const transformed = segments.map((segment) => camelToKebab(abbreviate(segment)));
  return `${CSS_PREFIX}${transformed.join("-")}`;
}

/**
 * Strip the CSS prefix from a variable name, returning the bare token path in kebab-case.
 *
 * @example
 * cssVarToTokenSlug("--kui-color-bg-page") // "color-bg-page"
 */
export function cssVarToTokenSlug(cssVar: string): string {
  return cssVar.replace(CSS_PREFIX, "");
}
