import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTreeExpansion } from "./use-tree-expansion";
import { getChildIds, getBranchIds, getNodeDepth, isDescendantOf } from "./tree-collection-utils";
import {
  createTreeRowModel,
  getVisibleRows,
  getAncestorIds,
  getDescendantIds,
} from "../data/row-model";

// ─── Test data ──────────────────────────────────────────────────────

interface TreeNode {
  id: string;
  label: string;
  parentId: string | null;
}

const treeData: TreeNode[] = [
  { id: "root", label: "Root", parentId: null },
  { id: "a", label: "A", parentId: "root" },
  { id: "b", label: "B", parentId: "root" },
  { id: "a1", label: "A1", parentId: "a" },
  { id: "a2", label: "A2", parentId: "a" },
  { id: "a1x", label: "A1x", parentId: "a1" },
  { id: "b1", label: "B1", parentId: "b" },
];

function buildTree() {
  return createTreeRowModel({
    data: treeData,
    getRowId: (n) => n.id,
    getParentId: (n) => n.parentId,
  });
}

// ─── getChildIds ────────────────────────────────────────────────────

describe("getChildIds", () => {
  it("returns direct children of root", () => {
    const rows = buildTree();
    expect(getChildIds(rows, "root")).toEqual(["a", "b"]);
  });

  it("returns direct children of intermediate node", () => {
    const rows = buildTree();
    expect(getChildIds(rows, "a")).toEqual(["a1", "a2"]);
  });

  it("returns empty for leaf node", () => {
    const rows = buildTree();
    expect(getChildIds(rows, "a1x")).toEqual([]);
  });
});

// ─── getBranchIds ───────────────────────────────────────────────────

describe("getBranchIds", () => {
  it("returns all non-leaf nodes", () => {
    const rows = buildTree();
    const branches = getBranchIds(rows);
    expect(branches).toContain("root");
    expect(branches).toContain("a");
    expect(branches).toContain("a1");
    expect(branches).toContain("b");
    expect(branches).not.toContain("a2");
    expect(branches).not.toContain("a1x");
    expect(branches).not.toContain("b1");
  });
});

// ─── getNodeDepth ───────────────────────────────────────────────────

describe("getNodeDepth", () => {
  it("root has depth 0", () => {
    expect(getNodeDepth(buildTree(), "root")).toBe(0);
  });

  it("children have depth 1", () => {
    expect(getNodeDepth(buildTree(), "a")).toBe(1);
  });

  it("grandchildren have depth 2", () => {
    expect(getNodeDepth(buildTree(), "a1")).toBe(2);
  });

  it("returns -1 for unknown node", () => {
    expect(getNodeDepth(buildTree(), "unknown")).toBe(-1);
  });
});

// ─── isDescendantOf ─────────────────────────────────────────────────

describe("isDescendantOf", () => {
  it("child is descendant of parent", () => {
    expect(isDescendantOf(buildTree(), "a", "root")).toBe(true);
  });

  it("grandchild is descendant of root", () => {
    expect(isDescendantOf(buildTree(), "a1x", "root")).toBe(true);
  });

  it("sibling is not descendant", () => {
    expect(isDescendantOf(buildTree(), "b", "a")).toBe(false);
  });

  it("parent is not descendant of child", () => {
    expect(isDescendantOf(buildTree(), "root", "a")).toBe(false);
  });
});

// ─── Integration: visible rows with expansion ───────────────────────

describe("hierarchical collection: visible rows", () => {
  it("shows only root when nothing expanded", () => {
    const rows = buildTree();
    const visible = getVisibleRows(rows, new Set());
    expect(visible.map((r) => r.id)).toEqual(["root"]);
  });

  it("shows root + children when root expanded", () => {
    const rows = buildTree();
    const visible = getVisibleRows(rows, new Set(["root"]));
    expect(visible.map((r) => r.id)).toEqual(["root", "a", "b"]);
  });

  it("shows deep subtree when all ancestors expanded", () => {
    const rows = buildTree();
    const visible = getVisibleRows(rows, new Set(["root", "a", "a1"]));
    expect(visible.map((r) => r.id)).toEqual(["root", "a", "a1", "a1x", "a2", "b"]);
  });

  it("shows entire tree when all branches expanded", () => {
    const rows = buildTree();
    const allBranches = new Set(getBranchIds(rows));
    const visible = getVisibleRows(rows, allBranches);
    expect(visible).toHaveLength(7);
  });
});

// ─── Integration: ancestors and descendants ─────────────────────────

describe("hierarchical collection: relationships", () => {
  it("ancestors of a1x are [a1, a, root]", () => {
    expect(getAncestorIds(buildTree(), "a1x")).toEqual(["a1", "a", "root"]);
  });

  it("descendants of a are [a1, a1x, a2]", () => {
    expect(getDescendantIds(buildTree(), "a")).toEqual(["a1", "a1x", "a2"]);
  });
});

// ─── useTreeExpansion ───────────────────────────────────────────────

describe("useTreeExpansion", () => {
  it("starts with empty expansion", () => {
    const { result } = renderHook(() => useTreeExpansion());
    expect(result.current.expandedIds.size).toBe(0);
  });

  it("starts with defaultExpandedIds", () => {
    const { result } = renderHook(() =>
      useTreeExpansion({ defaultExpandedIds: new Set(["root", "a"]) }),
    );
    expect(result.current.isExpanded("root")).toBe(true);
    expect(result.current.isExpanded("a")).toBe(true);
    expect(result.current.isExpanded("b")).toBe(false);
  });

  it("toggleExpanded adds and removes", () => {
    const { result } = renderHook(() => useTreeExpansion());

    act(() => {
      result.current.toggleExpanded("root");
    });
    expect(result.current.isExpanded("root")).toBe(true);

    act(() => {
      result.current.toggleExpanded("root");
    });
    expect(result.current.isExpanded("root")).toBe(false);
  });

  it("expandAll adds multiple IDs", () => {
    const { result } = renderHook(() => useTreeExpansion());

    act(() => {
      result.current.expandAll(["root", "a", "b"]);
    });
    expect(result.current.expandedIds.size).toBe(3);
  });

  it("collapseAll removes all", () => {
    const { result } = renderHook(() =>
      useTreeExpansion({ defaultExpandedIds: new Set(["root", "a"]) }),
    );

    act(() => {
      result.current.collapseAll();
    });
    expect(result.current.expandedIds.size).toBe(0);
  });

  it("calls onExpandedChange callback", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useTreeExpansion({ onExpandedChange: onChange }));

    act(() => {
      result.current.toggleExpanded("root");
    });
    expect(onChange).toHaveBeenCalledWith(new Set(["root"]));
  });

  it("works in controlled mode", () => {
    const onChange = vi.fn();
    const ids = new Set(["root"]);

    const { result, rerender } = renderHook(
      ({ expandedIds: e }) => useTreeExpansion({ expandedIds: e, onExpandedChange: onChange }),
      { initialProps: { expandedIds: ids } },
    );

    expect(result.current.isExpanded("root")).toBe(true);

    act(() => {
      result.current.toggleExpanded("a");
    });
    expect(onChange).toHaveBeenCalled();

    rerender({ expandedIds: new Set(["root", "a"]) });
    expect(result.current.isExpanded("a")).toBe(true);
  });

  it("onExpandedChange sets directly", () => {
    const { result } = renderHook(() => useTreeExpansion());

    act(() => {
      result.current.onExpandedChange(new Set(["root", "a", "b"]));
    });
    expect(result.current.expandedIds.size).toBe(3);
  });
});
