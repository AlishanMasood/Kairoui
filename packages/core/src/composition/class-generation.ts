import { toKebabCase } from "@kairoui/utils";

/** Prefix for all KairoUI CSS classes. */
const PREFIX = "kui-";

// ─── Component Classes ──────────────────────────────────────────────

/** Generates the root class for a component: `kui-{name}`. */
export function componentClass(componentName: string): string {
  return `${PREFIX}${toKebabCase(componentName)}`;
}

// ─── Slot Classes ───────────────────────────────────────────────────

/** Generates a slot class: `kui-{component}__{slot}`. */
export function slotClass(componentName: string, slotName: string): string {
  return `${PREFIX}${toKebabCase(componentName)}__${toKebabCase(slotName)}`;
}

// ─── Variant Classes ────────────────────────────────────────────────

/** Generates a variant modifier class: `kui-{component}--{value}`. */
export function variantClass(componentName: string, value: string): string {
  return `${PREFIX}${toKebabCase(componentName)}--${toKebabCase(value)}`;
}

/** Generates a boolean variant class: `kui-{component}--{axis}`. */
export function booleanVariantClass(componentName: string, axisName: string): string {
  return `${PREFIX}${toKebabCase(componentName)}--${toKebabCase(axisName)}`;
}

/** Generates a compound variant class: `kui-{component}--{v1}-{v2}`. */
export function compoundVariantClass(componentName: string, values: readonly string[]): string {
  const sorted = [...values].sort();
  return `${PREFIX}${toKebabCase(componentName)}--${sorted.map(toKebabCase).join("-")}`;
}

/** Generates a slot variant class: `kui-{component}__{slot}--{value}`. */
export function slotVariantClass(componentName: string, slotName: string, value: string): string {
  return `${PREFIX}${toKebabCase(componentName)}__${toKebabCase(slotName)}--${toKebabCase(value)}`;
}

// ─── State Selectors ────────────────────────────────────────────────

/** Maps state names to their CSS selectors. */
const STATE_SELECTORS: Readonly<Record<string, string>> = {
  hovered: ":hover",
  focused: ":focus",
  focusVisible: ":focus-visible",
  pressed: ":active",
  disabled: "[data-disabled]",
  loading: "[data-loading]",
  selected: "[data-selected]",
  checked: "[data-checked]",
  expanded: "[data-expanded]",
  open: "[data-open]",
  invalid: "[data-invalid]",
  readOnly: "[data-read-only]",
};

/** Returns the CSS selector for a state name. */
export function stateSelector(stateName: string): string {
  return STATE_SELECTORS[stateName] ?? `[data-${toKebabCase(stateName)}]`;
}

/** Generates a state selector scoped to a component: `.kui-button[data-disabled]`. */
export function componentStateSelector(componentName: string, stateName: string): string {
  return `.${componentClass(componentName)}${stateSelector(stateName)}`;
}

/** Generates a state selector scoped to a slot: `.kui-button__icon[data-disabled]`. */
export function slotStateSelector(
  componentName: string,
  slotName: string,
  stateName: string,
): string {
  const sel = stateSelector(stateName);
  // Pseudo-classes scope via parent
  if (sel.startsWith(":")) {
    return `.${componentClass(componentName)}${sel} .${slotClass(componentName, slotName)}`;
  }
  return `.${slotClass(componentName, slotName)}${sel}`;
}

// ─── Full Class List Builder ────────────────────────────────────────

/** Input for building a complete class list. */
export interface ClassListInput {
  componentName: string;
  slotName?: string | undefined;
  variantValues?: Readonly<Record<string, string>> | undefined;
  booleanVariants?: Readonly<Record<string, boolean>> | undefined;
}

/**
 * Builds a deterministic class list from component/slot/variant info.
 * Returns a space-separated string.
 */
export function buildClassList(input: ClassListInput): string {
  const classes: string[] = [];

  if (input.slotName && input.slotName !== "root") {
    classes.push(slotClass(input.componentName, input.slotName));
  } else {
    classes.push(componentClass(input.componentName));
  }

  // Variant classes (alphabetical axis order)
  if (input.variantValues) {
    const axes = Object.keys(input.variantValues).sort();
    for (const axis of axes) {
      const value = input.variantValues[axis];
      if (value !== undefined) {
        classes.push(variantClass(input.componentName, value));
      }
    }
  }

  // Boolean variant classes (alphabetical, true only)
  if (input.booleanVariants) {
    const axes = Object.keys(input.booleanVariants).sort();
    for (const axis of axes) {
      if (input.booleanVariants[axis] === true) {
        classes.push(booleanVariantClass(input.componentName, axis));
      }
    }
  }

  return classes.join(" ");
}
