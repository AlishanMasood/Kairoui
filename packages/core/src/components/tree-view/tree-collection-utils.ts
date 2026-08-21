import type { RowId } from "../data/data-types";
import type { RowModel } from "../data/row-model";

/** Get the direct children IDs of a given node. */
export function getChildIds<TRow>(
  rows: readonly RowModel<TRow>[],
  parentId: RowId,
): readonly RowId[] {
  return rows.filter((r) => r.parentId === parentId).map((r) => r.id);
}

/** Get all non-leaf node IDs (nodes that have children). */
export function getBranchIds<TRow>(rows: readonly RowModel<TRow>[]): readonly RowId[] {
  return rows.filter((r) => !r.isLeaf).map((r) => r.id);
}

/** Get the depth of a specific node. Returns -1 if not found. */
export function getNodeDepth<TRow>(rows: readonly RowModel<TRow>[], nodeId: RowId): number {
  const row = rows.find((r) => r.id === nodeId);
  return row ? row.depth : -1;
}

/** Check if a node is a descendant of another. */
export function isDescendantOf<TRow>(
  rows: readonly RowModel<TRow>[],
  nodeId: RowId,
  ancestorId: RowId,
): boolean {
  const idToRow = new Map<RowId, RowModel<TRow>>();
  for (const row of rows) {
    idToRow.set(row.id, row);
  }

  let current = idToRow.get(nodeId);
  while (current?.parentId !== null && current?.parentId !== undefined) {
    if (current.parentId === ancestorId) return true;
    current = idToRow.get(current.parentId);
  }
  return false;
}
