// @kairoui/utils/events — Event composition utilities

/** Minimal event shape required for composition (no React dependency). */
export interface ComposableEvent {
  defaultPrevented: boolean;
}

export interface ComposeEventHandlersOptions {
  /**
   * When true (default), the internal handler is skipped if the consumer
   * handler calls `event.preventDefault()`.
   */
  checkDefaultPrevented?: boolean;
}

/**
 * Composes a consumer event handler with an internal handler.
 *
 * - Consumer handler runs first.
 * - If `checkDefaultPrevented` is true (default) and the consumer calls
 *   `event.preventDefault()`, the internal handler is skipped.
 * - Both handlers receive the same event object (not mutated by this utility).
 * - Null/undefined handlers are safely skipped.
 * - Errors propagate — not swallowed.
 */
export function composeEventHandlers<E extends ComposableEvent>(
  userHandler: ((event: E) => void) | null | undefined,
  internalHandler: ((event: E) => void) | null | undefined,
  options: ComposeEventHandlersOptions = {},
): (event: E) => void {
  const { checkDefaultPrevented = true } = options;

  return (event: E): void => {
    if (userHandler != null) {
      userHandler(event);
    }

    if (checkDefaultPrevented && event.defaultPrevented) {
      return;
    }

    if (internalHandler != null) {
      internalHandler(event);
    }
  };
}

export {
  Keys,
  isEnterKey,
  isSpaceKey,
  isEscapeKey,
  isArrowKey,
  isActivationKey,
  hasModifier,
  isCtrlOrMeta,
  isPrintableKey,
  isNavigationKey,
} from "./keyboard";
export type { KeyboardEventLike } from "./keyboard";
