import { cx, mergeAriaTokenList, composeRefs } from "@kairoui/utils";
import type { AssignableRef } from "@kairoui/utils";
import { composeEventHandlers } from "@kairoui/utils/events";
import type { ComposableEvent } from "@kairoui/utils/events";
import { mergeStyles } from "./merge-styles";
import type { StyleSource } from "./merge-styles";

/** ARIA token-list attributes that should be reconciled (not overridden). */
const ARIA_TOKEN_LISTS = new Set([
  "aria-labelledby",
  "aria-describedby",
  "aria-controls",
  "aria-owns",
  "aria-errormessage",
]);

/** Props with event handler semantics (on* keys). */
function isEventHandler(key: string): boolean {
  return (
    key.length > 2 && key.startsWith("on") && key.charCodeAt(2) >= 65 && key.charCodeAt(2) <= 90
  );
}

/**
 * Merges two prop objects with composition-layer semantics.
 *
 * This is the core prop-merging primitive used by every KairoUI component.
 * It applies the correct strategy for each prop category:
 *
 * - className: merged (concatenated)
 * - style: shallow-merged (later wins per-property)
 * - event handlers (on*): composed (base first, override can cancel via preventDefault)
 * - ref: composed (both receive the element)
 * - ARIA token-lists: reconciled (deduplicated, both included)
 * - data-* attributes: merged (override wins per-key)
 * - All other props: override (later wins)
 *
 * @param base - Lower-priority props (internal, defaults)
 * @param override - Higher-priority props (consumer)
 * @returns Merged props
 */
export function mergeProps<B extends Record<string, unknown>, O extends Record<string, unknown>>(
  base: B,
  override: O,
): B & O {
  const result: Record<string, unknown> = { ...base };

  for (const key of Object.keys(override)) {
    const baseValue = result[key];
    const overrideValue = (override as Record<string, unknown>)[key];

    // Skip undefined overrides (don't erase base)
    if (overrideValue === undefined) continue;

    // className: merge
    if (key === "className") {
      result[key] = cx(baseValue as string | undefined, overrideValue as string | undefined);
      continue;
    }

    // style: shallow merge
    if (key === "style") {
      result[key] = mergeStyles(baseValue as StyleSource, overrideValue as StyleSource);
      continue;
    }

    // ref: compose
    if (key === "ref") {
      result[key] = composeRefs(
        baseValue as AssignableRef<unknown>,
        overrideValue as AssignableRef<unknown>,
      );
      continue;
    }

    // ARIA token-list attributes: reconcile
    if (ARIA_TOKEN_LISTS.has(key)) {
      result[key] = mergeAriaTokenList(
        baseValue as string | undefined,
        overrideValue as string | undefined,
      );
      continue;
    }

    // Event handlers: compose (base runs first, override can cancel)
    if (
      isEventHandler(key) &&
      typeof baseValue === "function" &&
      typeof overrideValue === "function"
    ) {
      result[key] = composeEventHandlers(
        overrideValue as (event: ComposableEvent) => void,
        baseValue as (event: ComposableEvent) => void,
      );
      continue;
    }

    // data-* attributes: override per-key (handled naturally by spread)
    // All other props: override
    result[key] = overrideValue;
  }

  return result as B & O;
}

/**
 * Merges multiple prop objects left to right with composition semantics.
 * Later sources have higher priority.
 */
export function mergePropsAll(
  ...sources: readonly Record<string, unknown>[]
): Record<string, unknown> {
  if (sources.length === 0) return {};
  if (sources.length === 1) return sources[0] ?? {};

  let result = sources[0] ?? {};
  for (let i = 1; i < sources.length; i++) {
    const src = sources[i];
    if (src) result = mergeProps(result, src);
  }
  return result;
}
