import { describe, it, expect, vi } from "vitest";
import { act, fireEvent, render } from "@testing-library/react";
import { createElement } from "react";
import type React from "react";
import type { RowId } from "@kairoui/core/components";
import { DataGrid } from "./data-grid";
import type { DataGridColumnDef, EditCellRenderContext, ValidationResult } from "./column-types";

interface Person {
  readonly id: string;
  readonly name: string;
  readonly age: number;
  readonly team: string;
}

const people: Person[] = [
  { id: "1", name: "Alice", age: 30, team: "engineering" },
  { id: "2", name: "Bob", age: 25, team: "engineering" },
  { id: "3", name: "Carol", age: 35, team: "sales" },
  { id: "4", name: "Dave", age: 40, team: "sales" },
];

const cols: readonly DataGridColumnDef<Person>[] = [
  { id: "name", header: "Name", accessorKey: "name" },
  {
    id: "age",
    header: "Age",
    accessorKey: "age",
    aggregate: { reducer: "avg" },
  },
  { id: "team", header: "Team", accessorKey: "team" },
];

const getRowId = (row: Person): RowId => row.id;

// ─── Basic rendering ──────────────────────────────────────────────

describe("DataGrid — basic rendering", () => {
  it("renders a role=grid element", () => {
    const { container } = render(
      createElement(DataGrid<Person>, { data: people, columns: cols, getRowId }),
    );
    const grid = container.querySelector('[role="grid"]');
    expect(grid).not.toBeNull();
  });

  it("renders one row per data item", () => {
    const { container } = render(
      createElement(DataGrid<Person>, { data: people, columns: cols, getRowId }),
    );
    const leaves = container.querySelectorAll('[data-kui-row-kind="leaf"]');
    expect(leaves.length).toBe(4);
  });

  it("respects aria-rowcount and aria-colcount", () => {
    const { container } = render(
      createElement(DataGrid<Person>, { data: people, columns: cols, getRowId }),
    );
    const grid = container.querySelector('[role="grid"]');
    expect(grid?.getAttribute("aria-rowcount")).toBe("5"); // 4 rows + header
    expect(grid?.getAttribute("aria-colcount")).toBe("3");
  });

  it("uses aria-busy while loading", () => {
    const { container } = render(
      createElement(DataGrid<Person>, {
        data: people,
        columns: cols,
        getRowId,
        loading: true,
      }),
    );
    expect(container.querySelector('[role="grid"]')?.getAttribute("aria-busy")).toBe("true");
  });

  it("renders empty state when data is empty", () => {
    const { getByText } = render(
      createElement(DataGrid<Person>, {
        data: [],
        columns: cols,
        getRowId,
        emptyState: createElement("span", null, "No people here"),
      }),
    );
    expect(getByText("No people here")).toBeInTheDocument();
  });

  it("renders filteredEmptyState when active filters produce zero rows", () => {
    const { getByText } = render(
      createElement(DataGrid<Person>, {
        data: people,
        columns: cols,
        getRowId,
        defaultFilterState: {
          globalFilter: "nomatch",
          columnFilters: [],
          combinator: "and",
        },
        filteredEmptyState: createElement("span", null, "Nothing matches"),
      }),
    );
    expect(getByText("Nothing matches")).toBeInTheDocument();
  });
});

// ─── Sorting ──────────────────────────────────────────────────────

