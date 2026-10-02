import { useCallback, useMemo } from "react";
import type { KeyboardEvent } from "react";
import { useControllableState, useEventCallback } from "@kairoui/hooks";
// eslint-disable-next-line import-x/no-internal-modules
import { getCellValue } from "@kairoui/core/components/data-grid";
import type { RowId } from "@kairoui/core/components";
import type { DataGridColumnDef, EditCellRenderContext, ValidationResult } from "./column-types";
import type { CellEditEvent, EditingMode, EditingState, RowEditEvent } from "./editing-types";
import {
  EMPTY_EDITING_STATE,
  beginEdit as reduceBeginEdit,
  cancelEdit as reduceCancelEdit,
  changeEdit as reduceChangeEdit,
  discardAllPending,
  discardPendingRow,
  emptyEditingState,
  getCellError,
  getPendingValue,
  isCellEditing,
  isRowEditing,
  setEditingMode as reduceSetEditingMode,
  stagePendingValue,
  stageValidationError,
} from "./editing-model";

const OK: ValidationResult = { ok: true };

// ─── Options ───────────────────────────────────────────────────────

export interface UseEditingOptions<TRow> {
  readonly data: readonly TRow[];
  readonly columns: readonly DataGridColumnDef<TRow>[];
  readonly getRowId: (row: TRow) => RowId;

  readonly mode?: EditingMode;
  readonly editingState?: EditingState;
  readonly defaultEditingState?: EditingState;
  readonly onEditingChange?: (state: EditingState) => void;

  readonly onCellEdit?: (event: CellEditEvent<TRow>) => void | Promise<void>;
  readonly onRowEdit?: (event: RowEditEvent<TRow>) => void | Promise<void>;
}

// ─── Return ────────────────────────────────────────────────────────

export interface UseEditingReturn<TRow> {
  readonly state: EditingState;
  readonly mode: EditingMode;

  readonly isCellEditing: (rowId: RowId, columnId: string) => boolean;
  readonly isRowEditing: (rowId: RowId) => boolean;
  readonly getPendingValue: (
    rowId: RowId,
    columnId: string,
  ) => { readonly present: boolean; readonly value: unknown };
  readonly getCellError: (rowId: RowId, columnId: string) => string | undefined;

  readonly setEditingMode: (mode: EditingMode) => void;
  readonly beginEdit: (rowId: RowId, columnId: string) => void;
  readonly changeEdit: (rawInput: unknown) => void;
  readonly commitEdit: () => Promise<void>;
  readonly cancelEdit: () => void;

  readonly commitRow: (rowId: RowId) => Promise<void>;
  readonly discardRow: (rowId: RowId) => void;
  readonly commitAll: () => Promise<void>;
  readonly discardAll: () => void;

  readonly getEditorKeyHandler: () => (event: KeyboardEvent<HTMLElement>) => void;
  readonly getCellEditContext: (
    rowId: RowId,
    columnId: string,
  ) => EditCellRenderContext<TRow> | null;
}

// ─── Hook ──────────────────────────────────────────────────────────

/**
 * Controlled / uncontrolled bridge for editing state, plus imperative
 * lifecycle helpers (`beginEdit` / `changeEdit` / `commitEdit` /
 * `cancelEdit`) and row-level batch operations (`commitRow` /
 * `discardRow` / `commitAll` / `discardAll`).
 *
 * DataGrid never persists on its own. `onCellEdit` and `onRowEdit` are
 * called at commit time with plain-data events; consumers apply the
 * changes to their own store. Persistence errors thrown from a callback
 * leave the active editor / pending buffer in place so the user can
 * retry.
 */
