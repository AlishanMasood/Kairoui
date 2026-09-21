import { describe, it, expect } from "vitest";
import type { ColumnFilter, FilterState, SortState } from "@kairoui/core/components";
import {
  DEFAULT_COLUMN_WIDTH,
  DEFAULT_MAX_COLUMN_WIDTH,
  DEFAULT_MIN_COLUMN_WIDTH,
  clampColumnWidth,
  clearSort,
  findColumnFilter,
  findSortEntry,
  getColumnDefaultWidth,
  getColumnRuntime,
  getColumnWidth,
  getPinnedColumnIds,
  getTotalWidth,
  getVisibleColumnIds,
  hideColumn,
  initialColumnState,
  isColumnHidden,
  isColumnPinned,
  moveColumn,
  pinColumn,
  resetColumnState,
  setColumnOrder,
  setColumnPinning,
  setColumnSizing,
  setColumnVisibility,
  setColumnWidth,
  toggleColumnSort,
} from "./column-model";
import type { DataGridColumnDef } from "./column-types";

interface Person {
  readonly id: string;
  readonly name: string;
  readonly age: number;
  readonly email: string;
}

const cols: readonly DataGridColumnDef<Person>[] = [
  { id: "name", header: "Name", accessorKey: "name" },
  { id: "age", header: "Age", accessorKey: "age", minWidth: 60, maxWidth: 400 },
  { id: "email", header: "Email", accessorKey: "email", defaultWidth: 240 },
  { id: "status", header: "Status", accessorKey: "id", width: 100, hideable: false },
];

// ─── Column-def helpers ────────────────────────────────────────────

describe("getColumnDefaultWidth", () => {
  it("prefers width over defaultWidth", () => {
    expect(getColumnDefaultWidth({ id: "x", header: "", width: 200, defaultWidth: 300 })).toBe(200);
  });

  it("falls back to defaultWidth when width is absent", () => {
    expect(getColumnDefaultWidth({ id: "x", header: "", defaultWidth: 300 })).toBe(300);
  });

  it("falls back to DEFAULT_COLUMN_WIDTH when neither is present", () => {
    expect(getColumnDefaultWidth({ id: "x", header: "" })).toBe(DEFAULT_COLUMN_WIDTH);
  });

  it("respects an explicit fallback override", () => {
    expect(getColumnDefaultWidth({ id: "x", header: "" }, 500)).toBe(500);
  });

  it("ignores non-finite width", () => {
    expect(getColumnDefaultWidth({ id: "x", header: "", width: Number.NaN })).toBe(
      DEFAULT_COLUMN_WIDTH,
    );
  });
});

describe("clampColumnWidth", () => {
  it("clamps below minWidth", () => {
    expect(clampColumnWidth({ id: "x", header: "", minWidth: 60 }, 10)).toBe(60);
  });

  it("clamps above maxWidth", () => {
    expect(clampColumnWidth({ id: "x", header: "", maxWidth: 300 }, 500)).toBe(300);
  });

  it("passes values inside envelope through unchanged", () => {
    expect(clampColumnWidth({ id: "x", header: "", minWidth: 40, maxWidth: 400 }, 150)).toBe(150);
  });

  it("uses DEFAULT_MIN / DEFAULT_MAX when column def omits them", () => {
    expect(clampColumnWidth({ id: "x", header: "" }, DEFAULT_MIN_COLUMN_WIDTH - 1)).toBe(
      DEFAULT_MIN_COLUMN_WIDTH,
    );
    expect(clampColumnWidth({ id: "x", header: "" }, DEFAULT_MAX_COLUMN_WIDTH + 1)).toBe(
      DEFAULT_MAX_COLUMN_WIDTH,
    );
  });

  it("recovers from a min>max misconfiguration by returning min", () => {
    expect(clampColumnWidth({ id: "x", header: "", minWidth: 500, maxWidth: 100 }, 200)).toBe(500);
  });

  it("falls back to default when width is non-finite", () => {
    expect(clampColumnWidth({ id: "x", header: "", width: 200 }, Number.NaN)).toBe(200);
  });
});

// ─── Initialization ───────────────────────────────────────────────

