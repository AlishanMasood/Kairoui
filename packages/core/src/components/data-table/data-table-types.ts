import type { ReactNode } from "react";
import type {
  RowId,
  SortDirection,
  SortState,
  SelectionMode,
  ColumnAlign,
} from "../data/data-types";

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

// ─── DataTable Props ────────────────────────────────────────────────

export interface DataTableRootProps<TRow> extends DataTableSortProps, DataTableSelectionProps {
  readonly data: readonly TRow[];
  readonly columns: readonly DataTableColumnDef<TRow>[];
  readonly getRowId: (row: TRow) => RowId;

  readonly emptyState?: ReactNode;
  readonly loading?: boolean;

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
