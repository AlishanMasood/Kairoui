import type { DragEvent, KeyboardEvent } from "react";
import { useCallback, useMemo, useState } from "react";
import { useEventCallback } from "@kairoui/hooks";
import type { ColumnState, DataGridColumnDef } from "./column-types";
import { getPinnedColumnIds, isColumnPinned } from "./column-model";

// ─── Options ───────────────────────────────────────────────────────

export interface UseColumnReorderOptions<TRow> {
  readonly columnId: string;
  readonly columns: readonly DataGridColumnDef<TRow>[];
  readonly state: ColumnState;
  /** Called with the target index in the **canonical** order. */
  readonly onMove: (columnId: string, targetIndex: number) => void;
  readonly dir?: "ltr" | "rtl";
  /**
   * Disables the interaction entirely. When `reorderable === false` on the
   * column def, or the consumer wants to opt out at runtime.
   */
  readonly disabled?: boolean;
}

// ─── Return ────────────────────────────────────────────────────────

/** MIME type used for HTML5 native drag payload. */
export const REORDER_MIME = "application/x-kairoui-datagrid-column";

export interface DragHandleProps {
  readonly draggable: boolean;
  readonly "data-column-id": string;
  readonly "data-dragging": "true" | "false";
  readonly onDragStart: (event: DragEvent<HTMLElement>) => void;
  readonly onDragEnd: (event: DragEvent<HTMLElement>) => void;
  readonly onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
}

export interface DropTargetProps {
  readonly "data-column-id": string;
  readonly "data-drop-target": "true" | "false";
  readonly onDragOver: (event: DragEvent<HTMLElement>) => void;
  readonly onDragLeave: (event: DragEvent<HTMLElement>) => void;
  readonly onDrop: (event: DragEvent<HTMLElement>) => void;
}

export interface UseColumnReorderReturn {
  readonly canReorder: boolean;
  /** Move this column one step toward the visual start of its pin group. */
  readonly moveLeft: () => void;
  /** Move this column one step toward the visual end of its pin group. */
  readonly moveRight: () => void;
  /** Move this column to the given index in the canonical order. */
  readonly moveTo: (targetIndex: number) => void;
  /** True while the pointer is dragging **this** column via native DnD. */
  readonly isDragging: boolean;
  /** Column id currently hovered as a drop target during this session, if any. */
  readonly dragOverColumnId: string | null;
  readonly dragHandleProps: DragHandleProps;
  readonly dropTargetProps: DropTargetProps;
}

// ─── Helpers ───────────────────────────────────────────────────────

function getPinGroupForColumn(state: ColumnState, columnId: string): readonly string[] {
  const groups = getPinnedColumnIds(state);
  const side = isColumnPinned(state, columnId);
  if (side === "left") return groups.left;
  if (side === "right") return groups.right;
  return groups.center;
}

/**
 * Reorder gestures for a single column.
 *
 * ## Constraints
 *
 * - A column may only move **within its own pin group** (left / center /
 *   right). Cross-group moves require an explicit unpin/pin sequence.
 * - `moveLeft` / `moveRight` operate on the visible neighbor in the same
 *   pin group and swap positions in the canonical order.
 * - RTL inverts the meaning of `moveLeft` / `moveRight` so both map to
 *   "move toward visual start" and "move toward visual end" respectively.
 * - Pointer drag uses native HTML5 drag events — no external drag library
 *   is introduced. Drop targets refuse cross-pin-group drops.
 * - `disabled` or `reorderable: false` neutralizes all handlers and
 *   removes the `draggable` attribute.
 *
 * ## Keyboard model
 *
 * When the handle is focused:
 * - `Ctrl+ArrowLeft` / `Ctrl+ArrowRight` — move by one within pin group
 *   (RTL-aware).
 * - `Ctrl+Home` / `Ctrl+End` — snap to start / end of pin group.
 */
