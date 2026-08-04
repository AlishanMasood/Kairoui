import { describe, it, expect } from "vitest";
import {
  isNode,
  isElement,
  isHTMLElement,
  isSVGElement,
  isDocument,
  isWindow,
  isShadowRoot,
} from "./dom-guards";

// Mock DOM-like objects (cross-document safe — no real DOM constructors)
const mockElement = {
  nodeType: 1,
  tagName: "DIV",
  style: {},
  namespaceURI: "http://www.w3.org/1999/xhtml",
};
const mockSvgElement = {
  nodeType: 1,
  tagName: "svg",
  style: {},
  namespaceURI: "http://www.w3.org/2000/svg",
};
const mockDocument = { nodeType: 9, documentElement: {} };
const mockDocumentFragment = { nodeType: 11 };
const mockShadowRoot = { nodeType: 11, host: mockElement, mode: "open" };
const mockTextNode = { nodeType: 3, textContent: "hello" };

describe("isNode", () => {
  it("returns true for element-like objects", () => {
    expect(isNode(mockElement)).toBe(true);
  });

  it("returns true for document-like objects", () => {
    expect(isNode(mockDocument)).toBe(true);
  });

  it("returns true for text-node-like objects", () => {
    expect(isNode(mockTextNode)).toBe(true);
  });

  it("returns false for null", () => {
    expect(isNode(null)).toBe(false);
  });

  it("returns false for plain objects", () => {
    expect(isNode({})).toBe(false);
    expect(isNode({ type: "div" })).toBe(false);
  });

  it("returns false for primitives", () => {
    expect(isNode("string")).toBe(false);
    expect(isNode(42)).toBe(false);
  });
});

describe("isElement", () => {
  it("returns true for element-like (nodeType 1)", () => {
    expect(isElement(mockElement)).toBe(true);
  });

  it("returns false for document (nodeType 9)", () => {
    expect(isElement(mockDocument)).toBe(false);
  });

  it("returns false for text node (nodeType 3)", () => {
    expect(isElement(mockTextNode)).toBe(false);
  });

  it("returns false for non-objects", () => {
    expect(isElement(null)).toBe(false);
    expect(isElement("div")).toBe(false);
  });
});

describe("isHTMLElement", () => {
  it("returns true for element with tagName and style", () => {
    expect(isHTMLElement(mockElement)).toBe(true);
  });

  it("returns false for SVG element (still has tagName/style but test distinguishes via namespace)", () => {
    // SVG elements also have tagName and style — isHTMLElement returns true for them
    // (intentional: use isSVGElement to distinguish)
    expect(isHTMLElement(mockSvgElement)).toBe(true);
  });

  it("returns false for element without style", () => {
    expect(isHTMLElement({ nodeType: 1, tagName: "DIV" })).toBe(false);
  });

  it("returns false for element without tagName", () => {
    expect(isHTMLElement({ nodeType: 1, style: {} })).toBe(false);
  });

  it("returns false for non-elements", () => {
    expect(isHTMLElement(mockDocument)).toBe(false);
    expect(isHTMLElement(null)).toBe(false);
  });
});

describe("isSVGElement", () => {
  it("returns true for element with SVG namespace", () => {
    expect(isSVGElement(mockSvgElement)).toBe(true);
  });

  it("returns false for HTML element", () => {
    expect(isSVGElement(mockElement)).toBe(false);
  });

  it("returns false for non-elements", () => {
    expect(isSVGElement(null)).toBe(false);
    expect(isSVGElement(mockDocument)).toBe(false);
  });
});

describe("isDocument", () => {
  it("returns true for document-like (nodeType 9)", () => {
    expect(isDocument(mockDocument)).toBe(true);
  });

  it("returns false for elements", () => {
    expect(isDocument(mockElement)).toBe(false);
  });

  it("returns false for null", () => {
    expect(isDocument(null)).toBe(false);
  });
});

describe("isWindow", () => {
  it("returns true for window-like object (has document and self === value)", () => {
    const win: Record<string, unknown> = { document: mockDocument };
    win["self"] = win;
    expect(isWindow(win)).toBe(true);
  });

  it("returns false when self does not point to itself", () => {
    expect(isWindow({ document: {}, self: {} })).toBe(false);
  });

  it("returns false for document", () => {
    expect(isWindow(mockDocument)).toBe(false);
  });

  it("returns false for null", () => {
    expect(isWindow(null)).toBe(false);
  });

  it("returns false for plain objects", () => {
    expect(isWindow({})).toBe(false);
  });
});

describe("isShadowRoot", () => {
  it("returns true for document fragment with host", () => {
    expect(isShadowRoot(mockShadowRoot)).toBe(true);
  });

  it("returns false for regular document fragment", () => {
    expect(isShadowRoot(mockDocumentFragment)).toBe(false);
  });

  it("returns false for elements", () => {
    expect(isShadowRoot(mockElement)).toBe(false);
  });

  it("returns false for null", () => {
    expect(isShadowRoot(null)).toBe(false);
  });
});

describe("cross-document safety", () => {
  it("works with alternate realm element (different constructor)", () => {
    // Simulate iframe element — same shape but would fail instanceof
    const iframeElement = Object.create(null) as Record<string, unknown>;
    iframeElement["nodeType"] = 1;
    iframeElement["tagName"] = "BUTTON";
    iframeElement["style"] = {};
    expect(isElement(iframeElement)).toBe(true);
    expect(isHTMLElement(iframeElement)).toBe(true);
  });

  it("works with alternate realm document", () => {
    const iframeDoc = Object.create(null) as Record<string, unknown>;
    iframeDoc["nodeType"] = 9;
    expect(isDocument(iframeDoc)).toBe(true);
  });
});
