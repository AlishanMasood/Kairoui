import { describe, it, expect } from "vitest";
import {
  EMPTY_EDITING_STATE,
  beginEdit,
  cancelEdit,
  changeEdit,
  discardAllPending,
  discardPendingRow,
  emptyEditingState,
  getCellError,
  getPendingValue,
  isCellEditing,
  isRowEditing,
  setEditingMode,
  stagePendingValue,
  stageValidationError,
} from "./editing-model";
import type { EditingState } from "./editing-types";

// ─── Empty state ──────────────────────────────────────────────────

describe("emptyEditingState", () => {
  it("defaults to view mode", () => {
    const s = emptyEditingState();
    expect(s.mode).toBe("none");
    expect(s.active).toBeNull();
    expect(s.pending.size).toBe(0);
    expect(s.errors.size).toBe(0);
  });

  it("respects an explicit mode argument", () => {
    expect(emptyEditingState("row").mode).toBe("row");
    expect(emptyEditingState("batch").mode).toBe("batch");
  });

  it("EMPTY_EDITING_STATE is a view-mode singleton", () => {
    expect(EMPTY_EDITING_STATE.mode).toBe("none");
    expect(EMPTY_EDITING_STATE.active).toBeNull();
  });
});

// ─── beginEdit ─────────────────────────────────────────────────────

describe("beginEdit", () => {
  it("populates active with the given initial value in cell mode", () => {
    const before = emptyEditingState("cell");
    const after = beginEdit(before, "r1", "name", "Alice");
    expect(after.active).toEqual({
      rowId: "r1",
      columnId: "name",
      rawInput: "Alice",
      validation: { ok: true },
    });
  });

  it("is a no-op in view mode", () => {
    const before = emptyEditingState("none");
    expect(beginEdit(before, "r1", "name", "x")).toBe(before);
  });

  it("does not mutate the input state", () => {
    const before = emptyEditingState("cell");
    const snapshot = { ...before };
    beginEdit(before, "r1", "name", "Alice");
    expect(before).toEqual(snapshot);
    expect(before.active).toBeNull();
  });
});

// ─── changeEdit ────────────────────────────────────────────────────

describe("changeEdit", () => {
  it("updates the raw input on the active editor", () => {
    const before = beginEdit(emptyEditingState("cell"), "r1", "name", "");
    const after = changeEdit(before, "Alice");
    expect(after.active?.rawInput).toBe("Alice");
    expect(after.active?.validation).toEqual({ ok: true });
  });

  it("carries an explicit validation result", () => {
    const before = beginEdit(emptyEditingState("cell"), "r1", "name", "");
    const after = changeEdit(before, "!!", { ok: false, message: "no punctuation" });
    expect(after.active?.validation).toEqual({ ok: false, message: "no punctuation" });
  });

  it("is a no-op when there is no active editor", () => {
    const before = emptyEditingState("cell");
    expect(changeEdit(before, "x")).toBe(before);
  });
});

// ─── cancelEdit ────────────────────────────────────────────────────

describe("cancelEdit", () => {
  it("clears the active editor", () => {
    const before = beginEdit(emptyEditingState("cell"), "r1", "name", "");
    const after = cancelEdit(before);
    expect(after.active).toBeNull();
  });

  it("preserves pending values from earlier row edits", () => {
    const staged = stagePendingValue(beginEdit(emptyEditingState("row"), "r1", "age", 21), 21);
    const focused = beginEdit(staged, "r1", "name", "");
    const cancelled = cancelEdit(focused);
    expect(cancelled.pending.get("r1")?.get("age")).toBe(21);
  });

  it("is a no-op when there is no active editor", () => {
    const before = emptyEditingState("cell");
    expect(cancelEdit(before)).toBe(before);
  });
});

// ─── stagePendingValue ────────────────────────────────────────────

describe("stagePendingValue", () => {
  it("moves the active editor into the row's pending buffer in row mode", () => {
    const before = beginEdit(emptyEditingState("row"), "r1", "name", "Alice");
    const after = stagePendingValue(before, "Alice");
    expect(after.active).toBeNull();
    expect(after.pending.get("r1")?.get("name")).toBe("Alice");
  });

  it("accumulates multiple cells within the same row", () => {
    let s: EditingState = emptyEditingState("row");
    s = stagePendingValue(beginEdit(s, "r1", "name", "Alice"), "Alice");
    s = stagePendingValue(beginEdit(s, "r1", "age", 21), 21);
    const row = s.pending.get("r1");
    expect(row?.get("name")).toBe("Alice");
    expect(row?.get("age")).toBe(21);
  });

  it("spans rows in batch mode", () => {
    let s: EditingState = emptyEditingState("batch");
    s = stagePendingValue(beginEdit(s, "r1", "name", "Alice"), "Alice");
    s = stagePendingValue(beginEdit(s, "r2", "name", "Bob"), "Bob");
    expect(s.pending.get("r1")?.get("name")).toBe("Alice");
    expect(s.pending.get("r2")?.get("name")).toBe("Bob");
  });

  it("is a no-op in cell mode (cell commits fire callbacks directly)", () => {
    const before = beginEdit(emptyEditingState("cell"), "r1", "name", "Alice");
    expect(stagePendingValue(before, "Alice")).toBe(before);
  });

  it("is a no-op when the active editor is invalid", () => {
    const before = changeEdit(beginEdit(emptyEditingState("row"), "r1", "name", ""), "", {
      ok: false,
      message: "required",
    });
    expect(stagePendingValue(before, "")).toBe(before);
  });

  it("clears any previously recorded error for the same cell", () => {
    let s: EditingState = beginEdit(emptyEditingState("row"), "r1", "name", "");
    s = stageValidationError(s, "required");
    s = beginEdit(s, "r1", "name", "Alice");
    s = stagePendingValue(s, "Alice");
    expect(s.errors.get("r1")).toBeUndefined();
  });
});