export function useEditing<TRow>(options: UseEditingOptions<TRow>): UseEditingReturn<TRow> {
  const {
    data,
    columns,
    getRowId,
    mode: controlledMode,
    editingState,
    defaultEditingState,
    onEditingChange,
    onCellEdit,
    onRowEdit,
  } = options;

  const initialState = useMemo(
    () =>
      defaultEditingState ??
      (controlledMode ? emptyEditingState(controlledMode) : EMPTY_EDITING_STATE),
    // Initial-only: intentional single evaluation per hook lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const [state, setState] = useControllableState<EditingState>({
    value: editingState,
    defaultValue: initialState,
    ...(onEditingChange ? { onChange: onEditingChange } : undefined),
    name: "DataGrid",
    state: "editingState",
  });

  const currentMode = controlledMode ?? state.mode;

  // Column + row lookup indexes.
  const columnById = useMemo(() => {
    const map = new Map<string, DataGridColumnDef<TRow>>();
    for (const col of columns) map.set(col.id, col);
    return map;
  }, [columns]);

  const rowById = useMemo(() => {
    const map = new Map<RowId, TRow>();
    for (const row of data) map.set(getRowId(row), row);
    return map;
  }, [data, getRowId]);

  const onCellEditStable = useEventCallback(onCellEdit ?? (() => undefined));
  const onRowEditStable = useEventCallback(onRowEdit ?? (() => undefined));

  // ─── Selectors ─────────────────────────────────────────────────

  const isCellEditingCb = useCallback(
    (rowId: RowId, columnId: string) => isCellEditing(state, rowId, columnId),
    [state],
  );
  const isRowEditingCb = useCallback((rowId: RowId) => isRowEditing(state, rowId), [state]);
  const getPendingValueCb = useCallback(
    (rowId: RowId, columnId: string) => getPendingValue(state, rowId, columnId),
    [state],
  );
  const getCellErrorCb = useCallback(
    (rowId: RowId, columnId: string) => getCellError(state, rowId, columnId),
    [state],
  );

  // ─── Mode ──────────────────────────────────────────────────────

  const setEditingModeCb = useCallback(
    (next: EditingMode) => {
      setState((prev) => reduceSetEditingMode(prev, next));
    },
    [setState],
  );

  // ─── Begin / change / cancel ───────────────────────────────────

  const beginEditCb = useCallback(
    (rowId: RowId, columnId: string) => {
      if (currentMode === "none") return;
      const column = columnById.get(columnId);
      if (!column || column.editable !== true) return;
      const row = rowById.get(rowId);
      if (!row) return;

      // Seed with the row's current cell value (or the pending value if
      // this row is mid-batch), matching Excel's F2 semantics.
      const pending = getPendingValue(state, rowId, columnId);
      const initial = pending.present ? pending.value : getCellValue(column, row);
      setState((prev) => reduceBeginEdit(prev, rowId, columnId, initial));
    },
    [columnById, currentMode, rowById, setState, state],
  );

  const changeEditCb = useCallback(
    (rawInput: unknown) => {
      setState((prev) => {
        if (!prev.active) return prev;
        const column = columnById.get(prev.active.columnId);
        const row = rowById.get(prev.active.rowId);
        const validation: ValidationResult =
          column?.validateEdit && row ? column.validateEdit(rawInput, row) : OK;
        return reduceChangeEdit(prev, rawInput, validation);
      });
    },
    [columnById, rowById, setState],
  );

  const cancelEditCb = useCallback(() => {
    setState((prev) => reduceCancelEdit(prev));
  }, [setState]);

  // ─── Commit — cell mode fires onCellEdit; row/batch stage pending ──

  const commitEditCb = useCallback(async (): Promise<void> => {
    const active = state.active;
    if (!active) return;
    const column = columnById.get(active.columnId);
    const row = rowById.get(active.rowId);
    if (!column || !row) return;

    const validation: ValidationResult = column.validateEdit
      ? column.validateEdit(active.rawInput, row)
      : OK;

    if (!validation.ok) {
      // Keep the editor open, reflect the failure.
      setState((prev) => reduceChangeEdit(prev, active.rawInput, validation));
      if (currentMode === "row" || currentMode === "batch") {
        setState((prev) => stageValidationError(prev, validation.message ?? "Invalid input"));
      }
      return;
    }

    const parsedValue = column.parseEdit ? column.parseEdit(active.rawInput, row) : active.rawInput;

    if (currentMode === "cell") {
      const event: CellEditEvent<TRow> = {
        rowId: active.rowId,
        columnId: active.columnId,
        row,
        rawInput: active.rawInput,
        value: parsedValue,
        validation,
      };
      await onCellEditStable(event);
      // Success: clear the active editor.
      setState((prev) => reduceCancelEdit(prev));
    } else if (currentMode === "row" || currentMode === "batch") {
      setState((prev) => stagePendingValue(prev, parsedValue));
    }
  }, [columnById, currentMode, onCellEditStable, rowById, setState, state]);

  // ─── Row-level flush ───────────────────────────────────────────

  const commitRowCb = useCallback(
    async (rowId: RowId): Promise<void> => {
      const pending = state.pending.get(rowId);
      const errors = state.errors.get(rowId);
      const row = rowById.get(rowId);
      if (!row) return;
      const changes = new Map(pending ?? []);
      const errorMap = new Map(errors ?? []);
      if (changes.size === 0 && errorMap.size === 0) return;

      const event: RowEditEvent<TRow> = {
        rowId,
        row,
        changes,
        errors: errorMap,
      };
      await onRowEditStable(event);
      // Success: discard this row's pending buffer.
      setState((prev) => discardPendingRow(prev, rowId));
    },
    [onRowEditStable, rowById, setState, state],
  );

  const discardRowCb = useCallback(
    (rowId: RowId) => {
      setState((prev) => discardPendingRow(prev, rowId));
    },
    [setState],
  );

  const commitAllCb = useCallback(async (): Promise<void> => {
    const rowIds = Array.from(state.pending.keys());
    const committed: RowId[] = [];
    for (const rowId of rowIds) {
      const pending = state.pending.get(rowId);
      const errors = state.errors.get(rowId);
      const row = rowById.get(rowId);
      if (!row) continue;
      const changes = new Map(pending ?? []);
      const errorMap = new Map(errors ?? []);
      if (changes.size === 0 && errorMap.size === 0) continue;
      const event: RowEditEvent<TRow> = { rowId, row, changes, errors: errorMap };
      await onRowEditStable(event);
      committed.push(rowId);
    }
    if (committed.length === 0) return;
    // Coalesce every discard into a single functional update — sequential
    // `setState` calls don't compose across the shared valueRef in
    // `useControllableState`, so we batch by hand here.
    setState((prev) => {
      let next = prev;
      for (const rowId of committed) {
        next = discardPendingRow(next, rowId);
      }
      return next;
    });
  }, [onRowEditStable, rowById, setState, state]);

  const discardAllCb = useCallback(() => {
    setState((prev) => discardAllPending(prev));
  }, [setState]);

  // ─── Keyboard handler ──────────────────────────────────────────

  const commitEditRef = useEventCallback(commitEditCb);
  const cancelEditRef = useEventCallback(cancelEditCb);

  const getEditorKeyHandler = useCallback(() => {
    return (event: KeyboardEvent<HTMLElement>): void => {
      if (event.key === "Enter" && !event.shiftKey && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        void commitEditRef();
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        cancelEditRef();
      }
    };
  }, [cancelEditRef, commitEditRef]);

  // ─── Cell-editor context ───────────────────────────────────────

  const getCellEditContext = useCallback(
    (rowId: RowId, columnId: string): EditCellRenderContext<TRow> | null => {
      if (!isCellEditing(state, rowId, columnId)) return null;
      const active = state.active;
      if (!active) return null;
      const row = rowById.get(rowId);
      if (!row) return null;
      return {
        row,
        columnId,
        rawInput: active.rawInput,
        setInput: (next) => {
          changeEditCb(next);
        },
        commit: () => {
          void commitEditRef();
        },
        cancel: () => {
          cancelEditRef();
        },
        validation: active.validation,
      };
    },
    [cancelEditRef, changeEditCb, commitEditRef, rowById, state],
  );

  return {
    state,
    mode: currentMode,
    isCellEditing: isCellEditingCb,
    isRowEditing: isRowEditingCb,
    getPendingValue: getPendingValueCb,
    getCellError: getCellErrorCb,
    setEditingMode: setEditingModeCb,
    beginEdit: beginEditCb,
    changeEdit: changeEditCb,
    commitEdit: commitEditCb,
    cancelEdit: cancelEditCb,
    commitRow: commitRowCb,
    discardRow: discardRowCb,
    commitAll: commitAllCb,
    discardAll: discardAllCb,
    getEditorKeyHandler,
    getCellEditContext,
  };
}
