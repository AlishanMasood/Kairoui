import { useCallback, useEffect, useId, useMemo, useRef } from "react";
import type {
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
  ReactNode,
} from "react";
import { useControllableState, useEventCallback } from "@kairoui/hooks";
import { PermissionMatrixContext, usePermissionMatrix } from "./permission-matrix-context";
import type { PermissionMatrixContextValue } from "./permission-matrix-context";
import {
  DEFAULT_PERMISSION_MATRIX_KEYMAP,
  type PermissionMatrixAction,
  resolvePermissionMatrixAction,
} from "./keymap";
import type {
  PermissionActionId,
  PermissionCell,
  PermissionCellState,
  PermissionMatrixBulkChangePayload,
  PermissionMatrixBulkSource,
  PermissionMatrixCellClickPayload,
  PermissionMatrixCellChangePayload,
  PermissionMatrixCellProps,
  PermissionMatrixCellRenderer,
  PermissionMatrixColumnHeaderProps,
  PermissionMatrixEmptyStateProps,
  PermissionMatrixEmptyStateRenderer,
  PermissionMatrixHeaderProps,
  PermissionMatrixLegendItemProps,
  PermissionMatrixRootProps,
  PermissionMatrixRowHeaderProps,
  PermissionMatrixSelection,
  PermissionMatrixTableProps,
  PermissionSubjectId,
} from "./permission-matrix-types";
import { assertValidPermissionInput } from "./identity";
import {
  UNSET_STATE,
  computeBulkChanges,
  filterAxis,
  resolveCell,
  resolveToggleTarget,
} from "./cell-state";
import {
  defaultBulkChangeAnnouncement,
  defaultCellLabel,
  defaultChangeAnnouncement,
  defaultMatrixLabel,
  defaultRejectInheritedToggleAnnouncement,
  defaultSearchLabel,
  defaultSearchPlaceholder,
  defaultSelectAllLabel,
  defaultSelectColumnLabel,
  defaultSelectRowLabel,
  defaultStateLabel,
} from "./permission-matrix-messages";

const NONE_SELECTION: PermissionMatrixSelection = { kind: "none" };

// ─── Root ────────────────────────────────────────────────────────

