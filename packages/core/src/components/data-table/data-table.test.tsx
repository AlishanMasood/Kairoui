import { describe, it, expect, afterEach, vi } from "vitest";
import { createElement, StrictMode } from "react";
import { render, cleanup, screen, fireEvent } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { DataTable } from "./data-table";
import { column } from "./column-utils";
import type { DataTableRootProps } from "./data-table-types";

afterEach(cleanup);

// ─── Test data ──────────────────────────────────────────────────────

interface User {
  id: number;
  name: string;
  age: number;
}

const users: User[] = [
  { id: 1, name: "Charlie", age: 30 },
  { id: 2, name: "Alice", age: 25 },
  { id: 3, name: "Bob", age: 35 },
];

const cols = [
  column<User>({ id: "name", header: "Name", accessorKey: "name", sortable: true }),
  column<User>({ id: "age", header: "Age", accessorKey: "age", sortable: true, align: "end" }),
];

function renderTable(overrides: Partial<DataTableRootProps<User>> = {}) {
  const props: DataTableRootProps<User> = {
    data: users,
    columns: cols,
    getRowId: (u) => u.id,
    ...overrides,
  };
  return render(createElement(DataTable, props as never));
}

// ─── Basic rendering ────────────────────────────────────────────────

describe("DataTable: rendering", () => {
  it("renders a table with headers and rows", () => {
    renderTable();
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getAllByRole("columnheader")).toHaveLength(2);
    expect(screen.getAllByRole("row")).toHaveLength(4); // 1 header + 3 data
  });

  it("renders header content from column definitions", () => {
    renderTable();
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Age")).toBeInTheDocument();
  });

  it("renders cell content from accessor", () => {
    renderTable();
    expect(screen.getByText("Charlie")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("30")).toBeInTheDocument();
  });

  it("uses custom cell renderer", () => {
    const customCols = [
      column<User>({
        id: "name",
        header: "Name",
        accessorKey: "name",
        cell: (value) => createElement("strong", null, String(value)),
      }),
    ];
    render(
      createElement(DataTable, {
        data: users,
        columns: customCols,
        getRowId: (u: User) => u.id,
      } as never),
    );
    const strongs = document.querySelectorAll("strong");
    expect(strongs).toHaveLength(3);
  });
});

// ─── Sorting ────────────────────────────────────────────────────────

describe("DataTable: sorting", () => {
  it("sortable headers are interactive", () => {
    renderTable();
    const nameHeader = screen.getByText("Name");
    expect(nameHeader.closest("th")!.getAttribute("data-sortable")).toBe("true");
  });

  it("clicking header sorts ascending then descending", () => {
    renderTable();
    const nameHeader = screen.getByText("Name").closest("th")!;

    fireEvent.click(nameHeader);
    const cells = screen.getAllByRole("cell");
    // After ascending sort: Alice, Bob, Charlie
    expect(cells[0]!.textContent).toBe("Alice");

    fireEvent.click(nameHeader);
    // After descending: Charlie, Bob, Alice
    const cellsDesc = screen.getAllByRole("cell");
    expect(cellsDesc[0]!.textContent).toBe("Charlie");
  });

  it("sets aria-sort on active column", () => {
    renderTable();
    const nameHeader = screen.getByText("Name").closest("th")!;
    fireEvent.click(nameHeader);
    expect(nameHeader.getAttribute("aria-sort")).toBe("ascending");
  });

  it("calls onSortChange in controlled mode", () => {
    const onSortChange = vi.fn();
    renderTable({ onSortChange });
    const nameHeader = screen.getByText("Name").closest("th")!;
    fireEvent.click(nameHeader);
    expect(onSortChange).toHaveBeenCalledWith({ columnId: "name", direction: "ascending" });
  });
});

// ─── Selection ──────────────────────────────────────────────────────

describe("DataTable: selection", () => {
  it("renders selection column in multiple mode", () => {
    renderTable({ selectionMode: "multiple" });
    // Headers: select-all + Name + Age = 3
    expect(screen.getAllByRole("columnheader")).toHaveLength(3);
  });

  it("clicking row selection cell toggles selection", () => {
    renderTable({ selectionMode: "multiple" });
    const selectCells = document.querySelectorAll("[data-datatable-role='select-cell']");
    fireEvent.click(selectCells[0]!);
    const rows = screen.getAllByRole("row");
    // First data row should be selected
    expect(rows[1]!.getAttribute("aria-selected")).toBe("true");
  });

  it("select-all toggles all rows", () => {
    renderTable({ selectionMode: "multiple" });
    const selectAllHeader = document.querySelector("[data-datatable-role='select-all']")!;
    fireEvent.click(selectAllHeader);
    const dataRows = screen.getAllByRole("row").slice(1);
    dataRows.forEach((row) => {
      expect(row.getAttribute("aria-selected")).toBe("true");
    });
  });

  it("calls onSelectionChange", () => {
    const onSelectionChange = vi.fn();
    renderTable({ selectionMode: "multiple", onSelectionChange });
    const selectCells = document.querySelectorAll("[data-datatable-role='select-cell']");
    fireEvent.click(selectCells[0]!);
    expect(onSelectionChange).toHaveBeenCalled();
  });

  it("single selection mode shows selection column", () => {
    renderTable({ selectionMode: "single" });
    expect(screen.getAllByRole("columnheader")).toHaveLength(3);
  });
});

// ─── Empty state ────────────────────────────────────────────────────

describe("DataTable: empty state", () => {
  it("renders emptyState when data is empty", () => {
    renderTable({
      data: [],
      emptyState: createElement("div", { "data-testid": "empty" }, "No data"),
    });
    expect(screen.getByTestId("empty")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("does not render emptyState when loading", () => {
    renderTable({
      data: [],
      loading: true,
      emptyState: createElement("div", { "data-testid": "empty" }, "No data"),
    });
    expect(screen.queryByTestId("empty")).not.toBeInTheDocument();
    expect(screen.getByRole("table")).toBeInTheDocument();
  });
});

// ─── Loading state ──────────────────────────────────────────────────

describe("DataTable: loading state", () => {
  it("renders loading content when loading", () => {
    renderTable({ loading: true });
    expect(screen.getByText("Loading…")).toBeInTheDocument();
  });

  it("renders custom loading content via children", () => {
    render(
      createElement(DataTable, {
        data: users,
        columns: cols,
        getRowId: (u: User) => u.id,
        loading: true,
        children: "Custom loading...",
      } as never),
    );
    expect(screen.getByText("Custom loading...")).toBeInTheDocument();
  });
});

// ─── SSR ────────────────────────────────────────────────────────────

describe("DataTable: SSR", () => {
  it("renders to string", () => {
    const html = renderToString(
      createElement(DataTable, {
        data: users,
        columns: cols,
        getRowId: (u: User) => u.id,
      } as never),
    );
    expect(html).toContain("<table");
    expect(html).toContain("Charlie");
    expect(html).toContain("Name");
  });
});

// ─── StrictMode ─────────────────────────────────────────────────────

describe("DataTable: StrictMode", () => {
  it("works in StrictMode", () => {
    render(
      createElement(
        StrictMode,
        null,
        createElement(DataTable, {
          data: users,
          columns: cols,
          getRowId: (u: User) => u.id,
        } as never),
      ),
    );
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getAllByRole("row")).toHaveLength(4);
  });
});
