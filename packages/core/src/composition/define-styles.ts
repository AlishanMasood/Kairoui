import type {
  StyleProperties,
  SlotStyleDefinition,
  TokenReference,
  ComponentStyleContract,
} from "./style-contract";

// ─── Token Reference Helper ─────────────────────────────────────────

/** Creates a token reference for use in style properties. */
export function token(path: string, fallback?: string): TokenReference {
  if (fallback !== undefined) {
    return { token: path, fallback };
  }
  return { token: path };
}

/** Creates a CSS variable reference string from a token path. */
export function cssVar(name: string, fallback?: string): string {
  if (fallback !== undefined) {
    return `var(--kui-${name}, ${fallback})`;
  }
  return `var(--kui-${name})`;
}

// ─── Base Style Definition ──────────────────────────────────────────

/** Input for defining base styles for a single slot. */
export interface BaseSlotStyleInput {
  /** CSS properties for the slot's base state. */
  readonly base?: StyleProperties | undefined;
  /** Per-state CSS properties (keyed by state name). */
  readonly states?: Readonly<Record<string, StyleProperties>> | undefined;
}

/**
 * Defines base styles for a component's slots.
 * Returns a frozen, immutable style definition map.
 *
 * This is a build-time declaration — no runtime style computation occurs.
 */
export function defineBaseStyles<Slots extends string>(
  componentName: string,
  slots: Readonly<Record<Slots, BaseSlotStyleInput>>,
): ComponentStyleContract<Slots> {
  const frozenSlots = {} as Record<Slots, SlotStyleDefinition>;

  for (const slotName of Object.keys(slots) as Slots[]) {
    const input = slots[slotName];
    const def: SlotStyleDefinition = {
      base: input.base ? Object.freeze({ ...input.base }) : undefined,
      states: input.states ? Object.freeze({ ...input.states }) : undefined,
    };
    frozenSlots[slotName] = Object.freeze(def);
  }

  return Object.freeze({
    name: componentName,
    slots: Object.freeze(frozenSlots),
  });
}

/**
 * Defines component-scoped CSS custom properties with token-based defaults.
 * Returns a frozen map of property name → default value/token reference.
 */
export function defineCustomProperties(
  properties: Readonly<Record<string, string | TokenReference>>,
): Readonly<Record<string, string | TokenReference>> {
  return Object.freeze({ ...properties });
}
