/**
 * A callback ref function. May return a cleanup function (React 19+).
 */
export type CallbackRef<T> = (instance: T | null) => unknown;

/** A mutable ref object (like React.MutableRefObject). */
export interface MutableRefObject<T> {
  current: T;
}

/** Any supported ref type: callback, mutable object, or null/undefined. */
export type AssignableRef<T> = CallbackRef<T> | MutableRefObject<T | null> | null | undefined;

/**
 * Assigns a value to a ref, handling both callback refs and object refs.
 * - Callback refs: calls the function with the value.
 * - Object refs: sets `.current` to the value.
 * - Null/undefined refs: no-op.
 *
 * Does not swallow errors from callback refs.
 */
export function assignRef<T>(ref: AssignableRef<T>, value: T | null): void {
  if (ref == null) return;

  if (typeof ref === "function") {
    ref(value);
  } else {
    ref.current = value;
  }
}

/**
 * Composes multiple refs into a single callback ref.
 * Assigns the value to each ref in order. Null/undefined refs are skipped.
 * Errors from individual refs are not swallowed.
 */
export function composeRefs<T>(...refs: readonly AssignableRef<T>[]): (instance: T | null) => void {
  return (instance: T | null) => {
    for (const ref of refs) {
      assignRef(ref, instance);
    }
  };
}
