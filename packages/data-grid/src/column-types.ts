import type { ReactNode } from "react";
import type {
  ColumnFilter,
  DataTableColumnDef,
  FilterState,
  SortDirection,
  SortState,
} from "@kairoui/core/components";

// ─── Column identity ───────────────────────────────────────────────

/** Column identifier — alias for clarity in public API surfaces. */
export type DataGridColumnId = string;

/** Pinned side for a column. `null` at the runtime layer means "unpinned / center". */
export type ColumnPinSide = "left" | "right";

// ─── Slice types ───────────────────────────────────────────────────

export interface ColumnPinning {
  readonly left: readonly string[];
  readonly right: readonly string[];
}

/** Column ID → width in CSS pixels. Missing keys resolve to column def defaults. */
export type ColumnSizing = Readonly<Record<string, number>>;

/** Column ID → visible. Missing keys resolve to `true` (visible). */
export type ColumnVisibility = Readonly<Record<string, boolean>>;

/** Canonical column order — a permutation of the column IDs declared on the grid. */
export type ColumnOrder = readonly string[];

// ─── Aggregation ───────────────────────────────────────────────────

/** Built-in aggregation reducer keys. Extend behavior via a function reducer. */
export type AggregationBuiltin = "sum" | "avg" | "min" | "max" | "count" | "countUnique";

/**
 * Custom reducer. Receives raw cell values and the full row objects so
 * consumers can aggregate over multiple fields per row when needed.
 */
export type AggregationFn<TRow> = (values: readonly unknown[], rows: readonly TRow[]) => unknown;

export type AggregationReducer<TRow> = AggregationBuiltin | AggregationFn<TRow>;

export interface AggregationSpec<TRow> {
  readonly reducer: AggregationReducer<TRow>;
  /** When `true`, the aggregate is included in the grand-total footer row. */
  readonly footer?: boolean;
  readonly formatter?: (value: unknown) => ReactNode;
}

// ─── Editing ───────────────────────────────────────────────────────

export type ValidationResult =
  { readonly ok: true } | { readonly ok: false; readonly message?: string };

export interface EditCellRenderContext<TRow> {
  readonly row: TRow;
  readonly columnId: string;
  readonly rawInput: unknown;
  readonly setInput: (next: unknown) => void;
  readonly commit: () => void;
  readonly cancel: () => void;
  readonly validation: ValidationResult;
}

export type EditCellRenderer<TRow> = (ctx: EditCellRenderContext<TRow>) => ReactNode;

// ─── Column metadata ───────────────────────────────────────────────

/** Free-form metadata bag on a column definition. Not read by DataGrid itself. */
export type ColumnMetadata = Readonly<Record<string, unknown>>;

// ─── Column definition ────────────────────────────────────────────

/**
 * Column definition for `@kairoui-pro/data-grid`. Extends the free-tier
 * `DataTableColumnDef<TRow>` so DataTable columns migrate by import swap
 * plus optional widening.
 *
 * `TRow` inference flows from the columns array. Cell values remain
 * `unknown` in the public contract (matches the DataTable shape and keeps
 * the type checker off the hot path).
 */
export interface DataGridColumnDef<TRow> extends DataTableColumnDef<TRow> {
  // ─── Sizing ─────────────────────────────────────────────────────
  readonly width?: number;
  readonly minWidth?: number;
  readonly maxWidth?: number;
  readonly defaultWidth?: number;
  readonly resizable?: boolean;

  // ─── Reorder / pin / visibility ──────────────────────────────────
  readonly reorderable?: boolean;
  readonly pinnable?: boolean;
  readonly hideable?: boolean;

  // ─── Multi-sort ─────────────────────────────────────────────────
  readonly sortFn?: (a: TRow, b: TRow) => number;

  // ─── Filter (server hint) ───────────────────────────────────────
  readonly filterMode?: "client" | "server";

  // ─── Grouping / aggregation ─────────────────────────────────────
  readonly groupable?: boolean;
  readonly groupFn?: (row: TRow) => string | number;
  readonly aggregate?: AggregationSpec<TRow>;

  // ─── Editing ────────────────────────────────────────────────────
  readonly editable?: boolean;
  readonly editCell?: EditCellRenderer<TRow>;
  readonly parseEdit?: (input: unknown, row: TRow) => unknown;
  readonly validateEdit?: (input: unknown, row: TRow) => ValidationResult;

  // ─── Export ─────────────────────────────────────────────────────
  readonly exportValue?: (row: TRow) => unknown;

  // ─── Metadata ───────────────────────────────────────────────────
  readonly meta?: ColumnMetadata;
}

// ─── State ─────────────────────────────────────────────────────────

/**
 * Column state slice — the authoritative record of column-scoped mutable
 * concerns (sizing, ordering, visibility, pinning). Sort and filter live
 * outside this slice because they are consumed by the row-model pipeline
 * and modelled by the existing `@kairoui/core` state helpers; the
 * `getColumnRuntime` selector projects them onto a per-column snapshot.
 */
export interface ColumnState {
  readonly order: ColumnOrder;
  readonly pinned: ColumnPinning;
  readonly sizing: ColumnSizing;
  readonly visibility: ColumnVisibility;
}

/** Optional overrides for `initialColumnState` / `resetColumnState`. */
export interface ColumnStateInitOptions {
  readonly order?: ColumnOrder;
  readonly pinning?: ColumnPinning;
  readonly sizing?: ColumnSizing;
  readonly visibility?: ColumnVisibility;
  readonly defaultColumnWidth?: number;
}

/**
 * Materialized per-column snapshot. Not stored — produced on demand by
 * `getColumnRuntime` so the reducer never has to keep sort/filter and
 * the raw slices in sync.
 */
export interface ColumnRuntime {
  readonly id: string;
  readonly width: number;
  readonly hidden: boolean;
  readonly pinned: ColumnPinSide | null;
  readonly orderIndex: number;
  readonly sortIndex: number | null;
  readonly sortDirection: SortDirection | null;
  readonly filter: ColumnFilter | null;
}

/** Extra state that sits outside `ColumnState` but participates in the runtime projection. */
export interface ColumnRuntimeContext {
  readonly sort?: readonly SortState[];
  readonly filterState?: FilterState;
}

/** Grouped visible column IDs partitioned by pin side. */
export interface PinnedColumnGroups {
  readonly left: readonly string[];
  readonly center: readonly string[];
  readonly right: readonly string[];
}