describe("initialColumnState", () => {
  it("uses canonical column order when no override is given", () => {
    const state = initialColumnState(cols);
    expect(state.order).toEqual(["name", "age", "email", "status"]);
  });

  it("respects an order override and appends missing IDs after it", () => {
    const state = initialColumnState(cols, { order: ["email", "name"] });
    expect(state.order).toEqual(["email", "name", "age", "status"]);
  });

  it("drops unknown IDs from an order override", () => {
    const state = initialColumnState(cols, { order: ["mystery", "email", "email", "age"] });
    expect(state.order).toEqual(["email", "age", "name", "status"]);
  });

  it("initializes width from column def (width > defaultWidth > fallback)", () => {
    const state = initialColumnState(cols);
    expect(state.sizing).toEqual({
      name: DEFAULT_COLUMN_WIDTH,
      age: DEFAULT_COLUMN_WIDTH,
      email: 240,
      status: 100,
    });
  });

  it("applies the caller-supplied fallback width for columns with no width metadata", () => {
    const state = initialColumnState(cols, { defaultColumnWidth: 200 });
    expect(state.sizing["name"]).toBe(200);
    expect(state.sizing["email"]).toBe(240);
    expect(state.sizing["status"]).toBe(100);
  });

  it("clamps sizing overrides against the column def envelope", () => {
    const state = initialColumnState(cols, { sizing: { age: 10, email: 5000 } });
    expect(state.sizing["age"]).toBe(60);
    expect(state.sizing["email"]).toBe(DEFAULT_MAX_COLUMN_WIDTH);
  });

  it("marks every column visible by default", () => {
    const state = initialColumnState(cols);
    for (const id of ["name", "age", "email", "status"]) {
      expect(state.visibility[id]).toBe(true);
    }
  });

  it("honors a visibility override for hideable columns", () => {
    const state = initialColumnState(cols, { visibility: { name: false } });
    expect(state.visibility["name"]).toBe(false);
  });

  it("keeps hideable:false columns visible even if the override sets them hidden", () => {
    const state = initialColumnState(cols, { visibility: { status: false } });
    expect(state.visibility["status"]).toBe(false);
  });

  it("returns the empty pinning slice when no pinning override is given", () => {
    const state = initialColumnState(cols);
    expect(state.pinned.left).toEqual([]);
    expect(state.pinned.right).toEqual([]);
  });

  it("normalizes the pinning override and drops unknown IDs", () => {
    const state = initialColumnState(cols, {
      pinning: { left: ["name", "mystery"], right: ["status"] },
    });
    expect(state.pinned.left).toEqual(["name"]);
    expect(state.pinned.right).toEqual(["status"]);
  });
});

describe("resetColumnState", () => {
  it("produces the same shape as initialColumnState", () => {
    const initial = initialColumnState(cols);
    const reset = resetColumnState(cols);
    expect(reset).toEqual(initial);
  });
});

// ─── Selectors ────────────────────────────────────────────────────

describe("getVisibleColumnIds", () => {
  it("returns pinned-left → center → pinned-right in that order", () => {
    let state = initialColumnState(cols, {
      pinning: { left: ["email"], right: ["status"] },
    });
    expect(getVisibleColumnIds(state)).toEqual(["email", "name", "age", "status"]);

    state = pinColumn(state, "name", "left");
    expect(getVisibleColumnIds(state)).toEqual(["email", "name", "age", "status"]);
  });

  it("omits hidden columns", () => {
    let state = initialColumnState(cols);
    state = hideColumn(state, "age", true);
    expect(getVisibleColumnIds(state)).toEqual(["name", "email", "status"]);
  });
});

describe("getPinnedColumnIds", () => {
  it("partitions IDs into left / center / right and omits hidden ones", () => {
    let state = initialColumnState(cols, {
      pinning: { left: ["name"], right: ["status"] },
    });
    state = hideColumn(state, "age", true);
    const groups = getPinnedColumnIds(state);
    expect(groups.left).toEqual(["name"]);
    expect(groups.center).toEqual(["email"]);
    expect(groups.right).toEqual(["status"]);
  });
});

