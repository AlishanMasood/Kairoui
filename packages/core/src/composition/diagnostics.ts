import { warning, warnOnce } from "@kairoui/utils";
import type { ElementType } from "react";

/**
 * Composition diagnostics — development-only warnings for invalid usage patterns.
 * All functions are no-ops in production (tree-shaken via process.env.NODE_ENV).
 */

/** Warns if `as` prop is an invalid element type. */
export function warnInvalidPolymorphicTarget(componentName: string, target: unknown): void {
  if (typeof target === "string" && target.length > 0) return; // valid intrinsic
  if (typeof target === "function") return; // valid component
  if (typeof target === "object" && target !== null && "$$typeof" in target) return; // valid forwardRef/memo

  warning(
    false,
    `${componentName}: Invalid \`as\` prop value. Expected a valid HTML element string or React component, received ${typeof target}.`,
  );
}

/** Warns on conflicting `as` + `asChild` (once per component). */
export function warnAsChildConflict(componentName: string): void {
  warnOnce(
    `${componentName}:as+asChild`,
    `${componentName}: Both \`as\` and \`asChild\` were provided. \`asChild\` takes precedence; \`as\` is ignored.`,
  );
}

/** Warns when asChild receives invalid children. */
export function warnAsChildInvalidChildren(
  componentName: string,
  childCount: number,
  childType: string,
): void {
  if (childCount === 0) {
    warning(
      false,
      `${componentName}: \`asChild\` requires exactly one React element child, but received 0 children.`,
    );
  } else if (childCount > 1) {
    warning(
      false,
      `${componentName}: \`asChild\` requires exactly one React element child, but received ${String(childCount)} children. Only the first element will be used.`,
    );
  } else if (childType !== "element") {
    warning(
      false,
      `${componentName}: \`asChild\` requires a React element child, but received ${childType}. The component will render its default element instead.`,
    );
  }
}

/** Warns when a slot replacement targets a non-public (internal) slot. */
export function warnInternalSlotReplacement(componentName: string, slotName: string): void {
  warning(
    false,
    `${componentName}: Slot "${slotName}" is internal and cannot be replaced by consumers. This replacement will be ignored.`,
  );
}

/** Warns when a slot replacement uses an invalid element type. */
export function warnInvalidSlotReplacement(
  componentName: string,
  slotName: string,
  replacement: unknown,
): void {
  warning(
    false,
    `${componentName}: Invalid replacement for slot "${slotName}". Expected a valid element type (HTML tag string, React component, or forwardRef), received ${typeof replacement}.`,
  );
}

/** Warns when an unknown slot name is used. */
export function warnUnknownSlot(
  componentName: string,
  slotName: string,
  availableSlots: readonly string[],
): void {
  warning(
    false,
    `${componentName}: Unknown slot "${slotName}". Available slots: ${availableSlots.join(", ")}.`,
  );
}

/** Warns when a required slot is missing from render output. */
export function warnMissingRequiredSlot(componentName: string, slotName: string): void {
  warning(
    false,
    `${componentName}: Required slot "${slotName}" was not rendered. This may cause the component to appear broken.`,
  );
}

/** Warns when a consumer attempts to override a protected accessibility prop. */
export function warnProtectedPropConflict(
  componentName: string,
  propName: string,
  internalValue: unknown,
  consumerValue: unknown,
): void {
  warnOnce(
    `${componentName}:protected:${propName}`,
    `${componentName}: Consumer provided "${propName}=${String(consumerValue)}" which conflicts with the internal value "${String(internalValue)}". The internal value is required for accessibility and will be preserved.`,
  );
}

/** Warns when a slot replacement doesn't forward refs. */
export function warnSlotRefNotForwarded(
  componentName: string,
  slotName: string,
  replacementName: string,
): void {
  warnOnce(
    `${componentName}:ref:${slotName}`,
    `${componentName}: Slot "${slotName}" replacement "${replacementName}" does not appear to support ref forwarding. Use React.forwardRef() to wrap your component if ref access is needed.`,
  );
}

/** Validates a polymorphic target and returns whether it's valid. */
export function isValidElementType(target: unknown): target is ElementType {
  if (typeof target === "string" && target.length > 0) return true;
  if (typeof target === "function") return true;
  if (typeof target === "object" && target !== null && "$$typeof" in target) return true;
  return false;
}
