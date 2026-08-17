import { useCallback, useRef } from "react";
import type { RegisteredItem } from "./use-collection";

export interface UseTypeaheadOptions {
  /** Items to search through. */
  items: readonly RegisteredItem[];
  /** Timeout in ms before the search buffer resets. Defaults to 500. */
  timeout?: number;
  /** Called when a match is found. */
  onMatch?: (value: string) => void;
}

export interface TypeaheadState {
  /** Process a single character input. Returns matched item value or undefined. */
  search: (char: string) => string | undefined;
  /** Reset the search buffer immediately. */
  reset: () => void;
}

/**
 * Reusable typeahead (type-to-select) matching for collection-based components.
 *
 * Features:
 * - Character accumulation with configurable debounce
 * - Case-insensitive prefix matching against item labels
 * - Disabled-item skipping
 * - Repeated-character cycling: typing "aaa" cycles through items starting with "a"
 * - Deterministic: first matching item wins; cycling advances through matches
 */
export function useTypeahead(options: UseTypeaheadOptions): TypeaheadState {
  const { items, timeout = 500, onMatch } = options;

  const bufferRef = useRef("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastMatchIndexRef = useRef(-1);

  const resetTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    resetTimer();
    bufferRef.current = "";
    lastMatchIndexRef.current = -1;
  }, [resetTimer]);

  const search = useCallback(
    (char: string): string | undefined => {
      resetTimer();

      bufferRef.current += char.toLowerCase();
      const buffer = bufferRef.current;

      // Schedule reset after timeout
      timerRef.current = setTimeout(() => {
        bufferRef.current = "";
        lastMatchIndexRef.current = -1;
      }, timeout);

      const enabledItems = items.filter((i) => !i.disabled);
      if (enabledItems.length === 0) return undefined;

      // Repeated-character cycling: if buffer is all the same character (e.g., "aaa")
      const isRepeatedChar = buffer.length > 1 && buffer.split("").every((c) => c === buffer[0]);

      if (isRepeatedChar) {
        const singleChar = buffer[0] ?? "";
        const matches = enabledItems.filter((i) => i.label.toLowerCase().startsWith(singleChar));
        if (matches.length === 0) return undefined;

        // Cycle: advance past last match
        const cycleIndex = (lastMatchIndexRef.current + 1) % matches.length;
        lastMatchIndexRef.current = cycleIndex;
        const match = matches[cycleIndex];
        if (!match) return undefined;
        onMatch?.(match.value);
        return match.value;
      }

      // Standard prefix match
      const match = enabledItems.find((i) => i.label.toLowerCase().startsWith(buffer));

      if (match) {
        // Track index for cycling
        const matchIdx = enabledItems.findIndex((i) => i.value === match.value);
        lastMatchIndexRef.current = matchIdx;
        onMatch?.(match.value);
        return match.value;
      }

      // No match found — try with just the latest character (handles case where
      // accumulated buffer no longer matches anything but single char might)
      if (buffer.length > 1) {
        const singleMatch = enabledItems.find((i) =>
          i.label.toLowerCase().startsWith(char.toLowerCase()),
        );
        if (singleMatch) {
          bufferRef.current = char.toLowerCase();
          const idx = enabledItems.findIndex((i) => i.value === singleMatch.value);
          lastMatchIndexRef.current = idx;
          onMatch?.(singleMatch.value);
          return singleMatch.value;
        }
      }

      return undefined;
    },
    [items, timeout, onMatch, resetTimer],
  );

  return { search, reset };
}
