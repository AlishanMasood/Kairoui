import type { StyleProperties, SlotStyleDefinition } from "./style-contract";
import type { VariantAxisConfig, VariantDefinition, VariantPropsFrom } from "./define-variants";
import type { OwnerState } from "./state-styles";
import { resolveVariants, resolveSlotVariants } from "./resolve-variants";
import { resolveAllSlotStyles } from "./resolve-slot-styles";
import type { ResolvedSlotStyle } from "./resolve-slot-styles";

// ─── Types ──────────────────────────────────────────────────────────

/** Complete resolved style output for a component with slots. */
export interface PropagatedSlotStyles<Slots extends string> {
  /** Root-level resolved variant info (className, values). */
  readonly rootClassName: string;
  /** Resolved variant values. */
  readonly variantValues: Readonly<Record<string, string>>;
  /** Per-slot resolved styles (base + variant + state merged). */
  readonly slots: Record<Slots, ResolvedSlotStyle>;
}

/** Input for propagating variants to slots. */
export interface PropagateVariantsInput<
  Axes extends Record<string, VariantAxisConfig>,
  Slots extends string,
> {
  /** The variant definition for this component. */
  readonly definition: VariantDefinition<Axes, Slots>;
  /** Consumer variant props. */
  readonly props: VariantPropsFrom<Axes>;
  /** Slot names to resolve. */
  readonly slots: readonly Slots[];
  /** Per-slot style definitions (base + states). */
  readonly slotDefinitions: Readonly<Partial<Record<Slots, SlotStyleDefinition>>>;
  /** Current owner state for state style resolution. */
  readonly ownerState?: OwnerState | undefined;
}

// ─── Propagation ────────────────────────────────────────────────────

/**
 * Resolves component variants and propagates them to all declared slots.
 *
 * Flow:
 * 1. Resolve root variant values from consumer props + defaults
 * 2. Resolve slot-specific variant styles from the definition's slotVariants
 * 3. Resolve each slot's complete styles (base + variant + state)
 * 4. Return unified result with root className + per-slot styles
 */
export function propagateVariantsToSlots<
  Axes extends Record<string, VariantAxisConfig>,
  Slots extends string,
>(input: PropagateVariantsInput<Axes, Slots>): PropagatedSlotStyles<Slots> {
  const { definition, props, slots, slotDefinitions, ownerState } = input;

  // 1. Resolve root variants
  const rootResolved = resolveVariants(definition, props);

  // 2. Resolve slot-specific variant styles
  const slotVariantResult = resolveSlotVariants(definition, rootResolved.values);

  // 3. Resolve complete styles per slot
  const resolvedSlots = resolveAllSlotStyles(slots, slotDefinitions, {
    variantStyles: slotVariantResult.styles as Readonly<Partial<Record<Slots, StyleProperties>>>,
    variantClassNames: slotVariantResult.classNames as Readonly<
      Partial<Record<Slots, readonly string[]>>
    >,
    ownerState,
  });

  return {
    rootClassName: rootResolved.className,
    variantValues: rootResolved.values,
    slots: resolvedSlots,
  };
}
