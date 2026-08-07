import type { ElementType } from "react";
import { mergeProps } from "./merge-props";
import type { SlotDefinition } from "./slot-definitions";

/** Consumer-provided slot overrides. */
export interface SlotOverrides<Names extends string> {
  /** Slot element replacements (e.g., { root: "a" }). */
  slots?: Partial<Record<Names, ElementType>>;
  /** Additional props per slot (merged with internal props). */
  slotProps?: Partial<Record<Names, Record<string, unknown>>>;
}

/** Result of resolving a single slot's props. */
export interface ResolvedSlotProps {
  /** The element to render for this slot. */
  element: ElementType;
  /** The merged props to pass to the element. */
  props: Record<string, unknown>;
}

/**
 * Resolves the props for a single slot by merging internal, consumer, and state sources.
 *
 * Merge order (per KUI-COMP-003 precedence):
 * 1. Internal base props (component logic)
 * 2. Accessibility props
 * 3. State-derived props
 * 4. Consumer slotProps (from slotProps.slotName)
 *
 * All merging uses `mergeProps` — events composed, ARIA reconciled, classes merged.
 */
export function resolveSlotProps(options: {
  definition: SlotDefinition;
  internalProps?: Record<string, unknown> | undefined;
  accessibilityProps?: Record<string, unknown> | undefined;
  stateProps?: Record<string, unknown> | undefined;
  consumerProps?: Record<string, unknown> | undefined;
  elementOverride?: ElementType | undefined;
}): ResolvedSlotProps {
  const {
    definition,
    internalProps = {},
    accessibilityProps = {},
    stateProps = {},
    consumerProps = {},
    elementOverride,
  } = options;

  // Merge in precedence order: internal < a11y < state < consumer
  let merged = mergeProps(internalProps, accessibilityProps);
  merged = mergeProps(merged, stateProps);
  merged = mergeProps(merged, consumerProps);

  // Add slot metadata
  merged["data-kui-slot"] = definition.slotName;

  return {
    element: elementOverride ?? definition.defaultElement,
    props: merged,
  };
}

/**
 * Resolves all slots for a component at once.
 * Returns a map of slot name → resolved element + props.
 */
export function resolveAllSlotProps<Names extends string>(options: {
  definitions: Readonly<Record<Names, SlotDefinition>>;
  internalProps?: Partial<Record<Names, Record<string, unknown>>>;
  accessibilityProps?: Partial<Record<Names, Record<string, unknown>>>;
  stateProps?: Partial<Record<Names, Record<string, unknown>>>;
  overrides?: SlotOverrides<Names>;
}): Record<Names, ResolvedSlotProps> {
  const { definitions, internalProps, accessibilityProps, stateProps, overrides } = options;
  const result = {} as Record<Names, ResolvedSlotProps>;

  for (const name of Object.keys(definitions) as Names[]) {
    result[name] = resolveSlotProps({
      definition: definitions[name],
      internalProps: internalProps?.[name],
      accessibilityProps: accessibilityProps?.[name],
      stateProps: stateProps?.[name],
      consumerProps: overrides?.slotProps?.[name],
      elementOverride: overrides?.slots?.[name],
    });
  }

  return result;
}
