/**
 * Cross-document-safe DOM type guards.
 * These do NOT rely on global constructors (e.g., `instanceof HTMLElement`)
 * because iframe elements use different constructor references.
 * Instead, they use duck-typing via nodeType and nodeName checks.
 */

// nodeType constants
const ELEMENT_NODE = 1;
const DOCUMENT_NODE = 9;
const DOCUMENT_FRAGMENT_NODE = 11;

/** Returns true if value is a DOM Node (has nodeType). */
export function isNode(value: unknown): boolean {
  return (
    value != null &&
    typeof value === "object" &&
    "nodeType" in value &&
    typeof value.nodeType === "number"
  );
}

/** Returns true if value is a DOM Element (nodeType === 1). */
export function isElement(value: unknown): boolean {
  return isNode(value) && (value as { nodeType: number }).nodeType === ELEMENT_NODE;
}

/** Returns true if value is an HTMLElement (Element with tagName and style). */
export function isHTMLElement(value: unknown): boolean {
  if (!isElement(value)) return false;
  const el = value as Record<string, unknown>;
  return typeof el["tagName"] === "string" && "style" in el;
}

/** Returns true if value is an SVGElement (Element in SVG namespace). */
export function isSVGElement(value: unknown): boolean {
  if (!isElement(value)) return false;
  const el = value as Record<string, unknown>;
  return typeof el["namespaceURI"] === "string" && el["namespaceURI"].includes("svg");
}

/** Returns true if value is a Document node (nodeType === 9). */
export function isDocument(value: unknown): boolean {
  return isNode(value) && (value as { nodeType: number }).nodeType === DOCUMENT_NODE;
}

/** Returns true if value looks like a Window (has document and self reference). */
export function isWindow(value: unknown): boolean {
  if (value == null || typeof value !== "object") return false;
  const obj = value as Record<string, unknown>;
  return "document" in obj && "self" in obj && obj["self"] === value;
}

/** Returns true if value is a ShadowRoot (DocumentFragment with host). */
export function isShadowRoot(value: unknown): boolean {
  if (!isNode(value)) return false;
  const node = value as { nodeType: number } & Record<string, unknown>;
  return node.nodeType === DOCUMENT_FRAGMENT_NODE && "host" in node;
}
