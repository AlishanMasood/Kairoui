/** Minimal document-like interface for active element queries. */
export interface ActiveElementDocument {
  activeElement?: ActiveElementNode | null;
}

/** Minimal node-like interface for active element traversal. */
export interface ActiveElementNode {
  shadowRoot?: ActiveElementDocument | null;
  contains?: (node: ActiveElementNode | null) => boolean;
}

/**
 * Returns the active (focused) element for a given document.
 * Returns null if no element is focused or if document is unavailable.
 * Never accesses global `document`.
 */
export function getActiveElement(
  doc: ActiveElementDocument | null | undefined,
): ActiveElementNode | null {
  if (doc == null) return null;
  return doc.activeElement ?? null;
}

/**
 * Returns the deepest active element, traversing through shadow roots.
 * Useful when focus is inside a shadow DOM.
 */
export function getDeepActiveElement(
  doc: ActiveElementDocument | null | undefined,
): ActiveElementNode | null {
  let active = getActiveElement(doc);
  if (active == null) return null;

  while (active.shadowRoot?.activeElement != null) {
    active = active.shadowRoot.activeElement;
  }

  return active;
}

/**
 * Returns true if the given element contains the active element.
 * Uses the element's `contains` method if available.
 */
export function containsActiveElement(
  element: ActiveElementNode | null | undefined,
  doc: ActiveElementDocument | null | undefined,
): boolean {
  if (element == null || doc == null) return false;
  const active = getDeepActiveElement(doc);
  if (active == null) return false;
  if (active === element) return true;
  if (typeof element.contains === "function") {
    return element.contains(active);
  }
  return false;
}

/**
 * Returns true if the given element or any of its descendants has focus.
 * Equivalent to the :focus-within CSS pseudo-class check.
 */
export function hasFocusWithin(
  element: ActiveElementNode | null | undefined,
  doc: ActiveElementDocument | null | undefined,
): boolean {
  return containsActiveElement(element, doc);
}
