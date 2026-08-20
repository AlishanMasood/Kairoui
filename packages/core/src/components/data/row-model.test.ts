import { describe, it, expect, expectTypeOf } from "vitest";
import {
    createRowModel,
    createTreeRowModel,
    getVisibleRows,
    getAncestorIds,
    getDescendantIds,
} from "./row-model";
import type { RowModel } from "./row-model";

// ─── Test data ──────────────────────────────────────────────────────

interface User {
    id: number;
    name: string;
}

const users: User[] = [
    { id: 1, name: "Alice" },
    { id: 2, name: "Bob" },
    { id: 3, name: "Charlie" },
];

interface TreeNode {
    id: string;
    label: string;
    parentId: string | null;
}

const treeData: TreeNode[] = [
    { id: "root", label: "Root", parentId: null },
    { id: "child1", label: "Child 1", parentId: "root" },
    { id: "child2", label: "Child 2", parentId: "root" },
    { id: "grandchild1", label: "Grandchild 1", parentId: "child1" },
    { id: "leaf", label: "Leaf", parentId: "grandchild1" },
];

interface NestedNode {
    id: string;
    label: string;
    children?: NestedNode[];
}

const nestedData: NestedNode[] = [
    {
        id: "a",
        label: "A",
        children: [
            { id: "a1", label: "A1", children: [{ id: "a1x", label: "A1x" }] },
            { id: "a2", label: "A2" },
        ],
    },
    { id: "b", label: "B" },
];

// ─── createRowModel (flat) ──────────────────────────────────────────

describe("createRowModel", () => {
    it("creates row models from flat data", () => {
        const rows = createRowModel({ data: users, getRowId: (u) => u.id });
        expect(rows).toHaveLength(3);
        expect(rows[0]!.id).toBe(1);
        expect(rows[0]!.original).toBe(users[0]);
        expect(rows[0]!.index).toBe(0);
        expect(rows[0]!.depth).toBe(0);
        expect(rows[0]!.parentId).toBeNull();
        expect(rows[0]!.isLeaf).toBe(true);
    });

    it("preserves original data reference (no cloning)", () => {
        const rows = createRowModel({ data: users, getRowId: (u) => u.id });
        expect(rows[1]!.original).toBe(users[1]);
    });

    it("assigns sequential indices", () => {
        const rows = createRowModel({ data: users, getRowId: (u) => u.id });
        expect(rows.map((r) => r.index)).toEqual([0, 1, 2]);
    });

    it("works with empty data", () => {
        const rows = createRowModel({ data: [], getRowId: (u: User) => u.id });
        expect(rows).toHaveLength(0);
    });

    it("supports index-based IDs", () => {
        const rows = createRowModel({ data: users, getRowId: (_u, i) => `row-${String(i)}` });
        expect(rows[0]!.id).toBe("row-0");
        expect(rows[2]!.id).toBe("row-2");
    });
});

// ─── createTreeRowModel (parent-id based) ───────────────────────────

describe("createTreeRowModel (parent-id)", () => {
    it("builds hierarchical rows from parentId references", () => {
        const rows = createTreeRowModel({
            data: treeData,
            getRowId: (n) => n.id,
            getParentId: (n) => n.parentId,
        });
        expect(rows).toHaveLength(5);
    });

    it("assigns correct depths", () => {
        const rows = createTreeRowModel({
            data: treeData,
            getRowId: (n) => n.id,
            getParentId: (n) => n.parentId,
        });
        const depths = Object.fromEntries(rows.map((r) => [r.id, r.depth]));
        expect(depths["root"]).toBe(0);
        expect(depths["child1"]).toBe(1);
        expect(depths["child2"]).toBe(1);
        expect(depths["grandchild1"]).toBe(2);
        expect(depths["leaf"]).toBe(3);
    });

    it("sets parentId correctly", () => {
        const rows = createTreeRowModel({
            data: treeData,
            getRowId: (n) => n.id,
            getParentId: (n) => n.parentId,
        });
        const parents = Object.fromEntries(rows.map((r) => [r.id, r.parentId]));
        expect(parents["root"]).toBeNull();
        expect(parents["child1"]).toBe("root");
        expect(parents["grandchild1"]).toBe("child1");
    });

    it("marks leaf nodes correctly", () => {
        const rows = createTreeRowModel({
            data: treeData,
            getRowId: (n) => n.id,
            getParentId: (n) => n.parentId,
        });
        const leaves = Object.fromEntries(rows.map((r) => [r.id, r.isLeaf]));
        expect(leaves["root"]).toBe(false);
        expect(leaves["child1"]).toBe(false);
        expect(leaves["child2"]).toBe(true);
        expect(leaves["leaf"]).toBe(true);
    });

    it("produces depth-first order", () => {
        const rows = createTreeRowModel({
            data: treeData,
            getRowId: (n) => n.id,
            getParentId: (n) => n.parentId,
        });
        expect(rows.map((r) => r.id)).toEqual(["root", "child1", "grandchild1", "leaf", "child2"]);
    });
});

// ─── createTreeRowModel (children-based) ────────────────────────────

