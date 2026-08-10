/**
 * Component style contract — TypeScript definitions for declaring component styles.
 *
 * These types define the shape of a component's style declaration, compatible with
 * static CSS generation. No runtime is implemented here — this is the contract only.
 */

// ─── CSS Value Types ────────────────────────────────────────────────

/** A CSS custom property reference (e.g., "var(--kui-color-primary)"). */
export type CSSVarReference = `var(--${string})`;

/** A CSS class name (e.g., "kui-button", "kui-button--primary"). */
export type CSSClassName = string & { readonly __brand?: "CSSClassName" };

// ─── Token Reference ────────────────────────────────────────────────

/** References a design token by its path. Used for static CSS generation. */
export interface TokenReference {
  /** Token path (e.g., "color.interactive.default"). */
  readonly token: string;
  /** Fallback value if the token is not defined. */
  readonly fallback?: string | undefined;
}

// ─── Style Properties ───────────────────────────────────────────────

/** A map of CSS property names to their values or token references. */
export type StyleProperties = Readonly<Record<string, string | TokenReference>>;

// ─── Slot Style Definition ──────────────────────────────────────────

/** Style declaration for a single slot. */
export interface SlotStyleDefinition {
  /** Base styles always applied to this slot. */
  readonly base?: StyleProperties | undefined;
  /** Styles applied per component state (uses data-attribute selectors). */
  readonly states?: Readonly<Record<string, StyleProperties>> | undefined;
}

// ─── State Style Definition ─────────────────────────────────────────

/** Maps state names to their style properties. */
export type StateStyleMap = Readonly<Record<string, StyleProperties>>;

// ─── Variant Definition ─────────────────────────────────────────────

/**
 * Defines a single variant axis (e.g., "appearance", "color", "size").
 * Maps variant values to their style properties.
 */
export type VariantStyleMap<Values extends string = string> = Readonly<
  Record<Values, StyleProperties>
>;

/** Complete variant definition including all axes. */
export type VariantDefinitions<Variants extends Record<string, string> = Record<string, string>> = {
  readonly [K in keyof Variants]: VariantStyleMap<Variants[K]>;
};

// ─── Compound Variant ───────────────────────────────────────────────

/** A compound variant condition — a specific combination of variant values. */
export interface CompoundVariantCondition<
  Variants extends Record<string, string> = Record<string, string>,
> {
  /** The variant values that must all match for this compound to apply. */
  readonly condition: Partial<Variants>;
  /** Styles applied when all conditions match. */
  readonly styles: StyleProperties;
}

// ─── Default Variants ───────────────────────────────────────────────

/** Default variant values when the consumer doesn't specify. */
export type DefaultVariants<Variants extends Record<string, string> = Record<string, string>> =
  Readonly<{ [K in keyof Variants]?: Variants[K] | undefined }>;

// ─── Component Style Contract ───────────────────────────────────────

/**
 * The complete style contract for a KairoUI component.
 *
 * This defines everything needed to generate the component's static CSS file:
 * - Base styles for each slot
 * - State-based styles
 * - Variant styles
 * - Compound variant styles
 * - Default variant values
 * - Component-scoped custom properties
 */
export interface ComponentStyleContract<
  Slots extends string = "root",
  Variants extends Record<string, string> = Record<string, never>,
> {
  /** Component name (used in CSS class generation: .kui-{name}). */
  readonly name: string;

  /** Component-scoped CSS custom properties with their default token references. */
  readonly customProperties?: Readonly<Record<string, string | TokenReference>> | undefined;

  /** Base styles per slot. */
  readonly slots: Readonly<Record<Slots, SlotStyleDefinition>>;

  /** Variant definitions (each axis maps values to styles). */
  readonly variants?: VariantDefinitions<Variants> | undefined;

  /** Compound variants — styles for specific combinations of variant values. */
  readonly compoundVariants?: readonly CompoundVariantCondition<Variants>[] | undefined;

  /** Default variant values. */
  readonly defaultVariants?: DefaultVariants<Variants> | undefined;
}

// ─── Style Metadata ─────────────────────────────────────────────────

/** Metadata about a component's style contract for tooling. */
export interface StyleMetadata {
  /** Component name. */
  readonly name: string;
  /** Slot names. */
  readonly slots: readonly string[];
  /** Variant axis names. */
  readonly variantAxes: readonly string[];
  /** Available variant values per axis. */
  readonly variantValues: Readonly<Record<string, readonly string[]>>;
  /** Whether the component has compound variants. */
  readonly hasCompoundVariants: boolean;
  /** Component-scoped custom property names. */
  readonly customPropertyNames: readonly string[];
}

// ─── Consumer Override Types ─────────────────────────────────────────

/** Consumer-facing style override props for a slotted component. */
export interface ConsumerStyleOverrides<Slots extends string = "root"> {
  /** Additional className for the root element. */
  className?: string | undefined;
  /** Inline style override for the root element. */
  style?: Record<string, string | number> | undefined;
  /** Per-slot className and style overrides (via slotProps). */
  slotStyles?:
    | Partial<
        Record<
          Slots,
          {
            className?: string | undefined;
            style?: Record<string, string | number> | undefined;
          }
        >
      >
    | undefined;
}

// ─── Variant Props Type Helper ──────────────────────────────────────

/**
 * Generates the variant prop types for a component from its variant definitions.
 * Each variant axis becomes an optional prop.
 */
export type VariantProps<Variants extends Record<string, string>> = {
  [K in keyof Variants]?: Variants[K] | undefined;
};
