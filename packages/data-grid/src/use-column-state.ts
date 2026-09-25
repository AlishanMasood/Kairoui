import { useCallback, useMemo } from "react";
import { useControllableState } from "@kairoui/hooks";
import type {
  ColumnOrder,
  ColumnPinning,
  ColumnPinSide,
  ColumnSizing,
  ColumnState,
  ColumnVisibility,
  DataGridColumnDef,
} from "./column-types";
import {
  hideColumn as reduceHideColumn,
  initialColumnState,
  moveColumn as reduceMoveColumn,
  pinColumn as reducePinColumn,
  setColumnOrder as reduceSetColumnOrder,
  setColumnPinning as reduceSetColumnPinning,
  setColumnVisibility as reduceSetColumnVisibility,
  setColumnWidth as reduceSetColumnWidth,
} from "./column-model";

// ─── Options ───────────────────────────────────────────────────────

export interface UseColumnStateOptions<TRow> {
  readonly columns: readonly DataGridColumnDef<TRow>[];

  readonly columnSizing?: ColumnSizing;
  readonly defaultColumnSizing?: ColumnSizing;
  readonly onColumnSizingChange?: (sizing: ColumnSizing) => void;

  readonly columnOrder?: ColumnOrder;
  readonly defaultColumnOrder?: ColumnOrder;
  readonly onColumnOrderChange?: (order: ColumnOrder) => void;

  readonly columnPinning?: ColumnPinning;
  readonly defaultColumnPinning?: ColumnPinning;
  readonly onColumnPinningChange?: (pinning: ColumnPinning) => void;

  readonly columnVisibility?: ColumnVisibility;
  readonly defaultColumnVisibility?: ColumnVisibility;
  readonly onColumnVisibilityChange?: (visibility: ColumnVisibility) => void;

  readonly defaultColumnWidth?: number;
}

// ─── Return ────────────────────────────────────────────────────────

export interface UseColumnStateReturn {
  readonly state: ColumnState;

  readonly sizing: ColumnSizing;
  readonly order: ColumnOrder;
  readonly pinning: ColumnPinning;
  readonly visibility: ColumnVisibility;

  readonly setColumnWidth: (columnId: string, width: number) => void;
  readonly setColumnSizing: (sizing: ColumnSizing) => void;

  readonly setColumnOrder: (order: ColumnOrder) => void;
  readonly moveColumn: (columnId: string, targetIndex: number) => void;

  readonly setColumnPinning: (pinning: ColumnPinning) => void;
  readonly pinColumn: (columnId: string, side: ColumnPinSide | null) => void;

  readonly setColumnVisibility: (visibility: ColumnVisibility) => void;
  readonly hideColumn: (columnId: string, hidden: boolean) => void;

  readonly reset: () => void;
}

// ─── Hook ──────────────────────────────────────────────────────────

/**
 * Controlled / uncontrolled bridge for the four `ColumnState` slices.
 *
 * Each slice follows the KairoUI controllable-state pattern:
 * `state?` + `defaultState?` + `onStateChange?`. When any slice is
 * controlled, updates flow through `onXxxChange` and the internal
 * store is not the source of truth. Uncontrolled slices are stored
 * internally.
 *
 * The returned `state` is a live composition of all four slices.
 */
