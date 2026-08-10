import type { StyleProperties } from "./style-contract";

// ─── Variant Value Config ───────────────────────────────────────────

/** Style properties applied when a variant value is active. */
export type VariantValueConfig = StyleProperties;

/** A single variant axis definition mapping values to their styles. */
export type VariantAxisConfig = Readonly<Record<string, VariantValueConfig>>;

// ─── Boolean Variant ────────────────────────────────────────────────

/** A boolean variant with styles for the true case. */
export interface BooleanVariantConfig {
  readonly true: VariantValueConfig;
  readonly false?: VariantValueConfig | undefined;
}

// ─── Compound Variant ───────────────────────────────────────────────

/** A compound variant condition + style override. */
export interface CompoundVariantConfig<Axes extends Record<string, VariantAxisConfig>> {
  readonly condition: {
    readonly [K in keyof Axes]?: keyof Axes[K];
  };
  readonly styles: StyleProperties;
}

// ─── Slot Variant ───────────────────────────────────────────────────

/** Variant styles applied to a specific slot. */
export type SlotVariantConfig<Axes extends Record<string, VariantAxisConfig>> = {
  readonly [Axis in keyof Axes]?: Readonly<Partial<Record<keyof Axes[Axis], StyleProperties>>>;
};

// ─── Variant Definition Input ───────────────────────────────────────

/** Full variant definition input for a component. */
export interface VariantDefinitionInput<
  Axes extends Record<string, VariantAxisConfig>,
  Slots extends string = never,
> {
  /** Variant axes with their allowed values and styles. */
  readonly variants: Axes;

  /** Default value for each axis. */
  readonly defaultVariants: {
    readonly [K in keyof Axes]: keyof Axes[K];
  };

  /** Compound variants for specific value combinations. */
  readonly compoundVariants?: readonly CompoundVariantConfig<Axes>[] | undefined;

  /** Per-slot variant styles. */
  readonly slotVariants?: Readonly<Record<Slots, SlotVariantConfig<Axes>>> | undefined;
}

// ─── Variant Definition Output ──────────────────────────────────────

/** Frozen, immutable variant definition. */
export interface VariantDefinition<
  Axes extends Record<string, VariantAxisConfig>,
  Slots extends string = never,
> {
  /** Component name for class generation. */
  readonly componentName: string;
  /** All variant axes. */
  readonly variants: Axes;
  /** Default values. */
  readonly defaultVariants: { readonly [K in keyof Axes]: keyof Axes[K] };
  /** Compound variant rules. */
  readonly compoundVariants: readonly CompoundVariantConfig<Axes>[];
  /** Per-slot variant styles. */
  readonly slotVariants: Readonly<Record<Slots, SlotVariantConfig<Axes>>> | undefined;
  /** Ordered list of axis names. */
  readonly axisNames: readonly (keyof Axes & string)[];
  /** Available values per axis. */
  readonly axisValues: { readonly [K in keyof Axes]: readonly (keyof Axes[K] & string)[] };
}

// ─── Variant Props Type Helper ──────────────────────────────────────

/** Generates optional variant props from an axes definition. */
export type VariantPropsFrom<Axes extends Record<string, VariantAxisConfig>> = {
  [K in keyof Axes]?: keyof Axes[K] | undefined;
};

// ─── defineVariants ─────────────────────────────────────────────────

/**
 * Defines a component's variant configuration.
 * Returns a frozen, immutable definition with extracted metadata.
 */
export function defineVariants<
  Axes extends Record<string, VariantAxisConfig>,
  Slots extends string = never,
>(
  componentName: string,
  input: VariantDefinitionInput<Axes, Slots>,
): VariantDefinition<Axes, Slots> {
  const axisNames = Object.keys(input.variants).sort() as (keyof Axes & string)[];

  const axisValues = {} as {
    [K in keyof Axes]: readonly (keyof Axes[K] & string)[];
  };
  for (const axis of axisNames) {
    (axisValues as Record<string, readonly string[]>)[axis] = Object.keys(
      input.variants[axis] as Record<string, unknown>,
    ).sort();
  }

  return Object.freeze({
    componentName,
    variants: input.variants,
    defaultVariants: input.defaultVariants,
    compoundVariants: Object.freeze(input.compoundVariants ?? []),
    slotVariants: input.slotVariants,
    axisNames: Object.freeze(axisNames),
    axisValues: Object.freeze(axisValues),
  });
}
