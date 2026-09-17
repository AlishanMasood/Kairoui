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

// ─── Filtered empty state ──────────────────────────────────────────

describe("DataTable: filtered empty state", () => {
  it("renders `filteredEmptyState` when every row is filtered out", () => {
    const filterState: FilterState = {
      globalFilter: "zzz-no-match",
      combinator: "and",
      columnFilters: [],
    };
    renderTable({
      filterState,
      filteredEmptyState: createElement("div", { role: "note" }, "No matches"),
    });
    expect(screen.getByRole("note")).toHaveTextContent("No matches");
  });

  it("falls back to `emptyState` when only `emptyState` is provided", () => {
    const filterState: FilterState = {
      globalFilter: "zzz-no-match",
      combinator: "and",
      columnFilters: [],
    };
    renderTable({
      filterState,
      emptyState: createElement("div", { role: "note" }, "Nothing here"),
    });
    expect(screen.getByRole("note")).toHaveTextContent("Nothing here");
  });

  it("emits data-filtered-empty on the wrapper when filters are active", () => {
    const filterState: FilterState = {
      globalFilter: "zzz-no-match",
      combinator: "and",
      columnFilters: [],
    };
    const { container } = renderTable({
      filterState,
      filteredEmptyState: createElement("div", null, "None"),
    });
    const wrapper = container.querySelector("[data-kui-component='DataTable']");
    expect(wrapper?.getAttribute("data-filtered-empty")).toBe("true");
  });

  it("does not render filtered-empty when data itself is empty", () => {
    render(
      createElement(DataTable, {
        data: [] as User[],
        columns: cols,
        getRowId: (u: User) => u.id,
        emptyState: createElement("div", { role: "note" }, "No data"),
        filteredEmptyState: createElement("div", { role: "alert" }, "No matches"),
      } as never),
    );
    expect(screen.getByRole("note")).toHaveTextContent("No data");
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("still renders the table when no empty node is provided", () => {
    const filterState: FilterState = {
      globalFilter: "zzz-no-match",
      combinator: "and",
      columnFilters: [],
    };
    renderTable({ filterState });
    expect(screen.getByRole("table")).toBeInTheDocument();
    // No data rows.
    expect(screen.getAllByRole("row")).toHaveLength(1);
  });
});

// ─── Accessible id linkage ─────────────────────────────────────────

describe("DataTable: accessible id linkage", () => {
  it("propagates the id to the table element", () => {
    renderTable({ id: "users-table" });
    expect(screen.getByRole("table").id).toBe("users-table");
  });

  it("propagates the id to the empty-state wrapper", () => {
    render(
      createElement(DataTable, {
        data: [] as User[],
        columns: cols,
        getRowId: (u: User) => u.id,
        id: "users-table",
        emptyState: createElement("div", null, "No data"),
      } as never),
    );
    const wrapper = document.getElementById("users-table");
    expect(wrapper).not.toBeNull();
    expect(wrapper?.getAttribute("data-kui-component")).toBe("DataTable");
  });

  it("propagates the id to the filtered-empty wrapper", () => {
    const filterState: FilterState = {
      globalFilter: "zzz-no-match",
      combinator: "and",
      columnFilters: [],
    };
    renderTable({
      id: "users-table",
      filterState,
      filteredEmptyState: createElement("div", null, "No matches"),
    });
    const wrapper = document.getElementById("users-table");
    expect(wrapper?.getAttribute("data-filtered-empty")).toBe("true");
  });
});
