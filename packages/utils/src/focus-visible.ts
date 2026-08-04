/**
 * Focus-visible modality tracking.
 *
 * Tracks whether the current input modality is keyboard-based,
 * which determines if focus should be visually indicated.
 *
 * Uses the same heuristic as browsers' native :focus-visible:
 * - Keyboard navigation (Tab, arrows, etc.) → focus IS visible
 * - Pointer interaction (mouse, touch) → focus is NOT visible
 * - Programmatic focus → follows the last modality
 */

/** Input modality: how the user last interacted. */
export type InputModality = "keyboard" | "pointer";

export interface FocusVisibleState {
  /** Current input modality. */
  getModality: () => InputModality;
  /** Whether the current focus should be visually indicated. */
  isFocusVisible: () => boolean;
  /** Start tracking. Returns a cleanup function. */
  observe: () => () => void;
}

// Keys that indicate keyboard navigation
const KEYBOARD_KEYS = new Set([
  "Tab",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "Home",
  "End",
  "PageUp",
  "PageDown",
  "Enter",
  " ",
  "Escape",
]);

/** Minimal event interfaces for framework independence. */
export interface FocusVisibleDocument {
  addEventListener?: (type: string, handler: (event: unknown) => void, options?: unknown) => void;
  removeEventListener?: (
    type: string,
    handler: (event: unknown) => void,
    options?: unknown,
  ) => void;
}

export interface FocusVisibleKeyEvent {
  key?: string;
  metaKey?: boolean;
  ctrlKey?: boolean;
  altKey?: boolean;
}

/**
 * Creates a focus-visible state tracker for a given document.
 * Call `observe()` to start listening, and the returned cleanup to stop.
 * SSR-safe: if document is null/missing event APIs, observe is a no-op.
 */
export function createFocusVisibleTracker(doc?: FocusVisibleDocument | null): FocusVisibleState {
  let modality: InputModality = "pointer";

  const getModality = (): InputModality => modality;
  const isFocusVisible = (): boolean => modality === "keyboard";

  const observe = (): (() => void) => {
    if (!doc?.addEventListener || !doc.removeEventListener) {
      return () => {};
    }

    const add = doc.addEventListener.bind(doc);
    const remove = doc.removeEventListener.bind(doc);

    const handleKeyDown = (event: unknown) => {
      const e = event as FocusVisibleKeyEvent;
      // Ignore modifier-only keypresses
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key && KEYBOARD_KEYS.has(e.key)) {
        modality = "keyboard";
      }
    };

    const handlePointerDown = () => {
      modality = "pointer";
    };

    const handleVisibilityChange = () => {
      // Reset to pointer when window regains visibility (avoids stale keyboard state)
      modality = "pointer";
    };

    add("keydown", handleKeyDown, true);
    add("pointerdown", handlePointerDown, true);
    add("mousedown", handlePointerDown, true);
    add("visibilitychange", handleVisibilityChange);

    return () => {
      remove("keydown", handleKeyDown, true);
      remove("pointerdown", handlePointerDown, true);
      remove("mousedown", handlePointerDown, true);
      remove("visibilitychange", handleVisibilityChange);
    };
  };

  return { getModality, isFocusVisible, observe };
}
