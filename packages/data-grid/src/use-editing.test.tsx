import { describe, it, expect, vi } from "vitest";
import { act, fireEvent, render, renderHook } from "@testing-library/react";
import { createElement } from "react";
import type { RowId } from "@kairoui/core/components";
import { useEditing } from "./use-editing";
import type { DataGridColumnDef, ValidationResult } from "./column-types";
import type { CellEditEvent, RowEditEvent } from "./editing-types";

interface Row {
  readonly id: string;
  readonly name: string;
  readonly age: number;
  readonly readonly: string;
}

const rows: Row[] = [
  { id: "r1", name: "Alice", age: 30, readonly: "x" },
  { id: "r2", name: "Bob", age: 25, readonly: "y" },
];

const cols: readonly DataGridColumnDef<Row>[] = [
  {
    id: "name",
    header: "Name",
    accessorKey: "name",
    editable: true,
  },
  {
    id: "age",
    header: "Age",
    accessorKey: "age",
    editable: true,
    parseEdit: (input) => (typeof input === "string" ? Number(input) : input),
    validateEdit: (input): ValidationResult => {
      const parsed = typeof input === "string" ? Number(input) : input;
      if (typeof parsed !== "number" || !Number.isFinite(parsed)) {
        return { ok: false, message: "must be a number" };
      }
      if (parsed < 0) return { ok: false, message: "must be positive" };
      return { ok: true };
    },
  },
  { id: "readonly", header: "R/O", accessorKey: "readonly" },
];

const getRowId = (row: Row): RowId => row.id;

// ─── Mode gating ──────────────────────────────────────────────────

describe("useEditing — mode gating", () => {
  it("defaults to view mode with no active editor", () => {
    const { result } = renderHook(() => useEditing({ data: rows, columns: cols, getRowId }));
    expect(result.current.mode).toBe("none");
    expect(result.current.state.active).toBeNull();
  });

  it("beginEdit is a no-op in view mode", () => {
    const { result } = renderHook(() => useEditing({ data: rows, columns: cols, getRowId }));
    act(() => {
      result.current.beginEdit("r1", "name");
    });
    expect(result.current.state.active).toBeNull();
  });

  it("beginEdit is a no-op on columns without editable=true", () => {
    const { result } = renderHook(() =>
      useEditing({ data: rows, columns: cols, getRowId, mode: "cell" }),
    );
    act(() => {
      result.current.beginEdit("r1", "readonly");
    });
    expect(result.current.state.active).toBeNull();
  });

  it("beginEdit is a no-op for unknown row / column IDs", () => {
    const { result } = renderHook(() =>
      useEditing({ data: rows, columns: cols, getRowId, mode: "cell" }),
    );
    act(() => {
      result.current.beginEdit("mystery", "name");
      result.current.beginEdit("r1", "mystery");
    });
    expect(result.current.state.active).toBeNull();
  });
});

// ─── Cell mode ────────────────────────────────────────────────────

