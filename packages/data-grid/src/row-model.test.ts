import { describe, it, expect } from "vitest";
import type { ExpansionState, RowId } from "@kairoui/core/components";
import {
  FOOTER_NODE_ID,
  GROUP_ID_PREFIX,
  buildRowNodes,
  buildRowState,
  filterGroupableColumns,
  groupNodeId,
  stableKeyString,
  type GridGroupRowNode,
  type GridRowNode,
} from "./row-model";
import type { DataGridColumnDef } from "./column-types";

interface Sale {
  readonly id: string;
  readonly region: string;
  readonly product: string;
  readonly amount: number;
}

const data: readonly Sale[] = [
  { id: "1", region: "north", product: "apple", amount: 100 },
  { id: "2", region: "north", product: "apple", amount: 50 },
  { id: "3", region: "north", product: "pear", amount: 200 },
  { id: "4", region: "south", product: "apple", amount: 75 },
  { id: "5", region: "south", product: "pear", amount: 125 },
];

const cols: readonly DataGridColumnDef<Sale>[] = [
  { id: "region", header: "Region", accessorKey: "region" },
  { id: "product", header: "Product", accessorKey: "product" },
  {
    id: "amount",
    header: "Amount",
    accessorKey: "amount",
    aggregate: { reducer: "sum" },
  },
  {
    id: "totalCount",
    header: "Count",
    accessorKey: "amount",
    aggregate: { reducer: "count" },
  },
  { id: "internalOnly", header: "Internal", accessorKey: "id", groupable: false },
];

const getRowId = (row: Sale): RowId => row.id;

function expansion(ids: readonly string[]): ExpansionState {
  return { expandedIds: new Set<RowId>(ids) };
}

// ─── Key + ID helpers ──────────────────────────────────────────────

describe("stableKeyString", () => {
  it("serializes primitives deterministically", () => {
    expect(stableKeyString("north")).toBe("north");
    expect(stableKeyString(42)).toBe("42");
    expect(stableKeyString(true)).toBe("true");
    expect(stableKeyString(null)).toBe("null");
    expect(stableKeyString(undefined)).toBe("undefined");
  });

  it("serializes Date instances by timestamp", () => {
    const key = stableKeyString(new Date(1_700_000_000_000));
    expect(key).toBe("d:1700000000000");
  });

  it("falls back to JSON for objects", () => {
    expect(stableKeyString({ a: 1 })).toBe('{"a":1}');
  });
});

describe("groupNodeId", () => {
  it("is stable across calls with the same path", () => {
    const path = [
      { columnId: "region", key: "north" },
      { columnId: "product", key: "apple" },
    ];
    expect(groupNodeId(path)).toBe(groupNodeId(path));
  });

  it("carries the group prefix and every path segment", () => {
    const id = groupNodeId([
      { columnId: "region", key: "north" },
      { columnId: "product", key: "apple" },
    ]);
    expect(id.startsWith(GROUP_ID_PREFIX)).toBe(true);
    expect(id).toContain("region=north");
    expect(id).toContain("product=apple");
  });

  it("distinguishes reordered paths", () => {
    const a = groupNodeId([
      { columnId: "region", key: "north" },
      { columnId: "product", key: "apple" },
    ]);
    const b = groupNodeId([
      { columnId: "product", key: "apple" },
      { columnId: "region", key: "north" },
    ]);
    expect(a).not.toBe(b);
  });
});

// ─── Column validation ────────────────────────────────────────────

describe("filterGroupableColumns", () => {
  it("keeps known groupable columns in order", () => {
    expect(filterGroupableColumns(cols, ["region", "product"])).toEqual(["region", "product"]);
  });

  it("drops unknown IDs", () => {
    expect(filterGroupableColumns(cols, ["mystery", "region"])).toEqual(["region"]);
  });

  it("drops columns marked groupable=false", () => {
    expect(filterGroupableColumns(cols, ["internalOnly", "region"])).toEqual(["region"]);
  });

  it("deduplicates entries", () => {
    expect(filterGroupableColumns(cols, ["region", "region", "product"])).toEqual([
      "region",
      "product",
    ]);
  });
});

// ─── buildRowNodes: ungrouped ─────────────────────────────────────