describe("createTreeRowModel (children)", () => {
    it("builds from nested children arrays", () => {
        const rows = createTreeRowModel({
            data: nestedData,
            getRowId: (n) => n.id,
            getParentId: () => null,
            getChildren: (n) => n.children,
        });
        expect(rows).toHaveLength(5);
    });

    it("assigns correct depths from nested structure", () => {
        const rows = createTreeRowModel({
            data: nestedData,
            getRowId: (n) => n.id,
            getParentId: () => null,
            getChildren: (n) => n.children,
        });
        const depths = Object.fromEntries(rows.map((r) => [r.id, r.depth]));
        expect(depths["a"]).toBe(0);
        expect(depths["a1"]).toBe(1);
        expect(depths["a1x"]).toBe(2);
        expect(depths["b"]).toBe(0);
    });

    it("produces depth-first order", () => {
        const rows = createTreeRowModel({
            data: nestedData,
            getRowId: (n) => n.id,
            getParentId: () => null,
            getChildren: (n) => n.children,
        });
        expect(rows.map((r) => r.id)).toEqual(["a", "a1", "a1x", "a2", "b"]);
    });
});

// ─── getVisibleRows ─────────────────────────────────────────────────

describe("getVisibleRows", () => {
    it("shows all rows when all non-leaf nodes are expanded", () => {
        const rows = createTreeRowModel({
            data: treeData,
            getRowId: (n) => n.id,
            getParentId: (n) => n.parentId,
        });
        const expanded = new Set(["root", "child1", "grandchild1"]);
        const visible = getVisibleRows(rows, expanded);
        expect(visible).toHaveLength(5);
    });

    it("hides children of collapsed nodes", () => {
        const rows = createTreeRowModel({
            data: treeData,
            getRowId: (n) => n.id,
            getParentId: (n) => n.parentId,
        });
        const expanded = new Set<string>();
        const visible = getVisibleRows(rows, expanded);
        // Only root is visible when nothing is expanded
        expect(visible.map((r) => r.id)).toEqual(["root"]);
    });

    it("hides nested descendants of collapsed parent", () => {
        const rows = createTreeRowModel({
            data: treeData,
            getRowId: (n) => n.id,
            getParentId: (n) => n.parentId,
        });
        // root expanded, child1 collapsed
        const expanded = new Set(["root"]);
        const visible = getVisibleRows(rows, expanded);
        expect(visible.map((r) => r.id)).toEqual(["root", "child1", "child2"]);
    });

    it("partially expanded tree shows correct subset", () => {
        const rows = createTreeRowModel({
            data: treeData,
            getRowId: (n) => n.id,
            getParentId: (n) => n.parentId,
        });
        const expanded = new Set(["root", "child1"]);
        const visible = getVisibleRows(rows, expanded);
        expect(visible.map((r) => r.id)).toEqual(["root", "child1", "grandchild1", "child2"]);
    });
});

// ─── getAncestorIds ─────────────────────────────────────────────────

describe("getAncestorIds", () => {
    it("returns ancestors bottom-up", () => {
        const rows = createTreeRowModel({
            data: treeData,
            getRowId: (n) => n.id,
            getParentId: (n) => n.parentId,
        });
        const ancestors = getAncestorIds(rows, "leaf");
        expect(ancestors).toEqual(["grandchild1", "child1", "root"]);
    });

    it("returns empty for root nodes", () => {
        const rows = createTreeRowModel({
            data: treeData,
            getRowId: (n) => n.id,
            getParentId: (n) => n.parentId,
        });
        expect(getAncestorIds(rows, "root")).toEqual([]);
    });
});

// ─── getDescendantIds ───────────────────────────────────────────────

describe("getDescendantIds", () => {
    it("returns all descendants in depth-first order", () => {
        const rows = createTreeRowModel({
            data: treeData,
            getRowId: (n) => n.id,
            getParentId: (n) => n.parentId,
        });
        const descendants = getDescendantIds(rows, "root");
        expect(descendants).toEqual(["child1", "grandchild1", "leaf", "child2"]);
    });

    it("returns empty for leaf nodes", () => {
        const rows = createTreeRowModel({
            data: treeData,
            getRowId: (n) => n.id,
            getParentId: (n) => n.parentId,
        });
        expect(getDescendantIds(rows, "leaf")).toEqual([]);
    });

    it("returns only subtree for intermediate node", () => {
        const rows = createTreeRowModel({
            data: treeData,
            getRowId: (n) => n.id,
            getParentId: (n) => n.parentId,
        });
        expect(getDescendantIds(rows, "child1")).toEqual(["grandchild1", "leaf"]);
    });
});

// ─── Type contracts ─────────────────────────────────────────────────

describe("row-model: type contracts", () => {
    it("RowModel preserves generic row type", () => {
        type Model = RowModel<User>;
        expectTypeOf<Model["original"]>().toEqualTypeOf<User>();
        expectTypeOf<Model["id"]>().toEqualTypeOf<string | number>();
        expectTypeOf<Model["index"]>().toEqualTypeOf<number>();
        expectTypeOf<Model["depth"]>().toEqualTypeOf<number>();
        expectTypeOf<Model["parentId"]>().toEqualTypeOf<string | number | null>();
        expectTypeOf<Model["isLeaf"]>().toEqualTypeOf<boolean>();
    });

    it("createRowModel returns readonly array", () => {
        const result = createRowModel({ data: users, getRowId: (u) => u.id });
        expectTypeOf(result).toExtend<readonly RowModel<User>[]>();
    });

    it("does not mutate original data (readonly input)", () => {
        const frozenData = Object.freeze([...users]);
        const rows = createRowModel({ data: frozenData, getRowId: (u) => u.id });
        expect(rows[0]!.original).toBe(frozenData[0]);
    });
});
