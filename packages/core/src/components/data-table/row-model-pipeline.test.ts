import { describe, it, expect } from "vitest";
import { runRowModelPipeline } from "./row-model-pipeline";
import { column } from "./column-utils";
import { EMPTY_FILTER_STATE } from "./filter-utils";
import type { FilterState } from "./filter-utils";
import type { SortState } from "../data/data-types";

// ─── Test data ─────────────────────────────────────────────────────

interface User {
  id: number;
  name: string;
  age: number;
  role: string;
}

const users: readonly User[] = [
  { id: 1, name: "Charlie", age: 30, role: "admin" },
  { id: 2, name: "Alice", age: 25, role: "user" },
  { id: 3, name: "Bob", age: 45, role: "user" },
  { id: 4, name: "Alice", age: 28, role: "admin" },
];

const cols = [
  column<User>({ id: "name", header: "Name", accessorKey: "name", sortable: true }),
  column<User>({ id: "age", header: "Age", accessorKey: "age", sortable: true }),
  column<User>({ id: "role", header: "Role", accessorKey: "role", filterKind: "select" }),
];

// ─── No-op pipeline ─────────────────────────────────────────────────

describe("runRowModelPipeline: no-op", () => {
  it("returns the input array by reference when no filter and no sort", () => {
    const out = runRowModelPipeline({ data: users, columns: cols });
    expect(out).toBe(users);
  });

  it("returns input by reference with EMPTY_FILTER_STATE and no sort", () => {
    const out = runRowModelPipeline({
      data: users,
      columns: cols,
      filterState: EMPTY_FILTER_STATE,
    });
    expect(out).toBe(users);
  });
});

// ─── Filter → Sort order ───────────────────────────────────────────

describe("runRowModelPipeline: pipeline order", () => {
  it("filters before sorting", () => {
    const filterState: FilterState = {
      globalFilter: "",
      combinator: "and",
      columnFilters: [{ columnId: "role", op: "equals", value: "user" }],
    };
    const sort: SortState = { columnId: "age", direction: "ascending" };
    const out = runRowModelPipeline({ data: users, columns: cols, filterState, sort });
    expect(out.map((r) => r.name)).toEqual(["Alice", "Bob"]);
    expect(out.map((r) => r.age)).toEqual([25, 45]);
  });

  it("preserves original row references (no mutation)", () => {
    const filterState: FilterState = {
      globalFilter: "",
      combinator: "and",
      columnFilters: [{ columnId: "role", op: "equals", value: "admin" }],
    };
    const sort: SortState = { columnId: "name", direction: "ascending" };
    const out = runRowModelPipeline({ data: users, columns: cols, filterState, sort });
    for (const row of out) {
      expect(users.some((u) => u === row)).toBe(true);
    }
  });

  it("global filter + sort applied together", () => {
    const filterState: FilterState = {
      globalFilter: "alice",
      combinator: "and",
      columnFilters: [],
    };
    const sort: SortState = { columnId: "age", direction: "descending" };
    const out = runRowModelPipeline({ data: users, columns: cols, filterState, sort });
    expect(out.map((r) => r.age)).toEqual([28, 25]);
  });
});

// ─── Referential stability ─────────────────────────────────────────

describe("runRowModelPipeline: referential stability", () => {
  it("returns the input reference when both stages no-op", () => {
    const a = runRowModelPipeline({ data: users, columns: cols });
    const b = runRowModelPipeline({ data: users, columns: cols });
    expect(a).toBe(users);
    expect(b).toBe(users);
    expect(a).toBe(b);
  });

  it("does not mutate the input data array", () => {
    const original = [...users];
    const filterState: FilterState = {
      globalFilter: "",
      combinator: "and",
      columnFilters: [{ columnId: "role", op: "equals", value: "admin" }],
    };
    runRowModelPipeline({ data: users, columns: cols, filterState });
    expect([...users]).toEqual(original);
  });
});

// ─── Custom filter function via column ─────────────────────────────

describe("runRowModelPipeline: custom filter functions", () => {
  it("applies filterFn defined on the column", () => {
    const customCols = [
      column<User>({ id: "name", header: "Name", accessorKey: "name" }),
      column<User>({
        id: "role",
        header: "Role",
        accessorKey: "role",
        filterFn: (row) => row.name.startsWith("A") && row.role === "admin",
      }),
    ];
    const filterState: FilterState = {
      globalFilter: "",
      combinator: "and",
      columnFilters: [{ columnId: "role", op: "equals", value: "irrelevant" }],
    };
    const out = runRowModelPipeline({ data: users, columns: customCols, filterState });
    // Only Alice/admin (id=4) matches — Alice(user), Bob(user), Charlie(admin) do not.
    expect(out).toHaveLength(1);
    expect(out[0]?.id).toBe(4);
  });
});

// ─── Disabled filtering per column ─────────────────────────────────

describe("runRowModelPipeline: disabled filtering", () => {
  it("silently ignores filters targeting a column with filterable: false", () => {
    const gatedCols = [
      column<User>({ id: "name", header: "Name", accessorKey: "name" }),
      column<User>({
        id: "role",
        header: "Role",
        accessorKey: "role",
        filterable: false,
      }),
    ];
    const filterState: FilterState = {
      globalFilter: "",
      combinator: "and",
      columnFilters: [{ columnId: "role", op: "equals", value: "admin" }],
    };
    const out = runRowModelPipeline({ data: users, columns: gatedCols, filterState });
    expect(out).toHaveLength(users.length);
  });

  it("silently ignores global filter matches on non-filterable columns", () => {
    const gatedCols = [
      column<User>({ id: "name", header: "Name", accessorKey: "name" }),
      column<User>({
        id: "role",
        header: "Role",
        accessorKey: "role",
        filterable: false,
      }),
    ];
    const filterState: FilterState = {
      globalFilter: "admin",
      combinator: "and",
      columnFilters: [],
    };
    const out = runRowModelPipeline({ data: users, columns: gatedCols, filterState });
    // "admin" would match rows via the role column, but it is not filterable.
    // No filterable column contains "admin", so no rows pass.
    expect(out).toHaveLength(0);
  });
});
