import { describe, it, expect } from "vitest";
import {
  applyFilters,
  clearAllFilters,
  clearColumnFilter,
  evaluateColumnFilter,
  filterPredicates,
  isColumnFilterable,
  matchesGlobalFilter,
  setColumnFilter,
  setGlobalFilter,
  EMPTY_FILTER_STATE,
} from "./filter-utils";
import type { ColumnFilter, FilterState } from "./filter-utils";
import { column } from "./column-utils";

// ─── Test data ─────────────────────────────────────────────────────

interface User {
  id: number;
  name: string;
  age: number;
  role: string;
  joined: Date;
  active: boolean;
}

const users: readonly User[] = [
  { id: 1, name: "Alice", age: 30, role: "admin", joined: new Date(2024, 0, 15), active: true },
  { id: 2, name: "Bob", age: 25, role: "user", joined: new Date(2024, 3, 1), active: true },
  { id: 3, name: "Charlie", age: 45, role: "user", joined: new Date(2025, 6, 10), active: false },
  { id: 4, name: "diana", age: 30, role: "admin", joined: new Date(2023, 11, 5), active: true },
];

const cols = [
  column<User>({ id: "name", header: "Name", accessorKey: "name", filterKind: "text" }),
  column<User>({ id: "age", header: "Age", accessorKey: "age", filterKind: "number" }),
  column<User>({ id: "role", header: "Role", accessorKey: "role", filterKind: "select" }),
  column<User>({ id: "joined", header: "Joined", accessorKey: "joined", filterKind: "date" }),
  column<User>({ id: "active", header: "Active", accessorKey: "active", filterKind: "boolean" }),
  column<User>({ id: "actions", header: "Actions" }),
];

// ─── Predicates ─────────────────────────────────────────────────────

describe("filterPredicates: equals / notEquals", () => {
  it("primitive equality", () => {
    expect(filterPredicates.equals("a", "a")).toBe(true);
    expect(filterPredicates.equals(1, 1)).toBe(true);
    expect(filterPredicates.equals(1, 2)).toBe(false);
    expect(filterPredicates.notEquals(1, 2)).toBe(true);
  });

  it("compares Date instances by time", () => {
    const a = new Date(2026, 0, 1);
    const b = new Date(2026, 0, 1);
    const c = new Date(2026, 0, 2);
    expect(filterPredicates.equals(a, b)).toBe(true);
    expect(filterPredicates.equals(a, c)).toBe(false);
  });

  it("null / undefined only equal each other via Object.is", () => {
    expect(filterPredicates.equals(null, null)).toBe(true);
    expect(filterPredicates.equals(undefined, undefined)).toBe(true);
    expect(filterPredicates.equals(null, undefined)).toBe(false);
  });
});

describe("filterPredicates: string operators", () => {
  it("contains is case-insensitive", () => {
    expect(filterPredicates.contains("Hello world", "WORLD")).toBe(true);
    expect(filterPredicates.contains("Hello", "z")).toBe(false);
  });

  it("notContains is a strict negation for non-null cells", () => {
    expect(filterPredicates.notContains("Hello", "world")).toBe(true);
    expect(filterPredicates.notContains("Hello", "hello")).toBe(false);
  });

  it("notContains keeps rows with null cells", () => {
    expect(filterPredicates.notContains(null, "x")).toBe(true);
    expect(filterPredicates.notContains(undefined, "x")).toBe(true);
  });

  it("startsWith / endsWith are case-insensitive", () => {
    expect(filterPredicates.startsWith("Alice", "AL")).toBe(true);
    expect(filterPredicates.startsWith("Alice", "ce")).toBe(false);
    expect(filterPredicates.endsWith("Alice", "CE")).toBe(true);
  });

  it("contains rejects null / undefined cells", () => {
    expect(filterPredicates.contains(null, "a")).toBe(false);
    expect(filterPredicates.contains(undefined, "a")).toBe(false);
  });
});

