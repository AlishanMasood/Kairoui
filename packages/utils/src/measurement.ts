/**
 * DOM measurement utilities.
 *
 * Limitations:
 * - Computed styles require a live DOM (returns empty/default on server).
 * - getBoundingClientRect is only available on rendered elements.
 * - Visibility checks cannot detect `opacity: 0` or `clip-path` hiding.
 */

/** Minimal element for style/measurement queries. */
export interface MeasurableElement {
  getBoundingClientRect?: () => DOMRectLike;
  getComputedStyle?: never; // getComputedStyle lives on the window
  offsetWidth?: number;
  offsetHeight?: number;
  clientWidth?: number;
  clientHeight?: number;
  scrollWidth?: number;
  scrollHeight?: number;
}

/** Minimal window for getComputedStyle access. */
export interface MeasurableWindow {
  getComputedStyle?: (el: unknown) => StyleDeclaration;
  innerWidth?: number;
  innerHeight?: number;
}

/** Minimal style declaration. */
export interface StyleDeclaration {
  getPropertyValue?: (prop: string) => string;
  [key: string]: unknown;
}

/** Bounding rectangle shape. */
export interface DOMRectLike {
  top: number;
  right: number;
  bottom: number;
  left: number;
  width: number;
  height: number;
}

const EMPTY_RECT: DOMRectLike = { top: 0, right: 0, bottom: 0, left: 0, width: 0, height: 0 };

/**
 * Returns the bounding client rect for an element.
 * Returns a zero rect if the element or method is unavailable (SSR-safe).
 */
export function getElementRect(element: MeasurableElement | null | undefined): DOMRectLike {
  if (element == null || typeof element.getBoundingClientRect !== "function") {
    return EMPTY_RECT;
  }
  return element.getBoundingClientRect();
}

/**
 * Returns the computed value of a CSS property.
 * Returns empty string if unavailable (SSR-safe).
 */
export function getComputedStyleValue(
  win: MeasurableWindow | null | undefined,
  element: unknown,
  property: string,
): string {
  if (win == null || typeof win.getComputedStyle !== "function") return "";
  const styles = win.getComputedStyle(element);
  if (styles.getPropertyValue) {
    return styles.getPropertyValue(property);
  }
  const val = styles[property];
  return typeof val === "string" ? val : "";
}

/**
 * Parses a CSS pixel value string (e.g., "16px") to a number.
 * Returns 0 for non-pixel or unparseable values.
 */
export function parsePxValue(value: string): number {
  if (!value.endsWith("px")) return 0;
  const num = Number.parseFloat(value);
  return Number.isFinite(num) ? num : 0;
}

/**
 * Approximates whether an element is visible (non-zero dimensions).
 * Cannot detect CSS visibility:hidden or opacity:0.
 */
export function isElementVisible(element: MeasurableElement | null | undefined): boolean {
  if (element == null) return false;
  const rect = getElementRect(element);
  return rect.width > 0 && rect.height > 0;
}

/**
 * Returns true if the element's content overflows vertically.
 */
export function hasOverflowY(element: MeasurableElement | null | undefined): boolean {
  if (element == null) return false;
  return (element.scrollHeight ?? 0) > (element.clientHeight ?? 0);
}

/**
 * Returns true if the element's content overflows horizontally.
 */
export function hasOverflowX(element: MeasurableElement | null | undefined): boolean {
  if (element == null) return false;
  return (element.scrollWidth ?? 0) > (element.clientWidth ?? 0);
}

/**
 * Returns the viewport rectangle (inner dimensions of the window).
 * Returns zero rect on server.
 */
export function getViewportRect(win: MeasurableWindow | null | undefined): DOMRectLike {
  if (win == null) return EMPTY_RECT;
  const w = win.innerWidth ?? 0;
  const h = win.innerHeight ?? 0;
  return { top: 0, left: 0, right: w, bottom: h, width: w, height: h };
}

/**
 * Returns true if the child rect is fully contained within the parent rect.
 */
export function isRectContained(parent: DOMRectLike, child: DOMRectLike): boolean {
  return (
    child.top >= parent.top &&
    child.left >= parent.left &&
    child.bottom <= parent.bottom &&
    child.right <= parent.right
  );
}
