import { describe, it, expect, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import type { ExpansionState, RowId } from "@kairoui/core/components";
import { useGrouping } from "./use-grouping";
import type { DataGridColumnDef } from "./column-types";

interface Row {
  readonly id: string;
  readonly region: string;
  readonly product: string;
  readonly secret: string;
}

const cols: readonly DataGridColumnDef<Row>[] = [
  { id: "region", header: "Region", accessorKey: "region" },
  { id: "product", header: "Product", accessorKey: "product" },
  { id: "secret", header: "Secret", accessorKey: "secret", groupable: false },
];

function expansion(ids: readonly string[]): ExpansionState {
  return { expandedIds: new Set<RowId>(ids) };
}

// ─── Initial state ────────────────────────────────────────────────

describe("useGrouping — initialization", () => {
  it("defaults to no grouping and no expansion", () => {
    const { result } = renderHook(() => useGrouping({ columns: cols }));
    expect(result.current.state.groupBy).toEqual([]);
    expect(result.current.expanded.expandedIds.size).toBe(0);
  });

  it("respects defaultGroupBy", () => {
    const { result } = renderHook(() => useGrouping({ columns: cols, defaultGroupBy: ["region"] }));
    expect(result.current.state.groupBy).toEqual(["region"]);
  });

  it("respects defaultExpanded", () => {
    const { result } = renderHook(() =>
      useGrouping({ columns: cols, defaultExpanded: expansion(["a"]) }),
    );
    expect(result.current.isExpanded("a")).toBe(true);
  });
});

// ─── Grouping mutations ───────────────────────────────────────────

describe("useGrouping — groupBy mutations (uncontrolled)", () => {
  it("groupByColumn appends valid columns", () => {
    const { result } = renderHook(() => useGrouping({ columns: cols }));
    act(() => {
      result.current.groupByColumn("region");
    });
    expect(result.current.state.groupBy).toEqual(["region"]);
    act(() => {
      result.current.groupByColumn("product");
    });
    expect(result.current.state.groupBy).toEqual(["region", "product"]);
  });

  it("groupByColumn drops unknown or forbidden columns silently", () => {
    const { result } = renderHook(() => useGrouping({ columns: cols }));
    act(() => {
      result.current.groupByColumn("mystery");
      result.current.groupByColumn("secret");
    });
    expect(result.current.state.groupBy).toEqual([]);
  });

  it("groupByColumn is a no-op when the column is already grouped", () => {
    const { result } = renderHook(() => useGrouping({ columns: cols }));
    act(() => {
      result.current.groupByColumn("region");
      result.current.groupByColumn("region");
    });
    expect(result.current.state.groupBy).toEqual(["region"]);
  });

  it("ungroupColumn removes the column while preserving order", () => {
    const { result } = renderHook(() =>
      useGrouping({ columns: cols, defaultGroupBy: ["region", "product"] }),
    );
    act(() => {
      result.current.ungroupColumn("region");
    });
    expect(result.current.state.groupBy).toEqual(["product"]);
  });

  it("setGroupBy replaces the list, filtered through column validation", () => {
    const { result } = renderHook(() => useGrouping({ columns: cols }));
    act(() => {
      result.current.setGroupBy(["product", "mystery", "secret", "region"]);
    });
    expect(result.current.state.groupBy).toEqual(["product", "region"]);
  });

  it("clearGrouping empties the list", () => {
    const { result } = renderHook(() =>
      useGrouping({ columns: cols, defaultGroupBy: ["region", "product"] }),
    );
    act(() => {
      result.current.clearGrouping();
    });
    expect(result.current.state.groupBy).toEqual([]);
  });
});

// ─── Expansion mutations ──────────────────────────────────────────

describe("useGrouping — expansion mutations (uncontrolled)", () => {
  it("toggleExpanded adds and removes an ID", () => {
    const { result } = renderHook(() => useGrouping({ columns: cols }));
    act(() => {
      result.current.toggleExpanded("g1");
    });
    expect(result.current.isExpanded("g1")).toBe(true);
    act(() => {
      result.current.toggleExpanded("g1");
    });
    expect(result.current.isExpanded("g1")).toBe(false);
  });

  it("expandGroup / collapseGroup are idempotent", () => {
    const { result } = renderHook(() => useGrouping({ columns: cols }));
    act(() => {
      result.current.expandGroup("g1");
      result.current.expandGroup("g1");
    });
    expect(result.current.expanded.expandedIds.size).toBe(1);
    act(() => {
      result.current.collapseGroup("g1");
      result.current.collapseGroup("g1");
    });
    expect(result.current.expanded.expandedIds.size).toBe(0);
  });

  it("expandAll replaces the set with the given IDs", () => {
    const { result } = renderHook(() => useGrouping({ columns: cols }));
    act(() => {
      result.current.expandAll(["a", "b", "c"]);
    });
    expect(result.current.expanded.expandedIds.size).toBe(3);
    expect(result.current.isExpanded("a")).toBe(true);
    expect(result.current.isExpanded("c")).toBe(true);
  });

  it("collapseAll clears the set", () => {
    const { result } = renderHook(() => useGrouping({ columns: cols }));
    act(() => {
      result.current.expandAll(["a", "b"]);
    });
    act(() => {
      result.current.collapseAll();
    });
    expect(result.current.expanded.expandedIds.size).toBe(0);
  });

  it("setExpanded replaces the state wholesale", () => {
    const { result } = renderHook(() => useGrouping({ columns: cols }));
    act(() => {
      result.current.setExpanded(expansion(["x"]));
    });
    expect(result.current.isExpanded("x")).toBe(true);
  });
});

// ─── Controlled ──────────────────────────────────────────────────

describe("useGrouping — controlled", () => {
  it("fires onGroupByChange with the reduced next list", () => {
    const onGroupByChange = vi.fn();
    const { result } = renderHook(() =>
      useGrouping({ columns: cols, groupBy: [], onGroupByChange }),
    );
    act(() => {
      result.current.groupByColumn("region");
    });
    expect(onGroupByChange).toHaveBeenCalledTimes(1);
    expect(onGroupByChange.mock.calls[0]?.[0]).toEqual(["region"]);
  });

  it("fires onExpandChange with the next expansion state", () => {
    const onExpandChange = vi.fn();
    const { result } = renderHook(() =>
      useGrouping({ columns: cols, expanded: expansion([]), onExpandChange }),
    );
    act(() => {
      result.current.toggleExpanded("g1");
    });
    expect(onExpandChange).toHaveBeenCalledTimes(1);
    const next = onExpandChange.mock.calls[0]?.[0] as ExpansionState;
    expect(next.expandedIds.has("g1")).toBe(true);
  });
});