describe("filterPredicates: numeric ordering", () => {
  it("compares numbers", () => {
    expect(filterPredicates.greaterThan(5, 3)).toBe(true);
    expect(filterPredicates.greaterThan(3, 5)).toBe(false);
    expect(filterPredicates.greaterThanOrEqual(5, 5)).toBe(true);
    expect(filterPredicates.lessThan(3, 5)).toBe(true);
    expect(filterPredicates.lessThanOrEqual(5, 5)).toBe(true);
  });

  it("compares dates by time", () => {
    const early = new Date(2024, 0, 1);
    const late = new Date(2026, 0, 1);
    expect(filterPredicates.greaterThan(late, early)).toBe(true);
    expect(filterPredicates.lessThan(early, late)).toBe(true);
  });

  it("returns false when either side is null / NaN", () => {
    expect(filterPredicates.greaterThan(null, 1)).toBe(false);
    expect(filterPredicates.lessThan(1, null)).toBe(false);
    expect(filterPredicates.greaterThan(Number.NaN, 1)).toBe(false);
  });

  it("coerces numeric strings", () => {
    expect(filterPredicates.greaterThan("5", "3")).toBe(true);
  });
});

describe("filterPredicates: between", () => {
  it("inclusive on both ends", () => {
    expect(filterPredicates.between(5, [1, 10])).toBe(true);
    expect(filterPredicates.between(1, [1, 10])).toBe(true);
    expect(filterPredicates.between(10, [1, 10])).toBe(true);
    expect(filterPredicates.between(0, [1, 10])).toBe(false);
    expect(filterPredicates.between(11, [1, 10])).toBe(false);
  });

  it("swaps reversed bounds", () => {
    expect(filterPredicates.between(5, [10, 1])).toBe(true);
  });

  it("rejects non-tuple filter values", () => {
    expect(filterPredicates.between(5, [1])).toBe(false);
    expect(filterPredicates.between(5, "not a tuple")).toBe(false);
  });

  it("works for dates", () => {
    const min = new Date(2024, 0, 1);
    const max = new Date(2025, 0, 1);
    const cell = new Date(2024, 6, 1);
    expect(filterPredicates.between(cell, [min, max])).toBe(true);
  });
});

describe("filterPredicates: in / notIn", () => {
  it("checks set membership", () => {
    expect(filterPredicates.in("a", ["a", "b", "c"])).toBe(true);
    expect(filterPredicates.in("z", ["a", "b", "c"])).toBe(false);
    expect(filterPredicates.notIn("z", ["a", "b", "c"])).toBe(true);
  });

  it("returns false when filter value is not an array", () => {
    expect(filterPredicates.in("a", "a")).toBe(false);
  });

  it("notIn keeps rows when filter value is not an array", () => {
    expect(filterPredicates.notIn("a", "a")).toBe(true);
  });
});

describe("filterPredicates: isEmpty / isNotEmpty", () => {
  it("treats null, undefined, empty string, empty array, NaN as empty", () => {
    for (const v of [null, undefined, "", [], Number.NaN]) {
      expect(filterPredicates.isEmpty(v)).toBe(true);
      expect(filterPredicates.isNotEmpty(v)).toBe(false);
    }
  });

  it("treats populated values as non-empty", () => {
    for (const v of ["a", 0, false, [1], { x: 1 }]) {
      expect(filterPredicates.isEmpty(v)).toBe(false);
      expect(filterPredicates.isNotEmpty(v)).toBe(true);
    }
  });
});

// ─── Column filterability ───────────────────────────────────────────

describe("isColumnFilterable", () => {
  it("respects explicit true / false", () => {
    expect(isColumnFilterable(column<User>({ id: "x", header: "X", filterable: false }))).toBe(
      false,
    );
    expect(isColumnFilterable(column<User>({ id: "x", header: "X", filterable: true }))).toBe(true);
  });

  it("defaults to true when an accessor exists", () => {
    expect(isColumnFilterable(cols[0]!)).toBe(true);
  });

  it("defaults to false without an accessor", () => {
    expect(isColumnFilterable(cols[cols.length - 1]!)).toBe(false);
  });
});

