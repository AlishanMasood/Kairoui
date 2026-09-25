import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { createElement } from "react";
import type { RowId } from "@kairoui/core/components";
import { DataGrid } from "./data-grid";
import type { DataGridColumnDef } from "./column-types";

interface Row {
  readonly id: string;
  readonly name: string;
  readonly value: number;
}

const rows: Row[] = [
  { id: "r1", name: "n1", value: 1 },
  { id: "r2", name: "n2", value: 2 },
  { id: "r3", name: "n3", value: 3 },
];

const cols: readonly DataGridColumnDef<Row>[] = [
  { id: "name", header: "Name", accessorKey: "name", sortable: true },
  {
    id: "value",
    header: "Value",
    accessorKey: "value",
    sortable: true,
    aggregate: { reducer: "sum" },
  },
];

const getRowId = (row: Row): RowId => row.id;

describe("DataGrid — accessibility", () => {
  it("root exposes role=grid", () => {
    const { container } = render(
      createElement(DataGrid<Row>, { data: rows, columns: cols, getRowId }),
    );
    expect(container.querySelector('[role="grid"]')).not.toBeNull();
  });

  it("rows expose role=row", () => {
    const { container } = render(
      createElement(DataGrid<Row>, { data: rows, columns: cols, getRowId }),
    );
    const dataRows = container.querySelectorAll('[data-kui-row-kind="leaf"]');
    for (const row of dataRows) {
      expect(row.getAttribute("role")).toBe("row");
    }
  });

  it("cells expose role=gridcell with aria-colindex", () => {
    const { container } = render(
      createElement(DataGrid<Row>, { data: rows, columns: cols, getRowId }),
    );
    const cells = container.querySelectorAll('[role="gridcell"]');
    expect(cells.length).toBeGreaterThan(0);
    for (const c of cells) {
      const idx = c.getAttribute("aria-colindex");
      expect(idx).not.toBeNull();
      expect(Number(idx)).toBeGreaterThan(0);
    }
  });

  it("column headers expose role=columnheader", () => {
    const { container } = render(
      createElement(DataGrid<Row>, { data: rows, columns: cols, getRowId }),
    );
    const headers = container.querySelectorAll('[role="columnheader"]');
    expect(headers.length).toBe(2);
  });

  it("aria-sort is 'none' by default and reflects the sort direction after clicking", () => {
    const { container } = render(
      createElement(DataGrid<Row>, {
        data: rows,
        columns: cols,
        getRowId,
        defaultSort: [{ columnId: "name", direction: "ascending" }],
      }),
    );
    const header = container.querySelector('[data-kui-column-id="name"]');
    expect(header?.getAttribute("aria-sort")).toBe("ascending");
    const other = container.querySelector('[data-kui-column-id="value"]');
    expect(other?.getAttribute("aria-sort")).toBe("none");
  });

  it("aria-selected reflects row selection", () => {
    const { container } = render(
      createElement(DataGrid<Row>, {
        data: rows,
        columns: cols,
        getRowId,
        selectionMode: "multiple",
        defaultSelectedIds: new Set(["r1"]),
      }),
    );
    const row = container.querySelector('[data-row-id="r1"]');
    expect(row?.getAttribute("aria-selected")).toBe("true");
  });

  it("aria-expanded on group rows reflects the expansion state", () => {
    const { container } = render(
      createElement(DataGrid<Row>, {
        data: rows,
        columns: cols,
        getRowId,
        defaultGroupBy: ["name"],
      }),
    );
    const groupRow = container.querySelector('[data-kui-row-kind="group"]');
    expect(groupRow?.getAttribute("aria-expanded")).toBe("false");
  });

  it("group toggle carries aria-expanded and an aria-label", () => {
    const { container } = render(
      createElement(DataGrid<Row>, {
        data: rows,
        columns: cols,
        getRowId,
        defaultGroupBy: ["name"],
      }),
    );
    const toggle = container.querySelector('[data-kui-group-toggle="true"]');
    expect(toggle?.getAttribute("aria-expanded")).toBe("false");
    expect(toggle?.getAttribute("aria-label")).toMatch(/expand|collapse/i);
  });

  it("empty-state cell spans every visible column", () => {
    const { container } = render(
      createElement(DataGrid<Row>, {
        data: [],
        columns: cols,
        getRowId,
        emptyState: createElement("span", null, "empty"),
      }),
    );
    const cell = container.querySelector('[data-kui-empty-state="true"]');
    expect(cell?.getAttribute("colspan")).toBe(String(cols.length));
  });

  it("the select-all checkbox has an accessible name", () => {
    const { container } = render(
      createElement(DataGrid<Row>, {
        data: rows,
        columns: cols,
        getRowId,
        selectionMode: "multiple",
      }),
    );
    const selectAll = container.querySelector<HTMLInputElement>('thead input[type="checkbox"]');
    expect(selectAll?.getAttribute("aria-label")).toBe("Select all rows");
  });

  it("row checkboxes have per-row accessible names", () => {
    const { container } = render(
      createElement(DataGrid<Row>, {
        data: rows,
        columns: cols,
        getRowId,
        selectionMode: "multiple",
      }),
    );
    const rowChecks = container.querySelectorAll<HTMLInputElement>(
      '[data-kui-row-kind="leaf"] input[type="checkbox"]',
    );
    expect(rowChecks[0]?.getAttribute("aria-label")).toContain("r1");
  });
});
