import { createElement } from "react";
import type { ReactElement, ReactNode } from "react";
import type { ResolvedSlotProps } from "./resolve-slot-props";

/**
 * Renders a single resolved slot as a React element.
 * Uses the resolved element type and merged props from slot prop composition.
 */
export function renderSlot(resolved: ResolvedSlotProps, children?: ReactNode): ReactElement {
  const props = children !== undefined ? { ...resolved.props, children } : resolved.props;
  return createElement(resolved.element, props);
}

/**
 * Conditionally renders an optional slot.
 * Returns null if `condition` is false (slot is not shown).
 */
export function renderOptionalSlot(
  resolved: ResolvedSlotProps,
  condition: boolean,
  children?: ReactNode,
): ReactElement | null {
  if (!condition) return null;
  return renderSlot(resolved, children);
}

/**
 * Renders multiple slots from a resolved map, returning a record of elements.
 * Optional slots can be excluded by providing a visibility map.
 */
export function renderSlots<Names extends string>(
  resolved: Record<Names, ResolvedSlotProps>,
  options?: {
    children?: Partial<Record<Names, ReactNode>>;
    visible?: Partial<Record<Names, boolean>>;
  },
): Record<Names, ReactElement | null> {
  const result = {} as Record<Names, ReactElement | null>;
  const { children, visible } = options ?? {};

  for (const name of Object.keys(resolved) as Names[]) {
    const isVisible = visible?.[name] !== false;
    if (!isVisible) {
      result[name] = null;
      continue;
    }
    result[name] = renderSlot(resolved[name], children?.[name]);
  }

  return result;
}