describe("buildRowNodes — ungrouped", () => {
  it("emits one leaf node per row when groupBy is empty", () => {
    const nodes = buildRowNodes({
      data,
      columns: cols,
      groupBy: [],
      expanded: expansion([]),
      getRowId,
    });
    expect(nodes).toHaveLength(5);
    expect(nodes.every((n) => n.kind === "leaf")).toBe(true);
    expect(nodes.map((n) => (n.kind === "leaf" ? n.id : null))).toEqual(["1", "2", "3", "4", "5"]);
  });

  it("treats requested groupBy entries that fail validation as no grouping", () => {
    const nodes = buildRowNodes({
      data,
      columns: cols,
      groupBy: ["mystery", "internalOnly"],
      expanded: expansion([]),
      getRowId,
    });
    expect(nodes.every((n) => n.kind === "leaf")).toBe(true);
  });
});

// ─── buildRowNodes: single-level grouping ─────────────────────────

describe("buildRowNodes — single-level grouping", () => {
  it("emits collapsed group nodes with no leaves when no group is expanded", () => {
    const nodes = buildRowNodes({
      data,
      columns: cols,
      groupBy: ["region"],
      expanded: expansion([]),
      getRowId,
    });
    expect(nodes).toHaveLength(2);
    expect(nodes.every((n) => n.kind === "group")).toBe(true);
    const [north, south] = nodes as [GridGroupRowNode, GridGroupRowNode];
    expect(north.key).toBe("north");
    expect(north.count).toBe(3);
    expect(north.aggregates["amount"]).toBe(350);
    expect(north.aggregates["totalCount"]).toBe(3);
    expect(south.key).toBe("south");
    expect(south.count).toBe(2);
    expect(south.aggregates["amount"]).toBe(200);
  });

  it("expands leaves under expanded groups", () => {
    const northId = groupNodeId([{ columnId: "region", key: "north" }]);
    const nodes = buildRowNodes({
      data,
      columns: cols,
      groupBy: ["region"],
      expanded: expansion([northId]),
      getRowId,
    });
    expect(nodes).toHaveLength(2 + 3); // 2 groups + 3 north leaves
    const leaves = nodes.filter((n) => n.kind === "leaf");
    expect(leaves.map((l) => l.id)).toEqual(["1", "2", "3"]);
    for (const leaf of leaves) {
      expect(leaf.parentGroupId).toBe(northId);
      expect(leaf.depth).toBe(1);
    }
  });

  it("uses a column's groupFn override when present", () => {
    const largeSmall: readonly DataGridColumnDef<Sale>[] = [
      {
        id: "bucket",
        header: "Bucket",
        accessorKey: "amount",
        groupFn: (row) => (row.amount >= 150 ? "large" : "small"),
      },
    ];
    const nodes = buildRowNodes({
      data,
      columns: largeSmall,
      groupBy: ["bucket"],
      expanded: expansion([]),
      getRowId,
    });
    const groups = nodes.filter((n) => n.kind === "group");
    expect(groups.map((g) => g.key).sort()).toEqual(["large", "small"]);
  });
});

// ─── buildRowNodes: nested grouping ───────────────────────────────

describe("buildRowNodes — nested grouping", () => {
  const northId = groupNodeId([{ columnId: "region", key: "north" }]);
  const northApple = groupNodeId([
    { columnId: "region", key: "north" },
    { columnId: "product", key: "apple" },
  ]);

  it("emits a nested group when the parent is expanded", () => {
    const nodes = buildRowNodes({
      data,
      columns: cols,
      groupBy: ["region", "product"],
      expanded: expansion([northId]),
      getRowId,
    });
    const groups = nodes.filter((n) => n.kind === "group");
    const nested = groups.filter((g) => g.depth === 1);
    expect(nested.map((g) => g.key).sort()).toEqual(["apple", "pear"]);
    // Nested groups reference their parent group ID.
    for (const g of nested) expect(g.parentGroupId).toBe(northId);
    // No leaves yet — nested groups are still collapsed.
    expect(nodes.every((n) => n.kind !== "leaf")).toBe(true);
  });

  it("expands leaves under a fully-expanded nested chain", () => {
    const nodes = buildRowNodes({
      data,
      columns: cols,
      groupBy: ["region", "product"],
      expanded: expansion([northId, northApple]),
      getRowId,
    });
    const leaves = nodes.filter((n) => n.kind === "leaf");
    expect(leaves.map((l) => l.id)).toEqual(["1", "2"]);
    for (const leaf of leaves) {
      expect(leaf.parentGroupId).toBe(northApple);
      expect(leaf.depth).toBe(2);
    }
  });

  it("aggregates group values from the leaves recursively covered by the group", () => {
    const nodes = buildRowNodes({
      data,
      columns: cols,
      groupBy: ["region", "product"],
      expanded: expansion([northId]),
      getRowId,
    });
    const groups = nodes.filter((n) => n.kind === "group");
    const northApple = groups.find((g) => g.depth === 1 && g.key === "apple");
    expect(northApple?.count).toBe(2);
    expect(northApple?.aggregates["amount"]).toBe(150);
  });
});

