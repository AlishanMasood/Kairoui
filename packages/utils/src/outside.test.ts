import { describe, it, expect } from "vitest";
import { isEventOutside, isNodeOutside } from "./outside";
import type { NodeLike, OutsideEventLike } from "./outside";

// Helpers to build mock DOM-like structures
function createNode(
  children: NodeLike[] = [],
  parent?: NodeLike,
): NodeLike & { children: NodeLike[] } {
  const node: NodeLike & { children: NodeLike[] } = {
    children,
    parentNode: parent ?? null,
    contains(other: NodeLike | null): boolean {
      if (other == null) return false;
      if (other === node) return true;
      return node.children.some(
        (child) =>
          child === other || (typeof child.contains === "function" && child.contains(other)),
      );
    },
  };
  // Set parent references on children
  for (const child of children) {
    (child as { parentNode: NodeLike }).parentNode = node;
  }
  return node;
}

function createEvent(target: NodeLike | null, composedPath?: NodeLike[]): OutsideEventLike {
  const event: OutsideEventLike = { target };
  if (composedPath) {
    event.composedPath = () => composedPath;
  }
  return event;
}

describe("isEventOutside", () => {
  describe("basic containment", () => {
    it("returns false when target is the inside element", () => {
      const el = createNode();
      expect(isEventOutside(createEvent(el), { insideElements: [el] })).toBe(false);
    });

    it("returns false when target is a child of inside element", () => {
      const child = createNode();
      const parent = createNode([child]);
      expect(isEventOutside(createEvent(child), { insideElements: [parent] })).toBe(false);
    });

    it("returns true when target is outside all elements", () => {
      const inside = createNode();
      const outside = createNode();
      expect(isEventOutside(createEvent(outside), { insideElements: [inside] })).toBe(true);
    });
  });

  describe("nested elements", () => {
    it("returns false for deeply nested child", () => {
      const grandchild = createNode();
      const child = createNode([grandchild]);
      const root = createNode([child]);
      expect(isEventOutside(createEvent(grandchild), { insideElements: [root] })).toBe(false);
    });
  });

  describe("multiple inside elements (portal pattern)", () => {
    it("returns false when target is in any inside element", () => {
      const trigger = createNode();
      const popoverChild = createNode();
      const popover = createNode([popoverChild]);
      expect(
        isEventOutside(createEvent(popoverChild), {
          insideElements: [trigger, popover],
        }),
      ).toBe(false);
    });

    it("returns true when target is outside all inside elements", () => {
      const trigger = createNode();
      const popover = createNode();
      const outside = createNode();
      expect(
        isEventOutside(createEvent(outside), {
          insideElements: [trigger, popover],
        }),
      ).toBe(true);
    });
  });

  describe("exclude elements", () => {
    it("returns false when target is in exclude element", () => {
      const inside = createNode();
      const excludeChild = createNode();
      const exclude = createNode([excludeChild]);
      expect(
        isEventOutside(createEvent(excludeChild), {
          insideElements: [inside],
          excludeElements: [exclude],
        }),
      ).toBe(false);
    });
  });

  describe("composed path (Shadow DOM)", () => {
    it("uses composedPath when available", () => {
      const shadowChild = createNode();
      const shadowHost = createNode();
      // composedPath includes the shadow child and host
      const event = createEvent(shadowChild, [shadowChild, shadowHost]);
      expect(isEventOutside(event, { insideElements: [shadowHost] })).toBe(false);
    });

    it("returns true when composedPath does not include inside elements", () => {
      const outside = createNode();
      const inside = createNode();
      const event = createEvent(outside, [outside]);
      expect(isEventOutside(event, { insideElements: [inside] })).toBe(true);
    });
  });

  describe("detached targets", () => {
    it("returns true for detached node (no parent chain)", () => {
      const inside = createNode();
      const detached: NodeLike = { parentNode: null };
      expect(isEventOutside(createEvent(detached), { insideElements: [inside] })).toBe(true);
    });
  });

  describe("null/undefined handling", () => {
    it("returns true when target is null", () => {
      const inside = createNode();
      expect(isEventOutside(createEvent(null), { insideElements: [inside] })).toBe(true);
    });

    it("returns true when insideElements is empty", () => {
      const target = createNode();
      expect(isEventOutside(createEvent(target), { insideElements: [] })).toBe(true);
    });

    it("filters null inside elements", () => {
      const target = createNode();
      expect(
        isEventOutside(createEvent(target), { insideElements: [null, target, undefined] }),
      ).toBe(false);
    });
  });
});

describe("isNodeOutside", () => {
  it("returns false when node is in the elements list", () => {
    const node = createNode();
    expect(isNodeOutside(node, [node])).toBe(false);
  });

  it("returns false when node is contained by an element", () => {
    const child = createNode();
    const parent = createNode([child]);
    expect(isNodeOutside(child, [parent])).toBe(false);
  });

  it("returns true when node is not in any element", () => {
    const node = createNode();
    const other = createNode();
    expect(isNodeOutside(node, [other])).toBe(true);
  });

  it("walks parent chain as fallback", () => {
    const grandchild: NodeLike = { parentNode: null };
    const child: NodeLike = { parentNode: null };
    const parent: NodeLike = { parentNode: null };
    // Set up chain without contains
    (grandchild as { parentNode: NodeLike }).parentNode = child;
    (child as { parentNode: NodeLike }).parentNode = parent;
    expect(isNodeOutside(grandchild, [parent])).toBe(false);
  });
});