function PermissionMatrixRoot(props: PermissionMatrixRootProps): ReactNode {
  const {
    subjects,
    actions,
    cells,
    mode = "role-permission",
    toggleMode = "grant-only",
    overrideOnInheritedToggle = false,
    readOnly = false,
    enableRowToggle = true,
    enableColumnToggle = true,
    enableSelectAll = true,
    enableSearch = false,
    search: searchProp,
    defaultSearch,
    onSearchChange,
    filterFn,
    selection: selectionProp,
    defaultSelection,
    onSelectionChange,
    focusedSubjectId: focusedSubjectIdProp,
    defaultFocusedSubjectId,
    onFocusedSubjectChange,
    focusedActionId: focusedActionIdProp,
    defaultFocusedActionId,
    onFocusedActionChange,
    virtualizeRows = false,
    rowHeight,
    viewportHeight,
    locale = "en",
    dir = "ltr",
    messages,
    onCellClick,
    onCellChange,
    onBulkChange,
    onError,
    renderCell,
    renderEmptyState,
    children,
    className,
    style,
    id,
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledBy,
    "aria-describedby": ariaDescribedBy,
  } = props;

  assertValidPermissionInput(subjects, actions, cells);

  const generatedId = useId();
  const rootId = id ?? generatedId;
  const gridId = `${rootId}-grid`;

  const [selection, setSelectionInternal] = useControllableState<PermissionMatrixSelection>({
    value: selectionProp,
    defaultValue: defaultSelection ?? NONE_SELECTION,
    ...(onSelectionChange ? { onChange: onSelectionChange } : undefined),
    isEqual: permissionSelectionEqual,
    name: "PermissionMatrix",
    state: "selection",
  });

  const [focusedSubjectId, setFocusedSubjectIdInternal] =
    useControllableState<PermissionSubjectId | null>({
      value: focusedSubjectIdProp,
      defaultValue: defaultFocusedSubjectId ?? null,
      ...(onFocusedSubjectChange ? { onChange: onFocusedSubjectChange } : undefined),
      name: "PermissionMatrix",
      state: "focusedSubjectId",
    });

  const [focusedActionId, setFocusedActionIdInternal] =
    useControllableState<PermissionActionId | null>({
      value: focusedActionIdProp,
      defaultValue: defaultFocusedActionId ?? null,
      ...(onFocusedActionChange ? { onChange: onFocusedActionChange } : undefined),
      name: "PermissionMatrix",
      state: "focusedActionId",
    });

  const [search, setSearchInternal] = useControllableState<string>({
    value: searchProp,
    defaultValue: defaultSearch ?? "",
    ...(onSearchChange ? { onChange: onSearchChange } : undefined),
    name: "PermissionMatrix",
    state: "search",
  });

  // ── Messages
  const mergedMessages = useMemo(
    () => ({
      matrixLabel: messages?.matrixLabel ?? defaultMatrixLabel(),
      searchLabel: messages?.searchLabel ?? defaultSearchLabel(),
      searchPlaceholder: messages?.searchPlaceholder ?? defaultSearchPlaceholder(),
      grantedLabel: messages?.grantedLabel ?? defaultStateLabel("granted"),
      deniedLabel: messages?.deniedLabel ?? defaultStateLabel("denied"),
      unsetLabel: messages?.unsetLabel ?? defaultStateLabel("unset"),
      inheritedLabel: messages?.inheritedLabel ?? defaultStateLabel("inherited"),
      indeterminateLabel: messages?.indeterminateLabel ?? defaultStateLabel("indeterminate"),
      disabledLabel: messages?.disabledLabel ?? "Disabled",
      readOnlyLabel: messages?.readOnlyLabel ?? "Read only",
      selectAllLabel: messages?.selectAllLabel ?? defaultSelectAllLabel(),
      selectRowLabel: messages?.selectRowLabel ?? defaultSelectRowLabel,
      selectColumnLabel: messages?.selectColumnLabel ?? defaultSelectColumnLabel,
      cellLabel: messages?.cellLabel ?? defaultCellLabel,
      changeAnnouncement: messages?.changeAnnouncement ?? defaultChangeAnnouncement,
      bulkChangeAnnouncement: messages?.bulkChangeAnnouncement ?? defaultBulkChangeAnnouncement,
      rejectInheritedToggleAnnouncement:
        messages?.rejectInheritedToggleAnnouncement ?? defaultRejectInheritedToggleAnnouncement,
    }),
    [messages],
  );

  // ── Filtering
  const visibleSubjects = useMemo(
    () => filterAxis(subjects, search, filterFn, "subject"),
    [filterFn, search, subjects],
  );
  const visibleActions = useMemo(
    () => filterAxis(actions, search, filterFn, "action"),
    [actions, filterFn, search],
  );

  // ── Cell index
  const cellIndex = useMemo(() => {
    const map = new Map<string, PermissionCell>();
    for (const c of cells) {
      map.set(`${c.subjectId}\u0000${c.actionId}`, c);
    }
    return map;
  }, [cells]);

  // ── Announcer
  const announcerRef = useRef<HTMLDivElement | null>(null);
  const announce = useCallback((message: string) => {
    const el = announcerRef.current;
    if (!el) return;
    el.textContent = "";
    if (typeof window !== "undefined" && typeof window.requestAnimationFrame === "function") {
      window.requestAnimationFrame(() => {
        if (el.isConnected) el.textContent = message;
      });
    } else {
      el.textContent = message;
    }
  }, []);

  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const registerSearchInput = useCallback((el: HTMLInputElement | null) => {
    searchInputRef.current = el;
  }, []);
  const focusSearchInput = useCallback(() => {
    searchInputRef.current?.focus();
  }, []);

  // ── Setters
  const setSelection = useCallback(
    (next: PermissionMatrixSelection) => {
      setSelectionInternal(next);
    },
    [setSelectionInternal],
  );
  const setFocusedSubjectId = useCallback(
    (next: PermissionSubjectId | null) => {
      setFocusedSubjectIdInternal(next);
    },
    [setFocusedSubjectIdInternal],
  );
  const setFocusedActionId = useCallback(
    (next: PermissionActionId | null) => {
      setFocusedActionIdInternal(next);
    },
    [setFocusedActionIdInternal],
  );
  const setSearch = useCallback(
    (next: string) => {
      setSearchInternal(next);
    },
    [setSearchInternal],
  );

  // ── Stable callbacks
  const onCellClickStable = useEventCallback(onCellClick ?? (() => undefined));
  const onCellChangeStable = useEventCallback(onCellChange ?? (() => undefined));
  const onBulkChangeStable = useEventCallback(onBulkChange ?? (() => undefined));
  const onErrorStable = useEventCallback(onError ?? (() => undefined));

  const toggleCellAt = useCallback(
    (subjectId: PermissionSubjectId, actionId: PermissionActionId) => {
      if (readOnly) return;
      const subject = subjects.find((s) => s.id === subjectId);
      const action = actions.find((a) => a.id === actionId);
      if (!subject || !action) return;
      const cell = resolveCell(cells, subjectId, actionId);
      if (cell.disabled === true || cell.readOnly === true) return;
      const target = resolveToggleTarget(cell.state, toggleMode, overrideOnInheritedToggle);
      if (target === null) {
        announce(mergedMessages.rejectInheritedToggleAnnouncement(subject, action));
        return;
      }
      const payload: PermissionMatrixCellChangePayload = {
        subject,
        action,
        fromState: cell.state,
        toState: target,
      };
      try {
        const result = onCellChangeStable(payload);
        if (result instanceof Promise) {
          void result.catch((error: unknown) => {
            onErrorStable(error);
          });
        }
      } catch (error) {
        onErrorStable(error);
      }
      announce(mergedMessages.changeAnnouncement(subject, action, cell.state, target));
    },
    [
      actions,
      announce,
      cells,
      mergedMessages,
      onCellChangeStable,
      onErrorStable,
      overrideOnInheritedToggle,
      readOnly,
      subjects,
      toggleMode,
    ],
  );

  const bulkSetTo = useCallback(
    (source: PermissionMatrixBulkSource, targetState: PermissionCellState) => {
      if (readOnly) return;
      const rowSubjectId = source.kind === "row" ? source.subjectId : undefined;
      const columnActionId = source.kind === "column" ? source.actionId : undefined;
      const changes = computeBulkChanges({
        subjects,
        actions,
        cells,
        targetState,
        ...(rowSubjectId !== undefined ? { rowSubjectId } : {}),
        ...(columnActionId !== undefined ? { columnActionId } : {}),
      });
      if (changes.length === 0) return;
      const payload: PermissionMatrixBulkChangePayload = {
        changes,
        source,
        targetState,
      };
      try {
        const result = onBulkChangeStable(payload);
        if (result instanceof Promise) {
          void result.catch((error: unknown) => {
            onErrorStable(error);
          });
        }
      } catch (error) {
        onErrorStable(error);
      }
      announce(mergedMessages.bulkChangeAnnouncement(source, targetState, changes.length));
    },
    [
      actions,
      announce,
      cells,
      mergedMessages,
      onBulkChangeStable,
      onErrorStable,
      readOnly,
      subjects,
    ],
  );

  const contextValue: PermissionMatrixContextValue = useMemo(
    () => ({
      state: {
        selection,
        focusedSubjectId,
        focusedActionId,
        search,
      },
      subjects,
      actions,
      cells,
      visibleSubjects,
      visibleActions,
      cellIndex,
      mode,
      toggleMode,
      overrideOnInheritedToggle,
      readOnly,
      enableRowToggle,
      enableColumnToggle,
      enableSelectAll,
      enableSearch,
      virtualizeRows,
      rowHeight: rowHeight ?? null,
      viewportHeight: viewportHeight ?? null,
      locale,
      dir,
      rootId,
      gridId,
      keymap: DEFAULT_PERMISSION_MATRIX_KEYMAP,
      messages: mergedMessages,
      renderCell: renderCell ?? null,
      renderEmptyState: renderEmptyState ?? null,
      setSelection,
      setFocusedSubjectId,
      setFocusedActionId,
      setSearch,
      toggleCellAt,
      bulkSetTo,
      onCellClick:
        onCellClick !== undefined
          ? (onCellClickStable as PermissionMatrixContextValue["onCellClick"])
          : null,
      announce,
      registerSearchInput,
      focusSearchInput,
    }),
    [
      actions,
      announce,
      bulkSetTo,
      cellIndex,
      cells,
      dir,
      enableColumnToggle,
      enableRowToggle,
      enableSearch,
      enableSelectAll,
      focusSearchInput,
      focusedActionId,
      focusedSubjectId,
      gridId,
      locale,
      mergedMessages,
      mode,
      onCellClick,
      onCellClickStable,
      overrideOnInheritedToggle,
      readOnly,
      registerSearchInput,
      renderCell,
      renderEmptyState,
      rootId,
      rowHeight,
      search,
      selection,
      setFocusedActionId,
      setFocusedSubjectId,
      setSearch,
      setSelection,
      subjects,
      toggleCellAt,
      toggleMode,
      viewportHeight,
      virtualizeRows,
      visibleActions,
      visibleSubjects,
    ],
  );

  return (
    <PermissionMatrixContext.Provider value={contextValue}>
      <div
        id={rootId}
        className={joinClass("kui-permission-matrix", className)}
        style={style}
        role="application"
        aria-roledescription="Permission matrix"
        {...(ariaLabel !== undefined
          ? { "aria-label": ariaLabel }
          : ariaLabelledBy === undefined
            ? { "aria-label": mergedMessages.matrixLabel }
            : {})}
        {...(ariaLabelledBy !== undefined ? { "aria-labelledby": ariaLabelledBy } : {})}
        {...(ariaDescribedBy !== undefined ? { "aria-describedby": ariaDescribedBy } : {})}
        dir={dir}
        data-permission-matrix-mode={mode}
        data-permission-matrix-readonly={readOnly ? "" : undefined}
      >
        {children ?? <DefaultLayout />}
        <div
          ref={announcerRef}
          aria-live="polite"
          aria-atomic="true"
          className="kui-permission-matrix__announcer"
          data-permission-matrix-announcer=""
        />
      </div>
    </PermissionMatrixContext.Provider>
  );
}

