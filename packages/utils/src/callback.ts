/**
 * A stable callback container. The `call` method always invokes the latest
 * function set via `update`, while maintaining a stable reference identity.
 *
 * This is the framework-independent foundation for React's useEventCallback pattern.
 * It provides value outside React for event listener registrations, configuration
 * callbacks, and any scenario where a stable callable reference must always
 * dispatch to the latest implementation.
 */
export interface StableCallback<T extends (...args: never[]) => unknown> {
  /** Invoke the latest callback. Preserves arguments, return type, and errors. */
  call: (...args: Parameters<T>) => ReturnType<T>;
  /** Update the stored callback to a new implementation. */
  update: (fn: T) => void;
}

/**
 * Creates a stable callback container.
 * The returned `call` function always invokes the latest function provided via `update`.
 * The `call` reference itself never changes — safe to pass as an event listener.
 *
 * Errors from the callback are not swallowed.
 */
export function createStableCallback<T extends (...args: never[]) => unknown>(
  initial: T,
): StableCallback<T> {
  let current: T = initial;

  const call = (...args: Parameters<T>): ReturnType<T> => {
    return current(...args) as ReturnType<T>;
  };

  const update = (fn: T): void => {
    current = fn;
  };

  return { call: call, update };
}

/**
 * An event callback container that supports optional (possibly undefined) callbacks
 * and a disabled state. The `invoke` reference is stable.
 */
export interface EventCallback<T extends (...args: never[]) => unknown> {
  /** Invoke the current callback if present and not disabled. Returns undefined when skipped. */
  invoke: (...args: Parameters<T>) => ReturnType<T> | undefined;
  /** Update the stored callback. Pass undefined to clear. */
  update: (fn: T | undefined) => void;
  /** Enable or disable invocation. When disabled, invoke is a no-op. */
  setDisabled: (disabled: boolean) => void;
  /** Whether the callback is currently disabled. */
  readonly disabled: boolean;
}

/**
 * Creates an event callback container.
 *
 * - If no callback is set (undefined), `invoke` is a no-op returning undefined.
 * - If disabled, `invoke` is a no-op returning undefined.
 * - Otherwise, `invoke` calls the latest callback with all arguments.
 * - The `invoke` reference identity is stable — safe for event listener registration.
 * - Errors from the callback are not swallowed.
 */
export function createEventCallback<T extends (...args: never[]) => unknown>(
  initial?: T,
): EventCallback<T> {
  let current: T | undefined = initial;
  let isDisabled = false;

  const invoke = (...args: Parameters<T>): ReturnType<T> | undefined => {
    if (isDisabled || current == null) return undefined;
    return current(...args) as ReturnType<T>;
  };

  const update = (fn: T | undefined): void => {
    current = fn;
  };

  const setDisabled = (disabled: boolean): void => {
    isDisabled = disabled;
  };

  return {
    invoke: invoke,
    update,
    setDisabled,
    get disabled() {
      return isDisabled;
    },
  };
}
