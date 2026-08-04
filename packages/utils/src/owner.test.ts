import { describe, it, expect } from "vitest";
import { getOwnerDocument, getOwnerWindow } from "./owner";
import type { OwnerNode, OwnerDocument, OwnerWindow } from "./owner";

describe("getOwnerDocument", () => {
  it("returns undefined for null", () => {
    expect(getOwnerDocument(null)).toBeUndefined();
  });

  it("returns undefined for undefined", () => {
    expect(getOwnerDocument(undefined)).toBeUndefined();
  });

  it("returns the document itself if node is a document", () => {
    const doc: OwnerNode = { nodeType: 9 };
    expect(getOwnerDocument(doc)).toBe(doc);
  });

  it("returns ownerDocument for an element node", () => {
    const doc: OwnerDocument = { nodeType: 9 };
    const element: OwnerNode = { ownerDocument: doc };
    expect(getOwnerDocument(element)).toBe(doc);
  });

  it("returns undefined when element has no ownerDocument", () => {
    const element: OwnerNode = { ownerDocument: null };
    expect(getOwnerDocument(element)).toBeUndefined();
  });

  it("handles iframe document", () => {
    const iframeDoc: OwnerDocument = { nodeType: 9 };
    const iframeElement: OwnerNode = { ownerDocument: iframeDoc };
    expect(getOwnerDocument(iframeElement)).toBe(iframeDoc);
  });
});

describe("getOwnerWindow", () => {
  it("returns undefined for null", () => {
    expect(getOwnerWindow(null)).toBeUndefined();
  });

  it("returns undefined for undefined", () => {
    expect(getOwnerWindow(undefined)).toBeUndefined();
  });

  it("returns the window itself if node looks like a window", () => {
    const doc: OwnerDocument = { nodeType: 9 };
    const win = { document: doc } as unknown as OwnerNode;
    expect(getOwnerWindow(win)).toBe(win);
  });

  it("returns defaultView for a document node", () => {
    const win: OwnerWindow = {};
    const doc: OwnerNode = { nodeType: 9, defaultView: win };
    expect(getOwnerWindow(doc)).toBe(win);
  });

  it("returns defaultView via ownerDocument for an element", () => {
    const win: OwnerWindow = {};
    const doc: OwnerDocument = { defaultView: win, nodeType: 9 };
    const element: OwnerNode = { ownerDocument: doc };
    expect(getOwnerWindow(element)).toBe(win);
  });

  it("returns undefined when document has no defaultView", () => {
    const doc: OwnerDocument = { nodeType: 9, defaultView: null };
    const element: OwnerNode = { ownerDocument: doc };
    expect(getOwnerWindow(element)).toBeUndefined();
  });

  it("returns undefined when element has no ownerDocument", () => {
    const element: OwnerNode = { ownerDocument: null };
    expect(getOwnerWindow(element)).toBeUndefined();
  });

  it("handles iframe window", () => {
    const iframeWin: OwnerWindow = {};
    const iframeDoc: OwnerDocument = { defaultView: iframeWin, nodeType: 9 };
    const iframeElement: OwnerNode = { ownerDocument: iframeDoc };
    expect(getOwnerWindow(iframeElement)).toBe(iframeWin);
  });
});