describe("useEditing — cell mode", () => {
  it("seeds active with the row's current cell value", () => {
    const { result } = renderHook(() =>
      useEditing({ data: rows, columns: cols, getRowId, mode: "cell" }),
    );
    act(() => {
      result.current.beginEdit("r1", "name");
    });
    expect(result.current.state.active?.rawInput).toBe("Alice");
  });

  it("changeEdit runs column.validateEdit and reflects the result", () => {
    const { result } = renderHook(() =>
      useEditing({ data: rows, columns: cols, getRowId, mode: "cell" }),
    );
    act(() => {
      result.current.beginEdit("r1", "age");
    });
    act(() => {
      result.current.changeEdit("-1");
    });
    expect(result.current.state.active?.validation).toEqual({
      ok: false,
      message: "must be positive",
    });
  });

  it("commitEdit fires onCellEdit with parsed value and clears active", async () => {
    const onCellEdit = vi.fn();
    const { result } = renderHook(() =>
      useEditing({ data: rows, columns: cols, getRowId, mode: "cell", onCellEdit }),
    );
    act(() => {
      result.current.beginEdit("r1", "age");
    });
    act(() => {
      result.current.changeEdit("42");
    });
    await act(async () => {
      await result.current.commitEdit();
    });
    expect(onCellEdit).toHaveBeenCalledTimes(1);
    const event = onCellEdit.mock.calls[0]?.[0] as CellEditEvent<Row>;
    expect(event.rowId).toBe("r1");
    expect(event.columnId).toBe("age");
    expect(event.rawInput).toBe("42");
    expect(event.value).toBe(42);
    expect(result.current.state.active).toBeNull();
  });

  it("commitEdit leaves the editor open when validation fails", async () => {
    const onCellEdit = vi.fn();
    const { result } = renderHook(() =>
      useEditing({ data: rows, columns: cols, getRowId, mode: "cell", onCellEdit }),
    );
    act(() => {
      result.current.beginEdit("r1", "age");
    });
    act(() => {
      result.current.changeEdit("nope");
    });
    await act(async () => {
      await result.current.commitEdit();
    });
    expect(onCellEdit).not.toHaveBeenCalled();
    expect(result.current.state.active?.validation.ok).toBe(false);
  });

  it("commitEdit does not clear active when onCellEdit throws", async () => {
    const onCellEdit = vi.fn().mockRejectedValue(new Error("network"));
    const { result } = renderHook(() =>
      useEditing({ data: rows, columns: cols, getRowId, mode: "cell", onCellEdit }),
    );
    act(() => {
      result.current.beginEdit("r1", "name");
    });
    act(() => {
      result.current.changeEdit("Alicia");
    });
    await act(async () => {
      await expect(result.current.commitEdit()).rejects.toThrow(/network/);
    });
    expect(result.current.state.active?.rawInput).toBe("Alicia");
  });

  it("cancelEdit clears the active editor", () => {
    const { result } = renderHook(() =>
      useEditing({ data: rows, columns: cols, getRowId, mode: "cell" }),
    );
    act(() => {
      result.current.beginEdit("r1", "name");
    });
    act(() => {
      result.current.cancelEdit();
    });
    expect(result.current.state.active).toBeNull();
  });
});

// ─── Row mode ─────────────────────────────────────────────────────

describe("useEditing — row mode", () => {
  it("commitEdit stages the parsed value into pending", async () => {
    const onCellEdit = vi.fn();
    const { result } = renderHook(() =>
      useEditing({ data: rows, columns: cols, getRowId, mode: "row", onCellEdit }),
    );
    act(() => {
      result.current.beginEdit("r1", "age");
    });
    act(() => {
      result.current.changeEdit("40");
    });
    await act(async () => {
      await result.current.commitEdit();
    });
    expect(onCellEdit).not.toHaveBeenCalled();
    expect(result.current.state.pending.get("r1")?.get("age")).toBe(40);
    expect(result.current.state.active).toBeNull();
  });

  it("commitRow flushes pending to onRowEdit and clears the row", async () => {
    const onRowEdit = vi.fn();
    const { result } = renderHook(() =>
      useEditing({ data: rows, columns: cols, getRowId, mode: "row", onRowEdit }),
    );
    act(() => {
      result.current.beginEdit("r1", "name");
    });
    act(() => {
      result.current.changeEdit("Alicia");
    });
    await act(async () => {
      await result.current.commitEdit();
    });
    act(() => {
      result.current.beginEdit("r1", "age");
    });
    act(() => {
      result.current.changeEdit("40");
    });
    await act(async () => {
      await result.current.commitEdit();
    });
    await act(async () => {
      await result.current.commitRow("r1");
    });
    expect(onRowEdit).toHaveBeenCalledTimes(1);
    const event = onRowEdit.mock.calls[0]?.[0] as RowEditEvent<Row>;
    expect(event.rowId).toBe("r1");
    expect(event.changes.get("name")).toBe("Alicia");
    expect(event.changes.get("age")).toBe(40);
    expect(result.current.state.pending.has("r1")).toBe(false);
  });

  it("commitEdit records a validation error without clearing the editor", async () => {
    const { result } = renderHook(() =>
      useEditing({ data: rows, columns: cols, getRowId, mode: "row" }),
    );
    act(() => {
      result.current.beginEdit("r1", "age");
    });
    act(() => {
      result.current.changeEdit("nope");
    });
    await act(async () => {
      await result.current.commitEdit();
    });
    expect(result.current.state.active).not.toBeNull();
    expect(result.current.getCellError("r1", "age")).toBe("must be a number");
  });

  it("discardRow drops pending for one row", async () => {
    const { result } = renderHook(() =>
      useEditing({ data: rows, columns: cols, getRowId, mode: "row" }),
    );
    act(() => {
      result.current.beginEdit("r1", "name");
    });
    act(() => {
      result.current.changeEdit("A");
    });
    await act(async () => {
      await result.current.commitEdit();
    });
    act(() => {
      result.current.discardRow("r1");
    });
    expect(result.current.state.pending.has("r1")).toBe(false);
  });
});