describe("getColumnWidth", () => {
  it("returns the sized width when known", () => {
    const state = initialColumnState(cols);
    expect(getColumnWidth(state, "email")).toBe(240);
  });

  it("falls back to DEFAULT_COLUMN_WIDTH for unknown IDs", () => {
    const state = initialColumnState(cols);
    expect(getColumnWidth(state, "mystery")).toBe(DEFAULT_COLUMN_WIDTH);
  });
});

describe("getTotalWidth", () => {
  it("sums the widths of every visible column when no IDs are supplied", () => {
    const state = initialColumnState(cols);
    // name(150) + age(150) + email(240) + status(100)
    expect(getTotalWidth(state)).toBe(640);
  });

  it("sums the given ID set", () => {
    const state = initialColumnState(cols);
    expect(getTotalWidth(state, ["email", "status"])).toBe(340);
  });

  it("ignores hidden columns when computing the visible total", () => {
    let state = initialColumnState(cols);
    state = hideColumn(state, "email", true);
    expect(getTotalWidth(state)).toBe(400);
  });
});

describe("isColumnHidden / isColumnPinned", () => {
  it("reports pin sides accurately", () => {
    let state = initialColumnState(cols);
    state = pinColumn(state, "name", "left");
    state = pinColumn(state, "status", "right");
    expect(isColumnPinned(state, "name")).toBe("left");
    expect(isColumnPinned(state, "status")).toBe("right");
    expect(isColumnPinned(state, "age")).toBeNull();
  });

  it("reports hidden state accurately", () => {
    let state = initialColumnState(cols);
    expect(isColumnHidden(state, "age")).toBe(false);
    state = hideColumn(state, "age", true);
    expect(isColumnHidden(state, "age")).toBe(true);
  });
});

// ─── Multi-sort projection ────────────────────────────────────────

describe("findSortEntry", () => {
  it("returns the position and entry for a match", () => {
    const sort: readonly SortState[] = [
      { columnId: "name", direction: "ascending" },
      { columnId: "age", direction: "descending" },
    ];
    expect(findSortEntry(sort, "age")).toEqual({
      index: 1,
      entry: { columnId: "age", direction: "descending" },
    });
  });

  it("returns undefined when the column is not sorted", () => {
    expect(findSortEntry([], "age")).toBeUndefined();
  });
});

describe("findColumnFilter", () => {
  it("returns the matching column filter", () => {
    const filter: ColumnFilter = { columnId: "age", op: "greaterThan", value: 21 };
    const filterState: FilterState = {
      globalFilter: "",
      columnFilters: [filter],
      combinator: "and",
    };
    expect(findColumnFilter(filterState, "age")).toBe(filter);
  });

  it("returns null when the column is not filtered", () => {
    const filterState: FilterState = { globalFilter: "", columnFilters: [], combinator: "and" };
    expect(findColumnFilter(filterState, "age")).toBeNull();
  });
});

describe("getColumnRuntime", () => {
  it("materializes id / width / pinned / hidden / orderIndex", () => {
    let state = initialColumnState(cols);
    state = pinColumn(state, "name", "left");
    state = hideColumn(state, "age", true);
    const runtime = getColumnRuntime(state, "name");
    expect(runtime?.id).toBe("name");
    expect(runtime?.width).toBe(DEFAULT_COLUMN_WIDTH);
    expect(runtime?.pinned).toBe("left");
    expect(runtime?.hidden).toBe(false);
    expect(runtime?.orderIndex).toBe(state.order.indexOf("name"));
    const hidden = getColumnRuntime(state, "age");
    expect(hidden?.hidden).toBe(true);
  });

  it("returns undefined for an unknown ID", () => {
    const state = initialColumnState(cols);
    expect(getColumnRuntime(state, "mystery")).toBeUndefined();
  });

  it("projects sort into sortIndex / sortDirection when context is supplied", () => {
    const state = initialColumnState(cols);
    const runtime = getColumnRuntime(state, "age", {
      sort: [
        { columnId: "name", direction: "ascending" },
        { columnId: "age", direction: "descending" },
      ],
    });
    expect(runtime?.sortIndex).toBe(1);
    expect(runtime?.sortDirection).toBe("descending");
  });

  it("returns nulls for sort when no context is supplied", () => {
    const state = initialColumnState(cols);
    const runtime = getColumnRuntime(state, "age");
    expect(runtime?.sortIndex).toBeNull();
    expect(runtime?.sortDirection).toBeNull();
  });

  it("projects filter from filterState when context is supplied", () => {
    const state = initialColumnState(cols);
    const filter: ColumnFilter = { columnId: "age", op: "greaterThan", value: 18 };
    const runtime = getColumnRuntime(state, "age", {
      filterState: { globalFilter: "", columnFilters: [filter], combinator: "and" },
    });
    expect(runtime?.filter).toBe(filter);
  });

  it("returns null filter when no context is supplied", () => {
    const state = initialColumnState(cols);
    const runtime = getColumnRuntime(state, "age");
    expect(runtime?.filter).toBeNull();
  });
});

