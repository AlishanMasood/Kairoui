import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useColumnState } from "./use-column-state";
import type { DataGridColumnDef } from "./column-types";

interface Row {
  readonly id: string;
  readonly name: string;
  readonly age: number;
}

const cols: readonly DataGridColumnDef<Row>[] = [
  { id: "name", header: "Name", accessorKey: "name" },
  { id: "age", header: "Age", accessorKey: "age", minWidth: 60, maxWidth: 400 },
  { id: "email", header: "Email", accessorKey: "id", defaultWidth: 240 },
  { id: "status", header: "Status", accessorKey: "id", width: 100, hideable: false },
];

// ─── Initial state ────────────────────────────────────────────────

describe("useColumnState — initialization", () => {
  it("derives state from the column defs when no controlled / default props are passed", () => {
    const { result } = renderHook(() => useColumnState({ columns: cols }));
    expect(result.current.order).toEqual(["name", "age", "email", "status"]);
    expect(result.current.sizing["email"]).toBe(240);
    expect(result.current.pinning).toEqual({ left: [], right: [] });
    expect(result.current.visibility["name"]).toBe(true);
  });

  it("respects defaultColumnOrder", () => {
    const { result } = renderHook(() =>
      useColumnState({ columns: cols, defaultColumnOrder: ["email", "name"] }),
    );
    expect(result.current.order).toEqual(["email", "name", "age", "status"]);
  });

  it("respects defaultColumnPinning", () => {
    const { result } = renderHook(() =>
      useColumnState({
        columns: cols,
        defaultColumnPinning: { left: ["name"], right: ["status"] },
      }),
    );
    expect(result.current.pinning.left).toEqual(["name"]);
    expect(result.current.pinning.right).toEqual(["status"]);
  });

  it("clamps defaultColumnSizing against the column def envelope", () => {
    const { result } = renderHook(() =>
      useColumnState({ columns: cols, defaultColumnSizing: { age: 10 } }),
    );
    expect(result.current.sizing["age"]).toBe(60);
  });
});

// ─── Uncontrolled transitions ─────────────────────────────────────

describe("useColumnState — uncontrolled", () => {
  it("resizes a single column", () => {
    const { result } = renderHook(() => useColumnState({ columns: cols }));
    act(() => {
      result.current.setColumnWidth("age", 200);
    });
    expect(result.current.sizing["age"]).toBe(200);
  });

  it("clamps resize deltas that exceed the column envelope", () => {
    const { result } = renderHook(() => useColumnState({ columns: cols }));
    act(() => {
      result.current.setColumnWidth("age", 5000);
    });
    expect(result.current.sizing["age"]).toBe(400);
  });

  it("replaces sizing wholesale", () => {
    const { result } = renderHook(() => useColumnState({ columns: cols }));
    act(() => {
      result.current.setColumnSizing({ name: 500 });
    });
    expect(result.current.sizing).toEqual({ name: 500 });
  });

  it("moves a column", () => {
    const { result } = renderHook(() => useColumnState({ columns: cols }));
    act(() => {
      result.current.moveColumn("status", 0);
    });
    expect(result.current.order).toEqual(["status", "name", "age", "email"]);
  });

  it("replaces order wholesale", () => {
    const { result } = renderHook(() => useColumnState({ columns: cols }));
    act(() => {
      result.current.setColumnOrder(["email"]);
    });
    expect(result.current.order).toEqual(["email", "name", "age", "status"]);
  });

  it("pins a column to the left", () => {
    const { result } = renderHook(() => useColumnState({ columns: cols }));
    act(() => {
      result.current.pinColumn("name", "left");
    });
    expect(result.current.pinning.left).toEqual(["name"]);
  });

  it("unpins a column with side=null", () => {
    const { result } = renderHook(() => useColumnState({ columns: cols }));
    act(() => {
      result.current.pinColumn("name", "left");
    });
    act(() => {
      result.current.pinColumn("name", null);
    });
    expect(result.current.pinning.left).toEqual([]);
  });

  it("replaces pinning wholesale", () => {
    const { result } = renderHook(() => useColumnState({ columns: cols }));
    act(() => {
      result.current.setColumnPinning({ left: ["email"], right: [] });
    });
    expect(result.current.pinning.left).toEqual(["email"]);
  });

  it("hides a column", () => {
    const { result } = renderHook(() => useColumnState({ columns: cols }));
    act(() => {
      result.current.hideColumn("age", true);
    });
    expect(result.current.visibility["age"]).toBe(false);
  });

  it("replaces visibility wholesale", () => {
    const { result } = renderHook(() => useColumnState({ columns: cols }));
    act(() => {
      result.current.setColumnVisibility({ name: false });
    });
    expect(result.current.visibility).toEqual({ name: false });
  });

  it("reset returns state to the initial derivation", () => {
    const { result } = renderHook(() => useColumnState({ columns: cols }));
    act(() => {
      result.current.setColumnWidth("age", 200);
      result.current.moveColumn("status", 0);
      result.current.hideColumn("age", true);
      result.current.pinColumn("name", "left");
    });
    act(() => {
      result.current.reset();
    });
    expect(result.current.sizing["age"]).toBe(150);
    expect(result.current.order).toEqual(["name", "age", "email", "status"]);
    expect(result.current.visibility["age"]).toBe(true);
    expect(result.current.pinning.left).toEqual([]);
  });
});

