import { forwardRef, createElement } from "react";
import type {
  TableProps,
  TableCaptionProps,
  TableHeaderProps,
  TableBodyProps,
  TableFooterProps,
  TableRowProps,
  TableHeadProps,
  TableCellProps,
} from "./table-types";

// ─── Table (Root) ───────────────────────────────────────────────────

export const Table = forwardRef<HTMLTableElement, TableProps>(function Table(props, ref) {
  const { className, children, ...rest } = props;

  return createElement(
    "table",
    { ...rest, ref, "data-kui-component": "Table", className },
    children,
  );
});

// ─── Table.Caption ──────────────────────────────────────────────────

export const TableCaption = forwardRef<HTMLTableCaptionElement, TableCaptionProps>(
  function TableCaption(props, ref) {
    const { className, children, ...rest } = props;

    return createElement(
      "caption",
      { ...rest, ref, "data-kui-component": "TableCaption", className },
      children,
    );
  },
);

// ─── Table.Header ───────────────────────────────────────────────────

export const TableHeader = forwardRef<HTMLTableSectionElement, TableHeaderProps>(
  function TableHeader(props, ref) {
    const { className, children, ...rest } = props;

    return createElement(
      "thead",
      { ...rest, ref, "data-kui-component": "TableHeader", className },
      children,
    );
  },
);

// ─── Table.Body ─────────────────────────────────────────────────────

export const TableBody = forwardRef<HTMLTableSectionElement, TableBodyProps>(
  function TableBody(props, ref) {
    const { className, children, ...rest } = props;

    return createElement(
      "tbody",
      { ...rest, ref, "data-kui-component": "TableBody", className },
      children,
    );
  },
);

// ─── Table.Footer ───────────────────────────────────────────────────

export const TableFooter = forwardRef<HTMLTableSectionElement, TableFooterProps>(
  function TableFooter(props, ref) {
    const { className, children, ...rest } = props;

    return createElement(
      "tfoot",
      { ...rest, ref, "data-kui-component": "TableFooter", className },
      children,
    );
  },
);

// ─── Table.Row ──────────────────────────────────────────────────────

export const TableRow = forwardRef<HTMLTableRowElement, TableRowProps>(
  function TableRow(props, ref) {
    const { selected, className, children, ...rest } = props;

    return createElement(
      "tr",
      {
        ...rest,
        ref,
        "aria-selected": selected ?? undefined,
        "data-selected": selected || undefined,
        "data-kui-component": "TableRow",
        className,
      },
      children,
    );
  },
);

// ─── Table.Head ─────────────────────────────────────────────────────

function mapSortToAria(dir: "ascending" | "descending" | undefined): string | undefined {
  if (dir === "ascending") return "ascending";
  if (dir === "descending") return "descending";
  return undefined;
}

export const TableHead = forwardRef<HTMLTableCellElement, TableHeadProps>(
  function TableHead(props, ref) {
    const { align, sortDirection, onSort, style, className, children, ...rest } = props;

    const sortable = onSort !== undefined;

    return createElement(
      "th",
      {
        ...rest,
        ref,
        "aria-sort": mapSortToAria(sortDirection),
        "data-align": align ?? undefined,
        "data-sortable": sortable || undefined,
        "data-kui-component": "TableHead",
        className,
        ...(sortable
          ? {
              onClick: onSort,
              onKeyDown: (e: React.KeyboardEvent) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSort();
                }
              },
              tabIndex: 0,
              role: "columnheader",
              style: { cursor: "pointer", ...style },
            }
          : { style }),
      },
      children,
    );
  },
);

// ─── Table.Cell ─────────────────────────────────────────────────────

export const TableCell = forwardRef<HTMLTableCellElement, TableCellProps>(
  function TableCell(props, ref) {
    const { align, className, children, ...rest } = props;

    return createElement(
      "td",
      {
        ...rest,
        ref,
        "data-align": align ?? undefined,
        "data-kui-component": "TableCell",
        className,
      },
      children,
    );
  },
);