// ─── Sizing transitions ───────────────────────────────────────────

describe("setColumnWidth", () => {
  it("clamps against the column def envelope", () => {
    const state = initialColumnState(cols);
    const next = setColumnWidth(cols, state, "age", 10);
    expect(next.sizing["age"]).toBe(60);
  });

  it("returns the same reference when the clamped width matches current", () => {
    let state = initialColumnState(cols);
    state = setColumnWidth(cols, state, "email", 500);
    const next = setColumnWidth(cols, state, "email", 500);
    expect(next).toBe(state);
  });

  it("ignores unknown IDs", () => {
    const state = initialColumnState(cols);
    expect(setColumnWidth(cols, state, "mystery", 200)).toBe(state);
  });
});

describe("setColumnSizing", () => {
  it("replaces the sizing map wholesale", () => {
    const state = initialColumnState(cols);
    const next = setColumnSizing(state, { name: 500 });
    expect(next.sizing).toEqual({ name: 500 });
  });
});

// ─── Order transitions ───────────────────────────────────────────

describe("setColumnOrder", () => {
  it("appends missing IDs after the requested prefix", () => {
    const state = initialColumnState(cols);
    const next = setColumnOrder(state, ["email"]);
    expect(next.order).toEqual(["email", "name", "age", "status"]);
  });

  it("drops unknown IDs from the requested order", () => {
    const state = initialColumnState(cols);
    const next = setColumnOrder(state, ["mystery", "status", "name"]);
    expect(next.order).toEqual(["status", "name", "age", "email"]);
  });

  it("deduplicates the requested order", () => {
    const state = initialColumnState(cols);
    const next = setColumnOrder(state, ["name", "name", "email"]);
    expect(next.order).toEqual(["name", "email", "age", "status"]);
  });
});

describe("moveColumn", () => {
  it("moves a column forward", () => {
    const state = initialColumnState(cols);
    const next = moveColumn(state, "name", 2);
    expect(next.order).toEqual(["age", "email", "name", "status"]);
  });

  it("moves a column backward", () => {
    const state = initialColumnState(cols);
    const next = moveColumn(state, "status", 0);
    expect(next.order).toEqual(["status", "name", "age", "email"]);
  });

  it("clamps the target index to the array bounds", () => {
    const state = initialColumnState(cols);
    const next = moveColumn(state, "name", 999);
    expect(next.order).toEqual(["age", "email", "status", "name"]);
  });

  it("returns the same reference when the column is already at the target", () => {
    const state = initialColumnState(cols);
    const next = moveColumn(state, "name", 0);
    expect(next).toBe(state);
  });

  it("ignores unknown IDs", () => {
    const state = initialColumnState(cols);
    expect(moveColumn(state, "mystery", 0)).toBe(state);
  });
});

// ─── Pinning transitions ─────────────────────────────────────────