function permissionSelectionEqual(
  a: PermissionMatrixSelection,
  b: PermissionMatrixSelection,
): boolean {
  if (a === b) return true;
  if (a.kind !== b.kind) return false;
  switch (a.kind) {
    case "none":
    case "all":
      return true;
    case "cell":
      return b.kind === "cell" && a.subjectId === b.subjectId && a.actionId === b.actionId;
    case "row":
      return b.kind === "row" && a.subjectId === b.subjectId;
    case "column":
      return b.kind === "column" && a.actionId === b.actionId;
  }
}

function joinClass(...parts: readonly (string | false | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

function DefaultLayout(): ReactNode {
  return (
    <>
      <PermissionMatrixHeader />
      <PermissionMatrixTable />
    </>
  );
}

// ─── Header ──────────────────────────────────────────────────────

function PermissionMatrixHeader(props: PermissionMatrixHeaderProps = {}): ReactNode {
  const ctx = usePermissionMatrix();
  const { className, style, children } = props;
  return (
    <div
      className={joinClass("kui-permission-matrix__header", className)}
      style={style}
      data-permission-matrix-header=""
    >
      {children ?? (
        <>
          {ctx.enableSearch ? <SearchInput /> : null}
          <SelectionActions />
        </>
      )}
    </div>
  );
}

function SearchInput(): ReactNode {
  const ctx = usePermissionMatrix();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const registerSearchInput = ctx.registerSearchInput;
  useEffect(() => {
    registerSearchInput(inputRef.current);
    return () => {
      registerSearchInput(null);
    };
  }, [registerSearchInput]);
  return (
    <label className="kui-permission-matrix__search">
      <span className="kui-permission-matrix__search-label">{ctx.messages.searchLabel}</span>
      <input
        ref={inputRef}
        type="search"
        className="kui-permission-matrix__search-input"
        placeholder={ctx.messages.searchPlaceholder}
        value={ctx.state.search}
        onChange={(e) => {
          ctx.setSearch(e.target.value);
        }}
        aria-label={ctx.messages.searchLabel}
        data-permission-matrix-search=""
      />
    </label>
  );
}

function SelectionActions(): ReactNode {
  const ctx = usePermissionMatrix();
  const selection = ctx.state.selection;
  const disabled = ctx.readOnly;
  if (selection.kind === "none") return null;

  const bulkStates: readonly PermissionCellState[] =
    ctx.toggleMode === "grant-only" ? ["granted", "unset"] : ["granted", "denied", "unset"];

  return (
    <div
      className="kui-permission-matrix__selection-actions"
      data-permission-matrix-selection-actions=""
    >
      {bulkStates.map((state) => (
        <button
          key={state}
          type="button"
          className="kui-permission-matrix__bulk-btn"
          disabled={disabled}
          data-permission-matrix-bulk-set={state}
          onClick={() => {
            if (selection.kind === "cell") return;
            if (selection.kind === "row") {
              ctx.bulkSetTo({ kind: "row", subjectId: selection.subjectId }, state);
            } else if (selection.kind === "column") {
              ctx.bulkSetTo({ kind: "column", actionId: selection.actionId }, state);
            } else {
              ctx.bulkSetTo({ kind: "all" }, state);
            }
          }}
        >
          Set {stateLabel(state, ctx.messages)}
        </button>
      ))}
    </div>
  );
}

function stateLabel(
  state: PermissionCellState,
  messages: PermissionMatrixContextValue["messages"],
): string {
  switch (state) {
    case "granted":
      return messages.grantedLabel;
    case "denied":
      return messages.deniedLabel;
    case "unset":
      return messages.unsetLabel;
    case "inherited":
      return messages.inheritedLabel;
    case "indeterminate":
      return messages.indeterminateLabel;
  }
}

// ─── Table ───────────────────────────────────────────────────────

function PermissionMatrixTable(props: PermissionMatrixTableProps = {}): ReactNode {
  const ctx = usePermissionMatrix();
  const { className, style, children } = props;
  const rows = ctx.visibleSubjects;
  const cols = ctx.visibleActions;
  const gridRef = useRef<HTMLDivElement | null>(null);

  const onKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLDivElement>) => {
      const action = resolvePermissionMatrixAction(
        {
          key: e.key,
          shiftKey: e.shiftKey,
          ctrlKey: e.ctrlKey,
          altKey: e.altKey,
          metaKey: e.metaKey,
        },
        ctx.keymap,
      );
      if (!action) return;
      dispatchKeyboardAction(action, e, ctx);
    },
    [ctx],
  );

  if (rows.length === 0 || cols.length === 0) {
    return (
      <div
        className={joinClass("kui-permission-matrix__empty", className)}
        style={style}
        data-permission-matrix-empty=""
      >
        {children ?? (ctx.renderEmptyState ? ctx.renderEmptyState() : <DefaultEmptyState />)}
      </div>
    );
  }

  return (
    <div
      id={ctx.gridId}
      role="grid"
      aria-rowcount={rows.length + 1}
      aria-colcount={cols.length + 1}
      className={joinClass("kui-permission-matrix__grid", className)}
      style={style}
      data-permission-matrix-grid=""
      onKeyDown={onKeyDown}
      ref={gridRef}
      tabIndex={-1}
    >
      {children ?? (
        <>
          <div role="row" className="kui-permission-matrix__row kui-permission-matrix__row--header">
            <CornerCell />
            {cols.map((action, colIndex) => (
              <PermissionMatrixColumnHeader
                key={action.id}
                actionId={action.id}
                data-col-index={colIndex + 2}
              />
            ))}
          </div>
          {rows.map((subject, rowIndex) => (
            <div
              key={subject.id}
              role="row"
              className="kui-permission-matrix__row"
              aria-rowindex={rowIndex + 2}
              data-permission-matrix-row={subject.id}
            >
              <PermissionMatrixRowHeader subjectId={subject.id} />
              {cols.map((action) => (
                <PermissionMatrixCell key={action.id} subjectId={subject.id} actionId={action.id} />
              ))}
            </div>
          ))}
        </>
      )}
    </div>
  );
}

