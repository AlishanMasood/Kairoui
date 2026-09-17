import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useColumnFilter } from "./use-column-filter";
import { useFilterState } from "./use-filter-state";
import { EMPTY_FILTER_STATE } from "./filter-utils";

describe("useColumnFilter: read", () => {
  it("returns undefined filter when no entry exists", () => {
    const { result } = renderHook(() =>
      useColumnFilter({
        columnId: "name",
        filterState: EMPTY_FILTER_STATE,
        setColumnFilter: () => undefined,
        defaultOp: "contains",
      }),
    );
    expect(result.current.filter).toBeUndefined();
    expect(result.current.value).toBeUndefined();
    expect(result.current.op).toBe("contains");
  });

  it("returns the existing filter entry when present", () => {
    const state = {
      globalFilter: "",
      combinator: "and" as const,
      columnFilters: [{ columnId: "name", op: "contains" as const, value: "abc" }],
    };
    const { result } = renderHook(() =>
      useColumnFilter({
        columnId: "name",
        filterState: state,
        setColumnFilter: () => undefined,
        defaultOp: "contains",
      }),
    );
    expect(result.current.value).toBe("abc");
    expect(result.current.op).toBe("contains");
  });
});

describe("useColumnFilter: setValue", () => {
  it("creates a new filter with the default op when the column has no filter", () => {
    const wrapper = renderHook(() => {
      const store = useFilterState();
      const col = useColumnFilter({
        columnId: "name",
        filterState: store.filterState,
        setColumnFilter: store.setColumnFilter,
        defaultOp: "contains",
      });
      return { store, col };
    });
    act(() => {
      wrapper.result.current.col.setValue("hello");
    });
    expect(wrapper.result.current.store.filterState.columnFilters).toEqual([
      { columnId: "name", op: "contains", value: "hello" },
    ]);
  });

  it("clears the filter when value is empty (empty string / null / undefined / [])", () => {
    for (const empty of ["", null, undefined, []]) {
      const wrapper = renderHook(() => {
        const store = useFilterState({
          defaultFilterState: {
            globalFilter: "",
            combinator: "and",
            columnFilters: [{ columnId: "name", op: "contains", value: "abc" }],
          },
        });
        const col = useColumnFilter({
          columnId: "name",
          filterState: store.filterState,
          setColumnFilter: store.setColumnFilter,
          defaultOp: "contains",
        });
        return { store, col };
      });
      act(() => {
        wrapper.result.current.col.setValue(empty);
      });
      expect(wrapper.result.current.store.filterState.columnFilters).toHaveLength(0);
    }
  });
});

describe("useColumnFilter: setOp", () => {
  it("changes the operator while preserving the value", () => {
    const wrapper = renderHook(() => {
      const store = useFilterState({
        defaultFilterState: {
          globalFilter: "",
          combinator: "and",
          columnFilters: [{ columnId: "age", op: "equals", value: 30 }],
        },
      });
      const col = useColumnFilter({
        columnId: "age",
        filterState: store.filterState,
        setColumnFilter: store.setColumnFilter,
        defaultOp: "equals",
      });
      return { store, col };
    });
    act(() => {
      wrapper.result.current.col.setOp("greaterThan");
    });
    expect(wrapper.result.current.store.filterState.columnFilters[0]).toEqual({
      columnId: "age",
      op: "greaterThan",
      value: 30,
    });
  });

  it("removes the filter when changing op with no value present", () => {
    const wrapper = renderHook(() => {
      const store = useFilterState();
      const col = useColumnFilter({
        columnId: "age",
        filterState: store.filterState,
        setColumnFilter: store.setColumnFilter,
        defaultOp: "equals",
      });
      return { store, col };
    });
    act(() => {
      wrapper.result.current.col.setOp("greaterThan");
    });
    expect(wrapper.result.current.store.filterState.columnFilters).toHaveLength(0);
  });
});

describe("useColumnFilter: clear", () => {
  it("removes the column's filter entry", () => {
    const wrapper = renderHook(() => {
      const store = useFilterState({
        defaultFilterState: {
          globalFilter: "",
          combinator: "and",
          columnFilters: [{ columnId: "name", op: "contains", value: "abc" }],
        },
      });
      const col = useColumnFilter({
        columnId: "name",
        filterState: store.filterState,
        setColumnFilter: store.setColumnFilter,
        defaultOp: "contains",
      });
      return { store, col };
    });
    act(() => {
      wrapper.result.current.col.clear();
    });
    expect(wrapper.result.current.store.filterState.columnFilters).toHaveLength(0);
  });
});
