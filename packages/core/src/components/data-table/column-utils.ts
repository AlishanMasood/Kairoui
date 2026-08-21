import type { ReactNode } from "react";
import type { ColumnAlign } from "../data/data-types";
import type { DataTableColumnDef } from "./data-table-types";

// ─── Column helper ──────────────────────────────────────────────────

/** Creates a type-safe column definition. Identity function for inference. */
export function column<TRow>(def: DataTableColumnDef<TRow>): DataTableColumnDef<TRow> {
  return def;
}

/** Creates an array of type-safe column definitions. */
export function columns<TRow>(
  defs: readonly DataTableColumnDef<TRow>[],
): readonly DataTableColumnDef<TRow>[] {
  return defs;
}

// ─── Accessor resolution ────────────────────────────────────────────

/** Resolves the cell value from a row using the column's accessor. */
export function getCellValue<TRow>(col: DataTableColumnDef<TRow>, row: TRow): unknown {
  if (col.accessorFn) {
    return col.accessorFn(row);
  }
  if (col.accessorKey) {
    return row[col.accessorKey];
  }
  return undefined;
}

/** Resolves the rendered header content from a column definition. */
export function getHeaderContent<TRow>(col: DataTableColumnDef<TRow>): ReactNode {
  if (typeof col.header === "function") {
    return col.header();
  }
  return col.header;
}

/** Resolves the rendered cell content from a column definition and row. */
export function getCellContent<TRow>(col: DataTableColumnDef<TRow>, row: TRow): ReactNode {
  const value = getCellValue(col, row);
  if (col.cell) {
    return col.cell(value, row);
  }
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return JSON.stringify(value);
}

// ─── Column lookup ──────────────────────────────────────────────────

/** Build a map from column ID to column definition for O(1) lookups. */
export function buildColumnMap<TRow>(
  cols: readonly DataTableColumnDef<TRow>[],
): ReadonlyMap<string, DataTableColumnDef<TRow>> {
  const map = new Map<string, DataTableColumnDef<TRow>>();
  for (const col of cols) {
    map.set(col.id, col);
  }
  return map;
}

/** Get the alignment for a column, defaulting to "start". */
export function getColumnAlign<TRow>(col: DataTableColumnDef<TRow>): ColumnAlign {
  return col.align ?? "start";
}
