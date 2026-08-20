import { describe, it, expectTypeOf } from "vitest";
import type {
  TableRootProps,
  TableCaptionRootProps,
  TableHeaderRootProps,
  TableBodyRootProps,
  TableFooterRootProps,
  TableRowRootProps,
  TableHeadRootProps,
  TableCellRootProps,
  TableProps,
  TableHeadProps,
  TableCellProps,
  TableRowProps,
} from "./table-types";
import type { ColumnAlign, SortDirection } from "../data/data-types";

// ─── Anatomy ────────────────────────────────────────────────────────

describe("Table architecture: anatomy", () => {
  it("TableRootProps has children and className", () => {
    expectTypeOf<TableRootProps>().toHaveProperty("children");
    expectTypeOf<TableRootProps>().toHaveProperty("className");
  });

  it("TableCaptionRootProps has children", () => {
    expectTypeOf<TableCaptionRootProps>().toHaveProperty("children");
  });

  it("TableHeaderRootProps has children", () => {
    expectTypeOf<TableHeaderRootProps>().toHaveProperty("children");
  });

  it("TableBodyRootProps has children", () => {
    expectTypeOf<TableBodyRootProps>().toHaveProperty("children");
  });

  it("TableFooterRootProps has children", () => {
    expectTypeOf<TableFooterRootProps>().toHaveProperty("children");
  });
});

// ─── Row state ──────────────────────────────────────────────────────

describe("Table architecture: row state", () => {
  it("TableRowRootProps supports selected", () => {
    expectTypeOf<TableRowRootProps>().toHaveProperty("selected");
    expectTypeOf<TableRowRootProps["selected"]>().toEqualTypeOf<boolean | undefined>();
  });
});

// ─── Header cell ────────────────────────────────────────────────────

describe("Table architecture: header cell", () => {
  it("TableHeadRootProps supports alignment", () => {
    expectTypeOf<TableHeadRootProps>().toHaveProperty("align");
    expectTypeOf<TableHeadRootProps["align"]>().toEqualTypeOf<ColumnAlign | undefined>();
  });

  it("TableHeadRootProps supports sort metadata", () => {
    expectTypeOf<TableHeadRootProps>().toHaveProperty("sortDirection");
    expectTypeOf<TableHeadRootProps["sortDirection"]>().toEqualTypeOf<SortDirection | undefined>();
    expectTypeOf<TableHeadRootProps>().toHaveProperty("onSort");
  });
});

// ─── Data cell ──────────────────────────────────────────────────────

describe("Table architecture: data cell", () => {
  it("TableCellRootProps supports alignment", () => {
    expectTypeOf<TableCellRootProps>().toHaveProperty("align");
    expectTypeOf<TableCellRootProps["align"]>().toEqualTypeOf<ColumnAlign | undefined>();
  });
});

// ─── HTML attribute merging ─────────────────────────────────────────

describe("Table architecture: HTML attributes", () => {
  it("TableProps includes native table attributes", () => {
    expectTypeOf<TableProps>().toHaveProperty("id");
    expectTypeOf<TableProps>().toHaveProperty("role");
    expectTypeOf<TableProps>().toHaveProperty("aria-label");
  });

  it("TableHeadProps includes th-specific attributes", () => {
    expectTypeOf<TableHeadProps>().toHaveProperty("scope");
    expectTypeOf<TableHeadProps>().toHaveProperty("colSpan");
    expectTypeOf<TableHeadProps>().toHaveProperty("rowSpan");
  });

  it("TableCellProps includes td-specific attributes", () => {
    expectTypeOf<TableCellProps>().toHaveProperty("colSpan");
    expectTypeOf<TableCellProps>().toHaveProperty("rowSpan");
  });

  it("TableRowProps includes native tr attributes", () => {
    expectTypeOf<TableRowProps>().toHaveProperty("id");
    expectTypeOf<TableRowProps>().toHaveProperty("className");
  });
});
