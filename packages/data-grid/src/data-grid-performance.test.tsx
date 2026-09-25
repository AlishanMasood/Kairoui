import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { createElement } from "react";
import type { RowId } from "@kairoui/core/components";
import { DataGrid } from "./data-grid";
import type { DataGridColumnDef } from "./column-types";

interface Row {
  readonly id: string;
  readonly a: number;
  readonly b: string;
  readonly c: number;
  readonly d: string;
}

const cols: readonly DataGridColumnDef<Row>[] = [
  { id: "a", header: "A", accessorKey: "a" },
  { id: "b", header: "B", accessorKey: "b" },
  { id: "c", header: "C", accessorKey: "c" },
  { id: "d", header: "D", accessorKey: "d" },
];

const getRowId = (row: Row): RowId => row.id;

function makeRows(n: number): readonly Row[] {
  const out: Row[] = [];
  for (let i = 0; i < n; i++) {
    out.push({ id: String(i), a: i, b: `b${String(i)}`, c: i * 2, d: `d${String(i)}` });
  }
  return out;
}

describe("DataGrid — performance", () => {
  it("mounts a virtualized 2k-row grid without rendering every row", () => {
    const rows = makeRows(2_000);
    const start = performance.now();
    const { container, unmount } = render(
      createElement(DataGrid<Row>, {
        data: rows,
        columns: cols,
        getRowId,
        virtualized: true,
        rowHeight: 40,
        virtualScrollHeight: 200,
      }),
    );
    const elapsed = performance.now() - start;
    const leaves = container.querySelectorAll('[data-kui-row-kind="leaf"]');
    // Only viewport-worth of rows should render, not all 2k.
    expect(leaves.length).toBeLessThan(50);
    // Loose budget — this is a smoke check, not a benchmark.
    expect(elapsed).toBeLessThan(3000);
    unmount();
  });

  it("virtualized DOM row count grows sub-linearly with data size", () => {
    const smallLeaves = countLeaves(makeRows(500));
    const bigLeaves = countLeaves(makeRows(2_000));
    // Fixed viewport → both should render roughly the same number of rows.
    expect(bigLeaves).toBeLessThan(smallLeaves + 10);
  });

  it("a non-virtualized 200-row grid renders every row in a reasonable time", () => {
    const rows = makeRows(200);
    const start = performance.now();
    const { container, unmount } = render(
      createElement(DataGrid<Row>, {
        data: rows,
        columns: cols,
        getRowId,
      }),
    );
    const elapsed = performance.now() - start;
    const leaves = container.querySelectorAll('[data-kui-row-kind="leaf"]');
    expect(leaves.length).toBe(200);
    expect(elapsed).toBeLessThan(3000);
    unmount();
  });
});

function countLeaves(rows: readonly Row[]): number {
  const { container, unmount } = render(
    createElement(DataGrid<Row>, {
      data: rows,
      columns: cols,
      getRowId,
      virtualized: true,
      rowHeight: 40,
      virtualScrollHeight: 200,
    }),
  );
  const n = container.querySelectorAll('[data-kui-row-kind="leaf"]').length;
  unmount();
  return n;
}
