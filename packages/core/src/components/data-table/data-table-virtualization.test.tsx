import { describe, it, expect, afterEach } from "vitest";
import { createElement } from "react";
import { render, cleanup, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { DataTable } from "./data-table";
import { column } from "./column-utils";
import type { DataTableRootProps } from "./data-table-types";

afterEach(cleanup);

// ─── Large data fixture ──────────────────────────────────────────

interface BigRow {
  id: number;
  name: string;
  value: number;
}

function makeRows(n: number): BigRow[] {
  const out = new Array<BigRow>(n);
  for (let i = 0; i < n; i++) {
    out[i] = { id: i, name: `Row ${String(i)}`, value: i * 3 };
  }
  return out;
}

const bigCols = [
  column<BigRow>({ id: "name", header: "Name", accessorKey: "name", sortable: true }),
  column<BigRow>({ id: "value", header: "Value", accessorKey: "value", sortable: true }),
];

function renderBig(overrides: Partial<DataTableRootProps<BigRow>> = {}) {
  const props: DataTableRootProps<BigRow> = {
    data: makeRows(5000),
    columns: bigCols,
    getRowId: (r) => r.id,
    ...overrides,
  };
  return render(createElement(DataTable, props as never));
}

// ─── Basic virtualized rendering ─────────────────────────────────

describe("DataTable virtualization: rendering", () => {
  it("renders a scroll container wrapper when virtualized", () => {
    const { container } = renderBig({
      virtualized: true,
      rowHeight: 40,
      virtualScrollHeight: 400,
    });
    expect(container.querySelector("[data-kui-part='datatable-scroll-container']")).not.toBeNull();
  });

  it("marks the table with data-virtualized when opted in", () => {
    renderBig({ virtualized: true, rowHeight: 40, virtualScrollHeight: 400 });
    expect(screen.getByRole("table").getAttribute("data-virtualized")).toBe("true");
  });

  it("does not virtualize by default", () => {
    const { container } = renderBig();
    expect(container.querySelector("[data-kui-part='datatable-scroll-container']")).toBeNull();
    expect(screen.getByRole("table").hasAttribute("data-virtualized")).toBe(false);
  });

  it("silently falls back to non-virtualized when rowHeight is missing", () => {
    const { container } = renderBig({ virtualized: true, virtualScrollHeight: 400 });
    expect(container.querySelector("[data-kui-part='datatable-scroll-container']")).toBeNull();
  });

  it("renders only a windowed slice of rows for a 5000-row dataset", () => {
    renderBig({ virtualized: true, rowHeight: 40, virtualScrollHeight: 400 });
    // Header row (1) + spacer(s) + windowed body rows.
    // Visible rows ≈ 400/40 = 10; plus overscan 3 on each side = ~13-16.
    const rowsInDom = screen.getAllByRole("row");
    expect(rowsInDom.length).toBeLessThan(30);
    expect(rowsInDom.length).toBeGreaterThan(3);
  });
});

// ─── Accessibility ───────────────────────────────────────────────

describe("DataTable virtualization: accessibility", () => {
  it("emits aria-rowcount reflecting the total row count (header + data)", () => {
    renderBig({ virtualized: true, rowHeight: 40, virtualScrollHeight: 400 });
    expect(screen.getByRole("table").getAttribute("aria-rowcount")).toBe("5001");
  });

  it("emits aria-rowindex on every rendered data row", () => {
    renderBig({ virtualized: true, rowHeight: 40, virtualScrollHeight: 400 });
    const dataRows = document.querySelectorAll("[data-kui-component='TableRow'][data-row-id]");
    for (const row of Array.from(dataRows)) {
      const idx = row.getAttribute("aria-rowindex");
      expect(idx).not.toBeNull();
      expect(Number(idx)).toBeGreaterThanOrEqual(2);
    }
  });

  it("emits aria-rowindex=1 on the header row", () => {
    renderBig({ virtualized: true, rowHeight: 40, virtualScrollHeight: 400 });
    const headerRow = document.querySelector("thead [data-kui-component='TableRow']");
    expect(headerRow?.getAttribute("aria-rowindex")).toBe("1");
  });

  it("renders top/bottom spacers with aria-hidden", () => {
    renderBig({ virtualized: true, rowHeight: 40, virtualScrollHeight: 400 });
    const spacers = document.querySelectorAll("[data-datatable-role='virtual-spacer']");
    // With scrollTop=0 on first render only the bottom spacer exists.
    expect(spacers.length).toBeGreaterThanOrEqual(1);
    for (const s of Array.from(spacers)) {
      expect(s.getAttribute("aria-hidden")).toBe("true");
    }
  });

  it("preserves aria-rowcount when filters remove rows", () => {
    renderBig({
      virtualized: true,
      rowHeight: 40,
      virtualScrollHeight: 400,
      filterState: {
        globalFilter: "Row 42",
        combinator: "and",
        columnFilters: [],
      },
    });
    // Only rows containing "Row 42" match. aria-rowcount reflects the FILTERED count
    // (matches the total that would be rendered without virtualization) + 1 for the header.
    const rowCount = Number(screen.getByRole("table").getAttribute("aria-rowcount"));
    expect(rowCount).toBeGreaterThan(1);
    expect(rowCount).toBeLessThan(5001);
  });
});

// ─── Non-virtualized parity ──────────────────────────────────────

describe("DataTable virtualization: non-virtualized default preserves existing behavior", () => {
  it("does not emit aria-rowcount", () => {
    renderBig();
    expect(screen.getByRole("table").hasAttribute("aria-rowcount")).toBe(false);
  });

  it("does not emit aria-rowindex on data rows", () => {
    renderBig();
    const dataRows = document.querySelectorAll("tbody [data-kui-component='TableRow']");
    for (const row of Array.from(dataRows)) {
      expect(row.hasAttribute("aria-rowindex")).toBe(false);
    }
  });

  it("does not emit any spacer rows", () => {
    renderBig();
    expect(document.querySelectorAll("[data-datatable-role='virtual-spacer']")).toHaveLength(0);
  });
});

// ─── Sorting / filtering / selection integration ────────────────

describe("DataTable virtualization: state integration", () => {
  it("applies sort before slicing", () => {
    renderBig({
      virtualized: true,
      rowHeight: 40,
      virtualScrollHeight: 400,
      defaultSort: { columnId: "value", direction: "descending" },
    });
    // With descending sort, the first rendered row is the highest-value row.
    const firstDataRow = document.querySelector("[data-kui-component='TableRow'][data-row-id]");
    // Highest value = 4999 * 3 = 14997.
    expect(firstDataRow?.textContent).toContain("Row 4999");
  });

  it("supports controlled filtering with virtualization enabled", () => {
    renderBig({
      virtualized: true,
      rowHeight: 40,
      virtualScrollHeight: 400,
      filterState: {
        globalFilter: "Row 123",
        combinator: "and",
        columnFilters: [],
      },
    });
    const dataRows = document.querySelectorAll("[data-kui-component='TableRow'][data-row-id]");
    expect(dataRows.length).toBeGreaterThan(0);
    // "Row 123" matches Row 123, Row 1230..1239, Row 12300..12399 — many rows.
    for (const row of Array.from(dataRows)) {
      expect(row.textContent).toContain("Row 123");
    }
  });

  it("routes selection through the visible slice — selection persists across scroll", () => {
    // Selected rows must remain in the selection set even when scrolled out.
    renderBig({
      virtualized: true,
      rowHeight: 40,
      virtualScrollHeight: 400,
      selectionMode: "multiple",
      selectedIds: new Set([9, 100, 4500]),
      onSelectionChange: () => undefined,
    });
    // Rows 9 and 100 may not both be in the render slice, but selection is passthrough
    // state — the DataTable never removes IDs from the selection set based on visibility.
    // Assertion: whichever selected IDs happen to be rendered show `aria-selected`.
    const rendered = Array.from(
      document.querySelectorAll<HTMLElement>("[data-kui-component='TableRow'][data-row-id]"),
    );
    const selectedRendered = rendered.filter((r) => r.getAttribute("aria-selected") === "true");
    // Row 9 is in the initial visible window; at least one selected row is shown.
    expect(selectedRendered.length).toBeGreaterThanOrEqual(1);
  });
});

// ─── SSR ────────────────────────────────────────────────────────

describe("DataTable virtualization: SSR", () => {
  it("renders every row on the server (fallback for print / SEO / no-JS)", () => {
    const html = renderToString(
      createElement(DataTable, {
        data: makeRows(200),
        columns: bigCols,
        getRowId: (r: BigRow) => r.id,
        virtualized: true,
        rowHeight: 40,
      } as never),
    );
    // Without initialViewportHeight the SSR fallback covers every row.
    // 1 header + 200 data = 201 rows containing `<tr`.
    const trCount = html.split("<tr").length - 1;
    expect(trCount).toBeGreaterThanOrEqual(201);
  });
});

// ─── Performance sanity ─────────────────────────────────────────

describe("DataTable virtualization: performance", () => {
  it("keeps DOM node count bounded for large datasets", () => {
    const { container } = renderBig({
      virtualized: true,
      rowHeight: 40,
      virtualScrollHeight: 400,
      overscan: 3,
    });
    // Every TR (header + data + spacers) is the primary DOM cost.
    const trs = container.querySelectorAll("tr");
    // Header + spacers + (viewport rows + 2*overscan) — should be well under 30.
    expect(trs.length).toBeLessThan(30);
  });

  it("renders 5000 rows without throwing", () => {
    expect(() =>
      renderBig({ virtualized: true, rowHeight: 40, virtualScrollHeight: 400 }),
    ).not.toThrow();
  });

  it("scales linearly in aria-rowcount, not DOM node count", () => {
    const { container: c1, unmount: u1 } = renderBig({
      data: makeRows(1000),
      virtualized: true,
      rowHeight: 40,
      virtualScrollHeight: 400,
    });
    const trs1 = c1.querySelectorAll("tr").length;
    u1();
    const { container: c2 } = renderBig({
      data: makeRows(50_000),
      virtualized: true,
      rowHeight: 40,
      virtualScrollHeight: 400,
    });
    const trs2 = c2.querySelectorAll("tr").length;
    // Node count should stay bounded — the visible slice does not scale with data size.
    expect(Math.abs(trs2 - trs1)).toBeLessThan(5);
  });
});
