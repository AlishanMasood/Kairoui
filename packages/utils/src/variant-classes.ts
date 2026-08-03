/** A map of variant dimension names to their current values. */
export type VariantValues = Record<string, string | undefined>;

export interface ResolveVariantClassesOptions {
  /** Component name used as the class prefix. */
  component: string;
  /** Map of variant dimension → current value. Undefined values are omitted. */
  values: VariantValues;
  /** Optional prefix prepended to all classes. Defaults to "kui". */
  prefix?: string;
}

/**
 * Resolves variant values into stable class names.
 *
 * Output pattern: `{prefix}-{component}--{dimension}-{value}`
 *
 * - Undefined values are skipped (no class emitted).
 * - Order is deterministic: sorted by dimension name.
 * - Empty strings for value are skipped.
 */
export function resolveVariantClasses(options: ResolveVariantClassesOptions): string[] {
  const { component, values, prefix = "kui" } = options;
  const classes: string[] = [];

  const dimensions = Object.keys(values).sort();

  for (const dimension of dimensions) {
    const value = values[dimension];
    if (value == null || value === "") continue;
    classes.push(`${prefix}-${component}--${dimension}-${value}`);
  }

  return classes;
}

/**
 * Resolves variant values into a single space-separated class string.
 * Returns empty string if no variants are active.
 */
export function variantClasses(options: ResolveVariantClassesOptions): string {
  return resolveVariantClasses(options).join(" ");
}
