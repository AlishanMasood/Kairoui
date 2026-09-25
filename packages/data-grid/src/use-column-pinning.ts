import { useCallback, useMemo } from "react";
import type { ColumnPinning, ColumnPinSide, ColumnState, DataGridColumnDef } from "./column-types";
import { isColumnPinned } from "./column-model";

// ─── Options ───────────────────────────────────────────────────────

export interface UseColumnPinningOptions<TRow> {
  readonly columns: readonly DataGridColumnDef<TRow>[];
  readonly state: ColumnState;
  readonly onPin: (columnId: string, side: ColumnPinSide | null) => void;
  readonly onPinningChange: (pinning: ColumnPinning) => void;
}

// ─── Return ────────────────────────────────────────────────────────

export interface UseColumnPinningReturn {
  readonly pinning: ColumnPinning;
  readonly canPin: (columnId: string) => boolean;
  readonly getPinSide: (columnId: string) => ColumnPinSide | null;
  readonly pin: (columnId: string, side: ColumnPinSide) => void;
  readonly unpin: (columnId: string) => void;
  readonly togglePin: (columnId: string, side: ColumnPinSide) => void;
  readonly clear: () => void;
}

/**
 * Thin helper on top of `useColumnState` for pin/unpin/toggle-pin
 * ergonomics. Consumers that already use `useColumnState.pinColumn` do
 * not need this hook — it exists to make menu-driven pinning affordances
 * (`Pin left`, `Pin right`, `Unpin`) one line each.
 *
 * `canPin` respects `pinnable: false` on the column def.
 */
export function useColumnPinning<TRow>(
  options: UseColumnPinningOptions<TRow>,
): UseColumnPinningReturn {
  const { columns, state, onPin, onPinningChange } = options;

  const columnMap = useMemo(() => {
    const map = new Map<string, DataGridColumnDef<TRow>>();
    for (const column of columns) map.set(column.id, column);
    return map;
  }, [columns]);

  const canPin = useCallback(
    (columnId: string): boolean => {
      const column = columnMap.get(columnId);
      if (!column) return false;
      return column.pinnable !== false;
    },
    [columnMap],
  );

  const getPinSide = useCallback((columnId: string) => isColumnPinned(state, columnId), [state]);

  const pin = useCallback(
    (columnId: string, side: ColumnPinSide) => {
      if (!canPin(columnId)) return;
      onPin(columnId, side);
    },
    [canPin, onPin],
  );

  const unpin = useCallback(
    (columnId: string) => {
      if (isColumnPinned(state, columnId) === null) return;
      onPin(columnId, null);
    },
    [onPin, state],
  );

  const togglePin = useCallback(
    (columnId: string, side: ColumnPinSide) => {
      if (!canPin(columnId)) return;
      const current = isColumnPinned(state, columnId);
      onPin(columnId, current === side ? null : side);
    },
    [canPin, onPin, state],
  );

  const clear = useCallback(() => {
    onPinningChange({ left: [], right: [] });
  }, [onPinningChange]);

  return {
    pinning: state.pinned,
    canPin,
    getPinSide,
    pin,
    unpin,
    togglePin,
    clear,
  };
}
