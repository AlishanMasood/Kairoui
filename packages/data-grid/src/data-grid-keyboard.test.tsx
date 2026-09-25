import { describe, it, expect } from "vitest";
import { act, fireEvent, render } from "@testing-library/react";
import { createElement } from "react";
import type { RowId } from "@kairoui/core/components";
import { DataGrid } from "./data-grid";
import type { DataGridColumnDef } from "./column-types";

interface Row {
  readonly id: string;
  readonly a: string;
  readonly b: string;
  readonly c: string;
}

const rows: Row[] = [
  { id: "r1", a: "a1", b: "b1", c: "c1" },
  { id: "r2", a: "a2", b: "b2", c: "c2" },
  { id: "r3", a: "a3", b: "b3", c: "c3" },
];

const cols: readonly DataGridColumnDef<Row>[] = [
  { id: "a", header: "A", accessorKey: "a" },
  { id: "b", header: "B", accessorKey: "b" },
  { id: "c", header: "C", accessorKey: "c" },
];

const getRowId = (row: Row): RowId => row.id;

function focusInitial(container: HTMLElement): HTMLElement {
  // First-cell seed: pressing ArrowDown on the grid with no focus.
  const grid = container.querySelector<HTMLElement>('[role="grid"]');
  if (!grid) throw new Error("no grid");
  grid.focus();
  fireEvent.keyDown(grid, { key: "ArrowDown" });
  const focused = container.querySelector<HTMLElement>(
    '[data-row-id="r1"] [data-kui-column-id="a"]',
  );
  if (!focused) throw new Error("initial focus target missing");
  return focused;
}

describe("DataGrid — keyboard navigation", () => {
  it("ArrowDown seeds focus at the top-left cell", () => {
    const { container } = render(
      createElement(DataGrid<Row>, { data: rows, columns: cols, getRowId }),
    );
    act(() => {
      focusInitial(container);
    });
    const cell = container.querySelector<HTMLElement>(
      '[data-row-id="r1"] [data-kui-column-id="a"]',
    );
    expect(cell?.getAttribute("tabindex")).toBe("0");
  });

  it("ArrowRight moves to the next column", () => {
    const { container } = render(
      createElement(DataGrid<Row>, { data: rows, columns: cols, getRowId }),
    );
    act(() => {
      focusInitial(container);
    });
    const grid = container.querySelector<HTMLElement>('[role="grid"]');
    if (!grid) throw new Error();
    act(() => {
      fireEvent.keyDown(grid, { key: "ArrowRight" });
    });
    const cell = container.querySelector<HTMLElement>(
      '[data-row-id="r1"] [data-kui-column-id="b"]',
    );
    expect(cell?.getAttribute("tabindex")).toBe("0");
  });

  it("ArrowDown moves down a row", () => {
    const { container } = render(
      createElement(DataGrid<Row>, { data: rows, columns: cols, getRowId }),
    );
    act(() => {
      focusInitial(container);
    });
    const grid = container.querySelector<HTMLElement>('[role="grid"]');
    if (!grid) throw new Error();
    act(() => {
      fireEvent.keyDown(grid, { key: "ArrowDown" });
    });
    const cell = container.querySelector<HTMLElement>(
      '[data-row-id="r2"] [data-kui-column-id="a"]',
    );
    expect(cell?.getAttribute("tabindex")).toBe("0");
  });

  it("Home snaps to first column; Ctrl+Home to top-left; End to last; Ctrl+End to bottom-right", () => {
    const { container } = render(
      createElement(DataGrid<Row>, { data: rows, columns: cols, getRowId }),
    );
    act(() => {
      focusInitial(container);
    });
    const grid = container.querySelector<HTMLElement>('[role="grid"]') as HTMLElement;
    act(() => {
      fireEvent.keyDown(grid, { key: "ArrowRight" });
    });
    act(() => {
      fireEvent.keyDown(grid, { key: "ArrowDown" });
    });
    act(() => {
      fireEvent.keyDown(grid, { key: "Home" });
    });
    expect(
      container
        .querySelector<HTMLElement>('[data-row-id="r2"] [data-kui-column-id="a"]')
        ?.getAttribute("tabindex"),
    ).toBe("0");
    act(() => {
      fireEvent.keyDown(grid, { key: "End" });
    });
    expect(
      container
        .querySelector<HTMLElement>('[data-row-id="r2"] [data-kui-column-id="c"]')
        ?.getAttribute("tabindex"),
    ).toBe("0");
    act(() => {
      fireEvent.keyDown(grid, { key: "Home", ctrlKey: true });
    });
    expect(
      container
        .querySelector<HTMLElement>('[data-row-id="r1"] [data-kui-column-id="a"]')
        ?.getAttribute("tabindex"),
    ).toBe("0");
    act(() => {
      fireEvent.keyDown(grid, { key: "End", ctrlKey: true });
    });
    expect(
      container
        .querySelector<HTMLElement>('[data-row-id="r3"] [data-kui-column-id="c"]')
        ?.getAttribute("tabindex"),
    ).toBe("0");
  });

  it("Space toggles row selection when selectionMode is set", () => {
    const { container } = render(
      createElement(DataGrid<Row>, {
        data: rows,
        columns: cols,
        getRowId,
        selectionMode: "multiple",
      }),
    );
    act(() => {
      focusInitial(container);
    });
    const grid = container.querySelector<HTMLElement>('[role="grid"]') as HTMLElement;
    act(() => {
      fireEvent.keyDown(grid, { key: " " });
    });
    const rowCheck = container.querySelector<HTMLInputElement>(
      '[data-row-id="r1"] input[type="checkbox"]',
    );
    expect(rowCheck?.checked).toBe(true);
  });

  it("RTL inverts ArrowLeft / ArrowRight semantics", () => {
    const { container } = render(
      createElement(DataGrid<Row>, {
        data: rows,
        columns: cols,
        getRowId,
        dir: "rtl",
      }),
    );
    act(() => {
      focusInitial(container);
    });
    const grid = container.querySelector<HTMLElement>('[role="grid"]') as HTMLElement;
    // In RTL, ArrowLeft moves toward the visual end == next column ("b").
    act(() => {
      fireEvent.keyDown(grid, { key: "ArrowLeft" });
    });
    expect(
      container
        .querySelector<HTMLElement>('[data-row-id="r1"] [data-kui-column-id="b"]')
        ?.getAttribute("tabindex"),
    ).toBe("0");
  });

  it("only one cell has tabindex=0 at a time (roving)", () => {
    const { container } = render(
      createElement(DataGrid<Row>, { data: rows, columns: cols, getRowId }),
    );
    act(() => {
      focusInitial(container);
    });
    const focused = container.querySelectorAll<HTMLElement>('[tabindex="0"]');
    // Grid may have additional focusable elements (buttons, checkboxes)
    // but only ONE gridcell should carry tabindex=0.
    const focusedCells = container.querySelectorAll<HTMLElement>('[role="gridcell"][tabindex="0"]');
    expect(focusedCells.length).toBe(1);
    expect(focused.length).toBeGreaterThanOrEqual(1);
  });
});
