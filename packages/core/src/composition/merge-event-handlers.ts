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
  const handlers = [
    sources.consumer,
    sources.slot,
    sources.accessibility,
    sources.internal,
    sources.child,
  ].filter((h): h is (event: E) => void => h != null);

  if (handlers.length === 0) return undefined;
  if (handlers.length === 1) return handlers[0];

  // For two handlers, reuse the Phase 4 utility directly
  if (handlers.length === 2) {
    return composeEventHandlers(handlers[0], handlers[1], { checkDefaultPrevented });
  }

  // For 3+ handlers, chain them with defaultPrevented checks
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
