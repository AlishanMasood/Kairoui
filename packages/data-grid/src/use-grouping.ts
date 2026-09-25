import { useCallback, useMemo } from "react";
import { useControllableState } from "@kairoui/hooks";
import type { ExpansionState, RowId } from "@kairoui/core/components";
import type { DataGridColumnDef } from "./column-types";
import { filterGroupableColumns, type GroupingState } from "./row-model";

// ─── Empty defaults ────────────────────────────────────────────────

const EMPTY_GROUP_BY: readonly string[] = [];
const EMPTY_EXPANSION: ExpansionState = { expandedIds: new Set<RowId>() };

// ─── Options ───────────────────────────────────────────────────────

export interface UseGroupingOptions<TRow> {
  readonly columns: readonly DataGridColumnDef<TRow>[];

  readonly groupBy?: readonly string[];
  readonly defaultGroupBy?: readonly string[];
  readonly onGroupByChange?: (groupBy: readonly string[]) => void;

  readonly expanded?: ExpansionState;
  readonly defaultExpanded?: ExpansionState;
  readonly onExpandChange?: (expanded: ExpansionState) => void;
}

// ─── Return ────────────────────────────────────────────────────────

export interface UseGroupingReturn {
  readonly state: GroupingState;
  readonly expanded: ExpansionState;

  readonly setGroupBy: (groupBy: readonly string[]) => void;
  readonly groupByColumn: (columnId: string) => void;
  readonly ungroupColumn: (columnId: string) => void;
  readonly clearGrouping: () => void;

  readonly setExpanded: (expanded: ExpansionState) => void;
  readonly toggleExpanded: (groupId: string) => void;
  readonly expandGroup: (groupId: string) => void;
  readonly collapseGroup: (groupId: string) => void;
  readonly expandAll: (groupIds: readonly string[]) => void;
  readonly collapseAll: () => void;
  readonly isExpanded: (groupId: string) => boolean;
}

// ─── Hook ──────────────────────────────────────────────────────────

/**
 * Controlled / uncontrolled bridge for `groupBy` and `ExpansionState`.
 *
 * The `columns` array is only used to validate `groupByColumn`: unknown
 * or `groupable: false` IDs are dropped silently. Consumers may bypass
 * validation by passing an already-validated list through `setGroupBy`
 * (unknown / forbidden IDs are still dropped at the `filterGroupableColumns`
 * boundary in the row-model layer).
 */
export function useGrouping<TRow>(options: UseGroupingOptions<TRow>): UseGroupingReturn {
  const {
    columns,
    groupBy,
    defaultGroupBy,
    onGroupByChange,
    expanded,
    defaultExpanded,
    onExpandChange,
  } = options;

  const [groupByState, setGroupByInternal] = useControllableState<readonly string[]>({
    value: groupBy,
    defaultValue: defaultGroupBy ?? EMPTY_GROUP_BY,
    ...(onGroupByChange ? { onChange: onGroupByChange } : undefined),
    name: "DataGrid",
    state: "groupBy",
  });

  const [expandedState, setExpandedInternal] = useControllableState<ExpansionState>({
    value: expanded,
    defaultValue: defaultExpanded ?? EMPTY_EXPANSION,
    ...(onExpandChange ? { onChange: onExpandChange } : undefined),
    name: "DataGrid",
    state: "expanded",
  });

  const setGroupBy = useCallback(
    (next: readonly string[]) => {
      setGroupByInternal(() => filterGroupableColumns(columns, next));
    },
    [columns, setGroupByInternal],
  );

  const groupByColumn = useCallback(
    (columnId: string) => {
      setGroupByInternal((prev) => filterGroupableColumns(columns, [...prev, columnId]));
    },
    [columns, setGroupByInternal],
  );

  const ungroupColumn = useCallback(
    (columnId: string) => {
      setGroupByInternal((prev) => prev.filter((id) => id !== columnId));
    },
    [setGroupByInternal],
  );

  const clearGrouping = useCallback(() => {
    setGroupByInternal(() => EMPTY_GROUP_BY);
  }, [setGroupByInternal]);

  const setExpanded = useCallback(
    (next: ExpansionState) => {
      setExpandedInternal(() => next);
    },
    [setExpandedInternal],
  );

  const toggleExpanded = useCallback(
    (groupId: string) => {
      setExpandedInternal((prev) => {
        const next = new Set<RowId>(prev.expandedIds);
        if (next.has(groupId)) next.delete(groupId);
        else next.add(groupId);
        return { expandedIds: next };
      });
    },
    [setExpandedInternal],
  );

  const expandGroup = useCallback(
    (groupId: string) => {
      setExpandedInternal((prev) => {
        if (prev.expandedIds.has(groupId)) return prev;
        const next = new Set<RowId>(prev.expandedIds);
        next.add(groupId);
        return { expandedIds: next };
      });
    },
    [setExpandedInternal],
  );

  const collapseGroup = useCallback(
    (groupId: string) => {
      setExpandedInternal((prev) => {
        if (!prev.expandedIds.has(groupId)) return prev;
        const next = new Set<RowId>(prev.expandedIds);
        next.delete(groupId);
        return { expandedIds: next };
      });
    },
    [setExpandedInternal],
  );

  const expandAll = useCallback(
    (groupIds: readonly string[]) => {
      setExpandedInternal(() => ({ expandedIds: new Set<RowId>(groupIds) }));
    },
    [setExpandedInternal],
  );

  const collapseAll = useCallback(() => {
    setExpandedInternal(() => EMPTY_EXPANSION);
  }, [setExpandedInternal]);

  const isExpanded = useCallback(
    (groupId: string) => expandedState.expandedIds.has(groupId),
    [expandedState],
  );

  const state = useMemo<GroupingState>(() => ({ groupBy: groupByState }), [groupByState]);

  return {
    state,
    expanded: expandedState,
    setGroupBy,
    groupByColumn,
    ungroupColumn,
    clearGrouping,
    setExpanded,
    toggleExpanded,
    expandGroup,
    collapseGroup,
    expandAll,
    collapseAll,
    isExpanded,
  };
}
