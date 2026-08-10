/**
 * Consumer style override resolution.
 *
 * Resolves className, style, and per-slot overrides from consumer props
 * into final merged values while preserving internal behavior.
 */

// ─── Types ──────────────────────────────────────────────────────────

/** Consumer style override for a single element (root or slot). */
export interface StyleOverride {
  /** Additional CSS class names (merged with internal). */
  readonly className?: string | undefined;
  /** Inline style overrides (merged per-property, consumer wins). */
  readonly style?: Readonly<Record<string, string | number>> | undefined;
}

/** Consumer overrides for all component slots. */
export type SlotStyleOverrides<Slots extends string> = Partial<
  Readonly<Record<Slots, StyleOverride>>
>;

/** Full consumer style override input. */
export interface ConsumerOverrideInput<Slots extends string = "root"> {
  /** Root element className. */
  readonly className?: string | undefined;
  /** Root element inline style. */
  readonly style?: Readonly<Record<string, string | number>> | undefined;
  /** Per-slot overrides from slotProps. */
  readonly slotOverrides?: SlotStyleOverrides<Slots> | undefined;
}

/** Resolved style output for a single element. */
export interface ResolvedStyle {
  /** Final merged className (internal + consumer). */
  readonly className: string | undefined;
  /** Final merged style object (internal base + consumer overrides per-property). */
  readonly style: Record<string, string | number> | undefined;
}

// ─── Class Name Resolution ──────────────────────────────────────────

/**
 * Merges internal and consumer class names.
 * Both are preserved (consumer appended after internal).
 * Returns undefined if both are empty/undefined.
 */
export function resolveClassName(
  internal: string | undefined,
  consumer: string | undefined,
): string | undefined {
  if (!internal && !consumer) return undefined;
  if (!internal) return consumer;
  if (!consumer) return internal;
  return `${internal} ${consumer}`;
}

// ─── Style Object Resolution ────────────────────────────────────────

/**
 * Merges internal and consumer style objects.
 * Consumer properties override internal per-key.
 * Returns undefined if both are empty/undefined.
 */
export function resolveStyle(
  internal: Readonly<Record<string, string | number>> | undefined,
  consumer: Readonly<Record<string, string | number>> | undefined,
): Record<string, string | number> | undefined {
  if (!internal && !consumer) return undefined;
  if (!internal) return consumer ? { ...consumer } : undefined;
  if (!consumer) return { ...internal };
  return { ...internal, ...consumer };
}

// ─── Slot Override Resolution ────────────────────────────────────────

/**
 * Resolves consumer overrides for a single slot.
 * Merges the slot's internal className/style with any consumer overrides.
 */
export function resolveSlotOverride(
  internalClassName: string | undefined,
  internalStyle: Readonly<Record<string, string | number>> | undefined,
  consumerOverride: StyleOverride | undefined,
): ResolvedStyle {
  if (!consumerOverride) {
    return {
      className: internalClassName,
      style: internalStyle ? { ...internalStyle } : undefined,
    };
  }

  return {
    className: resolveClassName(internalClassName, consumerOverride.className),
    style: resolveStyle(internalStyle, consumerOverride.style),
  };
}

/**
 * Resolves all consumer overrides for a component.
 * Returns resolved styles for root and each slot.
 */
export function resolveConsumerOverrides<Slots extends string>(
  slots: readonly Slots[],
  internalStyles: Readonly<
    Record<Slots, { className?: string; style?: Readonly<Record<string, string | number>> }>
  >,
  consumer: ConsumerOverrideInput<Slots>,
): Record<Slots, ResolvedStyle> {
  const result = {} as Record<Slots, ResolvedStyle>;

  for (const slot of slots) {
    const internal = internalStyles[slot];
    const slotOverride = consumer.slotOverrides?.[slot];

    if (slot === "root") {
      // Root gets both root-level className/style AND slotOverrides.root
      const rootClassName = resolveClassName(
        internal.className,
        resolveClassName(consumer.className, slotOverride?.className),
      );
      const rootStyle = resolveStyle(
        internal.style,
        resolveStyle(consumer.style, slotOverride?.style),
      );
      result[slot] = { className: rootClassName, style: rootStyle };
    } else {
      result[slot] = resolveSlotOverride(internal.className, internal.style, slotOverride);
    }
  }

  return result;
}
