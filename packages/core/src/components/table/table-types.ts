import type { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes, ReactNode } from "react";
import type { SortDirection, ColumnAlign } from "../data/data-types";

// ─── Table.Root ─────────────────────────────────────────────────────

export interface TableRootProps {
  className?: string;
  children?: ReactNode;
}

// ─── Table.Caption ──────────────────────────────────────────────────

export interface TableCaptionRootProps {
  className?: string;
  children?: ReactNode;
}

// ─── Table.Header ───────────────────────────────────────────────────

export interface TableHeaderRootProps {
  className?: string;
  children?: ReactNode;
}

// ─── Table.Body ─────────────────────────────────────────────────────

export interface TableBodyRootProps {
  className?: string;
  children?: ReactNode;
}

// ─── Table.Footer ───────────────────────────────────────────────────

export interface TableFooterRootProps {
  className?: string;
  children?: ReactNode;
}

// ─── Table.Row ──────────────────────────────────────────────────────

export interface TableRowRootProps {
  selected?: boolean;
  className?: string;
  children?: ReactNode;
}

// ─── Table.Head ─────────────────────────────────────────────────────

export interface TableHeadRootProps {
  align?: ColumnAlign;
  /** Current sort direction — sets aria-sort on the header cell. */
  sortDirection?: SortDirection;
  /** Called when user activates sort on this column. */
  onSort?: () => void;
  className?: string;
  children?: ReactNode;
}

// ─── Table.Cell ─────────────────────────────────────────────────────

export interface TableCellRootProps {
  align?: ColumnAlign;
  className?: string;
  children?: ReactNode;
}

// ─── Combined prop types for HTML merging ───────────────────────────

export type TableProps = TableRootProps & HTMLAttributes<HTMLTableElement>;
export type TableCaptionProps = TableCaptionRootProps & HTMLAttributes<HTMLTableCaptionElement>;
export type TableHeaderProps = TableHeaderRootProps & HTMLAttributes<HTMLTableSectionElement>;
export type TableBodyProps = TableBodyRootProps & HTMLAttributes<HTMLTableSectionElement>;
export type TableFooterProps = TableFooterRootProps & HTMLAttributes<HTMLTableSectionElement>;
export type TableRowProps = TableRowRootProps & HTMLAttributes<HTMLTableRowElement>;
export type TableHeadProps = TableHeadRootProps & ThHTMLAttributes<HTMLTableCellElement>;
export type TableCellProps = TableCellRootProps & TdHTMLAttributes<HTMLTableCellElement>;
