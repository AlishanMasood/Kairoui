import type { SlotDefinitionMap } from "./slot-definitions";
import type { ResolvedSlotStyle } from "./resolve-slot-styles";
import { resolveClassName, resolveStyle } from "./consumer-overrides";
import type { SlotStyleOverrides } from "./consumer-overrides";
import { warning } from "@kairoui/utils";

// ─── Types ──────────────────────────────────────────────────────────

/** Final resolved slot style output with consumer overrides applied. */
export interface FinalSlotStyle {
  /** Merged className (internal + variant + consumer). */
  readonly className: string | undefined;
  /** Merged inline style (internal + variant + state + consumer per-property). */
  readonly style: Record<string, string | number> | undefined;
}

// ─── Single Slot Override ───────────────────────────────────────────

/**
 * Applies consumer overrides to a resolved slot style.
 * Consumer className is appended; consumer style overrides per-property.
 */
export function applySlotOverride(
  internalClassName: string | undefined,
  resolved: ResolvedSlotStyle,
  consumerClassName: string | undefined,
  consumerStyle: Readonly<Record<string, string | number>> | undefined,
): FinalSlotStyle {
  // Convert resolved styles from token references to string values for inline style
  const internalStyle = toInlineStyle(resolved.styles);

  return {
    className: resolveClassName(
      resolveClassName(internalClassName, resolved.classNames.join(" ") || undefined),
      consumerClassName,
    ),
    style: resolveStyle(internalStyle, consumerStyle),
  };
}

// ─── Multi-Slot Override with Validation ─────────────────────────────

/**
 * Applies consumer overrides to all slots, enforcing public/private boundaries.
 * Private (internal) slots reject consumer overrides with dev warnings.
 */
export function applySlotOverrides<Slots extends string>(
  slots: readonly Slots[],
  slotDefinitions: SlotDefinitionMap<Slots>,
  resolvedStyles: Record<Slots, ResolvedSlotStyle>,
  internalClassNames: Readonly<Partial<Record<Slots, string>>>,
  consumer: {
    rootClassName?: string | undefined;
    rootStyle?: Readonly<Record<string, string | number>> | undefined;
    slotOverrides?: SlotStyleOverrides<Slots> | undefined;
  },
  componentName: string,
): Record<Slots, FinalSlotStyle> {
  const result = {} as Record<Slots, FinalSlotStyle>;

  for (const slot of slots) {
    const override = consumer.slotOverrides?.[slot];
    const isPublic = slotDefinitions[slot].public;

    // Validate: warn if consumer tries to override a private slot
    if (override && !isPublic) {
      warning(
        false,
        `${componentName}: Slot "${slot}" is internal and does not accept consumer style overrides. The override will be ignored.`,
      );
    }

    const consumerClassName = isPublic ? override?.className : undefined;
    const consumerStyleRaw = isPublic ? override?.style : undefined;

    // Root slot also gets root-level consumer overrides
    const isRoot = slot === ("root" as Slots);
    const mergedClassName = isRoot
      ? resolveClassName(consumerClassName, consumer.rootClassName)
      : consumerClassName;
    const mergedStyle = isRoot
      ? resolveStyle(consumerStyleRaw, consumer.rootStyle)
      : consumerStyleRaw
        ? { ...consumerStyleRaw }
        : undefined;

    result[slot] = applySlotOverride(
      internalClassNames[slot],
      resolvedStyles[slot],
      mergedClassName,
      mergedStyle,
    );
  }

  return result;
}

// ─── Helpers ────────────────────────────────────────────────────────

/** Converts resolved style properties to an inline-safe style record. */
function toInlineStyle(
  styles: Record<string, unknown>,
): Record<string, string | number> | undefined {
  const keys = Object.keys(styles);
  if (keys.length === 0) return undefined;
  const result: Record<string, string | number> = {};
  for (const key of keys) {
    const val = styles[key];
    if (typeof val === "string" || typeof val === "number") {
      result[key] = val;
    } else if (typeof val === "object" && val !== null && "token" in val) {
      // TokenReference — skip for inline (handled by CSS classes)
      continue;
    }
  }
  return Object.keys(result).length > 0 ? result : undefined;
}
