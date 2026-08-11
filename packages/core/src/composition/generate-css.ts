import type { StyleProperties, TokenReference, ComponentStyleContract } from "./style-contract";
import {
  componentClass,
  slotClass,
  variantClass,
  booleanVariantClass,
  stateSelector,
} from "./class-generation";
import { tokenToCssValue } from "./resolve-tokens";
import type { CssLayer } from "./css-layers";
import { generateLayerOrder, wrapInLayer } from "./css-layers";
import { deduplicateContracts, deduplicateRules } from "./deduplicate-css";

// ─── CSS Value Resolution ───────────────────────────────────────────

function resolveCssValue(value: string | TokenReference): string {
  if (typeof value === "string") return value;
  return tokenToCssValue(value.token, value.fallback);
}

function toKebabProperty(prop: string): string {
  return prop.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

// ─── CSS Rule Generation ────────────────────────────────────────────

function generateProperties(props: StyleProperties, indent: string): string {
  const lines: string[] = [];
  for (const [key, value] of Object.entries(props)) {
    lines.push(`${indent}${toKebabProperty(key)}: ${resolveCssValue(value)};`);
  }
  return lines.join("\n");
}

function generateRule(selector: string, props: StyleProperties): string {
  const body = generateProperties(props, "  ");
  if (!body) return "";
  return `${selector} {\n${body}\n}`;
}

// ─── Component CSS Generation ───────────────────────────────────────

/** Input for generating CSS from a style contract. */
export interface GenerateCssInput {
  /** The component style contract. */
  readonly contract: ComponentStyleContract<string, Record<string, string>>;
  /** Component name override (defaults to contract.name). */
  readonly componentName?: string | undefined;
}

/**
 * Generates deterministic CSS from a component style contract.
 * Output order: custom properties → base → variants → compounds → slot variants → states.
 */
export function generateComponentCss(input: GenerateCssInput): string {
  const name = input.componentName ?? input.contract.name;
  const contract = input.contract;
  const sections: string[] = [];

  // 1. Custom properties on root
  if (contract.customProperties) {
    const propEntries = Object.entries(contract.customProperties);
    if (propEntries.length > 0) {
      const lines = propEntries.map(([key, value]) => {
        return `  ${key}: ${resolveCssValue(value)};`;
      });
      sections.push(`.${componentClass(name)} {\n${lines.join("\n")}\n}`);
    }
  }

  // 2. Base slot styles
  for (const [slotName, slotDef] of Object.entries(contract.slots) as [
    string,
    { base?: StyleProperties; states?: Record<string, StyleProperties> },
  ][]) {
    if (slotDef.base) {
      const selector =
        slotName === "root" ? `.${componentClass(name)}` : `.${slotClass(name, slotName)}`;
      const rule = generateRule(selector, slotDef.base);
      if (rule) sections.push(rule);
    }
  }

  // 3. Variant modifiers
  if (contract.variants) {
    const axes = Object.keys(contract.variants).sort();
    for (const axis of axes) {
      const axisConfig = (contract.variants as Record<string, Record<string, StyleProperties>>)[
        axis
      ];
      if (!axisConfig) continue;
      const values = Object.keys(axisConfig).sort();
      const isBoolean = values.length <= 2 && values.includes("true");

      for (const value of values) {
        if (isBoolean && value === "false") continue; // No class for boolean false
        const props = axisConfig[value];
        if (!props || Object.keys(props).length === 0) continue;
        const cls = isBoolean ? booleanVariantClass(name, axis) : variantClass(name, value);
        const rule = generateRule(`.${cls}`, props);
        if (rule) sections.push(rule);
      }
    }
  }

  // 4. Compound variants
  if (contract.compoundVariants) {
    for (const compound of contract.compoundVariants) {
      if (Object.keys(compound.styles).length === 0) continue;
      const condValues = Object.values(compound.condition).filter(Boolean).sort();
      const cls = `${componentClass(name)}--${(condValues as string[]).map((v) => toKebabProperty(v)).join("-")}`;
      const rule = generateRule(`.${cls}`, compound.styles);
      if (rule) sections.push(rule);
    }
  }

  // 5. State selectors
  for (const [slotName, slotDef] of Object.entries(contract.slots) as [
    string,
    { base?: StyleProperties; states?: Record<string, StyleProperties> },
  ][]) {
    if (!slotDef.states) continue;
    const stateNames = Object.keys(slotDef.states).sort();
    for (const stateName of stateNames) {
      const stateProps = slotDef.states[stateName];
      if (!stateProps || Object.keys(stateProps).length === 0) continue;

      const baseSelector =
        slotName === "root" ? `.${componentClass(name)}` : `.${slotClass(name, slotName)}`;
      const sel = stateSelector(stateName);
      const fullSelector = sel.startsWith(":") ? `${baseSelector}${sel}` : `${baseSelector}${sel}`;
      const rule = generateRule(fullSelector, stateProps);
      if (rule) sections.push(rule);
    }
  }

  return sections.join("\n\n");
}

/**
 * Generates CSS for multiple component contracts.
 * Components are sorted alphabetically for deterministic output.
 */
export interface GenerateStylesheetOptions {
  /** Wrap output in the specified CSS layer. Defaults to undefined (no layer). */
  readonly layer?: CssLayer | undefined;
  /** Prepend `@layer` order declaration. Defaults to false. */
  readonly includeLayerOrder?: boolean | undefined;
}

export function generateStylesheet(
  contracts: readonly GenerateCssInput[],
  options?: GenerateStylesheetOptions,
): string {
  const unique = deduplicateContracts(contracts);

  const sorted = [...unique].sort((a, b) => {
    const nameA = a.componentName ?? a.contract.name;
    const nameB = b.componentName ?? b.contract.name;
    return nameA.localeCompare(nameB);
  });

  const sections = sorted
    .map((input) => deduplicateRules(generateComponentCss(input)))
    .filter((css) => css.length > 0);

  let output = sections.join("\n\n");

  if (options?.layer && output) {
    output = wrapInLayer(options.layer, output);
  }

  if (options?.includeLayerOrder) {
    output = output ? `${generateLayerOrder()}\n\n${output}` : generateLayerOrder();
  }

  return output;
}