function DefaultEmptyState(): ReactNode {
  return <span className="kui-permission-matrix__empty-text">No permissions to show.</span>;
}

function CornerCell(): ReactNode {
  const ctx = usePermissionMatrix();
  const selected = ctx.state.selection.kind === "all";
  const onSelect = useCallback(() => {
    ctx.setSelection(selected ? { kind: "none" } : { kind: "all" });
  }, [ctx, selected]);
  const onKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onSelect();
      }
    },
    [onSelect],
  );
  if (!ctx.enableSelectAll) {
    return <div role="columnheader" className="kui-permission-matrix__corner" />;
  }
  return (
    <div
      role="columnheader"
      className={joinClass(
        "kui-permission-matrix__corner",
        selected && "kui-permission-matrix__corner--selected",
      )}
      aria-label={ctx.messages.selectAllLabel}
      aria-selected={selected}
      tabIndex={-1}
      data-permission-matrix-corner=""
      data-selected={selected ? "" : undefined}
      onClick={onSelect}
      onKeyDown={onKeyDown}
    >
      ⚪
    </div>
  );
}

// ─── Column header ───────────────────────────────────────────────

function PermissionMatrixColumnHeader(
  props: PermissionMatrixColumnHeaderProps & { readonly "data-col-index"?: number },
): ReactNode {
  const { actionId, className, style, children } = props;
  const ctx = usePermissionMatrix();
  const action = ctx.actions.find((a) => a.id === actionId);
  const isSelected =
    ctx.state.selection.kind === "column" && ctx.state.selection.actionId === actionId;
  const isFocused = ctx.state.focusedActionId === actionId;
  const canToggle = ctx.enableColumnToggle && !ctx.readOnly;

  const onSelect = useCallback(() => {
    if (canToggle) {
      ctx.setSelection({ kind: "column", actionId });
    }
  }, [actionId, canToggle, ctx]);

  const onKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onSelect();
      }
    },
    [onSelect],
  );

  if (!action) return null;

  return (
    <div
      role="columnheader"
      aria-selected={isSelected}
      aria-label={ctx.messages.selectColumnLabel(action)}
      className={joinClass(
        "kui-permission-matrix__column-header",
        isSelected && "kui-permission-matrix__column-header--selected",
        className,
      )}
      style={style}
      tabIndex={isFocused ? 0 : -1}
      data-permission-matrix-column-header={actionId}
      data-selected={isSelected ? "" : undefined}
      onClick={onSelect}
      onKeyDown={onKeyDown}
      onFocus={() => {
        ctx.setFocusedActionId(actionId);
      }}
    >
      {children ?? action.label}
    </div>
  );
}

