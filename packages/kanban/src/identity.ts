// Identity validation for Kanban input data. All checks throw at the
// pipeline boundary — the reducer refuses to render an ambiguous
// board.

import type { KanbanCard, KanbanColumn } from "./kanban-types";

/**
 * Throws when `column` violates the Kanban data-model contract: `id`
 * and `title` must be non-empty strings and (when provided) `order`
 * must be a finite number.
 */
export function assertValidKanbanColumn(column: KanbanColumn): void {
  if (typeof column.id !== "string" || column.id.length === 0) {
    throw new TypeError(`Kanban: column.id must be a non-empty string`);
  }
  if (typeof column.title !== "string") {
    throw new TypeError(`Kanban: column "${column.id}".title must be a string`);
  }
  if (column.order !== undefined && !Number.isFinite(column.order)) {
    throw new TypeError(
      `Kanban: column "${column.id}".order must be a finite number when provided`,
    );
  }
}

/**
 * Throws when `card` violates the Kanban data-model contract: `id`,
 * `columnId`, and `title` must be non-empty strings and (when
 * provided) `order` must be a finite number.
 */
export function assertValidKanbanCard(card: KanbanCard): void {
  if (typeof card.id !== "string" || card.id.length === 0) {
    throw new TypeError(`Kanban: card.id must be a non-empty string`);
  }
  if (typeof card.columnId !== "string" || card.columnId.length === 0) {
    throw new TypeError(`Kanban: card "${card.id}".columnId must be a non-empty string`);
  }
  if (typeof card.title !== "string") {
    throw new TypeError(`Kanban: card "${card.id}".title must be a string`);
  }
  if (card.order !== undefined && !Number.isFinite(card.order)) {
    throw new TypeError(`Kanban: card "${card.id}".order must be a finite number when provided`);
  }
}

/**
 * Validates the full input set: every column and card conforms, no
 * duplicate column or card ids, and every card's `columnId` matches
 * an existing column.
 */
export function assertValidKanbanInput(
  columns: readonly KanbanColumn[],
  cards: readonly KanbanCard[],
): void {
  const columnIds = new Set<string>();
  for (const column of columns) {
    assertValidKanbanColumn(column);
    if (columnIds.has(column.id)) {
      throw new RangeError(`Kanban: duplicate column id "${column.id}"`);
    }
    columnIds.add(column.id);
  }
  const cardIds = new Set<string>();
  for (const card of cards) {
    assertValidKanbanCard(card);
    if (cardIds.has(card.id)) {
      throw new RangeError(`Kanban: duplicate card id "${card.id}"`);
    }
    cardIds.add(card.id);
    if (!columnIds.has(card.columnId)) {
      throw new RangeError(
        `Kanban: card "${card.id}" references unknown column "${card.columnId}"`,
      );
    }
  }
}
