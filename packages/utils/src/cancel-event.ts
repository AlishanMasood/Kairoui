/** Minimal event shape for cancellation helpers — no React or DOM dependency. */
export interface CancelableEventLike {
  defaultPrevented: boolean;
  cancelable?: boolean;
  preventDefault?: () => void;
  stopPropagation?: () => void;
  stopImmediatePropagation?: () => void;
}

/** Returns true if the event's default action has already been prevented. */
export function isDefaultPrevented(event: CancelableEventLike): boolean {
  return event.defaultPrevented;
}

/** Returns true if the event is cancelable (default action can be prevented). */
export function isCancelable(event: CancelableEventLike): boolean {
  return event.cancelable !== false;
}

/**
 * Calls preventDefault on the event if it is cancelable and not already prevented.
 * Returns true if preventDefault was called, false otherwise.
 */
export function preventDefaultIfNeeded(event: CancelableEventLike): boolean {
  if (event.cancelable === false) return false;
  if (event.defaultPrevented) return false;
  event.preventDefault?.();
  return true;
}

/**
 * Calls stopPropagation on the event if the method exists.
 * Returns true if stopPropagation was called.
 */
export function stopPropagationIfNeeded(event: CancelableEventLike): boolean {
  if (event.stopPropagation == null) return false;
  event.stopPropagation();
  return true;
}

/**
 * Calls both preventDefault and stopPropagation on the event.
 * Only acts if the event is cancelable and the methods exist.
 */
export function cancelEvent(event: CancelableEventLike): void {
  preventDefaultIfNeeded(event);
  stopPropagationIfNeeded(event);
}
