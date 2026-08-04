/** Minimal node-like interface for owner resolution — no DOM dependency. */
export interface OwnerNode {
  ownerDocument?: OwnerDocument | null;
  defaultView?: OwnerWindow | null;
  nodeType?: number;
}

/** Minimal document-like interface. */
export interface OwnerDocument {
  defaultView?: OwnerWindow | null;
  nodeType?: number;
}

/** Minimal window-like interface. */
export interface OwnerWindow {
  document?: OwnerDocument;
}

// nodeType constants
const DOCUMENT_NODE = 9;

/**
 * Returns the ownerDocument for a given node.
 * - If `node` is a document, returns it directly.
 * - If `node` is an element, returns its `ownerDocument`.
 * - If `node` is null/undefined or has no owner, returns undefined.
 *
 * Never accesses the global `document`.
 */
export function getOwnerDocument(node: OwnerNode | null | undefined): OwnerDocument | undefined {
  if (node == null) return undefined;

  // If node IS a document
  if (node.nodeType === DOCUMENT_NODE) {
    return node;
  }

  return node.ownerDocument ?? undefined;
}

/**
 * Returns the ownerWindow (defaultView) for a given node.
 * - If `node` is a window, returns it directly.
 * - Resolves through ownerDocument.defaultView.
 * - If `node` is null/undefined or has no window, returns undefined.
 *
 * Never accesses the global `window`.
 */
export function getOwnerWindow(node: OwnerNode | null | undefined): OwnerWindow | undefined {
  if (node == null) return undefined;

  // If node looks like a window (has document property but no ownerDocument)
  if ("document" in node && node.ownerDocument === undefined) {
    return node as unknown as OwnerWindow;
  }

  // If node IS a document
  if (node.nodeType === DOCUMENT_NODE) {
    return (node as OwnerDocument).defaultView ?? undefined;
  }

  // Element → ownerDocument → defaultView
  const doc = node.ownerDocument;
  return doc?.defaultView ?? undefined;
}