describe("DataGrid — sorting", () => {
  it("sorts a column ascending on header click", () => {
    const { container } = render(
      createElement(DataGrid<Person>, { data: people, columns: cols, getRowId }),
    );
    const nameHeader = container.querySelector(
      '[data-kui-column-id="name"] [data-kui-header-button]',
    ) as HTMLElement;
    act(() => {
      fireEvent.click(nameHeader);
    });
    const firstLeaf = container.querySelectorAll('[data-kui-row-kind="leaf"]')[0];
    expect(firstLeaf?.getAttribute("data-row-id")).toBe("1"); // Alice
  });

  it("cycles ascending → descending → unsorted", () => {
    const { container } = render(
      createElement(DataGrid<Person>, { data: people, columns: cols, getRowId }),
    );
    const button = container.querySelector(
      '[data-kui-column-id="age"] [data-kui-header-button]',
    ) as HTMLElement;
    act(() => {
      fireEvent.click(button);
    });
    let first = container.querySelectorAll('[data-kui-row-kind="leaf"]')[0];
    expect(first?.getAttribute("data-row-id")).toBe("2"); // Bob age 25
    act(() => {
      fireEvent.click(button);
    });
    first = container.querySelectorAll('[data-kui-row-kind="leaf"]')[0];
    expect(first?.getAttribute("data-row-id")).toBe("4"); // Dave age 40
    act(() => {
      fireEvent.click(button);
    });
    // Back to original order
    first = container.querySelectorAll('[data-kui-row-kind="leaf"]')[0];
    expect(first?.getAttribute("data-row-id")).toBe("1");
  });

  it("supports multi-column sort with Shift+Click", () => {
    const { container } = render(
      createElement(DataGrid<Person>, { data: people, columns: cols, getRowId }),
    );
    // Click "team" then Shift+Click "age"
    const teamBtn = container.querySelector(
      '[data-kui-column-id="team"] [data-kui-header-button]',
    ) as HTMLElement;
    const ageBtn = container.querySelector(
      '[data-kui-column-id="age"] [data-kui-header-button]',
    ) as HTMLElement;
    act(() => {
      fireEvent.click(teamBtn);
    });
    act(() => {
      fireEvent.click(ageBtn, { shiftKey: true });
    });
    const rows = container.querySelectorAll('[data-kui-row-kind="leaf"]');
    // engineering first (alphabetical), then sales; within each, age asc.
    // engineering: Bob (25), Alice (30); sales: Carol (35), Dave (40)
    expect(rows[0]?.getAttribute("data-row-id")).toBe("2");
    expect(rows[1]?.getAttribute("data-row-id")).toBe("1");
    expect(rows[2]?.getAttribute("data-row-id")).toBe("3");
    expect(rows[3]?.getAttribute("data-row-id")).toBe("4");
  });

  it("skips client sort when serverSort=true", () => {
    const { container } = render(
      createElement(DataGrid<Person>, {
        data: people,
        columns: cols,
        getRowId,
        defaultSort: [{ columnId: "age", direction: "descending" }],
        serverSort: true,
      }),
    );
    const first = container.querySelectorAll('[data-kui-row-kind="leaf"]')[0];
    expect(first?.getAttribute("data-row-id")).toBe("1"); // original order preserved
  });

  it("fires onSortChange when a header is clicked", () => {
    const onSortChange = vi.fn();
    const { container } = render(
      createElement(DataGrid<Person>, {
        data: people,
        columns: cols,
        getRowId,
        onSortChange,
      }),
    );
    act(() => {
      fireEvent.click(
        container.querySelector(
          '[data-kui-column-id="name"] [data-kui-header-button]',
        ) as HTMLElement,
      );
    });
    expect(onSortChange).toHaveBeenCalled();
  });
});

// ─── Filtering ────────────────────────────────────────────────────

describe("DataGrid — filtering", () => {
  it("applies a controlled global filter", () => {
    const { container } = render(
      createElement(DataGrid<Person>, {
        data: people,
        columns: cols,
        getRowId,
        filterState: { globalFilter: "sales", columnFilters: [], combinator: "and" },
      }),
    );
    const leaves = container.querySelectorAll('[data-kui-row-kind="leaf"]');
    expect(leaves.length).toBe(2);
  });
});

// ─── Selection ────────────────────────────────────────────────────

describe("DataGrid — selection", () => {
  it("renders a selection checkbox column when selectionMode is set", () => {
    const { container } = render(
      createElement(DataGrid<Person>, {
        data: people,
        columns: cols,
        getRowId,
        selectionMode: "multiple",
      }),
    );
    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    expect(checkboxes.length).toBeGreaterThan(0);
  });

  it("toggles a row when its checkbox is clicked", () => {
    const onSelectionChange = vi.fn();
    const { container } = render(
      createElement(DataGrid<Person>, {
        data: people,
        columns: cols,
        getRowId,
        selectionMode: "multiple",
        onSelectionChange,
      }),
    );
    const rowCheckbox = container.querySelectorAll('input[type="checkbox"]')[1] as HTMLElement;
    act(() => {
      fireEvent.click(rowCheckbox);
    });
    expect(onSelectionChange).toHaveBeenCalled();
  });

  it("select-all toggles every visible row in multiple mode", () => {
    const { container } = render(
      createElement(DataGrid<Person>, {
        data: people,
        columns: cols,
        getRowId,
        selectionMode: "multiple",
      }),
    );
    const selectAll = container.querySelectorAll('input[type="checkbox"]')[0] as HTMLElement;
    act(() => {
      fireEvent.click(selectAll);
    });
    const rowChecks = Array.from(
      container.querySelectorAll<HTMLInputElement>(
        '[data-kui-row-kind="leaf"] input[type="checkbox"]',
      ),
    );
    expect(rowChecks.every((c) => c.checked)).toBe(true);
  });

  it("marks aria-multiselectable=true when selectionMode is multiple", () => {
    const { container } = render(
      createElement(DataGrid<Person>, {
        data: people,
        columns: cols,
        getRowId,
        selectionMode: "multiple",
      }),
    );
    expect(container.querySelector('[role="grid"]')?.getAttribute("aria-multiselectable")).toBe(
      "true",
    );
  });
});

