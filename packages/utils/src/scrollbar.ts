/** Minimal element-like interface for scrollbar measurement. */
export interface ScrollableElement {
  offsetWidth?: number;
  clientWidth?: number;
  offsetHeight?: number;
  clientHeight?: number;
  scrollWidth?: number;
  scrollHeight?: number;
}

/** Minimal document-like interface for viewport scrollbar measurement. */
export interface ScrollbarDocument {
  createElement?: (tag: string) => ScrollbarMeasureElement;
  body?: { appendChild?: (el: unknown) => void; removeChild?: (el: unknown) => void };
  documentElement?: ScrollableElement;
}

/** Element used for scrollbar measurement. */
interface ScrollbarMeasureElement {
  style: Record<string, string>;
  offsetWidth?: number;
  clientWidth?: number;
}

/**
 * Measures the viewport scrollbar width by creating a temporary element.
 * Returns 0 on the server or when DOM APIs are unavailable.
 * Does not leave DOM artifacts.
 */
export function measureScrollbarWidth(doc?: ScrollbarDocument | null): number {
  if (doc == null || !doc.createElement || !doc.body?.appendChild || !doc.body.removeChild) {
    return 0;
  }

  const outer = doc.createElement("div");
  outer.style["overflow"] = "scroll";
  outer.style["width"] = "100px";
  outer.style["height"] = "100px";
  outer.style["position"] = "absolute";
  outer.style["top"] = "-9999px";
  outer.style["left"] = "-9999px";

  doc.body.appendChild(outer);
  const width = (outer.offsetWidth ?? 0) - (outer.clientWidth ?? 0);
  doc.body.removeChild(outer);

  return Math.max(0, width);
}

/**
 * Returns the scrollbar width for a specific element.
 * Vertical scrollbar width = offsetWidth - clientWidth.
 */
export function getElementScrollbarWidth(element: ScrollableElement | null | undefined): number {
  if (element == null) return 0;
  return Math.max(0, (element.offsetWidth ?? 0) - (element.clientWidth ?? 0));
}

/**
 * Returns the scrollbar height for a specific element (horizontal scrollbar).
 * Horizontal scrollbar height = offsetHeight - clientHeight.
 */
export function getElementScrollbarHeight(element: ScrollableElement | null | undefined): number {
  if (element == null) return 0;
  return Math.max(0, (element.offsetHeight ?? 0) - (element.clientHeight ?? 0));
}

/** Returns true if the element has a vertical scrollbar. */
export function hasVerticalScrollbar(element: ScrollableElement | null | undefined): boolean {
  if (element == null) return false;
  return (element.scrollHeight ?? 0) > (element.clientHeight ?? 0);
}

/** Returns true if the element has a horizontal scrollbar. */
export function hasHorizontalScrollbar(element: ScrollableElement | null | undefined): boolean {
  if (element == null) return false;
  return (element.scrollWidth ?? 0) > (element.clientWidth ?? 0);
}
