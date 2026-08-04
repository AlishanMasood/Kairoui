import { describe, it, expect } from "vitest";
import {
  getActiveElement,
  getDeepActiveElement,
  containsActiveElement,
  hasFocusWithin,
} from "./active-element";
import type { ActiveElementDocument, ActiveElementNode } from "./active-element";

describe("getActiveElement", () => {
  it("returns activeElement from document", () => {
    const active: ActiveElementNode = {};
    const doc: ActiveElementDocument = { activeElement: active };
    expect(getActiveElement(doc)).toBe(active);
  });

  it("returns null when no active element", () => {
    const doc: ActiveElementDocument = { activeElement: null };
    expect(getActiveElement(doc)).toBeNull();
  });

  it("returns null when activeElement is undefined", () => {
    const doc: ActiveElementDocument = {};
    expect(getActiveElement(doc)).toBeNull();
  });

  it("returns null for null document", () => {
    expect(getActiveElement(null)).toBeNull();
  });

  it("returns null for undefined document", () => {
    expect(getActiveElement(undefined)).toBeNull();
  });
});

describe("getDeepActiveElement", () => {
  it("returns active element when no shadow root", () => {
    const active: ActiveElementNode = {};
    const doc: ActiveElementDocument = { activeElement: active };
    expect(getDeepActiveElement(doc)).toBe(active);
  });

  it("traverses one level of shadow root", () => {
    const deepActive: ActiveElementNode = {};
    const shadowHost: ActiveElementNode = {
      shadowRoot: { activeElement: deepActive },
    };
    const doc: ActiveElementDocument = { activeElement: shadowHost };
    expect(getDeepActiveElement(doc)).toBe(deepActive);
  });

  it("traverses multiple levels of shadow roots", () => {
    const deepest: ActiveElementNode = {};
    const level2: ActiveElementNode = {
      shadowRoot: { activeElement: deepest },
    };
    const level1: ActiveElementNode = {
      shadowRoot: { activeElement: level2 },
    };
    const doc: ActiveElementDocument = { activeElement: level1 };
    expect(getDeepActiveElement(doc)).toBe(deepest);
  });

  it("stops when shadow root has no active element", () => {
    const host: ActiveElementNode = {
      shadowRoot: { activeElement: null },
    };
    const doc: ActiveElementDocument = { activeElement: host };
    expect(getDeepActiveElement(doc)).toBe(host);
  });

  it("returns null when document has no active element", () => {
    const doc: ActiveElementDocument = { activeElement: null };
    expect(getDeepActiveElement(doc)).toBeNull();
  });
});

describe("containsActiveElement", () => {
  it("returns true when element is the active element", () => {
    const active: ActiveElementNode = {};
    const doc: ActiveElementDocument = { activeElement: active };
    expect(containsActiveElement(active, doc)).toBe(true);
  });

  it("returns true when element contains the active element", () => {
    const active: ActiveElementNode = {};
    const container: ActiveElementNode = {
      contains: (node) => node === active,
    };
    const doc: ActiveElementDocument = { activeElement: active };
    expect(containsActiveElement(container, doc)).toBe(true);
  });

  it("returns false when element does not contain active element", () => {
    const active: ActiveElementNode = {};
    const other: ActiveElementNode = {
      contains: () => false,
    };
    const doc: ActiveElementDocument = { activeElement: active };
    expect(containsActiveElement(other, doc)).toBe(false);
  });

  it("returns false when no active element", () => {
    const element: ActiveElementNode = { contains: () => false };
    const doc: ActiveElementDocument = { activeElement: null };
    expect(containsActiveElement(element, doc)).toBe(false);
  });

  it("returns false for null element", () => {
    const doc: ActiveElementDocument = { activeElement: {} };
    expect(containsActiveElement(null, doc)).toBe(false);
  });

  it("returns false for null document", () => {
    const element: ActiveElementNode = {};
    expect(containsActiveElement(element, null)).toBe(false);
  });

  it("traverses shadow roots for containment", () => {
    const deepActive: ActiveElementNode = {};
    const shadowHost: ActiveElementNode = {
      shadowRoot: { activeElement: deepActive },
    };
    const container: ActiveElementNode = {
      contains: (node) => node === deepActive,
    };
    const doc: ActiveElementDocument = { activeElement: shadowHost };
    expect(containsActiveElement(container, doc)).toBe(true);
  });
});

describe("hasFocusWithin", () => {
  it("returns true when element contains active element", () => {
    const active: ActiveElementNode = {};
    const container: ActiveElementNode = {
      contains: (node) => node === active,
    };
    const doc: ActiveElementDocument = { activeElement: active };
    expect(hasFocusWithin(container, doc)).toBe(true);
  });

  it("returns false when element does not contain active element", () => {
    const active: ActiveElementNode = {};
    const other: ActiveElementNode = { contains: () => false };
    const doc: ActiveElementDocument = { activeElement: active };
    expect(hasFocusWithin(other, doc)).toBe(false);
  });

  it("returns false for null element", () => {
    expect(hasFocusWithin(null, { activeElement: {} })).toBe(false);
  });
});
