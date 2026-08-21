import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { getNextSortState, defaultComparator, sortRows } from "./sort-utils";
import { useSortState } from "./use-sort-state";
import { column } from "./column-utils";
import type { SortState } from "../data/data-types";

// ─── Test data ──────────────────────────────────────────────────────

interface User {
  id: number;
  name: string;
  age: number;
}

const users: readonly User[] = [
  { id: 1, name: "Charlie", age: 30 },
  { id: 2, name: "Alice", age: 25 },
  { id: 3, name: "Bob", age: 35 },
  { id: 4, name: "Alice", age: 28 },
];

const cols = [
  column<User>({ id: "name", header: "Name", accessorKey: "name", sortable: true }),
  column<User>({ id: "age", header: "Age", accessorKey: "age", sortable: true }),
  column<User>({ id: "actions", header: "Actions", sortable: false }),
];

// ─── getNextSortState ───────────────────────────────────────────────

describe("getNextSortState", () => {
  it("unsorted → ascending", () => {
    const next = getNextSortState("name", undefined);
    expect(next).toEqual({ columnId: "name", direction: "ascending" });
  });

  it("ascending → descending", () => {
    const next = getNextSortState("name", { columnId: "name", direction: "ascending" });
    expect(next).toEqual({ columnId: "name", direction: "descending" });
  });

  it("descending → unsorted", () => {
    const next = getNextSortState("name", { columnId: "name", direction: "descending" });
    expect(next).toBeUndefined();
  });

  it("different column → ascending on new column", () => {
    const next = getNextSortState("age", { columnId: "name", direction: "ascending" });
    expect(next).toEqual({ columnId: "age", direction: "ascending" });
  });
});

// ─── defaultComparator ──────────────────────────────────────────────

describe("defaultComparator", () => {
  it("compares strings with localeCompare", () => {
    expect(defaultComparator("a", "b")).toBeLessThan(0);
    expect(defaultComparator("b", "a")).toBeGreaterThan(0);
    expect(defaultComparator("a", "a")).toBe(0);
  });

  it("compares numbers arithmetically", () => {
    expect(defaultComparator(1, 2)).toBeLessThan(0);
    expect(defaultComparator(10, 3)).toBeGreaterThan(0);
    expect(defaultComparator(5, 5)).toBe(0);
  });

  it("handles null/undefined (pushed to end)", () => {
    expect(defaultComparator(null, "a")).toBeGreaterThan(0);
    expect(defaultComparator("a", null)).toBeLessThan(0);
    expect(defaultComparator(undefined, "a")).toBeGreaterThan(0);
  });

  it("compares booleans (true before false)", () => {
    expect(defaultComparator(true, false)).toBeLessThan(0);
    expect(defaultComparator(false, true)).toBeGreaterThan(0);
  });

  it("returns 0 for equal values", () => {
    expect(defaultComparator(null, null)).toBe(0);
    expect(defaultComparator(42, 42)).toBe(0);
  });
});

// ─── sortRows ───────────────────────────────────────────────────────