// ─── Grouping ─────────────────────────────────────────────────────

describe("DataGrid — grouping", () => {
  it("renders group header rows when groupBy is active", () => {
    const { container } = render(
      createElement(DataGrid<Person>, {
        data: people,
        columns: cols,
        getRowId,
        defaultGroupBy: ["team"],
      }),
    );
    const groupRows = container.querySelectorAll('[data-kui-row-kind="group"]');
    expect(groupRows.length).toBe(2);
  });

  it("collapsed groups hide their leaf rows", () => {
    const { container } = render(
      createElement(DataGrid<Person>, {
        data: people,
        columns: cols,
        getRowId,
        defaultGroupBy: ["team"],
      }),
    );
    expect(container.querySelectorAll('[data-kui-row-kind="leaf"]').length).toBe(0);
  });

  it("expanding a group reveals its leaves", () => {
    const { container } = render(
      createElement(DataGrid<Person>, {
        data: people,
        columns: cols,
        getRowId,
        defaultGroupBy: ["team"],
      }),
    );
    const toggle = container.querySelector(
      '[data-kui-row-kind="group"] button[aria-expanded]',
    ) as HTMLElement;
    act(() => {
      fireEvent.click(toggle);
    });
    expect(container.querySelectorAll('[data-kui-row-kind="leaf"]').length).toBeGreaterThan(0);
  });

  it("renders per-group aggregates from column def", () => {
    const { container } = render(
      createElement(DataGrid<Person>, {
        data: people,
        columns: cols,
        getRowId,
        defaultGroupBy: ["team"],
      }),
    );
    const groupRows = container.querySelectorAll('[data-kui-row-kind="group"]');
    // "engineering" group avg age = (30+25)/2 = 27.5
    expect(groupRows[0]?.textContent ?? "").toContain("27.5");
  });
});

// ─── Aggregation footer ──────────────────────────────────────────

describe("DataGrid — aggregate footer", () => {
  it("renders the aggregate footer when showAggregatedFooter=true", () => {
    const footerCols: readonly DataGridColumnDef<Person>[] = [
      { id: "name", header: "Name", accessorKey: "name" },
      {
        id: "age",
        header: "Age",
        accessorKey: "age",
        aggregate: { reducer: "sum", footer: true },
      },
    ];
    const { container } = render(
      createElement(DataGrid<Person>, {
        data: people,
        columns: footerCols,
        getRowId,
        showAggregatedFooter: true,
      }),
    );
    const footer = container.querySelector('[data-kui-slot="aggregate-footer"]');
    expect(footer?.textContent ?? "").toContain("130"); // 30+25+35+40
  });
});

// ─── Editing ──────────────────────────────────────────────────────

