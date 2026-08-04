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