// ─── Row header ──────────────────────────────────────────────────

function PermissionMatrixRowHeader(props: PermissionMatrixRowHeaderProps): ReactNode {
  const { subjectId, className, style, children } = props;
  const ctx = usePermissionMatrix();
  const subject = ctx.subjects.find((s) => s.id === subjectId);
  const isSelected =
    ctx.state.selection.kind === "row" && ctx.state.selection.subjectId === subjectId;
  const isFocused = ctx.state.focusedSubjectId === subjectId;
  const canToggle = ctx.enableRowToggle && !ctx.readOnly;

  const onSelect = useCallback(() => {
    if (canToggle) {
      ctx.setSelection({ kind: "row", subjectId });
    }
  }, [canToggle, ctx, subjectId]);

  const onKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onSelect();
      }
    },
    [onSelect],
  );

  if (!subject) return null;

  return (
    <div
      role="rowheader"
      aria-selected={isSelected}
      aria-label={ctx.messages.selectRowLabel(subject)}
      className={joinClass(
        "kui-permission-matrix__row-header",
        isSelected && "kui-permission-matrix__row-header--selected",
        className,
      )}
      style={style}
      tabIndex={isFocused ? 0 : -1}
      data-permission-matrix-row-header={subjectId}
      data-selected={isSelected ? "" : undefined}
      onClick={onSelect}
      onKeyDown={onKeyDown}
      onFocus={() => {
        ctx.setFocusedSubjectId(subjectId);
      }}
    >
      {children ?? subject.label}
    </div>
  );
}