// ─── Global filter ─────────────────────────────────────────────────

describe("matchesGlobalFilter", () => {
  it("matches when any filterable column contains the input", () => {
    expect(matchesGlobalFilter(users[0]!, "alice", cols)).toBe(true);
    expect(matchesGlobalFilter(users[0]!, "admin", cols)).toBe(true);
  });

  it("does not consider non-filterable columns", () => {
    expect(matchesGlobalFilter(users[0]!, "actions", cols)).toBe(false);
  });

  it("empty input matches every row", () => {
    expect(matchesGlobalFilter(users[0]!, "", cols)).toBe(true);
  });

  it("is case-insensitive", () => {
    expect(matchesGlobalFilter(users[3]!, "DIANA", cols)).toBe(true);
  });
});

// ─── Column filter evaluation ──────────────────────────────────────

describe("evaluateColumnFilter", () => {
  const columns = cols;

  it("silently keeps rows when the column ID is unknown", () => {
    const filter: ColumnFilter = { columnId: "missing", op: "equals", value: 1 };
    expect(evaluateColumnFilter({ row: users[0]!, filter, columns })).toBe(true);
  });

  it("silently keeps rows when the column is non-filterable", () => {
    const filter: ColumnFilter = { columnId: "actions", op: "equals", value: "x" };
    expect(evaluateColumnFilter({ row: users[0]!, filter, columns })).toBe(true);
  });

  it("dispatches to the operator predicate", () => {
    const filter: ColumnFilter = { columnId: "age", op: "greaterThan", value: 29 };
    expect(evaluateColumnFilter({ row: users[0]!, filter, columns })).toBe(true);
    expect(evaluateColumnFilter({ row: users[1]!, filter, columns })).toBe(false);
  });

  it("prefers `filterFn` when defined on the column", () => {
    const overridden = [
      column<User>({
        id: "name",
        header: "Name",
        accessorKey: "name",
        filterFn: (row) => row.name.startsWith("A"),
      }),
    ];
    const filter: ColumnFilter = { columnId: "name", op: "equals", value: "irrelevant" };
    expect(evaluateColumnFilter({ row: users[0]!, filter, columns: overridden })).toBe(true);
    expect(evaluateColumnFilter({ row: users[1]!, filter, columns: overridden })).toBe(false);
  });
});

// ─── applyFilters ───────────────────────────────────────────────────

describe("applyFilters", () => {
  const columns = cols;

  it("returns the input array by reference for an empty state", () => {
    const result = applyFilters({ data: users, state: EMPTY_FILTER_STATE, columns });
    expect(result).toBe(users);
  });

  it("applies the global filter", () => {
    const state: FilterState = { ...EMPTY_FILTER_STATE, globalFilter: "alice" };
    const result = applyFilters({ data: users, state, columns });
    expect(result).toHaveLength(1);
    expect(result[0]?.name).toBe("Alice");
  });

  it("applies AND across column filters", () => {
    const state: FilterState = {
      ...EMPTY_FILTER_STATE,
      combinator: "and",
      columnFilters: [
        { columnId: "role", op: "equals", value: "admin" },
        { columnId: "age", op: "equals", value: 30 },
      ],
    };
    const result = applyFilters({ data: users, state, columns });
    expect(result.map((r) => r.name).sort()).toEqual(["Alice", "diana"]);
  });

  it("applies OR across column filters", () => {
    const state: FilterState = {
      ...EMPTY_FILTER_STATE,
      combinator: "or",
      columnFilters: [
        { columnId: "role", op: "equals", value: "admin" },
        { columnId: "age", op: "equals", value: 25 },
      ],
    };
    const result = applyFilters({ data: users, state, columns });
    expect(result.map((r) => r.name).sort()).toEqual(["Alice", "Bob", "diana"]);
  });

  it("ANDs the global filter with the column combinator", () => {
    const state: FilterState = {
      globalFilter: "admin",
      combinator: "or",
      columnFilters: [
        { columnId: "role", op: "equals", value: "admin" },
        { columnId: "age", op: "equals", value: 999 },
      ],
    };
    const result = applyFilters({ data: users, state, columns });
    // Global "admin" narrows to Alice, diana; both pass the OR via role=admin.
    expect(result.map((r) => r.name).sort()).toEqual(["Alice", "diana"]);
  });

  it("never mutates the input array", () => {
    const original = [...users];
    const state: FilterState = { ...EMPTY_FILTER_STATE, globalFilter: "zzz" };
    applyFilters({ data: users, state, columns });
    expect([...users]).toEqual(original);
  });
});

