import { useCallback, useEffect, useRef, useState } from "react";

export interface UseGlobalSearchOptions {
  readonly delayMs?: number;
  readonly initial?: string;
}

export interface UseGlobalSearchReturn {
  readonly input: string;
  readonly debounced: string;
  readonly setInput: (value: string) => void;
  readonly clear: () => void;
}

/**
 * Debounced global search state. DOM-free — wire `debounced` into
 * `useFilterState().setGlobalFilter` to run global filtering on quiescence.
 */
export function useGlobalSearch(options: UseGlobalSearchOptions = {}): UseGlobalSearchReturn {
  const { delayMs = 250, initial = "" } = options;
  const [input, setInputState] = useState(initial);
  const [debounced, setDebounced] = useState(initial);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timeoutRef.current !== null) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setDebounced(input);
      timeoutRef.current = null;
    }, delayMs);
    return () => {
      if (timeoutRef.current !== null) clearTimeout(timeoutRef.current);
    };
  }, [input, delayMs]);

  const setInput = useCallback((value: string) => {
    setInputState(value);
  }, []);

  const clear = useCallback(() => {
    setInputState("");
    setDebounced("");
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  return { input, debounced, setInput, clear };
}
