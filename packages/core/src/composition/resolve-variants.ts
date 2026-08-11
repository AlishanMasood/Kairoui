import type { StyleProperties, TokenReference } from "./style-contract";
import type { VariantAxisConfig, VariantDefinition, VariantPropsFrom } from "./define-variants";
import { warning, toKebabCase } from "@kairoui/utils";

// ─── Resolution Output ──────────────────────────────────────────────

/** Resolved variant values and their corresponding class names/styles. */
export interface ResolvedVariants<Axes extends Record<string, VariantAxisConfig>> {
  /** The resolved value for each axis (after applying defaults). */
  readonly values: { readonly [K in keyof Axes]: keyof Axes[K] & string };
  /** CSS class names for each active variant. */
  readonly classNames: readonly string[];
  /** Combined class name string (space-separated). */
  readonly className: string;
  /** Merged style properties from all active variant values. */
  readonly styles: StyleProperties;
}

/** Resolved slot variant output. */
export interface ResolvedSlotVariants {
  /** Per-slot class names. */
  readonly classNames: Readonly<Record<string, readonly string[]>>;
  /** Per-slot merged styles. */
  readonly styles: Readonly<Record<string, StyleProperties>>;
}

// ─── Class Name Generation ──────────────────────────────────────────

/** Checks if a variant axis is boolean (has "true" and optionally "false" as keys). */
function isBooleanAxis(axisKeys: readonly string[]): boolean {
  return (
    axisKeys.includes("true") &&
    axisKeys.length <= 2 &&
    (axisKeys.length === 1 || axisKeys.includes("false"))
  );
}

/** Generates a variant class name: kui-{component}--{value}. */
function variantClassName(componentName: string, value: string): string {
  return `kui-${componentName}--${toKebabCase(value)}`;
}

/** Generates a slot variant class name: kui-{component}__{slot}--{value}. */
function slotVariantClassName(componentName: string, slot: string, value: string): string {
  return `kui-${componentName}__${toKebabCase(slot)}--${toKebabCase(value)}`;
}

// ─── Compound Matching ──────────────────────────────────────────────

/** Checks if all conditions in a compound match the resolved values. */
function matchesCompound(
  condition: Readonly<Record<string, unknown>>,
  resolvedValues: Readonly<Record<string, unknown>>,
): boolean {
  for (const [axis, required] of Object.entries(condition)) {
    if (resolvedValues[axis] !== required) return false;
  }
  return true;
}

// ─── Variant Resolution ─────────────────────────────────────────────

/**
 * Resolves variant prop values against a variant definition.
 *
 * 1. Applies defaults for missing/undefined props
 * 2. Validates values against the definition
 * 3. Generates deterministic class names
 * 4. Merges style properties from all active values
 */
export function resolveVariants<
  Axes extends Record<string, VariantAxisConfig>,
  Slots extends string = never,
>(
  definition: VariantDefinition<Axes, Slots>,
  props: VariantPropsFrom<Axes>,
): ResolvedVariants<Axes> {
  const values = {} as { [K in keyof Axes]: keyof Axes[K] & string };
  const classNames: string[] = [`kui-${definition.componentName}`];
  const mergedStyles: Record<string, string | TokenReference> = {};

  for (const axis of definition.axisNames) {
    const propValue = (props as Record<string, unknown>)[axis];
    const axisConfig = definition.variants[axis];
    const axisKeys = definition.axisValues[axis];

    // Resolve value: consumer prop → default
    let resolved: string;
    if (typeof propValue === "string") {
      resolved = propValue;
    } else if (typeof propValue === "boolean" || typeof propValue === "number") {
      resolved = `${propValue}`;
    } else if (propValue !== undefined && propValue !== null) {
      resolved = String(definition.defaultVariants[axis]);
    } else {
      resolved = String(definition.defaultVariants[axis]);
    }

    // Validate resolved value against allowed values
    if (!axisKeys.includes(resolved)) {
      warning(
        false,
        `${definition.componentName}: Invalid variant value "${resolved}" for axis "${axis}". Valid values: ${axisKeys.join(", ")}.`,
      );
      resolved = String(definition.defaultVariants[axis]);
    }

    (values as Record<string, string>)[axis] = resolved;

    // Boolean axes: use axis name as class for true, skip for false
    if (isBooleanAxis(axisKeys)) {
      if (resolved === "true") {
        classNames.push(variantClassName(definition.componentName, axis));
      }
    } else {
      classNames.push(variantClassName(definition.componentName, resolved));
    }

    // Merge styles from the variant value
    const valueStyles = (axisConfig as Record<string, StyleProperties>)[resolved];
    if (valueStyles) {
      for (const key of Object.keys(valueStyles)) {
        const val = valueStyles[key];
        if (val !== undefined) {
          mergedStyles[key] = val;
        }
      }
    }
  }

  // Resolve compound variants (declaration order, all matching compounds apply)
  for (const compound of definition.compoundVariants) {
    if (matchesCompound(compound.condition, values)) {
      for (const key of Object.keys(compound.styles)) {
        const val = compound.styles[key];
        if (val !== undefined) {
          mergedStyles[key] = val;
        }
      }
    }
  }

  return {
    values: values,
    classNames,
    className: classNames.join(" "),
    styles: mergedStyles,
  };
}

/**
 * Resolves slot-specific variant styles.
 * Returns per-slot class names and merged styles.
 */
export function resolveSlotVariants<
  Axes extends Record<string, VariantAxisConfig>,
  Slots extends string,
>(
  definition: VariantDefinition<Axes, Slots>,
  resolvedValues: { readonly [K in keyof Axes]: keyof Axes[K] & string },
): ResolvedSlotVariants {
  const classNames: Record<string, string[]> = {};
  const styles: Record<string, Record<string, string | TokenReference>> = {};

  if (!definition.slotVariants) {
    return { classNames: {}, styles: {} };
  }

  for (const [slot, axisMap] of Object.entries(definition.slotVariants) as [
    string,
    Record<string, Record<string, StyleProperties>>,
  ][]) {
    classNames[slot] = [];
    styles[slot] = {};

    for (const [axis, valueMap] of Object.entries(axisMap)) {
      const resolvedValue = (resolvedValues as Record<string, string>)[axis];
      if (resolvedValue === undefined) continue;

      const valueStyles = (valueMap as Record<string, StyleProperties | undefined>)[resolvedValue];
      if (valueStyles) {
        classNames[slot].push(slotVariantClassName(definition.componentName, slot, resolvedValue));
        for (const key of Object.keys(valueStyles)) {
          const val = valueStyles[key];
          if (val !== undefined) {
            styles[slot][key] = val;
          }
        }
      }
    }
  }

  return { classNames, styles };
}