describe("pinColumn", () => {
  it("pins to the left", () => {
    const state = initialColumnState(cols);
    const next = pinColumn(state, "name", "left");
    expect(next.pinned.left).toEqual(["name"]);
  });

  it("pins to the right", () => {
    const state = initialColumnState(cols);
    const next = pinColumn(state, "name", "right");
    expect(next.pinned.right).toEqual(["name"]);
  });

  it("moves a column between sides", () => {
    let state = initialColumnState(cols);
    state = pinColumn(state, "name", "left");
    state = pinColumn(state, "name", "right");
    expect(state.pinned.left).toEqual([]);
    expect(state.pinned.right).toEqual(["name"]);
  });

  it("unpins with side=null", () => {
    let state = initialColumnState(cols);
    state = pinColumn(state, "name", "left");
    state = pinColumn(state, "name", null);
    expect(state.pinned.left).toEqual([]);
    expect(state.pinned.right).toEqual([]);
  });

  it("is idempotent when the column is already pinned to the requested side", () => {
    const state = pinColumn(initialColumnState(cols), "name", "left");
    const next = pinColumn(state, "name", "left");
    expect(next).toBe(state);
  });

  it("is idempotent when unpinning an already-unpinned column", () => {
    const state = initialColumnState(cols);
    const next = pinColumn(state, "name", null);
    expect(next).toBe(state);
  });

  it("ignores unknown IDs", () => {
    const state = initialColumnState(cols);
    expect(pinColumn(state, "mystery", "left")).toBe(state);
  });
});

describe("setColumnPinning", () => {
  it("normalizes the input and drops unknown IDs", () => {
    const state = initialColumnState(cols);
    const next = setColumnPinning(state, {
      left: ["name", "mystery", "name"],
      right: ["status"],
    });
    expect(next.pinned.left).toEqual(["name"]);
    expect(next.pinned.right).toEqual(["status"]);
  });
});

// ─── Visibility transitions ──────────────────────────────────────

describe("hideColumn", () => {
  it("marks a column hidden", () => {
    const state = initialColumnState(cols);
    const next = hideColumn(state, "age", true);
    expect(next.visibility["age"]).toBe(false);
  });

  it("marks a column visible", () => {
    let state = initialColumnState(cols);
    state = hideColumn(state, "age", true);
    state = hideColumn(state, "age", false);
    expect(state.visibility["age"]).toBe(true);
  });

  it("is idempotent when the visibility is already at the target value", () => {
    const state = initialColumnState(cols);
    const next = hideColumn(state, "age", false);
    expect(next).toBe(state);
  });

  it("ignores unknown IDs", () => {
    const state = initialColumnState(cols);
    expect(hideColumn(state, "mystery", true)).toBe(state);
  });
});

describe("setColumnVisibility", () => {
  it("replaces the visibility map wholesale", () => {
    const state = initialColumnState(cols);
    const next = setColumnVisibility(state, { name: false });
    expect(next.visibility).toEqual({ name: false });
  });
});

// ─── Multi-sort transitions ──────────────────────────────────────

describe("toggleColumnSort", () => {
  it("cycles unsorted → ascending → descending → unsorted in single-column mode", () => {
    const empty: readonly SortState[] = [];
    const asc = toggleColumnSort(empty, "name");
    expect(asc).toEqual([{ columnId: "name", direction: "ascending" }]);
    const desc = toggleColumnSort(asc, "name");
    expect(desc).toEqual([{ columnId: "name", direction: "descending" }]);
    const cleared = toggleColumnSort(desc, "name");
    expect(cleared).toEqual([]);
  });

  it("resets other entries in single-column mode", () => {
    const start: readonly SortState[] = [{ columnId: "age", direction: "ascending" }];
    const next = toggleColumnSort(start, "name");
    expect(next).toEqual([{ columnId: "name", direction: "ascending" }]);
  });

  it("appends new entries in additive mode without touching existing ones", () => {
    const start: readonly SortState[] = [{ columnId: "age", direction: "descending" }];
    const next = toggleColumnSort(start, "name", true);
    expect(next).toEqual([
      { columnId: "age", direction: "descending" },
      { columnId: "name", direction: "ascending" },
    ]);
  });

  it("cycles a specific entry inside a multi-sort array", () => {
    const start: readonly SortState[] = [
      { columnId: "name", direction: "ascending" },
      { columnId: "age", direction: "ascending" },
    ];
    const desc = toggleColumnSort(start, "name", true);
    expect(desc).toEqual([
      { columnId: "name", direction: "descending" },
      { columnId: "age", direction: "ascending" },
    ]);
    const removed = toggleColumnSort(desc, "name", true);
    expect(removed).toEqual([{ columnId: "age", direction: "ascending" }]);
  });
});

describe("clearSort", () => {
  it("returns an empty array", () => {
    expect(clearSort()).toEqual([]);
  });
});