// ─── Batch mode ───────────────────────────────────────────────────

describe("useEditing — batch mode", () => {
  it("commitAll flushes every row in sequence", async () => {
    const onRowEdit = vi.fn();
    const { result } = renderHook(() =>
      useEditing({ data: rows, columns: cols, getRowId, mode: "batch", onRowEdit }),
    );
    act(() => {
      result.current.beginEdit("r1", "name");
    });
    act(() => {
      result.current.changeEdit("A");
    });
    await act(async () => {
      await result.current.commitEdit();
    });
    act(() => {
      result.current.beginEdit("r2", "name");
    });
    act(() => {
      result.current.changeEdit("B");
    });
    await act(async () => {
      await result.current.commitEdit();
    });
    await act(async () => {
      await result.current.commitAll();
    });
    expect(onRowEdit).toHaveBeenCalledTimes(2);
    expect(result.current.state.pending.size).toBe(0);
  });

  it("discardAll clears every pending row", async () => {
    const { result } = renderHook(() =>
      useEditing({ data: rows, columns: cols, getRowId, mode: "batch" }),
    );
    act(() => {
      result.current.beginEdit("r1", "name");
    });
    act(() => {
      result.current.changeEdit("A");
    });
    await act(async () => {
      await result.current.commitEdit();
    });
    act(() => {
      result.current.discardAll();
    });
    expect(result.current.state.pending.size).toBe(0);
  });
});

// ─── Keyboard commit / cancel ─────────────────────────────────────

describe("useEditing — keyboard handler", () => {
  it("Enter triggers commit", async () => {
    const onCellEdit = vi.fn();
    const { result } = renderHook(() =>
      useEditing({ data: rows, columns: cols, getRowId, mode: "cell", onCellEdit }),
    );
    const { getByTestId } = render(
      createElement("input", {
        "data-testid": "editor",
        onKeyDown: result.current.getEditorKeyHandler(),
      }),
    );
    act(() => {
      result.current.beginEdit("r1", "name");
    });
    act(() => {
      result.current.changeEdit("Alicia");
    });
    await act(async () => {
      fireEvent.keyDown(getByTestId("editor"), { key: "Enter" });
      await Promise.resolve();
    });
    expect(onCellEdit).toHaveBeenCalledTimes(1);
  });

  it("Escape triggers cancel", () => {
    const { result } = renderHook(() =>
      useEditing({ data: rows, columns: cols, getRowId, mode: "cell" }),
    );
    const { getByTestId } = render(
      createElement("input", {
        "data-testid": "editor",
        onKeyDown: result.current.getEditorKeyHandler(),
      }),
    );
    act(() => {
      result.current.beginEdit("r1", "name");
    });
    act(() => {
      fireEvent.keyDown(getByTestId("editor"), { key: "Escape" });
    });
    expect(result.current.state.active).toBeNull();
  });

  it("Shift+Enter is not treated as commit", async () => {
    const onCellEdit = vi.fn();
    const { result } = renderHook(() =>
      useEditing({ data: rows, columns: cols, getRowId, mode: "cell", onCellEdit }),
    );
    const { getByTestId } = render(
      createElement("input", {
        "data-testid": "editor",
        onKeyDown: result.current.getEditorKeyHandler(),
      }),
    );
    act(() => {
      result.current.beginEdit("r1", "name");
    });
    await act(async () => {
      fireEvent.keyDown(getByTestId("editor"), { key: "Enter", shiftKey: true });
      await Promise.resolve();
    });
    expect(onCellEdit).not.toHaveBeenCalled();
  });
});

