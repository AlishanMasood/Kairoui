import type { RowId } from "@kairoui/core/components";
import type { ValidationResult } from "./column-types";
import type { EditingCell, EditingMode, EditingState } from "./editing-types";

// ─── Constants ─────────────────────────────────────────────────────

const OK: ValidationResult = { ok: true };

// ─── Empty helpers ────────────────────────────────────────────────

/** Fresh empty state for the given mode. `mode = "none"` by default. */
export function emptyEditingState(mode: EditingMode = "none"): EditingState {
  return {
    mode,
    active: null,
    pending: new Map(),
    errors: new Map(),
  };
}

/** Empty state constant — safe to share across renders (never mutated). */
export const EMPTY_EDITING_STATE: EditingState = emptyEditingState("none");

// ─── Selectors ─────────────────────────────────────────────────────

export function isRowEditing(state: EditingState, rowId: RowId): boolean {
  if (state.active?.rowId === rowId) return true;
  return state.pending.has(rowId);
}

export function isCellEditing(state: EditingState, rowId: RowId, columnId: string): boolean {
  return state.active?.rowId === rowId && state.active.columnId === columnId;
}

export function getPendingValue(
  state: EditingState,
  rowId: RowId,
  columnId: string,
): { readonly present: boolean; readonly value: unknown } {
  const row = state.pending.get(rowId);
  if (!row) return { present: false, value: undefined };
  if (!row.has(columnId)) return { present: false, value: undefined };
  return { present: true, value: row.get(columnId) };
}

export function getCellError(
  state: EditingState,
  rowId: RowId,
  columnId: string,
): string | undefined {
  return state.errors.get(rowId)?.get(columnId);
}

// ─── Transitions ──────────────────────────────────────────────────

/**
 * Enter edit mode for `(rowId, columnId)` with the given initial value.
 * No-op when `state.mode === "none"`.
 */
export function beginEdit(
  state: EditingState,
  rowId: RowId,
  columnId: string,
  initialValue: unknown,
): EditingState {
  if (state.mode === "none") return state;
  const active: EditingCell = {
    rowId,
    columnId,
    rawInput: initialValue,
    validation: OK,
  };
  return { ...state, active };
}

/**
 * Update the active editor's raw input. Optionally records the
 * validation result of the new input.
 */
export function changeEdit(
  state: EditingState,
  rawInput: unknown,
  validation: ValidationResult = OK,
): EditingState {
  if (!state.active) return state;
  return {
    ...state,
    active: { ...state.active, rawInput, validation },
  };
}

/**
 * Reject the current edit and return to view. Never touches
 * `pending` — pending values from earlier row edits stay put.
 */
export function cancelEdit(state: EditingState): EditingState {
  if (!state.active) return state;
  return { ...state, active: null };
}

/**
 * Stage the currently-active cell into `pending` for the row and clear
 * the active editor. Used by row / batch modes. Also clears any error
 * previously recorded for that cell.
 *
 * No-op when the state is not in row / batch mode, when there is no
 * active editor, or when the active validation is `{ ok: false }`.
 */
export function stagePendingValue(state: EditingState, parsedValue: unknown): EditingState {
  if (!state.active) return state;
  if (state.mode !== "row" && state.mode !== "batch") return state;
  if (!state.active.validation.ok) return state;

  const { rowId, columnId } = state.active;
  const pendingRow = new Map(state.pending.get(rowId));
  pendingRow.set(columnId, parsedValue);
  const pending = new Map(state.pending);
  pending.set(rowId, pendingRow);

  const errorsRow = new Map(state.errors.get(rowId));
  errorsRow.delete(columnId);
  const errors = new Map(state.errors);
  if (errorsRow.size === 0) errors.delete(rowId);
  else errors.set(rowId, errorsRow);

  return { ...state, active: null, pending, errors };
}

/**
 * Record a validation failure for the active cell into `errors` and
 * leave the editor open so the user can correct the input.
 */
export function stageValidationError(state: EditingState, message: string): EditingState {
  if (!state.active) return state;
  if (state.mode !== "row" && state.mode !== "batch") return state;
  const { rowId, columnId } = state.active;
  const errorsRow = new Map(state.errors.get(rowId));
  errorsRow.set(columnId, message);
  const errors = new Map(state.errors);
  errors.set(rowId, errorsRow);
  return { ...state, errors };
}

/** Drop the pending values for a single row. */
export function discardPendingRow(state: EditingState, rowId: RowId): EditingState {
  if (!state.pending.has(rowId) && !state.errors.has(rowId)) return state;
  const pending = new Map(state.pending);
  const errors = new Map(state.errors);
  pending.delete(rowId);
  errors.delete(rowId);
  return { ...state, pending, errors };
}

/** Drop every pending change and error across all rows. */
export function discardAllPending(state: EditingState): EditingState {
  if (state.pending.size === 0 && state.errors.size === 0) return state;
  return { ...state, pending: new Map(), errors: new Map() };
}

/**
 * Switch modes. Any active editor is cancelled and any pending buffer
 * is discarded so the new mode starts from a clean base.
 */
export function setEditingMode(state: EditingState, mode: EditingMode): EditingState {
  if (state.mode === mode && state.active === null && state.pending.size === 0) return state;
  return {
    mode,
    active: null,
    pending: new Map(),
    errors: new Map(),
  };
}
