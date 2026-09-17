import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useFilterState } from "./use-filter-state";
import { EMPTY_FILTER_STATE } from "./filter-utils";
import type { FilterState } from "./filter-utils";

describe("useFilterState: uncontrolled", () => {
  it("starts empty by default", () => {
    const { result } = renderHook(() => useFilterState());
    expect(result.current.filterState).toEqual(EMPTY_FILTER_STATE);
  });

  it("accepts a defaultFilterState seed", () => {
    const seed: FilterState = {
      globalFilter: "abc",
      combinator: "or",
      columnFilters: [{ columnId: "age", op: "equals", value: 1 }],
    };
    const { result } = renderHook(() => useFilterState({ defaultFilterState: seed }));
    expect(result.current.filterState).toEqual(seed);
  });

  it("setGlobalFilter updates the state", () => {
    const { result } = renderHook(() => useFilterState());
    act(() => {
      result.current.setGlobalFilter("hello");
    });
    expect(result.current.filterState.globalFilter).toBe("hello");
  });

  it("setColumnFilter adds and replaces column filters", () => {
    const { result } = renderHook(() => useFilterState());
    act(() => {
      result.current.setColumnFilter("age", { columnId: "age", op: "equals", value: 30 });
    });
    expect(result.current.filterState.columnFilters).toHaveLength(1);
    act(() => {
      result.current.setColumnFilter("age", { columnId: "age", op: "equals", value: 40 });
    });
    expect(result.current.filterState.columnFilters).toHaveLength(1);
    expect(result.current.filterState.columnFilters[0]?.value).toBe(40);
  });

  it("clearColumnFilter removes one column filter", () => {
    const { result } = renderHook(() => useFilterState());
    act(() => {
      result.current.setColumnFilter("age", { columnId: "age", op: "equals", value: 30 });
      result.current.setColumnFilter("name", {
        columnId: "name",
        op: "contains",
        value: "a",
      });
    });
    act(() => {
      result.current.clearColumnFilter("age");
    });
    expect(result.current.filterState.columnFilters).toHaveLength(1);
    expect(result.current.filterState.columnFilters[0]?.columnId).toBe("name");
  });

  it("clearAll resets the state while keeping the combinator", () => {
    const seed: FilterState = {
      globalFilter: "abc",
      combinator: "or",
      columnFilters: [{ columnId: "age", op: "equals", value: 1 }],
    };
    const { result } = renderHook(() => useFilterState({ defaultFilterState: seed }));
    act(() => {
      result.current.clearAll();
    });
    expect(result.current.filterState.globalFilter).toBe("");
    expect(result.current.filterState.columnFilters).toHaveLength(0);
    expect(result.current.filterState.combinator).toBe("or");
  });
});

describe("useFilterState: controlled", () => {
  it("reflects the controlled prop and does not mutate parent state via setters", () => {
    const state: FilterState = {
      globalFilter: "seed",
      combinator: "and",
      columnFilters: [],
    };
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useFilterState({ filterState: state, onFilterStateChange: onChange }),
    );
    expect(result.current.filterState).toBe(state);
    act(() => {
      result.current.setGlobalFilter("changed");
    });
    // Parent controls the state — the hook does not mutate the prop but does
    // call onFilterStateChange with the new value.
    expect(state.globalFilter).toBe("seed");
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0]?.[0].globalFilter).toBe("changed");
  });

  it("onFilterStateChange fires for each transition", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useFilterState({ onFilterStateChange: onChange }));
    act(() => {
      result.current.setGlobalFilter("a");
    });
    act(() => {
      result.current.setColumnFilter("age", { columnId: "age", op: "equals", value: 1 });
    });
    act(() => {
      result.current.clearAll();
    });
    expect(onChange).toHaveBeenCalledTimes(3);
  });
});

describe("useFilterState: setter stability", () => {
  it("setters are stable across renders", () => {
    const { result, rerender } = renderHook(() => useFilterState());
    const initial = result.current;
    rerender();
    expect(result.current.setGlobalFilter).toBe(initial.setGlobalFilter);
    expect(result.current.setColumnFilter).toBe(initial.setColumnFilter);
    expect(result.current.clearColumnFilter).toBe(initial.clearColumnFilter);
    expect(result.current.clearAll).toBe(initial.clearAll);
    expect(result.current.setFilterState).toBe(initial.setFilterState);
  });
});
