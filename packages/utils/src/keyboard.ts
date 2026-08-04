/** Minimal keyboard event shape — no React or DOM dependency. */
export interface KeyboardEventLike {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
}

/** Named keys used across KairoUI components. */
export const Keys = {
  Enter: "Enter",
  Space: " ",
  Escape: "Escape",
  ArrowUp: "ArrowUp",
  ArrowDown: "ArrowDown",
  ArrowLeft: "ArrowLeft",
  ArrowRight: "ArrowRight",
  Home: "Home",
  End: "End",
  PageUp: "PageUp",
  PageDown: "PageDown",
  Tab: "Tab",
  Backspace: "Backspace",
  Delete: "Delete",
} as const;

/** Checks if the key is Enter. */
export function isEnterKey(event: KeyboardEventLike): boolean {
  return event.key === Keys.Enter;
}

/** Checks if the key is Space. */
export function isSpaceKey(event: KeyboardEventLike): boolean {
  return event.key === Keys.Space;
}

/** Checks if the key is Escape (or legacy "Esc"). */
export function isEscapeKey(event: KeyboardEventLike): boolean {
  return event.key === Keys.Escape || event.key === "Esc";
}

/** Checks if the key is an arrow key. */
export function isArrowKey(event: KeyboardEventLike): boolean {
  return (
    event.key === Keys.ArrowUp ||
    event.key === Keys.ArrowDown ||
    event.key === Keys.ArrowLeft ||
    event.key === Keys.ArrowRight
  );
}

/** Checks if the key is an activation key (Enter or Space). */
export function isActivationKey(event: KeyboardEventLike): boolean {
  return event.key === Keys.Enter || event.key === Keys.Space;
}

/** Checks if any modifier key is pressed (Ctrl, Shift, Alt, Meta). */
export function hasModifier(event: KeyboardEventLike): boolean {
  return Boolean(event.ctrlKey || event.shiftKey || event.altKey || event.metaKey);
}

/** Checks if the Ctrl key (or Cmd on Mac) is pressed. */
export function isCtrlOrMeta(event: KeyboardEventLike): boolean {
  return Boolean(event.ctrlKey || event.metaKey);
}

/**
 * Checks if the key is a printable character.
 * A key is printable if it's a single character (length 1) that is not a control character.
 */
export function isPrintableKey(event: KeyboardEventLike): boolean {
  if (event.key.length !== 1) return false;
  if (event.ctrlKey || event.metaKey) return false;
  const code = event.key.charCodeAt(0);
  return code >= 0x20;
}

/** Checks if the key is a navigation key (arrows, Home, End, PageUp, PageDown). */
export function isNavigationKey(event: KeyboardEventLike): boolean {
  return (
    isArrowKey(event) ||
    event.key === Keys.Home ||
    event.key === Keys.End ||
    event.key === Keys.PageUp ||
    event.key === Keys.PageDown
  );
}