// ─── Footer ───────────────────────────────────────────────────────

describe("buildRowNodes — footer", () => {
  const totalsCols: readonly DataGridColumnDef<Sale>[] = [
    {
      id: "amount",
      header: "Amount",
      accessorKey: "amount",
      aggregate: { reducer: "sum", footer: true },
    },
    {
      id: "count",
      header: "Count",
      accessorKey: "id",
      aggregate: { reducer: "count" },
    },
  ];

  it("appends a footer node with grand totals when includeFooter is true", () => {
    const nodes = buildRowNodes({
      data,
      columns: totalsCols,
      groupBy: [],
      expanded: expansion([]),
      getRowId,
      includeFooter: true,
    });
    const footer = nodes[nodes.length - 1];
    expect(footer?.kind).toBe("footer");
    if (footer?.kind !== "footer") throw new Error("no footer");
    expect(footer.id).toBe(FOOTER_NODE_ID);
    expect(footer.aggregates["amount"]).toBe(550);
    expect(footer.aggregates).not.toHaveProperty("count");
  });

  it("omits the footer when includeFooter is false or absent", () => {
    const nodes = buildRowNodes({
      data,
      columns: totalsCols,
      groupBy: [],
      expanded: expansion([]),
      getRowId,
    });
    expect(nodes.every((n) => n.kind !== "footer")).toBe(true);
  });
});

// ─── Immutability ─────────────────────────────────────────────────

describe("buildRowNodes — never mutates inputs", () => {
  it("leaves data and column defs untouched", () => {
    const originalData = data.map((r) => ({ ...r }));
    const originalCols = cols.map((c) => ({ ...c }));
    buildRowNodes({
      data,
      columns: cols,
      groupBy: ["region"],
      expanded: expansion([]),
      getRowId,
    });
    for (let i = 0; i < data.length; i++) expect(data[i]).toEqual(originalData[i]);
    for (let i = 0; i < cols.length; i++) expect(cols[i]).toEqual(originalCols[i]);
  });
});

// ─── buildRowState ────────────────────────────────────────────────

describe("buildRowState", () => {
  it("reports total and filtered leaf counts", () => {
    const northId = groupNodeId([{ columnId: "region", key: "north" }]);
    const state = buildRowState({
      data,
      columns: cols,
      groupBy: ["region"],
      expanded: expansion([northId]),
      getRowId,
    });
    expect(state.totalLeafCount).toBe(5);
    expect(state.filteredLeafCount).toBe(3);
  });

  it("indexById maps every node id to its position", () => {
    const state = buildRowState({
      data,
      columns: cols,
      groupBy: [],
      expanded: expansion([]),
      getRowId,
    });
    expect(state.indexById.get("1")).toBe(0);
    expect(state.indexById.get("5")).toBe(4);
  });

  it("respects the caller-supplied totalLeafCount override", () => {
    const state = buildRowState({
      data,
      columns: cols,
      groupBy: [],
      expanded: expansion([]),
      getRowId,
      totalLeafCount: 1000,
    });
    expect(state.totalLeafCount).toBe(1000);
    expect(state.filteredLeafCount).toBe(5);
  });
});

// ─── Stable group identity across data changes ────────────────────

describe("group identity is stable across row mutations", () => {
  it("identical group paths produce identical group node IDs across rebuilds", () => {
    const first = buildRowNodes({
      data,
      columns: cols,
      groupBy: ["region"],
      expanded: expansion([]),
      getRowId,
    });
    const shuffled: readonly Sale[] = [data[4], data[0], data[2], data[1], data[3]] as Sale[];
    const second = buildRowNodes({
      data: shuffled,
      columns: cols,
      groupBy: ["region"],
      expanded: expansion([]),
      getRowId,
    });
    const idsForGroups = (nodes: readonly GridRowNode<Sale>[]) =>
      nodes.filter((n): n is GridGroupRowNode => n.kind === "group").map((n) => n.id);
    expect(new Set(idsForGroups(first))).toEqual(new Set(idsForGroups(second)));
  });
});
