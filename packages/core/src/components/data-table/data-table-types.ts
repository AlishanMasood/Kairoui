import type { ReactNode } from "react";
import type {
  RowId,
  SortDirection,
  SortState,
  SelectionMode,
  ColumnAlign,
} from "../data/data-types";
import type { FilterFn, FilterKind, FilterOption, FilterState } from "./filter-utils";

// ─── Column Definition ──────────────────────────────────────────────

/** DataTable column definition — generic over the row data type. */
export interface DataTableColumnDef<TRow> {
  readonly id: string;
  readonly header: ReactNode | (() => ReactNode);
  readonly accessorKey?: keyof TRow & string;
  readonly accessorFn?: (row: TRow) => unknown;
  readonly cell?: (value: unknown, row: TRow) => ReactNode;
  readonly sortable?: boolean;
  readonly align?: ColumnAlign;

  /** When present, controls whether the column participates in filtering. */
  readonly filterable?: boolean;
  /** UI hint for filter widgets (deferred). Does not alter evaluator semantics. */
  readonly filterKind?: FilterKind;
  /** Custom filter — overrides operator dispatch for this column. */
  readonly filterFn?: FilterFn<TRow>;
  /** Enumerable choices for `filterKind: "select"` columns. */
  readonly filterOptions?: readonly FilterOption[];
}

// ─── Sort State ─────────────────────────────────────────────────────

export type { SortState, SortDirection };

export interface DataTableSortProps {
  readonly sort?: SortState;
  readonly defaultSort?: SortState;
  readonly onSortChange?: (sort: SortState | undefined) => void;
}

// ─── Selection State ────────────────────────────────────────────────

export interface DataTableSelectionProps {
  readonly selectionMode?: SelectionMode;
  readonly selectedIds?: ReadonlySet<RowId>;
  readonly defaultSelectedIds?: ReadonlySet<RowId>;
  readonly onSelectionChange?: (ids: ReadonlySet<RowId>) => void;
}

// ─── Filter State ───────────────────────────────────────────────────

/**
/**
 * Filter passthrough shape on `DataTableRootProps`. Consumers can drive
 * filtering entirely from outside (server-controlled) or let the built-in
 * `useFilterState` manage it internally (uncontrolled with defaults).
 */
export interface DataTableFilterProps {
  readonly filterState?: FilterState;
  readonly defaultFilterState?: FilterState;
  readonly onFilterStateChange?: (state: FilterState) => void;
}

// ─── DataTable Props ────────────────────────────────────────────────

export interface DataTableRootProps<TRow>
  extends DataTableSortProps, DataTableSelectionProps, DataTableFilterProps {
  readonly data: readonly TRow[];
  readonly columns: readonly DataTableColumnDef<TRow>[];
  readonly getRowId: (row: TRow) => RowId;

  readonly emptyState?: ReactNode;
  /** Shown when active filters remove every row. Falls back to `emptyState`. */
  readonly filteredEmptyState?: ReactNode;
  readonly loading?: boolean;

  /** Stable ID exposed on the table element for `aria-controls` linkage from external filter widgets. */
  readonly id?: string;
  readonly className?: string;
  readonly children?: ReactNode;
}

// ─── DataTable Context ──────────────────────────────────────────────

export interface DataTableContextValue<TRow> {
  readonly data: readonly TRow[];
  readonly columns: readonly DataTableColumnDef<TRow>[];
  readonly getRowId: (row: TRow) => RowId;
  readonly sort: SortState | undefined;
  readonly onSortChange: (sort: SortState | undefined) => void;
  readonly selectionMode: SelectionMode;
  readonly selectedIds: ReadonlySet<RowId>;
  readonly onSelectionChange: (ids: ReadonlySet<RowId>) => void;
  readonly loading: boolean;
}