// ─── getCellEditContext ───────────────────────────────────────────

describe("useEditing — cell-editor context", () => {
  it("returns the render context only for the active cell", () => {
    const { result } = renderHook(() =>
      useEditing({ data: rows, columns: cols, getRowId, mode: "cell" }),
    );
    act(() => {
      result.current.beginEdit("r1", "name");
    });
    expect(result.current.getCellEditContext("r1", "name")).not.toBeNull();
    expect(result.current.getCellEditContext("r2", "name")).toBeNull();
    expect(result.current.getCellEditContext("r1", "age")).toBeNull();
  });

  it("context.setInput forwards to changeEdit", () => {
    const { result } = renderHook(() =>
      useEditing({ data: rows, columns: cols, getRowId, mode: "cell" }),
    );
    act(() => {
      result.current.beginEdit("r1", "name");
    });
    act(() => {
      result.current.getCellEditContext("r1", "name")?.setInput("Alicia");
    });
    expect(result.current.state.active?.rawInput).toBe("Alicia");
  });

  it("context.commit forwards to commitEdit", async () => {
    const onCellEdit = vi.fn();
    const { result } = renderHook(() =>
      useEditing({ data: rows, columns: cols, getRowId, mode: "cell", onCellEdit }),
    );
    act(() => {
      result.current.beginEdit("r1", "name");
    });
    act(() => {
      result.current.changeEdit("Alicia");
    });
    await act(async () => {
      result.current.getCellEditContext("r1", "name")?.commit();
      await Promise.resolve();
    });
    expect(onCellEdit).toHaveBeenCalledTimes(1);
  });

  it("context.cancel forwards to cancelEdit", () => {
    const { result } = renderHook(() =>
      useEditing({ data: rows, columns: cols, getRowId, mode: "cell" }),
    );
    act(() => {
      result.current.beginEdit("r1", "name");
    });
    act(() => {
      result.current.getCellEditContext("r1", "name")?.cancel();
    });
    expect(result.current.state.active).toBeNull();
  });
});

// ─── Controlled ──────────────────────────────────────────────────

describe("useEditing — controlled", () => {
  it("fires onEditingChange with the next state", () => {
    const onEditingChange = vi.fn();
    const { result } = renderHook(() =>
      useEditing({
        data: rows,
        columns: cols,
        getRowId,
        mode: "cell",
        onEditingChange,
      }),
    );
    act(() => {
      result.current.beginEdit("r1", "name");
    });
    expect(onEditingChange).toHaveBeenCalled();
    const last = onEditingChange.mock.calls[onEditingChange.mock.calls.length - 1]?.[0] as {
      readonly active: { readonly rowId: RowId; readonly columnId: string } | null;
    };
    expect(last.active?.rowId).toBe("r1");
  });
});

// ─── Immutability ─────────────────────────────────────────────────

describe("useEditing — row immutability", () => {
  it("never mutates the input rows even after multiple commits", async () => {
    const originals = rows.map((r) => ({ ...r }));
    const { result } = renderHook(() =>
      useEditing({
        data: rows,
        columns: cols,
        getRowId,
        mode: "cell",
        onCellEdit: () => undefined,
      }),
    );
    act(() => {
      result.current.beginEdit("r1", "name");
    });
    act(() => {
      result.current.changeEdit("Alicia");
    });
    await act(async () => {
      await result.current.commitEdit();
    });
    for (let i = 0; i < rows.length; i++) {
      expect(rows[i]).toEqual(originals[i]);
    }
  });
});
