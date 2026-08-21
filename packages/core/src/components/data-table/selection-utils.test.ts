import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  toggleRowSelection,
  selectAll,
  selectNone,
  toggleSelectAll,
  getSelectAllState,
  isRowSelected,
} from "./selection-utils";
import { useRowSelection } from "./use-row-selection";
import type { RowId } from "../data/data-types";

// ─── toggleRowSelection ─────────────────────────────────────────────

describe("toggleRowSelection", () => {
  it("returns unchanged set in none mode", () => {
    const ids = new Set<RowId>([1]);
    expect(toggleRowSelection(ids, 2, "none")).toBe(ids);
  });

  it("single mode: selects a row", () => {
    const result = toggleRowSelection(new Set(), 1, "single");
    expect(result.has(1)).toBe(true);
    expect(result.size).toBe(1);
  });

  it("single mode: deselects the same row", () => {
    const result = toggleRowSelection(new Set([1]), 1, "single");
    expect(result.size).toBe(0);
  });

  it("single mode: replaces previous selection", () => {
    const result = toggleRowSelection(new Set([1]), 2, "single");
    expect(result.has(1)).toBe(false);
    expect(result.has(2)).toBe(true);
    expect(result.size).toBe(1);
  });

  it("multiple mode: adds a row", () => {
    const result = toggleRowSelection(new Set([1]), 2, "multiple");
    expect(result.has(1)).toBe(true);
    expect(result.has(2)).toBe(true);
  });

  it("multiple mode: removes a row", () => {
    const result = toggleRowSelection(new Set([1, 2]), 1, "multiple");
    expect(result.has(1)).toBe(false);
    expect(result.has(2)).toBe(true);
  });

  it("does not mutate original set", () => {
    const original = new Set<RowId>([1]);
    toggleRowSelection(original, 2, "multiple");
    expect(original.size).toBe(1);
  });
});

// ─── selectAll / selectNone ─────────────────────────────────────────

describe("selectAll / selectNone", () => {
  it("selectAll creates set from IDs", () => {
    const result = selectAll([1, 2, 3]);
    expect(result.size).toBe(3);
    expect(result.has(2)).toBe(true);
  });

  it("selectNone returns empty set", () => {
    expect(selectNone().size).toBe(0);
  });
});

// ─── toggleSelectAll ────────────────────────────────────────────────

describe("toggleSelectAll", () => {
  it("selects all when none are selected", () => {
    const result = toggleSelectAll(new Set(), [1, 2, 3]);
    expect(result.size).toBe(3);
  });

  it("deselects all when all are selected", () => {
    const result = toggleSelectAll(new Set([1, 2, 3]), [1, 2, 3]);
    expect(result.size).toBe(0);
  });

  it("selects all when partially selected (indeterminate)", () => {
    const result = toggleSelectAll(new Set([1]), [1, 2, 3]);
    expect(result.size).toBe(3);
  });

  it("returns empty for empty visible rows", () => {
    const result = toggleSelectAll(new Set([1]), []);
    expect(result.size).toBe(0);
  });
});

// ─── getSelectAllState ──────────────────────────────────────────────

describe("getSelectAllState", () => {
  it("returns 'none' when no rows selected", () => {
    expect(getSelectAllState(new Set(), [1, 2])).toBe("none");
  });

  it("returns 'all' when all visible selected", () => {
    expect(getSelectAllState(new Set([1, 2]), [1, 2])).toBe("all");
  });

  it("returns 'indeterminate' when partially selected", () => {
    expect(getSelectAllState(new Set([1]), [1, 2])).toBe("indeterminate");
  });

  it("returns 'none' for empty visible rows", () => {
    expect(getSelectAllState(new Set([1]), [])).toBe("none");
  });

  it("returns 'all' even with extra selections outside visible", () => {
    expect(getSelectAllState(new Set([1, 2, 99]), [1, 2])).toBe("all");
  });
});

// ─── isRowSelected ──────────────────────────────────────────────────

describe("isRowSelected", () => {
  it("returns true for selected row", () => {
    expect(isRowSelected(new Set([1, 2]), 1)).toBe(true);
  });

  it("returns false for unselected row", () => {
    expect(isRowSelected(new Set([1]), 2)).toBe(false);
  });

  it("works with string IDs", () => {
    expect(isRowSelected(new Set(["a", "b"]), "a")).toBe(true);
    expect(isRowSelected(new Set(["a"]), "c")).toBe(false);
  });
});

