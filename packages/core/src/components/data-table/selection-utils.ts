import type { RowId, SelectionMode } from "../data/data-types";

// ─── Selection state helpers ────────────────────────────────────────

/** Toggle a single row in a selection set. Returns a new set. */
export function toggleRowSelection(
  selectedIds: ReadonlySet<RowId>,
  rowId: RowId,
  mode: SelectionMode,
): ReadonlySet<RowId> {
  if (mode === "none") return selectedIds;

  if (mode === "single") {
    if (selectedIds.has(rowId)) return new Set<RowId>();
    return new Set<RowId>([rowId]);
  }

  // multiple
  const next = new Set(selectedIds);
  if (next.has(rowId)) {
    next.delete(rowId);
  } else {
    next.add(rowId);
  }
  return next;
}

/** Select all provided row IDs. Returns a new set. */
export function selectAll(rowIds: readonly RowId[]): ReadonlySet<RowId> {
  return new Set(rowIds);
}

/** Deselect all. Returns an empty set. */
export function selectNone(): ReadonlySet<RowId> {
  return new Set<RowId>();
}

/** Toggle select-all: if all are selected, deselect all; otherwise select all. */
export function toggleSelectAll(
  selectedIds: ReadonlySet<RowId>,
  visibleRowIds: readonly RowId[],
): ReadonlySet<RowId> {
  const allSelected = visibleRowIds.length > 0 && visibleRowIds.every((id) => selectedIds.has(id));
  return allSelected ? selectNone() : selectAll(visibleRowIds);
}

// ─── Select-all checkbox state ──────────────────────────────────────

export type SelectAllState = "all" | "none" | "indeterminate";

/** Compute the select-all checkbox state. */
export function getSelectAllState(
  selectedIds: ReadonlySet<RowId>,
  visibleRowIds: readonly RowId[],
): SelectAllState {
  if (visibleRowIds.length === 0) return "none";
  const selectedCount = visibleRowIds.filter((id) => selectedIds.has(id)).length;
  if (selectedCount === 0) return "none";
  if (selectedCount === visibleRowIds.length) return "all";
  return "indeterminate";
}

/** Check if a specific row is selected. */
export function isRowSelected(selectedIds: ReadonlySet<RowId>, rowId: RowId): boolean {
  return selectedIds.has(rowId);
}
