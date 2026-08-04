import { useCallback, useRef, useEffect } from "react";
import { useControlled } from "./use-controlled";

export interface UseControllableStateOptions<T> {
  /** Controlled value. If defined, component is controlled. */
  value: T | undefined;
  /** Default value for uncontrolled mode. */
  defaultValue: T;
  /** Called when the value changes. Receives the new value. */
  onChange?: (value: T) => void;
  /** Custom equality function. Defaults to Object.is. */
  isEqual?: (a: T, b: T) => boolean;
  /** Component name for development warnings. */
  name?: string;
  /** State name for development warnings. */
  state?: string;
}

export type UseControllableStateResult<T> = [T, (next: T | ((prev: T) => T)) => void];

/**
 * Higher-level controllable state hook with change callback.
 *
 * - Controlled: `setValue` calls `onChange` with the new value (does not own state).
 * - Uncontrolled: `setValue` updates internal state and calls `onChange`.
 * - Skips `onChange` when value does not change (per equality comparator).
 * - Setter is stable.
 * - Always uses the latest `onChange` callback (no stale closures).
 */
export function useControllableState<T>(
  options: UseControllableStateOptions<T>,
): UseControllableStateResult<T> {
  const {
    value: controlled,
    defaultValue,
    onChange,
    isEqual = Object.is,
    name = "Component",
    state = "value",
  } = options;

  const [currentValue, setInternalValue] = useControlled({
    controlled,
    defaultValue,
    name,
    state,
  });

  // Keep latest refs for onChange and isEqual to avoid stale closures
  const onChangeRef = useRef(onChange);
  const isEqualRef = useRef(isEqual);
  const valueRef = useRef(currentValue);

  useEffect(() => {
    onChangeRef.current = onChange;
    isEqualRef.current = isEqual;
    valueRef.current = currentValue;
  });

  const setValue = useCallback(
    (next: T | ((prev: T) => T)) => {
      const prevValue = valueRef.current;
      const nextValue = typeof next === "function" ? (next as (prev: T) => T)(prevValue) : next;

      if (isEqualRef.current(prevValue, nextValue)) return;

      setInternalValue(nextValue);
      onChangeRef.current?.(nextValue);
    },
    [setInternalValue],
  );

  return [currentValue, setValue];
}