// ─── Cell ────────────────────────────────────────────────────────

function PermissionMatrixCell(props: PermissionMatrixCellProps): ReactNode {
  const { subjectId, actionId, className, style, children } = props;
  const ctx = usePermissionMatrix();
  const subject = ctx.subjects.find((s) => s.id === subjectId);
  const action = ctx.actions.find((a) => a.id === actionId);
  const cell = useMemo<PermissionCell>(
    () =>
      ctx.cellIndex.get(`${subjectId}\u0000${actionId}`) ?? {
        subjectId,
        actionId,
        state: UNSET_STATE,
      },
    [actionId, ctx.cellIndex, subjectId],
  );
  const isFocused =
    ctx.state.focusedSubjectId === subjectId && ctx.state.focusedActionId === actionId;
  const isSelected =
    (ctx.state.selection.kind === "cell" &&
      ctx.state.selection.subjectId === subjectId &&
      ctx.state.selection.actionId === actionId) ||
    (ctx.state.selection.kind === "row" && ctx.state.selection.subjectId === subjectId) ||
    (ctx.state.selection.kind === "column" && ctx.state.selection.actionId === actionId) ||
    ctx.state.selection.kind === "all";
  const isDisabled = cell.disabled === true;
  const isReadOnly = cell.readOnly === true || ctx.readOnly;

  const onClick = useCallback(
    (e: ReactMouseEvent<HTMLDivElement>) => {
      if (!subject || !action) return;
      ctx.setSelection({ kind: "cell", subjectId, actionId });
      ctx.setFocusedSubjectId(subjectId);
      ctx.setFocusedActionId(actionId);
      if (ctx.onCellClick) {
        const payload: PermissionMatrixCellClickPayload = {
          subject,
          action,
          cell,
          nativeEvent: e.nativeEvent,
        };
        ctx.onCellClick(payload);
      }
      if (!isDisabled && !isReadOnly) {
        ctx.toggleCellAt(subjectId, actionId);
      }
    },
    [action, actionId, cell, ctx, isDisabled, isReadOnly, subject, subjectId],
  );

  const onKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (!isDisabled && !isReadOnly) {
          ctx.toggleCellAt(subjectId, actionId);
        }
      }
    },
    [actionId, ctx, isDisabled, isReadOnly, subjectId],
  );

  const onFocus = useCallback(() => {
    ctx.setFocusedSubjectId(subjectId);
    ctx.setFocusedActionId(actionId);
  }, [actionId, ctx, subjectId]);

  if (!subject || !action) return null;

  const ariaChecked = ariaCheckedFor(cell.state);
  const rendered =
    ctx.renderCell !== null
      ? ctx.renderCell({ subject, action, cell, isFocused, isSelected })
      : (defaultCellVisual(cell.state) satisfies ReactNode);

  return (
    // eslint-disable-next-line jsx-a11y/role-supports-aria-props
    <div
      role="gridcell"
      aria-checked={ariaChecked}
      aria-label={ctx.messages.cellLabel(subject, action, cell.state)}
      aria-disabled={isDisabled || undefined}
      aria-readonly={isReadOnly || undefined}
      className={joinClass(
        "kui-permission-matrix__cell",
        `kui-permission-matrix__cell--${cell.state}`,
        isFocused && "kui-permission-matrix__cell--focused",
        isSelected && "kui-permission-matrix__cell--selected",
        isDisabled && "kui-permission-matrix__cell--disabled",
        isReadOnly && "kui-permission-matrix__cell--readonly",
        className,
      )}
      style={style}
      tabIndex={isFocused ? 0 : -1}
      data-permission-matrix-cell=""
      data-subject-id={subjectId}
      data-action-id={actionId}
      data-state={cell.state}
      onClick={onClick}
      onKeyDown={onKeyDown}
      onFocus={onFocus}
    >
      {children ?? rendered}
    </div>
  );
}