// ─── useRowSelection ───────────────────────────────────────────────

describe("useRowSelection", () => {
  it("defaults to none mode with empty selection", () => {
    const { result } = renderHook(() => useRowSelection());
    expect(result.current.selectionMode).toBe("none");
    expect(result.current.selectedIds.size).toBe(0);
  });

  it("starts with defaultSelectedIds", () => {
    const { result } = renderHook(() =>
      useRowSelection({
        selectionMode: "multiple",
        defaultSelectedIds: new Set([1, 2]),
      }),
    );
    expect(result.current.selectedIds.size).toBe(2);
    expect(result.current.isSelected(1)).toBe(true);
  });

  it("toggleRow adds/removes in multiple mode", () => {
    const { result } = renderHook(() => useRowSelection({ selectionMode: "multiple" }));

    act(() => {
      result.current.toggleRow(1);
    });
    expect(result.current.isSelected(1)).toBe(true);

    act(() => {
      result.current.toggleRow(2);
    });
    expect(result.current.selectedIds.size).toBe(2);

    act(() => {
      result.current.toggleRow(1);
    });
    expect(result.current.isSelected(1)).toBe(false);
    expect(result.current.selectedIds.size).toBe(1);
  });

  it("toggleRow replaces in single mode", () => {
    const { result } = renderHook(() => useRowSelection({ selectionMode: "single" }));

    act(() => {
      result.current.toggleRow(1);
    });
    expect(result.current.isSelected(1)).toBe(true);

    act(() => {
      result.current.toggleRow(2);
    });
    expect(result.current.isSelected(1)).toBe(false);
    expect(result.current.isSelected(2)).toBe(true);
  });

  it("toggleRow is no-op in none mode", () => {
    const { result } = renderHook(() => useRowSelection({ selectionMode: "none" }));

    act(() => {
      result.current.toggleRow(1);
    });
    expect(result.current.selectedIds.size).toBe(0);
  });

  it("toggleAll selects all visible rows", () => {
    const { result } = renderHook(() => useRowSelection({ selectionMode: "multiple" }));

    act(() => {
      result.current.toggleAll([1, 2, 3]);
    });
    expect(result.current.selectedIds.size).toBe(3);
  });

  it("toggleAll deselects when all selected", () => {
    const { result } = renderHook(() =>
      useRowSelection({
        selectionMode: "multiple",
        defaultSelectedIds: new Set([1, 2, 3]),
      }),
    );

    act(() => {
      result.current.toggleAll([1, 2, 3]);
    });
    expect(result.current.selectedIds.size).toBe(0);
  });

  it("toggleAll is no-op in single mode", () => {
    const { result } = renderHook(() => useRowSelection({ selectionMode: "single" }));

    act(() => {
      result.current.toggleAll([1, 2, 3]);
    });
    expect(result.current.selectedIds.size).toBe(0);
  });

  it("calls onSelectionChange callback", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useRowSelection({ selectionMode: "multiple", onSelectionChange: onChange }),
    );

    act(() => {
      result.current.toggleRow(1);
    });
    expect(onChange).toHaveBeenCalledWith(new Set([1]));
  });

  it("works in controlled mode", () => {
    const onChange = vi.fn();
    const selected = new Set<RowId>([1]);

    const { result, rerender } = renderHook(
      ({ ids }) =>
        useRowSelection({
          selectionMode: "multiple",
          selectedIds: ids,
          onSelectionChange: onChange,
        }),
      { initialProps: { ids: selected } },
    );

    expect(result.current.isSelected(1)).toBe(true);

    act(() => {
      result.current.toggleRow(2);
    });
    expect(onChange).toHaveBeenCalled();

    // Update parent state
    rerender({ ids: new Set([1, 2]) });
    expect(result.current.isSelected(2)).toBe(true);
  });

  it("onSelectionChange sets selection directly", () => {
    const { result } = renderHook(() => useRowSelection({ selectionMode: "multiple" }));

    act(() => {
      result.current.onSelectionChange(new Set([5, 6]));
    });
    expect(result.current.selectedIds.size).toBe(2);
    expect(result.current.isSelected(5)).toBe(true);
  });
});
