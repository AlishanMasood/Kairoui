// Default localizable strings for the Kanban announcer + labels.

import type { KanbanCard, KanbanColumn } from "./kanban-types";

export function defaultBoardLabel(): string {
  return "Kanban board";
}

export function defaultColumnLabel(column: KanbanColumn, count: number): string {
  return `${column.title}, ${String(count)} card${count === 1 ? "" : "s"}`;
}

export function defaultCardLabel(card: KanbanCard, column: KanbanColumn): string {
  return `${card.title}, in ${column.title}`;
}

export function defaultEmptyColumnLabel(column: KanbanColumn): string {
  return `${column.title}, empty`;
}

export function defaultPickupAnnouncement(
  card: KanbanCard,
  column: KanbanColumn,
  index: number,
  total: number,
): string {
  return `Card ${card.title} picked up. Column ${column.title}, position ${String(index + 1)} of ${String(total)}.`;
}

export function defaultOverAnnouncement(
  card: KanbanCard,
  column: KanbanColumn,
  index: number,
  total: number,
): string {
  return `Card ${card.title} moved to position ${String(index + 1)} of ${String(total)} in column ${column.title}.`;
}

export function defaultDropAnnouncement(
  card: KanbanCard,
  column: KanbanColumn,
  index: number,
): string {
  return `Card ${card.title} dropped in column ${column.title} at position ${String(index + 1)}.`;
}

export function defaultCancelAnnouncement(
  card: KanbanCard,
  column: KanbanColumn,
  index: number,
): string {
  return `Card ${card.title} returned to column ${column.title} at position ${String(index + 1)}.`;
}

export function defaultRejectAnnouncement(card: KanbanCard, column: KanbanColumn): string {
  return `Card ${card.title} cannot be moved to column ${column.title}.`;
}

export function defaultColumnPickupAnnouncement(
  column: KanbanColumn,
  index: number,
  total: number,
): string {
  return `Column ${column.title} picked up. Position ${String(index + 1)} of ${String(total)}.`;
}

export function defaultColumnOverAnnouncement(
  column: KanbanColumn,
  index: number,
  total: number,
): string {
  return `Column ${column.title} moved to position ${String(index + 1)} of ${String(total)}.`;
}

export function defaultColumnDropAnnouncement(column: KanbanColumn, index: number): string {
  return `Column ${column.title} dropped at position ${String(index + 1)}.`;
}

export function defaultColumnCancelAnnouncement(column: KanbanColumn, index: number): string {
  return `Column ${column.title} returned to position ${String(index + 1)}.`;
}