export function useColumnReorder<TRow>(
  options: UseColumnReorderOptions<TRow>,
): UseColumnReorderReturn {
  const { columnId, columns, state, onMove, dir = "ltr", disabled = false } = options;

  const column = useMemo(() => columns.find((c) => c.id === columnId), [columns, columnId]);
  const canReorder = !disabled && !!column && column.reorderable !== false;

  const [isDragging, setIsDragging] = useState(false);
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);

  const onMoveStable = useEventCallback(onMove);

  const pinGroup = useMemo(() => getPinGroupForColumn(state, columnId), [state, columnId]);
  const pinGroupSet = useMemo(() => new Set(pinGroup), [pinGroup]);

  const moveTo = useCallback(
    (targetIndex: number) => {
      if (!canReorder) return;
      onMoveStable(columnId, targetIndex);
    },
    [canReorder, columnId, onMoveStable],
  );

  const shiftInGroup = useCallback(
    (delta: number) => {
      if (!canReorder) return;
      if (pinGroup.length < 2) return;
      const groupIndex = pinGroup.indexOf(columnId);
      if (groupIndex === -1) return;
      const targetGroupIndex = groupIndex + delta;
      if (targetGroupIndex < 0 || targetGroupIndex >= pinGroup.length) return;
      const neighborId = pinGroup[targetGroupIndex];
      if (neighborId === undefined) return;
      const neighborCanonical = state.order.indexOf(neighborId);
      if (neighborCanonical === -1) return;
      onMoveStable(columnId, neighborCanonical);
    },
    [canReorder, columnId, onMoveStable, pinGroup, state.order],
  );

  const rtlSign = dir === "rtl" ? -1 : 1;

  const moveLeft = useCallback(() => {
    shiftInGroup(-1 * rtlSign);
  }, [rtlSign, shiftInGroup]);

  const moveRight = useCallback(() => {
    shiftInGroup(1 * rtlSign);
  }, [rtlSign, shiftInGroup]);

  const snapToStart = useCallback(() => {
    if (!canReorder) return;
    const first = pinGroup[0];
    if (first === undefined) return;
    const canonical = state.order.indexOf(first);
    if (canonical === -1) return;
    onMoveStable(columnId, canonical);
  }, [canReorder, columnId, onMoveStable, pinGroup, state.order]);

  const snapToEnd = useCallback(() => {
    if (!canReorder) return;
    const last = pinGroup[pinGroup.length - 1];
    if (last === undefined) return;
    const canonical = state.order.indexOf(last);
    if (canonical === -1) return;
    onMoveStable(columnId, canonical);
  }, [canReorder, columnId, onMoveStable, pinGroup, state.order]);

  // ─── Pointer / DnD handlers ──────────────────────────────────────

  const onDragStart = useCallback(
    (event: DragEvent<HTMLElement>) => {
      if (!canReorder) {
        event.preventDefault();
        return;
      }
      event.dataTransfer.setData(REORDER_MIME, columnId);
      event.dataTransfer.effectAllowed = "move";
      setIsDragging(true);
    },
    [canReorder, columnId],
  );

  const onDragEnd = useCallback(() => {
    setIsDragging(false);
    setDragOverColumnId(null);
  }, []);

  const isValidDropSource = useCallback(
    (sourceId: string | null): sourceId is string => {
      if (sourceId === null) return false;
      if (sourceId === columnId) return false;
      return pinGroupSet.has(sourceId);
    },
    [columnId, pinGroupSet],
  );

  const readSourceId = useCallback((event: DragEvent<HTMLElement>): string | null => {
    const raw = event.dataTransfer.getData(REORDER_MIME);
    return raw === "" ? null : raw;
  }, []);

  const onDragOver = useCallback(
    (event: DragEvent<HTMLElement>) => {
      const sourceId = readSourceId(event);
      if (!isValidDropSource(sourceId)) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      setDragOverColumnId(columnId);
    },
    [columnId, isValidDropSource, readSourceId],
  );

  const onDragLeave = useCallback(() => {
    setDragOverColumnId(null);
  }, []);

  const onDrop = useCallback(
    (event: DragEvent<HTMLElement>) => {
      const sourceId = readSourceId(event);
      setDragOverColumnId(null);
      if (!isValidDropSource(sourceId)) return;
      event.preventDefault();
      const canonical = state.order.indexOf(columnId);
      if (canonical === -1) return;
      onMoveStable(sourceId, canonical);
    },
    [columnId, isValidDropSource, onMoveStable, readSourceId, state.order],
  );

  // ─── Keyboard handler on the handle ──────────────────────────────

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      if (!canReorder) return;
      if (!event.ctrlKey && !event.metaKey) return;
      switch (event.key) {
        case "ArrowLeft":
          event.preventDefault();
          moveLeft();
          return;
        case "ArrowRight":
          event.preventDefault();
          moveRight();
          return;
        case "Home":
          event.preventDefault();
          snapToStart();
          return;
        case "End":
          event.preventDefault();
          snapToEnd();
          return;
        default:
          return;
      }
    },
    [canReorder, moveLeft, moveRight, snapToEnd, snapToStart],
  );

  const dragHandleProps: DragHandleProps = {
    draggable: canReorder,
    "data-column-id": columnId,
    "data-dragging": isDragging ? "true" : "false",
    onDragStart,
    onDragEnd,
    onKeyDown,
  };

  const dropTargetProps: DropTargetProps = {
    "data-column-id": columnId,
    "data-drop-target": dragOverColumnId === columnId ? "true" : "false",
    onDragOver,
    onDragLeave,
    onDrop,
  };

  return {
    canReorder,
    moveLeft,
    moveRight,
    moveTo,
    isDragging,
    dragOverColumnId,
    dragHandleProps,
    dropTargetProps,
  };
}