// ─── Controlled ──────────────────────────────────────────────────

describe("useColumnState — controlled", () => {
  it("fires onColumnSizingChange with the reduced next sizing", () => {
    const onColumnSizingChange = vi.fn();
    const initialSizing: Record<string, number> = {
      name: 150,
      age: 150,
      email: 240,
      status: 100,
    };
    const { result, rerender } = renderHook(
      (props: { sizing: Record<string, number> }) =>
        useColumnState({
          columns: cols,
          columnSizing: props.sizing,
          onColumnSizingChange,
        }),
      { initialProps: { sizing: initialSizing } },
    );

    act(() => {
      result.current.setColumnWidth("age", 300);
    });
    expect(onColumnSizingChange).toHaveBeenCalledTimes(1);
    const nextSizing = onColumnSizingChange.mock.calls[0]?.[0] as Record<string, number>;
    expect(nextSizing["age"]).toBe(300);

    rerender({ sizing: nextSizing });
    expect(result.current.sizing["age"]).toBe(300);
  });

  it("fires onColumnOrderChange with the reduced next order", () => {
    const onColumnOrderChange = vi.fn();
    const { result } = renderHook(() => useColumnState({ columns: cols, onColumnOrderChange }));
    act(() => {
      result.current.moveColumn("status", 0);
    });
    expect(onColumnOrderChange).toHaveBeenCalledTimes(1);
    expect(onColumnOrderChange.mock.calls[0]?.[0]).toEqual(["status", "name", "age", "email"]);
  });

  it("fires onColumnPinningChange with the reduced next pinning", () => {
    const onColumnPinningChange = vi.fn();
    const { result } = renderHook(() => useColumnState({ columns: cols, onColumnPinningChange }));
    act(() => {
      result.current.pinColumn("name", "left");
    });
    expect(onColumnPinningChange).toHaveBeenCalledTimes(1);
    const nextPinning = onColumnPinningChange.mock.calls[0]?.[0] as {
      left: readonly string[];
      right: readonly string[];
    };
    expect(nextPinning.left).toEqual(["name"]);
  });

  it("fires onColumnVisibilityChange with the reduced next visibility", () => {
    const onColumnVisibilityChange = vi.fn();
    const { result } = renderHook(() =>
      useColumnState({ columns: cols, onColumnVisibilityChange }),
    );
    act(() => {
      result.current.hideColumn("age", true);
    });
    expect(onColumnVisibilityChange).toHaveBeenCalledTimes(1);
    const nextVisibility = onColumnVisibilityChange.mock.calls[0]?.[0] as Record<string, boolean>;
    expect(nextVisibility["age"]).toBe(false);
  });

  it("does not couple layout state to DOM order — reorder computes from state alone", () => {
    const onColumnOrderChange = vi.fn();
    const { result } = renderHook(() => useColumnState({ columns: cols, onColumnOrderChange }));
    act(() => {
      result.current.moveColumn("email", 0);
    });
    expect(onColumnOrderChange.mock.calls[0]?.[0]).toEqual(["email", "name", "age", "status"]);
  });
});

// ─── Column def immutability ──────────────────────────────────────

describe("useColumnState — never mutates column defs", () => {
  it("leaves the input columns array intact after every transition", () => {
    const originals = cols.map((c) => ({ ...c }));
    const { result } = renderHook(() => useColumnState({ columns: cols }));
    act(() => {
      result.current.setColumnWidth("age", 200);
      result.current.moveColumn("email", 0);
      result.current.pinColumn("name", "left");
      result.current.hideColumn("age", true);
    });
    for (let i = 0; i < cols.length; i++) {
      expect(cols[i]).toEqual(originals[i]);
    }
  });
});
