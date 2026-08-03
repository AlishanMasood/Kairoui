/**
 * Joins parts into a single DOM-safe identifier separated by hyphens.
 * Filters out empty/nullish parts.
 */
export function joinId(...parts: readonly (string | number | null | undefined)[]): string {
  return parts
    .filter((p): p is string | number => p != null && p !== "")
    .map((p) => sanitizeIdPart(String(p)))
    .join("-");
}

/**
 * Sanitizes a single part for use in a DOM id attribute.
 * Removes characters not valid in HTML id attributes and collapses hyphens.
 */
export function sanitizeIdPart(part: string): string {
  return part
    .replace(/[^a-zA-Z0-9\u00C0-\u024F_-]/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Converts a camelCase or PascalCase string to kebab-case.
 * Handles consecutive uppercase letters (e.g., "HTMLElement" → "html-element").
 */
export function toKebabCase(str: string): string {
  return str
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2")
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .toLowerCase();
}

/**
 * Converts a name to a valid data-* attribute name.
 * Result is always lowercase with "data-" prefix.
 */
export function toDataAttributeName(name: string): string {
  const kebab = toKebabCase(name);
  const safe = kebab
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "");
  if (safe.startsWith("data-")) return safe;
  return `data-${safe}`;
}

/**
 * Produces an ARIA-safe id string from parts.
 * ARIA id references must be valid DOM ids.
 */
export function toAriaId(...parts: readonly (string | number | null | undefined)[]): string {
  return joinId(...parts);
}

/** Capitalizes the first character of a string. */
export function capitalize(str: string): string {
  if (str.length === 0) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/** Trims leading/trailing whitespace and collapses internal whitespace runs. */
export function trimWhitespace(str: string): string {
  return str.trim().replace(/\s+/g, " ");
}

let counter = 0;

/**
 * Generates a deterministic short identifier with an optional prefix.
 * NOT cryptographically secure — suitable for DOM ids, ARIA references, etc.
 * Counter resets are not guaranteed across SSR boundaries; use React useId for hydration-safe ids.
 */
export function generateId(prefix = "kui"): string {
  return `${prefix}-${String(++counter)}`;
}

/** Resets the internal counter. Only for testing. */
export function resetIdCounter(): void {
  counter = 0;
}
