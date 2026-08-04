import { useState, useCallback, useEffect, useRef } from "react";
import { createFocusVisibleTracker } from "@kairoui/utils/dom";
import type { FocusVisibleState } from "@kairoui/utils/dom";
import { canUseDOM } from "@kairoui/utils";

export interface UseFocusVisibleResult {
  /** Whether the current focus should be visually indicated. */
  isFocusVisible: boolean;
  /** Props to spread on the element to track focus events. */
  focusProps: {
    onFocus: () => void;
    onBlur: () => void;
  };
}

/**
 * Hook that tracks whether focus should be visually indicated.
 *
 * Uses the same heuristic as :focus-visible:
 * - After keyboard interaction → focus IS visible
 * - After pointer interaction → focus is NOT visible
 *
 * Returns `isFocusVisible` and `focusProps` (onFocus/onBlur) to spread on the element.
 * SSR-safe: returns false on the server.
 */
export function useFocusVisible(): UseFocusVisibleResult {
  const [isFocusVisible, setIsFocusVisible] = useState(false);
  const trackerRef = useRef<FocusVisibleState | null>(null);

  useEffect(() => {
    if (!canUseDOM()) return;
    const tracker = createFocusVisibleTracker(
      document as unknown as Parameters<typeof createFocusVisibleTracker>[0],
    );
    trackerRef.current = tracker;
    const cleanup = tracker.observe();
    return cleanup;
  }, []);

  const onFocus = useCallback(() => {
    setIsFocusVisible(trackerRef.current?.isFocusVisible() ?? false);
  }, []);

  const onBlur = useCallback(() => {
    setIsFocusVisible(false);
  }, []);

  return {
    isFocusVisible,
    focusProps: { onFocus, onBlur },
  };
}
