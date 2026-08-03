/** A data attribute value: empty string for boolean presence, or a string enum value. */
export type DataAttributeValue = string;

/** Input for boolean data attributes — true adds the attribute, false/undefined omits it. */
export type BooleanDataAttributes = Record<string, boolean | undefined>;

/** Input for enumerated data attributes — string value is set, undefined omits. */
export type EnumDataAttributes = Record<string, string | undefined>;

export interface DataAttributeOptions {
  /** Prefix for attribute names. Defaults to "data". */
  prefix?: string;
}

/**
 * Converts boolean state flags into data attributes.
 * Truthy values produce `data-{name}: ""` (presence attribute).
 * Falsy/undefined values are omitted.
 */
export function resolveBooleanDataAttributes(
  attrs: BooleanDataAttributes,
  options: DataAttributeOptions = {},
): Record<string, DataAttributeValue> {
  const prefix = options.prefix ?? "data";
  const result: Record<string, DataAttributeValue> = {};

  for (const key of Object.keys(attrs).sort()) {
    if (attrs[key]) {
      result[`${prefix}-${toKebab(key)}`] = "";
    }
  }

  return result;
}

/**
 * Converts enumerated state values into data attributes.
 * String values produce `data-{name}: "{value}"`.
 * Undefined values are omitted.
 */
export function resolveEnumDataAttributes(
  attrs: EnumDataAttributes,
  options: DataAttributeOptions = {},
): Record<string, DataAttributeValue> {
  const prefix = options.prefix ?? "data";
  const result: Record<string, DataAttributeValue> = {};

  for (const key of Object.keys(attrs).sort()) {
    const value = attrs[key];
    if (value != null && value !== "") {
      result[`${prefix}-${toKebab(key)}`] = value;
    }
  }

  return result;
}

/**
 * Combines boolean and enum data attributes into a single attribute map.
 * Boolean attributes use empty string values; enum attributes use their string value.
 * Keys are deterministic (sorted).
 */
export function resolveDataAttributes(
  input: {
    boolean?: BooleanDataAttributes;
    enum?: EnumDataAttributes;
  },
  options: DataAttributeOptions = {},
): Record<string, DataAttributeValue> {
  const boolAttrs = input.boolean ? resolveBooleanDataAttributes(input.boolean, options) : {};
  const enumAttrs = input.enum ? resolveEnumDataAttributes(input.enum, options) : {};

  return { ...boolAttrs, ...enumAttrs };
}

function toKebab(str: string): string {
  return str
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2")
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .toLowerCase();
}
