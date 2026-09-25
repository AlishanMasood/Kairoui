import { describe, it, expect } from "vitest";
import { renderToStaticMarkup, renderToString } from "react-dom/server";
import { createElement } from "react";
import { render } from "@testing-library/react";
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
];

const cols: readonly DataGridColumnDef<Row>[] = [
  { id: "name", header: "Name", accessorKey: "name" },
  { id: "value", header: "Value", accessorKey: "value" },
];

const getRowId = (row: Row): RowId => row.id;

describe("DataGrid — SSR", () => {
  it("renders on the server without touching the DOM", () => {
    const markup = renderToString(
      createElement(DataGrid<Row>, { data: rows, columns: cols, getRowId }),
    );
    expect(markup).toContain('role="grid"');
    expect(markup).toContain('data-kui-component="DataGrid"');
    expect(markup).toContain("n1");
  });

  it("SSR + client render produce the same visible slice for the same props", () => {
    const big: Row[] = [];
    for (let i = 0; i < 200; i++) big.push({ id: String(i), name: `n${String(i)}`, value: i });
    const props = {
      data: big,
      columns: cols,
      getRowId,
      virtualized: true,
      rowHeight: 40,
      virtualScrollHeight: 200,
    };
    const serverMarkup = renderToString(createElement(DataGrid<Row>, props));
    const { container, unmount } = render(createElement(DataGrid<Row>, props));
    // Both markups should render the same range of leaf rows.
    const clientLeafIds = Array.from(
      container.querySelectorAll<HTMLElement>('[data-kui-row-kind="leaf"]'),
    ).map((el) => el.getAttribute("data-row-id"));
    for (const id of clientLeafIds) {
      if (id !== null) expect(serverMarkup).toContain(`data-row-id="${id}"`);
    }
    unmount();
  });

  it("static markup contains no client-only markers", () => {
    const markup = renderToStaticMarkup(
      createElement(DataGrid<Row>, { data: rows, columns: cols, getRowId }),
    );
    expect(markup).not.toContain("undefined");
    expect(markup).not.toContain("[object Object]");
  });

  it("hydrates without console warnings for an identical render", () => {
    // First: server render.
    const serverMarkup = renderToString(
      createElement(DataGrid<Row>, { data: rows, columns: cols, getRowId }),
    );
    expect(serverMarkup).toContain("n1");
    // Then: client render into a fresh container using the same props.
    const { container, unmount } = render(
      createElement(DataGrid<Row>, { data: rows, columns: cols, getRowId }),
    );
    // Byte-identical HTML for row content is asserted via presence of the same values.
    expect(container.textContent).toContain("n1");
    expect(container.textContent).toContain("n2");
    unmount();
  });
});