function ariaCheckedFor(state: PermissionCellState): boolean | "mixed" {
  switch (state) {
    case "granted":
      return true;
    case "denied":
    case "unset":
      return false;
    case "inherited":
    case "indeterminate":
      return "mixed";
  }
}

function defaultCellVisual(state: PermissionCellState): ReactNode {
  switch (state) {
    case "granted":
      return <span className="kui-permission-matrix__cell-icon">✓</span>;
    case "denied":
      return <span className="kui-permission-matrix__cell-icon">✕</span>;
    case "inherited":
      return <span className="kui-permission-matrix__cell-icon">↳</span>;
    case "indeterminate":
      return <span className="kui-permission-matrix__cell-icon">◐</span>;
    case "unset":
      return <span className="kui-permission-matrix__cell-icon" aria-hidden="true" />;
  }
}

// ─── EmptyState / LegendItem ─────────────────────────────────────

function PermissionMatrixEmptyState(props: PermissionMatrixEmptyStateProps = {}): ReactNode {
  const { className, style, children } = props;
  return (
    <div
      className={joinClass("kui-permission-matrix__empty-state", className)}
      style={style}
      data-permission-matrix-empty-state=""
    >
      {children}
    </div>
  );
}

function PermissionMatrixLegendItem(props: PermissionMatrixLegendItemProps): ReactNode {
  const { state, children, className, style } = props;
  const ctx = usePermissionMatrix();
  return (
    <span
      className={joinClass(
        "kui-permission-matrix__legend-item",
        `kui-permission-matrix__legend-item--${state}`,
        className,
      )}
      style={style}
      data-permission-matrix-legend={state}
    >
      {defaultCellVisual(state)} {children ?? stateLabel(state, ctx.messages)}
    </span>
  );
}

// ─── Keyboard action dispatcher ──────────────────────────────────