describe("sortRows", () => {
  it("returns original data when sort is undefined", () => {
    const result = sortRows({ data: users, sort: undefined, columns: cols });
    expect(result).toBe(users);
  });

  it("sorts ascending by string column", () => {
    const sort: SortState = { columnId: "name", direction: "ascending" };
    const result = sortRows({ data: users, sort, columns: cols });
    expect(result.map((u) => u.name)).toEqual(["Alice", "Alice", "Bob", "Charlie"]);
  });

  it("sorts descending by string column", () => {
    const sort: SortState = { columnId: "name", direction: "descending" };
    const result = sortRows({ data: users, sort, columns: cols });
    expect(result.map((u) => u.name)).toEqual(["Charlie", "Bob", "Alice", "Alice"]);
  });

  it("sorts ascending by number column", () => {
    const sort: SortState = { columnId: "age", direction: "ascending" };
    const result = sortRows({ data: users, sort, columns: cols });
    expect(result.map((u) => u.age)).toEqual([25, 28, 30, 35]);
  });

  it("sorts descending by number column", () => {
    const sort: SortState = { columnId: "age", direction: "descending" };
    const result = sortRows({ data: users, sort, columns: cols });
    expect(result.map((u) => u.age)).toEqual([35, 30, 28, 25]);
  });

  it("preserves original order for equal values (stable sort)", () => {
    const sort: SortState = { columnId: "name", direction: "ascending" };
    const result = sortRows({ data: users, sort, columns: cols });
    const alices = result.filter((u) => u.name === "Alice");
    expect(alices[0]!.age).toBe(25);
    expect(alices[1]!.age).toBe(28);
  });

  it("does not mutate original data", () => {
    const frozen = Object.freeze([...users]);
    const sort: SortState = { columnId: "name", direction: "ascending" };
    const result = sortRows({ data: frozen, sort, columns: cols });
    expect(result).not.toBe(frozen);
    expect(frozen[0]!.name).toBe("Charlie");
  });

  it("returns original data for non-sortable column", () => {
    const sort: SortState = { columnId: "actions", direction: "ascending" };
    const result = sortRows({ data: users, sort, columns: cols });
    expect(result).toBe(users);
  });

  it("returns original data for unknown column ID", () => {
    const sort: SortState = { columnId: "unknown", direction: "ascending" };
    const result = sortRows({ data: users, sort, columns: cols });
    expect(result).toBe(users);
  });

  it("supports custom comparator", () => {
    const reverseCompare = (a: unknown, b: unknown) => defaultComparator(b, a);
    const sort: SortState = { columnId: "name", direction: "ascending" };
    const result = sortRows({ data: users, sort, columns: cols, comparator: reverseCompare });
    expect(result[0]!.name).toBe("Charlie");
  });

  it("works with empty data", () => {
    const sort: SortState = { columnId: "name", direction: "ascending" };
    const result = sortRows({ data: [], sort, columns: cols });
    expect(result).toHaveLength(0);
  });
});

// ─── useSortState ───────────────────────────────────────────────────

describe("useSortState", () => {
  it("starts with undefined sort (uncontrolled, no default)", () => {
    const { result } = renderHook(() => useSortState());
    expect(result.current.sort).toBeUndefined();
  });

  it("starts with defaultSort", () => {
    const defaultSort: SortState = { columnId: "name", direction: "ascending" };
    const { result } = renderHook(() => useSortState({ defaultSort }));
    expect(result.current.sort).toEqual(defaultSort);
  });

  it("toggleSort cycles through states", () => {
    const { result } = renderHook(() => useSortState());

    act(() => {
      result.current.toggleSort("name");
    });
    expect(result.current.sort).toEqual({ columnId: "name", direction: "ascending" });

    act(() => {
      result.current.toggleSort("name");
    });
    expect(result.current.sort).toEqual({ columnId: "name", direction: "descending" });

    act(() => {
      result.current.toggleSort("name");
    });
    expect(result.current.sort).toBeUndefined();
  });

  it("toggleSort on different column resets to ascending", () => {
    const { result } = renderHook(() =>
      useSortState({ defaultSort: { columnId: "name", direction: "descending" } }),
    );

    act(() => {
      result.current.toggleSort("age");
    });
    expect(result.current.sort).toEqual({ columnId: "age", direction: "ascending" });
  });

  it("onSortChange sets sort directly", () => {
    const { result } = renderHook(() => useSortState());

    act(() => {
      result.current.onSortChange({ columnId: "age", direction: "descending" });
    });
    expect(result.current.sort).toEqual({ columnId: "age", direction: "descending" });

    act(() => {
      result.current.onSortChange(undefined);
    });
    expect(result.current.sort).toBeUndefined();
  });

  it("calls onSortChange callback in uncontrolled mode", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useSortState({ onSortChange: onChange }));

    act(() => {
      result.current.toggleSort("name");
    });
    expect(onChange).toHaveBeenCalledWith({ columnId: "name", direction: "ascending" });
  });

  it("works in controlled mode", () => {
    const onChange = vi.fn();
    const sort: SortState = { columnId: "name", direction: "ascending" };

    const { result, rerender } = renderHook(
      ({ sort: s }) => useSortState({ sort: s, onSortChange: onChange }),
      { initialProps: { sort } },
    );

    expect(result.current.sort).toEqual(sort);

    act(() => {
      result.current.toggleSort("name");
    });
    expect(onChange).toHaveBeenCalled();

    // Value doesn't change until parent re-renders with new prop
    const newSort: SortState = { columnId: "name", direction: "descending" };
    rerender({ sort: newSort });
    expect(result.current.sort).toEqual(newSort);
  });
});
