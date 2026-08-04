import { useState, useCallback, useRef, useEffect } from "react";
import { warnOnce } from "@kairoui/utils";

export interface UseControlledOptions<T> {
  /** The controlled value. If defined, the component is controlled. */
  controlled: T | undefined;
  /** The default value for uncontrolled mode. Used only on initial render. */
  defaultValue: T;
  /** Component name for development warnings. */
  name: string;
  /** State name for development warnings (e.g., "value", "open"). */
  state?: string;
}

export type UseControlledResult<T> = [T, (newValue: T | ((prev: T) => T)) => void];

/**
 * Hook for controlled/uncontrolled component patterns.
 *
 * - If `controlled` is defined, the component is controlled and `setValue` is a no-op
 *   (the parent must update `controlled`).
 * - If `controlled` is undefined, the component is uncontrolled and manages its own state.
 * - Warns in development if the component switches between controlled and uncontrolled.
 */
export function useControlled<T>(options: UseControlledOptions<T>): UseControlledResult<T> {
  const { controlled, defaultValue, name, state = "value" } = options;

  const isControlled = controlled !== undefined;
  const wasControlledRef = useRef(isControlled);

  // Warn on controlled/uncontrolled switching (in effect, not render phase)
  useEffect(() => {
    if (wasControlledRef.current !== isControlled) {
      warnOnce(
        `${name}-${state}-switch`,
        `${name}: A component is changing ${wasControlledRef.current ? "a controlled" : "an uncontrolled"} ${state} to be ${isControlled ? "controlled" : "uncontrolled"}. ` +
          `Decide between using a controlled or uncontrolled ${state} for the lifetime of the component.`,
      );
    }
  });

  // Internal state for uncontrolled mode (initialized only once)
  const [internalValue, setInternalValue] = useState<T>(defaultValue);

  const value = isControlled ? controlled : internalValue;

  const setValue = useCallback((newValue: T | ((prev: T) => T)) => {
    if (!wasControlledRef.current) {
      setInternalValue(newValue);
    }
  }, []);

  return [value, setValue];
}