function dispatchKeyboardAction(
  action: PermissionMatrixAction,
  e: ReactKeyboardEvent<HTMLDivElement>,
  ctx: PermissionMatrixContextValue,
): void {
  const rows = ctx.visibleSubjects;
  const cols = ctx.visibleActions;
  if (rows.length === 0 || cols.length === 0) return;
  const rowIndex = rows.findIndex((s) => s.id === ctx.state.focusedSubjectId);
  const colIndex = cols.findIndex((a) => a.id === ctx.state.focusedActionId);
  const currentRow = rowIndex >= 0 ? rowIndex : 0;
  const currentCol = colIndex >= 0 ? colIndex : 0;

  const moveTo = (r: number, c: number): void => {
    const row = rows[r];
    const col = cols[c];
    if (!row || !col) return;
    ctx.setFocusedSubjectId(row.id);
    ctx.setFocusedActionId(col.id);
    focusCell(ctx.gridId, row.id, col.id);
  };

  switch (action) {
    case "moveFocusUp":
      e.preventDefault();
      moveTo(Math.max(0, currentRow - 1), currentCol);
      return;
    case "moveFocusDown":
      e.preventDefault();
      moveTo(Math.min(rows.length - 1, currentRow + 1), currentCol);
      return;
    case "moveFocusLeft":
      e.preventDefault();
      moveTo(currentRow, Math.max(0, currentCol + (ctx.dir === "rtl" ? 1 : -1)));
      return;
    case "moveFocusRight":
      e.preventDefault();
      moveTo(currentRow, Math.min(cols.length - 1, currentCol + (ctx.dir === "rtl" ? -1 : 1)));
      return;
    case "moveFocusHome":
      e.preventDefault();
      moveTo(currentRow, 0);
      return;
    case "moveFocusEnd":
      e.preventDefault();
      moveTo(currentRow, cols.length - 1);
      return;
    case "moveFocusGridHome":
      e.preventDefault();
      moveTo(0, 0);
      return;
    case "moveFocusGridEnd":
      e.preventDefault();
      moveTo(rows.length - 1, cols.length - 1);
      return;
    case "moveFocusPageUp":
      e.preventDefault();
      moveTo(Math.max(0, currentRow - 10), currentCol);
      return;
    case "moveFocusPageDown":
      e.preventDefault();
      moveTo(Math.min(rows.length - 1, currentRow + 10), currentCol);
      return;
    case "toggle": {
      e.preventDefault();
      const row = rows[currentRow];
      const col = cols[currentCol];
      if (row && col) ctx.toggleCellAt(row.id, col.id);
      return;
    }
    case "selectRow": {
      e.preventDefault();
      const row = rows[currentRow];
      if (row) ctx.setSelection({ kind: "row", subjectId: row.id });
      return;
    }
    case "selectColumn": {
      e.preventDefault();
      const col = cols[currentCol];
      if (col) ctx.setSelection({ kind: "column", actionId: col.id });
      return;
    }
    case "selectAll":
      e.preventDefault();
      ctx.setSelection({ kind: "all" });
      return;
    case "clearSelection":
      e.preventDefault();
      ctx.setSelection({ kind: "none" });
      return;
    case "focusSearch":
      if (!ctx.enableSearch) return;
      e.preventDefault();
      ctx.focusSearchInput();
      return;
    default:
      return;
  }
}

function focusCell(gridId: string, subjectId: string, actionId: string): void {
  const grid = document.getElementById(gridId);
  if (!grid) return;
  const cell = grid.querySelector<HTMLElement>(
    `[data-subject-id="${cssEscape(subjectId)}"][data-action-id="${cssEscape(actionId)}"]`,
  );
  cell?.focus();
}

function cssEscape(value: string): string {
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
    return CSS.escape(value);
  }
  return value.replace(/["\\]/g, "\\$&");
}

// ─── Compound + exports ──────────────────────────────────────────

interface PermissionMatrixCompound {
  (props: PermissionMatrixRootProps): ReactNode;
  readonly displayName?: string;
  readonly Root: typeof PermissionMatrixRoot;
  readonly Header: typeof PermissionMatrixHeader;
  readonly Table: typeof PermissionMatrixTable;
  readonly ColumnHeader: typeof PermissionMatrixColumnHeader;
  readonly RowHeader: typeof PermissionMatrixRowHeader;
  readonly Cell: typeof PermissionMatrixCell;
  readonly EmptyState: typeof PermissionMatrixEmptyState;
  readonly LegendItem: typeof PermissionMatrixLegendItem;
}

const PermissionMatrixImpl = PermissionMatrixRoot as unknown as PermissionMatrixCompound & {
  displayName: string;
};
Object.assign(PermissionMatrixImpl, {
  Root: PermissionMatrixRoot,
  Header: PermissionMatrixHeader,
  Table: PermissionMatrixTable,
  ColumnHeader: PermissionMatrixColumnHeader,
  RowHeader: PermissionMatrixRowHeader,
  Cell: PermissionMatrixCell,
  EmptyState: PermissionMatrixEmptyState,
  LegendItem: PermissionMatrixLegendItem,
});
PermissionMatrixImpl.displayName = "PermissionMatrix";

export const PermissionMatrix: PermissionMatrixCompound = PermissionMatrixImpl;

export {
  PermissionMatrixRoot,
  PermissionMatrixHeader,
  PermissionMatrixTable,
  PermissionMatrixColumnHeader,
  PermissionMatrixRowHeader,
  PermissionMatrixCell,
  PermissionMatrixEmptyState,
  PermissionMatrixLegendItem,
};

export type { PermissionMatrixCellRenderer, PermissionMatrixEmptyStateRenderer };
