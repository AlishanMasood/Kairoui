import { composeEventHandlers } from "@kairoui/utils/events";
import type { ComposableEvent, ComposeEventHandlersOptions } from "@kairoui/utils/events";

/**
 * Handler source for composition-layer event merging.
 * A handler may be undefined (source not present) or a function.
 */
export type EventHandlerSource<E extends ComposableEvent> = ((event: E) => void) | null | undefined;

export interface MergeEventHandlersOptions {
  /**
   * When true (default), later handlers are skipped if an earlier handler
   * calls event.preventDefault().
   */
  checkDefaultPrevented?: boolean;
}

/**
 * Approved handler execution order (per KUI-COMP-003):
 * 1. Consumer root handler (runs first — can cancel)
 * 2. Consumer slot handler
 * 3. Accessibility handler (keyboard, ARIA patterns)
 * 4. Internal handler (component behavior)
 * 5. Future child handler (asChild target)
 *
 * At each boundary, if checkDefaultPrevented is true and the event
 * is already prevented, remaining handlers are skipped.
 */
export interface EventHandlerSources<E extends ComposableEvent> {
  consumer?: EventHandlerSource<E>;
  slot?: EventHandlerSource<E>;
  accessibility?: EventHandlerSource<E>;
  internal?: EventHandlerSource<E>;
  child?: EventHandlerSource<E>;
}

/**
 * Merges event handlers from multiple composition sources into a single handler.
 *
 * Execution order: consumer → slot → accessibility → internal → child
 * Cancellation: if checkDefaultPrevented (default true) and event.defaultPrevented
 *   becomes true after any handler, remaining handlers are skipped.
 * Errors: propagate immediately — subsequent handlers are NOT called after a throw.
 * `return false` is NOT treated as cancellation.
 */
export function mergeEventHandlers<E extends ComposableEvent>(
  sources: EventHandlerSources<E>,
  options: MergeEventHandlersOptions = {},
): ((event: E) => void) | undefined {
  const { checkDefaultPrevented = true } = options;

  // Avoid allocating an array for the common 0-1 handler case
  const a = sources.consumer ?? undefined;
  const b = sources.slot ?? undefined;
  const c = sources.accessibility ?? undefined;
  const d = sources.internal ?? undefined;
  const e = sources.child ?? undefined;

  let count = 0;
  let first: ((event: E) => void) | undefined;
  if (a) {
    count++;
    first = a;
  }
  if (b) {
    count++;
    first ??= b;
  }
  if (c) {
    count++;
    first ??= c;
  }
  if (d) {
    count++;
    first ??= d;
  }
  if (e) {
    count++;
    first ??= e;
  }

  if (count === 0) return undefined;
  if (count === 1) return first;

  // 2+ handlers: collect into array
  const handlers = [a, b, c, d, e].filter((h): h is (event: E) => void => h != null);

  if (count === 2) {
    return composeEventHandlers(handlers[0], handlers[1], { checkDefaultPrevented });
  }

  return (event: E): void => {
    for (const handler of handlers) {
      if (checkDefaultPrevented && event.defaultPrevented) return;
      handler(event);
    }
  };
}

/**
 * Simple two-source composition matching the Phase 4 pattern.
 * Consumer runs first; internal respects defaultPrevented.
 * Re-exported for convenience within the composition layer.
 */
export function composeHandlers<E extends ComposableEvent>(
  consumer: EventHandlerSource<E>,
  internal: EventHandlerSource<E>,
  options?: ComposeEventHandlersOptions,
): ((event: E) => void) | undefined {
  if (consumer == null && internal == null) return undefined;
  if (consumer == null && internal != null) return internal;
  if (internal == null && consumer != null) return consumer;
  return composeEventHandlers(consumer, internal, options);
}
