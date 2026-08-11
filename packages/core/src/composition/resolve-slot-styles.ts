import type { StyleProperties, SlotStyleDefinition, TokenReference } from "./style-contract";
import type { OwnerState } from "./state-styles";
import { resolveActiveStates } from "./state-styles";

// ─── Types ──────────────────────────────────────────────────────────

/** Resolved style output for a single slot. */
export interface ResolvedSlotStyle {
  /** Merged base + state + variant style properties. */
  readonly styles: Record<string, string | TokenReference>;
  /** CSS class names for this slot. */
  readonly classNames: readonly string[];
}

/** Input for resolving a single slot's styles. */
export interface SlotStyleInput {
  /** The slot's style definition (base + states). */
  readonly definition: SlotStyleDefinition;
  /** Variant-derived styles for this slot (from resolveSlotVariants). */
  readonly variantStyles?: StyleProperties | undefined;
  /** Variant-derived class names for this slot. */
  readonly variantClassNames?: readonly string[] | undefined;
  /** Current owner state for state style resolution. */
  readonly ownerState?: OwnerState | undefined;
}

// ─── Single Slot Resolution ─────────────────────────────────────────

/**
 * Resolves the complete styles for a single slot.
 *
 * Merge order (lowest → highest priority):
 * 1. Base slot styles (from definition)
 * 2. Variant-derived styles (from variant resolution)
 * 3. State-derived styles (from active owner state)
 */
export function resolveSlotStyle(input: SlotStyleInput): ResolvedSlotStyle {
  const styles: Record<string, string | TokenReference> = {};
  const classNames: string[] = [];

  // 1. Base styles
  if (input.definition.base) {
    for (const key of Object.keys(input.definition.base)) {
      const val = input.definition.base[key];
      if (val !== undefined) styles[key] = val;
    }
  }

  // 2. Variant styles (override base per-property)
  if (input.variantStyles) {
    for (const key of Object.keys(input.variantStyles)) {
      const val = input.variantStyles[key];
      if (val !== undefined) styles[key] = val;
    }
  }

  // 3. State styles (override variant + base per-property)
  if (input.ownerState && input.definition.states) {
    const activeStates = resolveActiveStates(input.ownerState);
    for (const stateName of activeStates) {
      const stateStyles = input.definition.states[stateName];
      if (stateStyles) {
        for (const key of Object.keys(stateStyles)) {
          const val = stateStyles[key];
          if (val !== undefined) styles[key] = val;
        }
      }
    }
  }

  // Collect class names
  if (input.variantClassNames) {
    classNames.push(...input.variantClassNames);
  }

  return { styles, classNames };
}

// ─── Multi-Slot Resolution ──────────────────────────────────────────

/**
 * Resolves styles for all declared slots in a component.
 * Optional slots with no definition are returned with empty styles.
 */
export function resolveAllSlotStyles<Slots extends string>(
  slots: readonly Slots[],
  definitions: Readonly<Partial<Record<Slots, SlotStyleDefinition>>>,
  options?: {
    variantStyles?: Readonly<Partial<Record<Slots, StyleProperties>>> | undefined;
    variantClassNames?: Readonly<Partial<Record<Slots, readonly string[]>>> | undefined;
    ownerState?: OwnerState | undefined;
  },
): Record<Slots, ResolvedSlotStyle> {
  const result = {} as Record<Slots, ResolvedSlotStyle>;

  for (const slot of slots) {
    const definition = definitions[slot];
    if (!definition) {
      result[slot] = { styles: {}, classNames: [] };
      continue;
    }

    result[slot] = resolveSlotStyle({
      definition,
      variantStyles: options?.variantStyles?.[slot],
      variantClassNames: options?.variantClassNames?.[slot],
      ownerState: options?.ownerState,
    });
  }

  return result;
}
