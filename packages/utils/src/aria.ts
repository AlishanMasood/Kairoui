/**
 * Merges ARIA token-list attributes (e.g., aria-labelledby, aria-describedby).
 * Deduplicates tokens, removes empty values, preserves insertion order.
 * Consumer-provided values come first, internal values are appended.
 */
export function mergeAriaTokenList(
  ...sources: readonly (string | null | undefined)[]
): string | undefined {
  const seen = new Set<string>();
  const tokens: string[] = [];

  for (const source of sources) {
    if (source == null) continue;
    for (const token of source.split(/\s+/)) {
      if (token && !seen.has(token)) {
        seen.add(token);
        tokens.push(token);
      }
    }
  }

  return tokens.length > 0 ? tokens.join(" ") : undefined;
}

/**
 * Merges aria-labelledby values. Consumer labels come first.
 * Returns undefined if no tokens are present (attribute should be omitted).
 */
export function mergeAriaLabelledBy(
  ...sources: readonly (string | null | undefined)[]
): string | undefined {
  return mergeAriaTokenList(...sources);
}

/**
 * Merges aria-describedby values. Consumer descriptions come first.
 * Returns undefined if no tokens are present.
 */
export function mergeAriaDescribedBy(
  ...sources: readonly (string | null | undefined)[]
): string | undefined {
  return mergeAriaTokenList(...sources);
}

/**
 * Merges aria-controls values.
 * Returns undefined if no tokens are present.
 */
export function mergeAriaControls(
  ...sources: readonly (string | null | undefined)[]
): string | undefined {
  return mergeAriaTokenList(...sources);
}

/**
 * Merges aria-owns values.
 * Returns undefined if no tokens are present.
 */
export function mergeAriaOwns(
  ...sources: readonly (string | null | undefined)[]
): string | undefined {
  return mergeAriaTokenList(...sources);
}

/** Approved boolean ARIA attribute names. */
export type BooleanAriaAttribute =
  | "aria-disabled"
  | "aria-hidden"
  | "aria-expanded"
  | "aria-pressed"
  | "aria-checked"
  | "aria-selected"
  | "aria-required"
  | "aria-invalid"
  | "aria-busy"
  | "aria-readonly"
  | "aria-modal";

/**
 * Resolves boolean ARIA attributes.
 * - true → "true"
 * - false → "false"
 * - undefined → attribute omitted
 */
export function resolveBooleanAria(
  attrs: Partial<Record<BooleanAriaAttribute, boolean | undefined>>,
): Record<string, string> {
  const result: Record<string, string> = {};

  for (const key of (Object.keys(attrs) as BooleanAriaAttribute[]).sort()) {
    const value = attrs[key];
    if (value !== undefined) {
      result[key] = String(value);
    }
  }

  return result;
}
