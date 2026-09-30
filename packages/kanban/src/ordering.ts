// Pure ordering algorithms for Kanban columns and cards. Every helper
// is framework-independent and side-effect free.

import type { KanbanCard, KanbanColumn, KanbanColumnId } from "./kanban-types";

/**
 * Returns the columns in visible order. When every column carries a
 * finite `order`, they are sorted ascending by `order` with ties
 * broken by `id`. Otherwise input order is preserved — the consumer
 * is authoritative.
 */
export function computeColumnOrder(columns: readonly KanbanColumn[]): readonly KanbanColumn[] {
  if (columns.length === 0) return columns;
  const allHaveOrder = columns.every((c) => typeof c.order === "number");
  if (!allHaveOrder) return columns;
  const sorted = [...columns];
  sorted.sort((a, b) => {
    const ao = a.order ?? 0;
    const bo = b.order ?? 0;
    if (ao !== bo) return ao - bo;
    if (a.id < b.id) return -1;
    if (a.id > b.id) return 1;
    return 0;
  });
  return sorted;
}

/**
 * Returns cards in visible order, scoped per column. Within a column,
 * ordering follows the same rule as `computeColumnOrder` — if every
 * card carries `order`, they are sorted ascending; otherwise the
 * input order is preserved. Cards for different columns are never
 * interleaved.
 */
export function computeCardOrder<TCard extends KanbanCard>(
  cards: readonly TCard[],
): readonly TCard[] {
  if (cards.length === 0) return cards;
  const byColumn = new Map<KanbanColumnId, TCard[]>();
  for (const card of cards) {
    let bucket = byColumn.get(card.columnId);
    if (!bucket) {
      bucket = [];
      byColumn.set(card.columnId, bucket);
    }
    bucket.push(card);
  }
  const output: TCard[] = [];
  const seenColumns = new Set<KanbanColumnId>();
  for (const card of cards) {
    if (seenColumns.has(card.columnId)) continue;
    seenColumns.add(card.columnId);
    const bucket = byColumn.get(card.columnId);
    if (!bucket) continue;
    const allHaveOrder = bucket.every((c) => typeof c.order === "number");
    if (allHaveOrder) {
      bucket.sort((a, b) => {
        const ao = a.order ?? 0;
        const bo = b.order ?? 0;
        if (ao !== bo) return ao - bo;
        if (a.id < b.id) return -1;
        if (a.id > b.id) return 1;
        return 0;
      });
    }
    for (const c of bucket) output.push(c);
  }
  return output;
}

/**
 * Partitions cards by column id after ordering. Guarantees that every
 * `columnId` in `columnIds` appears as a key, even when the column is
 * empty.
 */
export function partitionCardsByColumn<TCard extends KanbanCard>(
  cards: readonly TCard[],
  columnIds: readonly KanbanColumnId[],
): ReadonlyMap<KanbanColumnId, readonly TCard[]> {
  const buckets = new Map<KanbanColumnId, TCard[]>();
  for (const id of columnIds) buckets.set(id, []);
  const ordered = computeCardOrder(cards);
  for (const card of ordered) {
    const bucket = buckets.get(card.columnId);
    if (bucket) bucket.push(card);
  }
  return buckets;
}

/**
 * Computes an ordering key that sorts between `before` and `after`.
 *
 * - `nextOrderBetween(null, null)` → `0`
 * - `nextOrderBetween(a, null)` → `a + 1`
 * - `nextOrderBetween(null, b)` → `b - 1`
 * - `nextOrderBetween(a, b)` → `(a + b) / 2`
 *
 * `before` must be strictly less than `after` when both are provided;
 * otherwise a `RangeError` is thrown. The reducer never mutates
 * `order` on cards it does not touch.
 */
export function nextOrderBetween(before: number | null, after: number | null): number {
  if (before === null && after === null) return 0;
  if (before === null) {
    const b = after ?? 0;
    return b - 1;
  }
  if (after === null) return before + 1;
  if (before >= after) {
    throw new RangeError(
      `Kanban: nextOrderBetween requires before < after, received ${String(before)} / ${String(after)}`,
    );
  }
  return (before + after) / 2;
}

/**
 * Computes the `order` value a card would receive when inserted at
 * `toIndex` inside the ordered list `cards`. Handles endpoints (index
 * 0 and `cards.length`) and midpoints uniformly.
 */
export function orderAtIndex(
  cards: readonly { readonly order?: number }[],
  toIndex: number,
): number {
  if (cards.length === 0) return 0;
  const clampedIndex = Math.max(0, Math.min(cards.length, toIndex));
  const beforeCard = clampedIndex > 0 ? cards[clampedIndex - 1] : undefined;
  const afterCard = clampedIndex < cards.length ? cards[clampedIndex] : undefined;
  const before = beforeCard?.order ?? null;
  const after = afterCard?.order ?? null;
  if (before !== null && after !== null && before >= after) {
    return before + 1;
  }
  return nextOrderBetween(before, after);
}
