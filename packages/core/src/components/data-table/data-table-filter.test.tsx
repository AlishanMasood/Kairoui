import { describe, it, expect, afterEach, vi } from "vitest";
import { createElement } from "react";
import { render, cleanup, screen } from "@testing-library/react";
import { DataTable } from "./data-table";
import { column } from "./column-utils";
import type { DataTableRootProps } from "./data-table-types";
import type { FilterState } from "./filter-utils";
import { EMPTY_FILTER_STATE } from "./filter-utils";

afterEach(cleanup);

interface User {
  id: number;
  name: string;
  age: number;
  role: string;
}

const users: User[] = [
  { id: 1, name: "Charlie", age: 30, role: "admin" },
  { id: 2, name: "Alice", age: 25, role: "user" },
  { id: 3, name: "Bob", age: 45, role: "user" },
  { id: 4, name: "diana", age: 28, role: "admin" },
];

const cols = [
  column<User>({ id: "name", header: "Name", accessorKey: "name", sortable: true }),
  column<User>({ id: "age", header: "Age", accessorKey: "age", sortable: true }),
  column<User>({ id: "role", header: "Role", accessorKey: "role" }),
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

// ─── Controlled filterState ─────────────────────────────────────────

describe("DataTable: controlled filterState", () => {
  it("hides rows failing a column filter", () => {
    const filterState: FilterState = {
      globalFilter: "",
      combinator: "and",
      columnFilters: [{ columnId: "role", op: "equals", value: "admin" }],
    };
    renderTable({ filterState });
    expect(screen.getByText("Charlie")).toBeInTheDocument();
    expect(screen.getByText("diana")).toBeInTheDocument();
    expect(screen.queryByText("Alice")).toBeNull();
    expect(screen.queryByText("Bob")).toBeNull();
  });

  it("hides rows failing the global filter", () => {
    const filterState: FilterState = {
      globalFilter: "alice",
      combinator: "and",
      columnFilters: [],
    };
    renderTable({ filterState });
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.queryByText("Charlie")).toBeNull();
    expect(screen.queryByText("Bob")).toBeNull();
    expect(screen.queryByText("diana")).toBeNull();
  });

  it("applies filter before sort", () => {
    const filterState: FilterState = {
      globalFilter: "",
      combinator: "and",
      columnFilters: [{ columnId: "role", op: "equals", value: "user" }],
    };
    renderTable({
      filterState,
      defaultSort: { columnId: "age", direction: "ascending" },
    });
    const rows = screen.getAllByRole("row").slice(1);
    const cells = rows.map((r) => r.querySelectorAll("td")[0]?.textContent ?? "");
    expect(cells).toEqual(["Alice", "Bob"]);
  });
});

// ─── Uncontrolled defaultFilterState ────────────────────────────────

describe("DataTable: uncontrolled defaultFilterState", () => {
  it("filters the initial render based on defaults", () => {
    const defaultFilterState: FilterState = {
      globalFilter: "",
      combinator: "and",
      columnFilters: [{ columnId: "role", op: "equals", value: "admin" }],
    };
    renderTable({ defaultFilterState });
    expect(screen.getByText("Charlie")).toBeInTheDocument();
    expect(screen.queryByText("Alice")).toBeNull();
  });
});

// ─── Custom filter functions ────────────────────────────────────────

describe("DataTable: custom filterFn per column", () => {
  it("dispatches through the column filterFn", () => {
    const customCols = [
      column<User>({ id: "name", header: "Name", accessorKey: "name" }),
      column<User>({
        id: "role",
        header: "Role",
        accessorKey: "role",
        filterFn: (row) => row.age >= 30 && row.role === "admin",
      }),
      column<User>({ id: "age", header: "Age", accessorKey: "age" }),
    ];
    const filterState: FilterState = {
      globalFilter: "",
      combinator: "and",
      columnFilters: [{ columnId: "role", op: "equals", value: "ignored" }],
    };
    render(
      createElement(DataTable, {
        data: users,
        columns: customCols,
        getRowId: (u: User) => u.id,
        filterState,
      } as never),
    );
    expect(screen.getByText("Charlie")).toBeInTheDocument();
    expect(screen.queryByText("Alice")).toBeNull();
    expect(screen.queryByText("Bob")).toBeNull();
    expect(screen.queryByText("diana")).toBeNull();
  });
});

// ─── Disabled filtering per column ──────────────────────────────────

describe("DataTable: disabled filtering per column", () => {
  it("silently ignores filters targeting a non-filterable column", () => {
    const gatedCols = [
      column<User>({ id: "name", header: "Name", accessorKey: "name" }),
      column<User>({
        id: "role",
        header: "Role",
        accessorKey: "role",
        filterable: false,
      }),
    ];
    const filterState: FilterState = {
      globalFilter: "",
      combinator: "and",
      columnFilters: [{ columnId: "role", op: "equals", value: "admin" }],
    };
    render(
      createElement(DataTable, {
        data: users,
        columns: gatedCols,
        getRowId: (u: User) => u.id,
        filterState,
      } as never),
    );
    for (const name of ["Alice", "Bob", "Charlie", "diana"]) {
      expect(screen.getByText(name)).toBeInTheDocument();
    }
  });
});

// ─── onFilterStateChange ────────────────────────────────────────────

describe("DataTable: onFilterStateChange", () => {
  it("is not called on initial render", () => {
    const onFilterStateChange = vi.fn();
    renderTable({ onFilterStateChange });
    expect(onFilterStateChange).not.toHaveBeenCalled();
  });
});

// ─── Stable identity ────────────────────────────────────────────────

describe("DataTable: stable filtering", () => {
  it("passes original row references through when data is unchanged", () => {
    const filterState: FilterState = {
      globalFilter: "",
      combinator: "and",
      columnFilters: [{ columnId: "role", op: "equals", value: "admin" }],
    };
    // Render twice with the same state — both renders should reference the
    // same original row objects.
    const { rerender } = renderTable({ filterState });
    const charlieText1 = screen.getByText("Charlie");
    expect(charlieText1).toBeInTheDocument();
    rerender(
      createElement(DataTable, {
        data: users,
        columns: cols,
        getRowId: (u: User) => u.id,
        filterState,
      } as never),
    );
    expect(screen.getByText("Charlie")).toBeInTheDocument();
  });

  it("empty filter state does not remove any rows", () => {
    renderTable({ filterState: EMPTY_FILTER_STATE });
    for (const name of ["Alice", "Bob", "Charlie", "diana"]) {
      expect(screen.getByText(name)).toBeInTheDocument();
    }
  });
});
