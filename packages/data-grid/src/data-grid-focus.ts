import type { RowId } from "@kairoui/core/components";
import type { FocusState } from "./data-grid-types";

// ─── Focus reducer ─────────────────────────────────────────────────

export const EMPTY_FOCUS_STATE: FocusState = { rowId: null, columnId: null };

/**
 * Directions the focus reducer understands. Row-axis directions move
 * between focusable rows in the current visible order; column-axis
 * directions move between visible columns in left-to-right order.
 */
export type FocusMoveDirection =
  "left" | "right" | "up" | "down" | "rowStart" | "rowEnd" | "gridStart" | "gridEnd";

/** Focused-cell coordinates resolved against the current visible layout. */
export interface FocusLayout {
  /** Focusable row IDs in visible top-to-bottom order (leaves + groups). */
  readonly rowIds: readonly RowId[];
  /** Visible column IDs in left-to-right render order. */
  readonly columnIds: readonly string[];
}

// ─── Selectors ─────────────────────────────────────────────────────

/**
 * Return the position of the currently-focused cell inside the layout,
 * or `null` when the focus is unset or lies outside the layout.
 */
export function locateFocus(
  focus: FocusState,
  layout: FocusLayout,
): { readonly row: number; readonly column: number } | null {
  if (focus.rowId === null || focus.columnId === null) return null;
  const row = layout.rowIds.indexOf(focus.rowId);
  const column = layout.columnIds.indexOf(focus.columnId);
  if (row === -1 || column === -1) return null;
  return { row, column };
}

// ─── Transitions ──────────────────────────────────────────────────

/**
 * Move focus by one step in the requested direction. RTL callers should
 * swap `"left"` and `"right"` at the call site — the reducer is
 * direction-agnostic to keep it pure.
 *
 * When no cell is focused yet, `"down"`, `"right"`, and `"gridStart"`
 * seed to the first visible cell; the others are no-ops.
 * Returns the same reference when the move would land on the same cell.
 */
export function moveFocus(
  focus: FocusState,
  layout: FocusLayout,
  direction: FocusMoveDirection,
): FocusState {
  if (layout.rowIds.length === 0 || layout.columnIds.length === 0) return focus;

  const current = locateFocus(focus, layout);

  // Seed initial focus for "arrow into the grid" directions.
  if (current === null) {
    if (direction === "down" || direction === "right" || direction === "gridStart") {
      const firstRowId = layout.rowIds[0];
      const firstColumnId = layout.columnIds[0];
      if (firstRowId === undefined || firstColumnId === undefined) return focus;
      return { rowId: firstRowId, columnId: firstColumnId };
    }
    return focus;
  }

  let { row, column } = current;
  switch (direction) {
    case "left":
      column = Math.max(0, column - 1);
      break;
    case "right":
      column = Math.min(layout.columnIds.length - 1, column + 1);
      break;
    case "up":
      row = Math.max(0, row - 1);
      break;
    case "down":
      row = Math.min(layout.rowIds.length - 1, row + 1);
      break;
    case "rowStart":
      column = 0;
      break;
    case "rowEnd":
      column = layout.columnIds.length - 1;
      break;
    case "gridStart":
      row = 0;
      column = 0;
      break;
    case "gridEnd":
      row = layout.rowIds.length - 1;
      column = layout.columnIds.length - 1;
      break;
  }

  const nextRowId = layout.rowIds[row];
  const nextColumnId = layout.columnIds[column];
  if (nextRowId === undefined || nextColumnId === undefined) return focus;
  if (nextRowId === focus.rowId && nextColumnId === focus.columnId) return focus;
  return { rowId: nextRowId, columnId: nextColumnId };
}

/**
 * Nudge focus by a viewport-sized step. `pageSize` is measured in rows —
 * the DataGrid computes it from viewport height / row height.
 */
export function pageFocus(
  focus: FocusState,
  layout: FocusLayout,
  direction: "pageUp" | "pageDown",
  pageSize: number,
): FocusState {
  if (layout.rowIds.length === 0 || layout.columnIds.length === 0) return focus;
  if (pageSize <= 0) return focus;
  const current = locateFocus(focus, layout);
  if (current === null) return focus;

  const nextRow =
    direction === "pageUp"
      ? Math.max(0, current.row - pageSize)
      : Math.min(layout.rowIds.length - 1, current.row + pageSize);

  const nextRowId = layout.rowIds[nextRow];
  if (nextRowId === undefined) return focus;
  if (nextRowId === focus.rowId) return focus;
  return { ...focus, rowId: nextRowId };
}

/**
 * Move focus to an explicit `(rowId, columnId)` pair. No-op when either
 * ID is not part of the layout.
 */
export function focusCell(
  focus: FocusState,
  layout: FocusLayout,
  rowId: RowId,
  columnId: string,
): FocusState {
  if (!layout.rowIds.includes(rowId)) return focus;
  if (!layout.columnIds.includes(columnId)) return focus;
  if (focus.rowId === rowId && focus.columnId === columnId) return focus;
  return { rowId, columnId };
}

/** Clear the focus. Idempotent. */
export function blurFocus(focus: FocusState): FocusState {
  if (focus.rowId === null && focus.columnId === null) return focus;
  return EMPTY_FOCUS_STATE;
}