// ─── State transitions ─────────────────────────────────────────────

describe("setGlobalFilter", () => {
  it("replaces the global filter", () => {
    const next = setGlobalFilter(EMPTY_FILTER_STATE, "abc");
    expect(next.globalFilter).toBe("abc");
  });

  it("returns the same reference when unchanged", () => {
    const next = setGlobalFilter(EMPTY_FILTER_STATE, "");
    expect(next).toBe(EMPTY_FILTER_STATE);
  });
});

describe("setColumnFilter", () => {
  it("adds a new column filter", () => {
    const next = setColumnFilter(EMPTY_FILTER_STATE, "age", {
      columnId: "age",
      op: "equals",
      value: 30,
    });
    expect(next.columnFilters).toHaveLength(1);
    expect(next.columnFilters[0]?.value).toBe(30);
  });

  it("replaces an existing column filter", () => {
    const withOne = setColumnFilter(EMPTY_FILTER_STATE, "age", {
      columnId: "age",
      op: "equals",
      value: 30,
    });
    const withTwo = setColumnFilter(withOne, "age", {
      columnId: "age",
      op: "equals",
      value: 40,
    });
    expect(withTwo.columnFilters).toHaveLength(1);
    expect(withTwo.columnFilters[0]?.value).toBe(40);
  });

  it("removes a column filter when filter is undefined", () => {
    const withOne = setColumnFilter(EMPTY_FILTER_STATE, "age", {
      columnId: "age",
      op: "equals",
      value: 30,
    });
    const cleared = setColumnFilter(withOne, "age", undefined);
    expect(cleared.columnFilters).toHaveLength(0);
  });

  it("normalizes the columnId onto the stored filter", () => {
    const next = setColumnFilter(EMPTY_FILTER_STATE, "age", {
      columnId: "wrong",
      op: "equals",
      value: 30,
    });
    expect(next.columnFilters[0]?.columnId).toBe("age");
  });
});

describe("clearColumnFilter", () => {
  it("removes a column filter", () => {
    const withOne = setColumnFilter(EMPTY_FILTER_STATE, "age", {
      columnId: "age",
      op: "equals",
      value: 30,
    });
    const cleared = clearColumnFilter(withOne, "age");
    expect(cleared.columnFilters).toHaveLength(0);
  });
});

describe("clearAllFilters", () => {
  it("resets to empty while preserving the combinator", () => {
    const state: FilterState = {
      globalFilter: "abc",
      combinator: "or",
      columnFilters: [{ columnId: "age", op: "equals", value: 1 }],
    };
    const cleared = clearAllFilters(state);
    expect(cleared.globalFilter).toBe("");
    expect(cleared.columnFilters).toHaveLength(0);
    expect(cleared.combinator).toBe("or");
  });

  it("returns the same reference when already empty", () => {
    const cleared = clearAllFilters(EMPTY_FILTER_STATE);
    expect(cleared).toBe(EMPTY_FILTER_STATE);
  });
});
