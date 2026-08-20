import type { ReactNode } from "react";

// ─── Shared Data Concepts ───────────────────────────────────────────

/** Row identity: consumer provides a stable key per data item. */
export type RowId = string | number;

/** Sort direction for columns. */
export type SortDirection = "ascending" | "descending";

/** Sort state for a single column. */
export interface SortState {
  readonly columnId: string;
  readonly direction: SortDirection;
}

/** Selection mode for data components. */
export type SelectionMode = "none" | "single" | "multiple";

/** Expansion state for hierarchical data (tree, grouped rows). */
export interface ExpansionState {
  readonly expandedIds: ReadonlySet<RowId>;
}

// ─── Column Definitions ─────────────────────────────────────────────

/** Alignment for column content. */
export type ColumnAlign = "start" | "center" | "end";

/** Column definition for DataTable. Generic over the row data type. */
export interface ColumnDef<TRow> {
  readonly id: string;
  readonly header: ReactNode | (() => ReactNode);
  readonly accessorKey?: keyof TRow & string;
  readonly accessorFn?: (row: TRow) => unknown;
  readonly cell?: (value: unknown, row: TRow) => ReactNode;
  readonly sortable?: boolean;
  readonly align?: ColumnAlign;
}

// ─── Hierarchical Data ──────────────────────────────────────────────

/** Node identity in a hierarchical (tree) structure. */
export interface TreeNodeMeta {
  readonly id: RowId;
  readonly parentId: RowId | null;
  readonly depth: number;
  readonly hasChildren: boolean;
}

// ─── Calendar ───────────────────────────────────────────────────────

/** Calendar day metadata produced by the calendar grid model. */
export interface CalendarDay {
  readonly date: Date;
  readonly day: number;
  readonly isToday: boolean;
  readonly isOutsideMonth: boolean;
  readonly isDisabled: boolean;
  readonly isSelected: boolean;
}

/** Calendar week: array of 7 days. */
export type CalendarWeek = readonly CalendarDay[];

// ─── List ───────────────────────────────────────────────────────────

export type ListVariant = "unordered" | "ordered";

export interface ListProps {
  readonly variant?: ListVariant;
  readonly children?: ReactNode;
  readonly className?: string;
}

export interface ListItemProps {
  readonly children?: ReactNode;
  readonly className?: string;
}

// ─── DescriptionList ────────────────────────────────────────────────

export type DescriptionListLayout = "vertical" | "horizontal";

export interface DescriptionListProps {
  readonly layout?: DescriptionListLayout;
  readonly children?: ReactNode;
  readonly className?: string;
}

export interface DescriptionTermProps {
  readonly children?: ReactNode;
  readonly className?: string;
}

export interface DescriptionDetailsProps {
  readonly children?: ReactNode;
  readonly className?: string;
}

// ─── EmptyState ─────────────────────────────────────────────────────

export interface EmptyStateProps {
  readonly children?: ReactNode;
  readonly className?: string;
}

export interface EmptyStateTitleProps {
  readonly children?: ReactNode;
  readonly className?: string;
}

export interface EmptyStateDescriptionProps {
  readonly children?: ReactNode;
  readonly className?: string;
}

export interface EmptyStateIconProps {
  readonly children?: ReactNode;
  readonly className?: string;
}

export interface EmptyStateActionsProps {
  readonly children?: ReactNode;
  readonly className?: string;
}

// ─── Table (Presentation) ───────────────────────────────────────────

export interface TableProps {
  readonly children?: ReactNode;
  readonly className?: string;
}

export interface TableCaptionProps {
  readonly children?: ReactNode;
  readonly className?: string;
}

export interface TableHeaderProps {
  readonly children?: ReactNode;
  readonly className?: string;
}

export interface TableBodyProps {
  readonly children?: ReactNode;
  readonly className?: string;
}

export interface TableFooterProps {
  readonly children?: ReactNode;
  readonly className?: string;
}

export interface TableRowProps {
  readonly selected?: boolean;
  readonly children?: ReactNode;
  readonly className?: string;
}

export interface TableHeadProps {
  readonly align?: ColumnAlign;
  readonly sortDirection?: SortDirection;
  readonly onSort?: () => void;
  readonly children?: ReactNode;
  readonly className?: string;
}

export interface TableCellProps {
  readonly align?: ColumnAlign;
  readonly children?: ReactNode;
  readonly className?: string;
}

// ─── DataTable (Stateful) ───────────────────────────────────────────

export interface DataTableProps<TRow> {
  readonly data: readonly TRow[];
  readonly columns: readonly ColumnDef<TRow>[];
  readonly getRowId: (row: TRow) => RowId;
  readonly sort?: SortState;
  readonly defaultSort?: SortState;
  readonly onSortChange?: (sort: SortState | undefined) => void;
  readonly selectionMode?: SelectionMode;
  readonly selectedIds?: ReadonlySet<RowId>;
  readonly defaultSelectedIds?: ReadonlySet<RowId>;
  readonly onSelectionChange?: (ids: ReadonlySet<RowId>) => void;
  readonly emptyState?: ReactNode;
  readonly loading?: boolean;
  readonly children?: ReactNode;
  readonly className?: string;
}

// ─── TreeView ───────────────────────────────────────────────────────

export interface TreeViewProps {
  readonly expandedIds?: ReadonlySet<RowId>;
  readonly defaultExpandedIds?: ReadonlySet<RowId>;
  readonly onExpandedChange?: (ids: ReadonlySet<RowId>) => void;
  readonly selectionMode?: SelectionMode;
  readonly selectedIds?: ReadonlySet<RowId>;
  readonly defaultSelectedIds?: ReadonlySet<RowId>;
  readonly onSelectionChange?: (ids: ReadonlySet<RowId>) => void;
  readonly dir?: "ltr" | "rtl";
  readonly children?: ReactNode;
  readonly className?: string;
}

export interface TreeViewItemProps {
  readonly value: string;
  readonly disabled?: boolean;
  readonly children?: ReactNode;
  readonly className?: string;
}

export interface TreeViewItemTriggerProps {
  readonly children?: ReactNode;
  readonly className?: string;
}

export interface TreeViewItemContentProps {
  readonly children?: ReactNode;
  readonly className?: string;
}

// ─── Timeline ───────────────────────────────────────────────────────

export type TimelineOrientation = "vertical" | "horizontal";

export interface TimelineProps {
  readonly orientation?: TimelineOrientation;
  readonly children?: ReactNode;
  readonly className?: string;
}

export interface TimelineItemProps {
  readonly children?: ReactNode;
  readonly className?: string;
}

export interface TimelineIndicatorProps {
  readonly children?: ReactNode;
  readonly className?: string;
}

export interface TimelineConnectorProps {
  readonly className?: string;
}

export interface TimelineContentProps {
  readonly children?: ReactNode;
  readonly className?: string;
}

export interface TimelineTitleProps {
  readonly children?: ReactNode;
  readonly className?: string;
}

export interface TimelineDescriptionProps {
  readonly children?: ReactNode;
  readonly className?: string;
}

// ─── Calendar ───────────────────────────────────────────────────────

export interface CalendarProps {
  readonly value?: Date;
  readonly defaultValue?: Date;
  readonly onValueChange?: (date: Date) => void;
  readonly min?: Date;
  readonly max?: Date;
  readonly disabled?: (date: Date) => boolean;
  readonly locale?: string;
  readonly weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  readonly dir?: "ltr" | "rtl";
  readonly children?: ReactNode;
  readonly className?: string;
}
