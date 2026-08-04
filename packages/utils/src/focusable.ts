/**
 * Focusable element utilities.
 *
 * Uses duck-typing interfaces — no global DOM constructors.
 * Does NOT detect CSS visibility (display:none, visibility:hidden) because
 * that requires computed styles which are unavailable without a live DOM.
 *
 * Limitations:
 * - Cannot detect `display: none` or `visibility: hidden` (requires getComputedStyle)
 * - Cannot detect elements inside `<details>` without open attribute
 * - SVG focusability varies by browser; we check tabIndex presence
 * - Browser-specific edge cases (e.g., audio/video without controls) may differ
 */

/** Minimal element-like interface for focusability checks. */
export interface FocusableElement {
  tagName?: string;
  tabIndex?: number;
  disabled?: boolean;
  hidden?: boolean;
  inert?: boolean;
  type?: string;
  href?: unknown;
  contentEditable?: string;
  controls?: boolean;
  getAttribute?: (name: string) => string | null;
}

// Tags that are natively focusable (when not disabled)
const FOCUSABLE_TAGS = new Set(["INPUT", "SELECT", "TEXTAREA", "BUTTON", "DETAILS", "SUMMARY"]);

// Form control tags where `disabled` removes focusability
const DISABLEABLE_TAGS = new Set(["INPUT", "SELECT", "TEXTAREA", "BUTTON", "FIELDSET"]);

/**
 * Returns the effective tabIndex for an element.
 * - Returns the explicit tabIndex if set.
 * - Returns 0 for natively focusable elements without explicit tabIndex.
 * - Returns -1 for elements that are not natively focusable.
 */
export function getTabIndex(element: FocusableElement): number {
  if (element.tabIndex !== undefined && element.tabIndex !== -1) {
    return element.tabIndex;
  }

  const tag = element.tagName?.toUpperCase() ?? "";

  // Check for explicit tabindex attribute via getAttribute
  if (element.getAttribute) {
    const attr = element.getAttribute("tabindex");
    if (attr !== null) {
      const parsed = Number.parseInt(attr, 10);
      if (!Number.isNaN(parsed)) return parsed;
    }
  }

  // Natively focusable elements default to 0
  if (isNativelyFocusable(element, tag)) {
    return 0;
  }

  return -1;
}

/**
 * Returns true if the element can receive focus programmatically.
 * Focusable elements include those with tabIndex >= -1 that are not disabled/hidden/inert.
 */
export function isFocusable(element: FocusableElement): boolean {
  if (isDisabledOrHidden(element)) return false;

  const tag = element.tagName?.toUpperCase() ?? "";

  // Elements with explicit tabIndex (even negative) are focusable
  if (hasExplicitTabIndex(element)) return true;

  // Natively focusable elements
  if (isNativelyFocusable(element, tag)) return true;

  // Contenteditable elements
  if (isContentEditable(element)) return true;

  return false;
}

/**
 * Returns true if the element is in the tab order (focusable via Tab key).
 * Tabbable = focusable + tabIndex >= 0.
 */
export function isTabbable(element: FocusableElement): boolean {
  if (!isFocusable(element)) return false;
  return getTabIndex(element) >= 0;
}

function isDisabledOrHidden(element: FocusableElement): boolean {
  if (element.hidden) return true;
  if (element.inert) return true;

  const tag = element.tagName?.toUpperCase() ?? "";
  if (element.disabled && DISABLEABLE_TAGS.has(tag)) return true;

  return false;
}

function hasExplicitTabIndex(element: FocusableElement): boolean {
  if (element.tabIndex !== undefined && element.tabIndex !== -1) return true;
  if (element.getAttribute) {
    return element.getAttribute("tabindex") !== null;
  }
  return false;
}

function isNativelyFocusable(element: FocusableElement, tag: string): boolean {
  // Standard focusable tags
  if (FOCUSABLE_TAGS.has(tag)) {
    // input[type=hidden] is not focusable
    if (tag === "INPUT" && element.type?.toLowerCase() === "hidden") return false;
    return true;
  }

  // Links with href
  if ((tag === "A" || tag === "AREA") && element.href != null) return true;

  // Audio/video with controls
  if ((tag === "AUDIO" || tag === "VIDEO") && element.controls) return true;

  return false;
}

function isContentEditable(element: FocusableElement): boolean {
  return element.contentEditable === "true" || element.contentEditable === "";
}
