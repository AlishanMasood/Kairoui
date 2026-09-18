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

// ─── Virtualization ─────────────────────────────────────────────────

/**
 * Opt-in row virtualization. When enabled, DataTable wraps its `<table>` in
 * an internal scroll container and renders only the rows currently in view.
 * Fixed row height only in v1 — variable heights are deferred.
 *
 * Accessibility: `aria-rowcount` reflects the total row count and each
 * rendered `<tr>` carries `aria-rowindex` matching its 1-based position in
 * the table. Focused rows scrolling out of view remain in the DOM until
 * focus moves. See `docs/architecture/PHASE13-VIRTUALIZATION-ARCHITECTURE.md`
 * for the full accessibility posture and limitations.
 */
export interface DataTableVirtualizationProps {
  /** Opt-in row virtualization. Default `false`. */
  readonly virtualized?: boolean;
  /** Required when `virtualized === true`. Fixed row height in CSS pixels. */
  readonly rowHeight?: number;
  /** Extra rows rendered above and below the viewport. Default `3`. */
  readonly overscan?: number;
  /**
   * Viewport height (CSS pixels) applied to the internal scroll container.
   * Optional — if omitted, the consumer must size the DataTable via CSS.
   */
  readonly virtualScrollHeight?: number;
}

// ─── DataTable Props ────────────────────────────────────────────────

export interface DataTableRootProps<TRow>
  extends
    DataTableSortProps,
    DataTableSelectionProps,
    DataTableFilterProps,
    DataTableVirtualizationProps {
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