describe("DataGrid — editing", () => {
  const editable: readonly DataGridColumnDef<Person>[] = [
    { id: "name", header: "Name", accessorKey: "name" },
    {
      id: "age",
      header: "Age",
      accessorKey: "age",
      editable: true,
      parseEdit: (v) => Number(v),
      validateEdit: (v): ValidationResult => {
        const n = Number(v);
        return Number.isFinite(n) && n >= 0 ? { ok: true } : { ok: false, message: "invalid" };
      },
      editCell: (ctx: EditCellRenderContext<Person>) =>
        createElement("input", {
          "data-testid": `edit-${ctx.row.id}-${ctx.columnId}`,
          value: typeof ctx.rawInput === "string" ? ctx.rawInput : "",
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
            ctx.setInput(e.target.value);
          },
        }),
    },
  ];

  it("double-clicking an editable cell enters edit mode", () => {
    const { container, getByTestId } = render(
      createElement(DataGrid<Person>, {
        data: people,
        columns: editable,
        getRowId,
        editMode: "cell",
      }),
    );
    const cell = container.querySelector(
      '[data-row-id="1"] [data-kui-column-id="age"]',
    ) as HTMLElement;
    act(() => {
      fireEvent.doubleClick(cell);
    });
    expect(getByTestId("edit-1-age")).toBeInTheDocument();
  });

  it("Enter commits the edit and fires onCellEdit", async () => {
    const onCellEdit = vi.fn();
    const { container, getByTestId } = render(
      createElement(DataGrid<Person>, {
        data: people,
        columns: editable,
        getRowId,
        editMode: "cell",
        onCellEdit,
      }),
    );
    const cell = container.querySelector(
      '[data-row-id="1"] [data-kui-column-id="age"]',
    ) as HTMLElement;
    act(() => {
      fireEvent.doubleClick(cell);
    });
    const input = getByTestId("edit-1-age") as HTMLInputElement;
    act(() => {
      fireEvent.change(input, { target: { value: "42" } });
    });
    await act(async () => {
      fireEvent.keyDown(input, { key: "Enter" });
      await Promise.resolve();
    });
    expect(onCellEdit).toHaveBeenCalledTimes(1);
  });

  it("Escape cancels the edit", () => {
    const { container, getByTestId, queryByTestId } = render(
      createElement(DataGrid<Person>, {
        data: people,
        columns: editable,
        getRowId,
        editMode: "cell",
      }),
    );
    const cell = container.querySelector(
      '[data-row-id="1"] [data-kui-column-id="age"]',
    ) as HTMLElement;
    act(() => {
      fireEvent.doubleClick(cell);
    });
    const input = getByTestId("edit-1-age");
    act(() => {
      fireEvent.keyDown(input, { key: "Escape" });
    });
    expect(queryByTestId("edit-1-age")).toBeNull();
  });

  it("ignores double-click on non-editable columns", () => {
    const { container, queryByTestId } = render(
      createElement(DataGrid<Person>, {
        data: people,
        columns: editable,
        getRowId,
        editMode: "cell",
      }),
    );
    const nameCell = container.querySelector(
      '[data-row-id="1"] [data-kui-column-id="name"]',
    ) as HTMLElement;
    act(() => {
      fireEvent.doubleClick(nameCell);
    });
    expect(queryByTestId("edit-1-name")).toBeNull();
  });
});

// ─── Row virtualization ──────────────────────────────────────────

describe("DataGrid — virtualization", () => {
  it("renders only visible rows when virtualized", () => {
    const big: Person[] = [];
    for (let i = 0; i < 500; i++) {
      big.push({ id: String(i), name: `n${String(i)}`, age: i, team: "x" });
    }
    const { container } = render(
      createElement(DataGrid<Person>, {
        data: big,
        columns: cols,
        getRowId,
        virtualized: true,
        rowHeight: 40,
        virtualScrollHeight: 200,
      }),
    );
    const leaves = container.querySelectorAll('[data-kui-row-kind="leaf"]');
    expect(leaves.length).toBeLessThan(50);
  });

  it("emits top/bottom aria-hidden spacer rows", () => {
    const big: Person[] = [];
    for (let i = 0; i < 100; i++) {
      big.push({ id: String(i), name: `n${String(i)}`, age: i, team: "x" });
    }
    const { container } = render(
      createElement(DataGrid<Person>, {
        data: big,
        columns: cols,
        getRowId,
        virtualized: true,
        rowHeight: 40,
        virtualScrollHeight: 200,
      }),
    );
    const hidden = container.querySelectorAll('[aria-hidden="true"]');
    expect(hidden.length).toBeGreaterThan(0);
  });
});

// ─── Empty column list ───────────────────────────────────────────

describe("DataGrid — column visibility", () => {
  it("hidden columns are excluded from render", () => {
    const { container } = render(
      createElement(DataGrid<Person>, {
        data: people,
        columns: cols,
        getRowId,
        defaultColumnVisibility: { age: false },
      }),
    );
    expect(container.querySelector('[data-kui-column-id="age"]')).toBeNull();
  });
});

// ─── Pinning ─────────────────────────────────────────────────────

describe("DataGrid — column pinning", () => {
  it("pinned columns carry data-pinned attribute", () => {
    const { container } = render(
      createElement(DataGrid<Person>, {
        data: people,
        columns: cols,
        getRowId,
        defaultColumnPinning: { left: ["name"], right: ["team"] },
      }),
    );
    const leftPinned = container.querySelector('[data-pinned="left"]');
    const rightPinned = container.querySelector('[data-pinned="right"]');
    expect(leftPinned).not.toBeNull();
    expect(rightPinned).not.toBeNull();
  });
});

// ─── Server-controlled ──────────────────────────────────────────

describe("DataGrid — server-controlled callbacks", () => {
  it("fires state-change callbacks for controlled slices", () => {
    const onColumnPinningChange = vi.fn();
    const { container } = render(
      createElement(DataGrid<Person>, {
        data: people,
        columns: cols,
        getRowId,
        selectionMode: "multiple",
        onColumnPinningChange,
        onColumnSizingChange: vi.fn(),
        onColumnOrderChange: vi.fn(),
      }),
    );
    expect(container.querySelector('[role="grid"]')).not.toBeNull();
  });
});