// ─── stageValidationError ─────────────────────────────────────────

describe("stageValidationError", () => {
  it("records an error keyed by row + column in row mode", () => {
    const before = beginEdit(emptyEditingState("row"), "r1", "name", "");
    const after = stageValidationError(before, "required");
    expect(after.errors.get("r1")?.get("name")).toBe("required");
  });

  it("is a no-op in cell mode", () => {
    const before = beginEdit(emptyEditingState("cell"), "r1", "name", "");
    expect(stageValidationError(before, "required")).toBe(before);
  });
});

// ─── discard helpers ──────────────────────────────────────────────

describe("discardPendingRow", () => {
  it("removes a specific row's pending values and errors", () => {
    let s: EditingState = emptyEditingState("batch");
    s = stagePendingValue(beginEdit(s, "r1", "name", "A"), "A");
    s = stagePendingValue(beginEdit(s, "r2", "name", "B"), "B");
    s = discardPendingRow(s, "r1");
    expect(s.pending.has("r1")).toBe(false);
    expect(s.pending.get("r2")?.get("name")).toBe("B");
  });

  it("is a no-op when the row has no pending state", () => {
    const before = emptyEditingState("batch");
    expect(discardPendingRow(before, "r1")).toBe(before);
  });
});

describe("discardAllPending", () => {
  it("clears every pending row and error", () => {
    let s: EditingState = emptyEditingState("batch");
    s = stagePendingValue(beginEdit(s, "r1", "name", "A"), "A");
    s = stageValidationError(beginEdit(s, "r2", "name", ""), "required");
    s = discardAllPending(s);
    expect(s.pending.size).toBe(0);
    expect(s.errors.size).toBe(0);
  });

  it("is a no-op when nothing is pending", () => {
    const before = emptyEditingState("batch");
    expect(discardAllPending(before)).toBe(before);
  });
});

// ─── setEditingMode ───────────────────────────────────────────────

describe("setEditingMode", () => {
  it("switches modes and resets active + pending", () => {
    let s: EditingState = emptyEditingState("row");
    s = stagePendingValue(beginEdit(s, "r1", "name", "A"), "A");
    const next = setEditingMode(s, "cell");
    expect(next.mode).toBe("cell");
    expect(next.active).toBeNull();
    expect(next.pending.size).toBe(0);
    expect(next.errors.size).toBe(0);
  });

  it("returns the same reference when the mode is unchanged and state is clean", () => {
    const before = emptyEditingState("cell");
    expect(setEditingMode(before, "cell")).toBe(before);
  });
});

// ─── Selectors ────────────────────────────────────────────────────

describe("selectors", () => {
  it("isCellEditing / isRowEditing reflect the active cell", () => {
    const s = beginEdit(emptyEditingState("cell"), "r1", "name", "");
    expect(isCellEditing(s, "r1", "name")).toBe(true);
    expect(isCellEditing(s, "r1", "age")).toBe(false);
    expect(isRowEditing(s, "r1")).toBe(true);
  });

  it("isRowEditing is true when the row has pending values", () => {
    const s = stagePendingValue(beginEdit(emptyEditingState("row"), "r1", "name", "A"), "A");
    expect(isRowEditing(s, "r1")).toBe(true);
    expect(isRowEditing(s, "r2")).toBe(false);
  });

  it("getPendingValue distinguishes 'absent' from 'undefined value'", () => {
    let s: EditingState = emptyEditingState("row");
    expect(getPendingValue(s, "r1", "name")).toEqual({ present: false, value: undefined });
    s = stagePendingValue(beginEdit(s, "r1", "name", undefined), undefined);
    expect(getPendingValue(s, "r1", "name")).toEqual({ present: true, value: undefined });
  });

  it("getCellError returns undefined when no error is recorded", () => {
    const s = beginEdit(emptyEditingState("row"), "r1", "name", "");
    expect(getCellError(s, "r1", "name")).toBeUndefined();
  });
});