export function useColumnState<TRow>(options: UseColumnStateOptions<TRow>): UseColumnStateReturn {
  const {
    columns,
    columnSizing,
    defaultColumnSizing,
    onColumnSizingChange,
    columnOrder,
    defaultColumnOrder,
    onColumnOrderChange,
    columnPinning,
    defaultColumnPinning,
    onColumnPinningChange,
    columnVisibility,
    defaultColumnVisibility,
    onColumnVisibilityChange,
    defaultColumnWidth,
  } = options;

  const initialState = useMemo(
    () =>
      initialColumnState(columns, {
        ...(defaultColumnSizing !== undefined ? { sizing: defaultColumnSizing } : undefined),
        ...(defaultColumnOrder !== undefined ? { order: defaultColumnOrder } : undefined),
        ...(defaultColumnPinning !== undefined ? { pinning: defaultColumnPinning } : undefined),
        ...(defaultColumnVisibility !== undefined
          ? { visibility: defaultColumnVisibility }
          : undefined),
        ...(defaultColumnWidth !== undefined ? { defaultColumnWidth } : undefined),
      }),
    // Initial-only: intentional single evaluation per hook lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const [sizing, setSizing] = useControllableState<ColumnSizing>({
    value: columnSizing,
    defaultValue: initialState.sizing,
    ...(onColumnSizingChange ? { onChange: onColumnSizingChange } : undefined),
    name: "DataGrid",
    state: "columnSizing",
  });

  const [order, setOrder] = useControllableState<ColumnOrder>({
    value: columnOrder,
    defaultValue: initialState.order,
    ...(onColumnOrderChange ? { onChange: onColumnOrderChange } : undefined),
    name: "DataGrid",
    state: "columnOrder",
  });

  const [pinning, setPinning] = useControllableState<ColumnPinning>({
    value: columnPinning,
    defaultValue: initialState.pinned,
    ...(onColumnPinningChange ? { onChange: onColumnPinningChange } : undefined),
    name: "DataGrid",
    state: "columnPinning",
  });

  const [visibility, setVisibility] = useControllableState<ColumnVisibility>({
    value: columnVisibility,
    defaultValue: initialState.visibility,
    ...(onColumnVisibilityChange ? { onChange: onColumnVisibilityChange } : undefined),
    name: "DataGrid",
    state: "columnVisibility",
  });

  const state = useMemo<ColumnState>(
    () => ({ order, pinned: pinning, sizing, visibility }),
    [order, pinning, sizing, visibility],
  );

  const setColumnWidth = useCallback(
    (columnId: string, width: number) => {
      setSizing((prev) => {
        const next = reduceSetColumnWidth(
          columns,
          { order, pinned: pinning, sizing: prev, visibility },
          columnId,
          width,
        );
        return next.sizing;
      });
    },
    [columns, order, pinning, setSizing, visibility],
  );

  const setColumnSizingCb = useCallback(
    (nextSizing: ColumnSizing) => {
      setSizing(() => nextSizing);
    },
    [setSizing],
  );

  const setColumnOrderCb = useCallback(
    (nextOrder: ColumnOrder) => {
      setOrder((prev) => reduceSetColumnOrder({ ...state, order: prev }, nextOrder).order);
    },
    [setOrder, state],
  );

  const moveColumnCb = useCallback(
    (columnId: string, targetIndex: number) => {
      setOrder((prev) => reduceMoveColumn({ ...state, order: prev }, columnId, targetIndex).order);
    },
    [setOrder, state],
  );

  const setColumnPinningCb = useCallback(
    (nextPinning: ColumnPinning) => {
      setPinning(() => reduceSetColumnPinning(state, nextPinning).pinned);
    },
    [setPinning, state],
  );

  const pinColumnCb = useCallback(
    (columnId: string, side: ColumnPinSide | null) => {
      setPinning((prev) => reducePinColumn({ ...state, pinned: prev }, columnId, side).pinned);
    },
    [setPinning, state],
  );

  const setColumnVisibilityCb = useCallback(
    (nextVisibility: ColumnVisibility) => {
      setVisibility(() => reduceSetColumnVisibility(state, nextVisibility).visibility);
    },
    [setVisibility, state],
  );

  const hideColumnCb = useCallback(
    (columnId: string, hidden: boolean) => {
      setVisibility(
        (prev) => reduceHideColumn({ ...state, visibility: prev }, columnId, hidden).visibility,
      );
    },
    [setVisibility, state],
  );

  const reset = useCallback(() => {
    const fresh = initialColumnState(columns, {
      ...(defaultColumnWidth !== undefined ? { defaultColumnWidth } : undefined),
    });
    setSizing(() => fresh.sizing);
    setOrder(() => fresh.order);
    setPinning(() => fresh.pinned);
    setVisibility(() => fresh.visibility);
  }, [columns, defaultColumnWidth, setOrder, setPinning, setSizing, setVisibility]);

  return {
    state,
    sizing,
    order,
    pinning,
    visibility,
    setColumnWidth,
    setColumnSizing: setColumnSizingCb,
    setColumnOrder: setColumnOrderCb,
    moveColumn: moveColumnCb,
    setColumnPinning: setColumnPinningCb,
    pinColumn: pinColumnCb,
    setColumnVisibility: setColumnVisibilityCb,
    hideColumn: hideColumnCb,
    reset,
  };
}
