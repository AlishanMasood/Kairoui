import type { HTMLAttributes, ReactNode } from "react";
import type {
  ColumnFilter,
  ExpansionState,
  FilterState,
  RowId,
  SelectionMode,
  SortState,
} from "@kairoui/core/components";
import type {
  ColumnOrder,
  ColumnPinning,
  ColumnSizing,
  ColumnVisibility,
  DataGridColumnDef,
} from "./column-types";
import type { CellEditEvent, EditingMode, EditingState, RowEditEvent } from "./editing-types";

// ─── Focus state ───────────────────────────────────────────────────

/**
 * Position of the single focused grid cell. `null` values indicate the
 * grid has no focus yet (initial state, or blur out of the grid).
 */
export interface FocusState {
  readonly rowId: RowId | null;
  readonly columnId: string | null;
}

// ─── Slot rendering hooks ──────────────────────────────────────────

/**
 * Consumer-provided cell renderer invoked for group summary rows. The
 * default renders `column.aggregate.formatter(value)` when defined,
 * otherwise the raw aggregate value.
 */
export type GroupSummaryRenderer<TRow> = (context: {
  readonly columnId: string;
  readonly aggregateValue: unknown;
  readonly column: DataGridColumnDef<TRow>;
  readonly key: unknown;
  readonly count: number;
  readonly depth: number;
}) => ReactNode;

// ─── Root props ────────────────────────────────────────────────────

export interface DataGridRootProps<TRow> extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "children" | "onChange"
> {
  // ─── Data ─────────────────────────────────────────────────────
  readonly data: readonly TRow[];
  readonly columns: readonly DataGridColumnDef<TRow>[];
  readonly getRowId: (row: TRow) => RowId;

  // ─── Sort (multi-column) ───────────────────────────────────────
  readonly sort?: readonly SortState[];
  readonly defaultSort?: readonly SortState[];
  readonly onSortChange?: (sort: readonly SortState[]) => void;
  /** When `true`, click-only header toggles behave additively. Default `false`. */
  readonly multiSort?: boolean;
  /** When `true`, DataGrid trusts `data` as already sorted. Default `false`. */
  readonly serverSort?: boolean;

  // ─── Filter ────────────────────────────────────────────────────
  readonly filterState?: FilterState;
  readonly defaultFilterState?: FilterState;
  readonly onFilterStateChange?: (state: FilterState) => void;
  /** When `true`, DataGrid trusts `data` as already filtered. Default `false`. */
  readonly serverFilter?: boolean;

  // ─── Selection ────────────────────────────────────────────────
  readonly selectionMode?: SelectionMode;
  readonly selectedIds?: ReadonlySet<RowId>;
  readonly defaultSelectedIds?: ReadonlySet<RowId>;
  readonly onSelectionChange?: (ids: ReadonlySet<RowId>) => void;

  // ─── Column state ─────────────────────────────────────────────
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

  // ─── Grouping ─────────────────────────────────────────────────
  readonly groupBy?: readonly string[];
  readonly defaultGroupBy?: readonly string[];
  readonly onGroupByChange?: (groupBy: readonly string[]) => void;
  readonly expanded?: ExpansionState;
  readonly defaultExpanded?: ExpansionState;
  readonly onExpandChange?: (expanded: ExpansionState) => void;

  // ─── Editing ──────────────────────────────────────────────────
  readonly editMode?: EditingMode;
  readonly editingState?: EditingState;
  readonly defaultEditingState?: EditingState;
  readonly onEditingChange?: (state: EditingState) => void;
  readonly onCellEdit?: (event: CellEditEvent<TRow>) => void | Promise<void>;
  readonly onRowEdit?: (event: RowEditEvent<TRow>) => void | Promise<void>;

  // ─── Focus ────────────────────────────────────────────────────
  readonly focusState?: FocusState;
  readonly defaultFocusState?: FocusState;
  readonly onFocusChange?: (focus: FocusState) => void;

  // ─── Virtualization ──────────────────────────────────────────
  readonly virtualized?: boolean;
  readonly rowHeight?: number;
  readonly overscan?: number;
  readonly virtualScrollHeight?: number;

  // ─── States and slots ────────────────────────────────────────
  readonly loading?: boolean;
  readonly emptyState?: ReactNode;
  readonly filteredEmptyState?: ReactNode;
  readonly toolbar?: ReactNode;
  readonly footer?: ReactNode;
  /** Render a grand-total footer row aggregated from column `aggregate.footer`. */
  readonly showAggregatedFooter?: boolean;
  readonly renderGroupSummary?: GroupSummaryRenderer<TRow>;

  // ─── Direction ────────────────────────────────────────────────
  readonly dir?: "ltr" | "rtl";
}

// ─── Public column-filter shape (re-export convenience) ────────────

export type { ColumnFilter };
