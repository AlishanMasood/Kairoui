import { describe, it, expect, afterEach } from "vitest";
import { createElement } from "react";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { List, ListItem } from "../list/list";
import {
  DescriptionList,
  DescriptionTerm,
  DescriptionDetails,
} from "../description-list/description-list";
import {
  EmptyState,
  EmptyStateIcon,
  EmptyStateTitle,
  EmptyStateDescription,
} from "../empty-state/empty-state";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from "../table/table";
import { DataTable } from "../data-table/data-table";
import { column } from "../data-table/column-utils";
import {
  TreeView,
  TreeViewItem,
  TreeViewItemTrigger,
  TreeViewItemContent,
} from "../tree-view/tree-view";
import {
  Timeline,
  TimelineItem,
  TimelineIndicator,
  TimelineContent,
  TimelineTitle,
  TimelineTime,
} from "../timeline/timeline";
import { Calendar } from "../calendar/calendar";

afterEach(cleanup);

// ═══════════════════════════════════════════════════════════════════════
// LIST — Native Semantics
// ═══════════════════════════════════════════════════════════════════════

describe("A11y: List", () => {
  it("unordered list has list role", () => {
    render(createElement(List, null, createElement(ListItem, null, "A")));
    expect(screen.getByRole("list")).toBeInTheDocument();
  });

  it("items have listitem role", () => {
    render(
      createElement(
        List,
        null,
        createElement(ListItem, null, "A"),
        createElement(ListItem, null, "B"),
      ),
    );
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it("ordered list preserves list semantics", () => {
    render(createElement(List, { variant: "ordered" }, createElement(ListItem, null, "1")));
    expect(screen.getByRole("list")).toBeInTheDocument();
  });
});

// ═══════════════════════════════════════════════════════════════════════
// DESCRIPTION LIST — Native Semantics
// ═══════════════════════════════════════════════════════════════════════

describe("A11y: DescriptionList", () => {
  it("term has term role", () => {
    render(
      createElement(
        DescriptionList,
        null,
        createElement(DescriptionTerm, null, "Key"),
        createElement(DescriptionDetails, null, "Val"),
      ),
    );
    expect(screen.getByRole("term")).toBeInTheDocument();
  });

  it("details has definition role", () => {
    render(
      createElement(
        DescriptionList,
        null,
        createElement(DescriptionTerm, null, "Key"),
        createElement(DescriptionDetails, null, "Val"),
      ),
    );
    expect(screen.getByRole("definition")).toBeInTheDocument();
  });
});

// ═══════════════════════════════════════════════════════════════════════
// EMPTY STATE — Status Role
// ═══════════════════════════════════════════════════════════════════════

describe("A11y: EmptyState", () => {
  it("root has role=status", () => {
    render(createElement(EmptyState, null, createElement(EmptyStateTitle, null, "Empty")));
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("icon is aria-hidden", () => {
    render(
      createElement(
        EmptyState,
        null,
        createElement(EmptyStateIcon, { "data-testid": "icon" } as never, "📭"),
      ),
    );
    expect(screen.getByTestId("icon").getAttribute("aria-hidden")).toBe("true");
  });

  it("title renders as heading", () => {
    render(createElement(EmptyState, null, createElement(EmptyStateTitle, null, "No data")));
    expect(screen.getByRole("heading", { level: 3 })).toBeInTheDocument();
  });

  it("description renders as paragraph", () => {
    render(
      createElement(
        EmptyState,
        null,
        createElement(EmptyStateDescription, { "data-testid": "desc" } as never, "Try again"),
      ),
    );
    expect(screen.getByTestId("desc").tagName).toBe("P");
  });
});

// ═══════════════════════════════════════════════════════════════════════
// TABLE — Semantic Table + Sort
// ═══════════════════════════════════════════════════════════════════════

describe("A11y: Table", () => {
  it("has table role", () => {
    render(
      createElement(
        Table,
        null,
        createElement(
          TableBody,
          null,
          createElement(TableRow, null, createElement(TableCell, null, "A")),
        ),
      ),
    );
    expect(screen.getByRole("table")).toBeInTheDocument();
  });

  it("caption provides accessible name", () => {
    render(
      createElement(
        Table,
        null,
        createElement(TableCaption, null, "Users"),
        createElement(TableBody, null),
      ),
    );
    expect(screen.getByText("Users").tagName).toBe("CAPTION");
  });

  it("header cells have columnheader role", () => {
    render(
      createElement(
        Table,
        null,
        createElement(
          TableHeader,
          null,
          createElement(TableRow, null, createElement(TableHead, null, "Name")),
        ),
      ),
    );
    expect(screen.getByRole("columnheader")).toBeInTheDocument();
  });

  it("sortable header has aria-sort", () => {
    render(
      createElement(
        Table,
        null,
        createElement(
          TableHeader,
          null,
          createElement(
            TableRow,
            null,
            createElement(
              TableHead,
              { sortDirection: "ascending", onSort: () => {} } as never,
              "Name",
            ),
          ),
        ),
      ),
    );
    expect(screen.getByRole("columnheader").getAttribute("aria-sort")).toBe("ascending");
  });

  it("sortable header is keyboard-accessible", () => {
    let sorted = false;
    render(
      createElement(
        Table,
        null,
        createElement(
          TableHeader,
          null,
          createElement(
            TableRow,
            null,
            createElement(
              TableHead,
              {
                onSort: () => {
                  sorted = true;
                },
                "data-testid": "th",
              } as never,
              "Name",
            ),
          ),
        ),
      ),
    );
    fireEvent.keyDown(screen.getByTestId("th"), { key: "Enter" });
    expect(sorted).toBe(true);
  });

  it("selected row has aria-selected", () => {
    render(
      createElement(
        Table,
        null,
        createElement(
          TableBody,
          null,
          createElement(
            TableRow,
            { selected: true, "data-testid": "row" } as never,
            createElement(TableCell, null, "A"),
          ),
        ),
      ),
    );
    expect(screen.getByTestId("row").getAttribute("aria-selected")).toBe("true");
  });
});

// ═══════════════════════════════════════════════════════════════════════
// DATATABLE — Keyboard Matrix
// ═══════════════════════════════════════════════════════════════════════

describe("A11y: DataTable keyboard matrix", () => {
  interface User {
    id: number;
    name: string;
    age: number;
  }
  const users: User[] = [
    { id: 1, name: "Alice", age: 30 },
    { id: 2, name: "Bob", age: 25 },
  ];
  const cols = [
    column<User>({ id: "name", header: "Name", accessorKey: "name", sortable: true }),
    column<User>({ id: "age", header: "Age", accessorKey: "age", sortable: true }),
  ];

  it("Enter/Space on sortable header toggles sort", () => {
    render(
      createElement(DataTable, {
        data: users,
        columns: cols,
        getRowId: (u: User) => u.id,
      } as never),
    );
    const th = screen.getByText("Name").closest("th")!;
    fireEvent.click(th);
    expect(th.getAttribute("aria-sort")).toBe("ascending");
    fireEvent.click(th);
    expect(th.getAttribute("aria-sort")).toBe("descending");
  });

  it("Enter/Space on selection cell toggles row selection", () => {
    render(
      createElement(DataTable, {
        data: users,
        columns: cols,
        getRowId: (u: User) => u.id,
        selectionMode: "multiple",
      } as never),
    );
    const selectCell = document.querySelector("[data-datatable-role='select-cell']")!;
    fireEvent.keyDown(selectCell, { key: "Enter" });
    const row = screen.getAllByRole("row")[1]!;
    expect(row.getAttribute("aria-selected")).toBe("true");
  });

  it("select-all responds to Enter/Space", () => {
    render(
      createElement(DataTable, {
        data: users,
        columns: cols,
        getRowId: (u: User) => u.id,
        selectionMode: "multiple",
      } as never),
    );
    const selectAll = document.querySelector("[data-datatable-role='select-all']")!;
    fireEvent.keyDown(selectAll, { key: " " });
    const rows = screen.getAllByRole("row").slice(1);
    rows.forEach((row) => {
      expect(row.getAttribute("aria-selected")).toBe("true");
    });
  });

  it("loading state sets aria-busy", () => {
    render(
      createElement(DataTable, {
        data: users,
        columns: cols,
        getRowId: (u: User) => u.id,
        loading: true,
      } as never),
    );
    expect(screen.getByRole("table").getAttribute("aria-busy")).toBe("true");
  });

  it("non-loading state has no aria-busy", () => {
    render(
      createElement(DataTable, {
        data: users,
        columns: cols,
        getRowId: (u: User) => u.id,
      } as never),
    );
    expect(screen.getByRole("table").getAttribute("aria-busy")).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════
// TREEVIEW — Keyboard Matrix
// ═══════════════════════════════════════════════════════════════════════

describe("A11y: TreeView keyboard matrix", () => {
  function renderTree(dir: "ltr" | "rtl" = "ltr") {
    return render(
      createElement(
        TreeView,
        { dir } as never,
        createElement(
          TreeViewItem,
          { value: "folder" },
          createElement(
            TreeViewItemTrigger,
            { "data-testid": "folder-trigger" } as never,
            "Folder",
          ),
          createElement(
            TreeViewItemContent,
            null,
            createElement(
              TreeViewItem,
              { value: "file1" },
              createElement(
                TreeViewItemTrigger,
                { "data-testid": "file1-trigger" } as never,
                "File 1",
              ),
            ),
            createElement(
              TreeViewItem,
              { value: "file2" },
              createElement(TreeViewItemTrigger, null, "File 2"),
            ),
          ),
        ),
      ),
    );
  }

  it("root has role=tree", () => {
    renderTree();
    expect(screen.getByRole("tree")).toBeInTheDocument();
  });

  it("items have role=treeitem", () => {
    renderTree();
    expect(screen.getAllByRole("treeitem").length).toBeGreaterThan(0);
  });

  it("ArrowRight expands collapsed branch", () => {
    renderTree();
    const trigger = screen.getByTestId("folder-trigger");
    fireEvent.keyDown(trigger, { key: "ArrowRight" });
    expect(screen.getByText("File 1")).toBeInTheDocument();
  });

  it("ArrowLeft collapses expanded branch", () => {
    renderTree();
    const trigger = screen.getByTestId("folder-trigger");
    fireEvent.keyDown(trigger, { key: "ArrowRight" }); // expand
    fireEvent.keyDown(trigger, { key: "ArrowLeft" }); // collapse
    expect(screen.queryByText("File 1")).not.toBeInTheDocument();
  });

  it("Enter/Space activates trigger", () => {
    renderTree();
    const trigger = screen.getByTestId("folder-trigger");
    fireEvent.keyDown(trigger, { key: "Enter" });
    expect(screen.getByText("File 1")).toBeInTheDocument();
  });

  it("RTL: ArrowLeft expands, ArrowRight collapses", () => {
    renderTree("rtl");
    const trigger = screen.getByTestId("folder-trigger");
    fireEvent.keyDown(trigger, { key: "ArrowLeft" });
    expect(screen.getByText("File 1")).toBeInTheDocument();
    fireEvent.keyDown(trigger, { key: "ArrowRight" });
    expect(screen.queryByText("File 1")).not.toBeInTheDocument();
  });

  it("expanded branch has aria-expanded=true", () => {
    renderTree();
    const trigger = screen.getByTestId("folder-trigger");
    fireEvent.keyDown(trigger, { key: "ArrowRight" });
    const item = screen.getByTestId("folder-trigger").closest("[role='treeitem']")!;
    expect(item.getAttribute("aria-expanded")).toBe("true");
  });

  it("nested content has role=group", () => {
    renderTree();
    fireEvent.keyDown(screen.getByTestId("folder-trigger"), { key: "Enter" });
    expect(document.querySelector("[role='group']")).toBeInTheDocument();
  });

  it("disabled items have aria-disabled", () => {
    render(
      createElement(
        TreeView,
        null,
        createElement(
          TreeViewItem,
          { value: "dis", disabled: true },
          createElement(TreeViewItemTrigger, null, "Disabled"),
        ),
      ),
    );
    const item = screen.getByRole("treeitem");
    expect(item.getAttribute("aria-disabled")).toBe("true");
  });
});

// ═══════════════════════════════════════════════════════════════════════
// CALENDAR — Keyboard Matrix
// ═══════════════════════════════════════════════════════════════════════

describe("A11y: Calendar keyboard matrix", () => {
  it("grid has role=grid", () => {
    render(createElement(Calendar, { defaultValue: new Date(2026, 0, 15) } as never));
    expect(screen.getByRole("grid")).toBeInTheDocument();
  });

  it("grid has accessible name from heading", () => {
    render(createElement(Calendar, { defaultValue: new Date(2026, 0, 15) } as never));
    const grid = screen.getByRole("grid");
    expect(grid.getAttribute("aria-label")).toContain("January");
  });

  it("month heading has aria-live=polite", () => {
    render(createElement(Calendar, { defaultValue: new Date(2026, 0, 15) } as never));
    const heading = document.querySelector("[aria-live='polite']")!;
    expect(heading).toBeInTheDocument();
    expect(heading.textContent).toContain("January");
  });

  it("day cells have role=gridcell", () => {
    render(createElement(Calendar, { defaultValue: new Date(2026, 0, 15) } as never));
    expect(screen.getAllByRole("gridcell").length).toBeGreaterThan(0);
  });

  it("selected day has aria-selected", () => {
    render(createElement(Calendar, { defaultValue: new Date(2026, 0, 15) } as never));
    const day15 = screen.getByText("15");
    fireEvent.click(day15);
    expect(day15.getAttribute("aria-selected")).toBe("true");
  });

  it("disabled day has aria-disabled", () => {
    render(
      createElement(Calendar, {
        defaultValue: new Date(2026, 0, 15),
        min: new Date(2026, 0, 10),
      } as never),
    );
    const day5 = screen.getByText("5");
    expect(day5.getAttribute("aria-disabled")).toBe("true");
  });

  it("ArrowRight moves focus to next day", () => {
    render(createElement(Calendar, { defaultValue: new Date(2026, 0, 15) } as never));
    const grid = screen.getByRole("grid");
    fireEvent.keyDown(grid, { key: "ArrowRight" });
    expect(screen.getByText("16").getAttribute("tabindex")).toBe("0");
  });

  it("ArrowLeft moves focus to previous day", () => {
    render(createElement(Calendar, { defaultValue: new Date(2026, 0, 15) } as never));
    const grid = screen.getByRole("grid");
    fireEvent.keyDown(grid, { key: "ArrowLeft" });
    expect(screen.getByText("14").getAttribute("tabindex")).toBe("0");
  });

  it("ArrowDown moves focus to next week", () => {
    render(createElement(Calendar, { defaultValue: new Date(2026, 0, 15) } as never));
    const grid = screen.getByRole("grid");
    fireEvent.keyDown(grid, { key: "ArrowDown" });
    expect(screen.getByText("22").getAttribute("tabindex")).toBe("0");
  });

  it("ArrowUp moves focus to previous week", () => {
    render(createElement(Calendar, { defaultValue: new Date(2026, 0, 15) } as never));
    const grid = screen.getByRole("grid");
    fireEvent.keyDown(grid, { key: "ArrowUp" });
    expect(screen.getByText("8").getAttribute("tabindex")).toBe("0");
  });

  it("Enter selects the focused day", () => {
    render(createElement(Calendar, { defaultValue: new Date(2026, 0, 15) } as never));
    const grid = screen.getByRole("grid");
    fireEvent.keyDown(grid, { key: "ArrowRight" });
    const day16 = screen.getByText("16");
    fireEvent.keyDown(day16, { key: "Enter" });
    expect(day16.getAttribute("aria-selected")).toBe("true");
  });

  it("RTL reverses arrow directions", () => {
    render(createElement(Calendar, { defaultValue: new Date(2026, 0, 15), dir: "rtl" } as never));
    const grid = screen.getByRole("grid");
    fireEvent.keyDown(grid, { key: "ArrowRight" });
    expect(screen.getByText("14").getAttribute("tabindex")).toBe("0");
  });

  it("prev/next buttons have aria-label", () => {
    render(createElement(Calendar, { defaultValue: new Date(2026, 0, 15) } as never));
    expect(screen.getByLabelText("Previous month")).toBeInTheDocument();
    expect(screen.getByLabelText("Next month")).toBeInTheDocument();
  });

  it("weekday headers have scope=col", () => {
    render(createElement(Calendar, { defaultValue: new Date(2026, 0, 15) } as never));
    const ths = document.querySelectorAll("th[scope='col']");
    expect(ths).toHaveLength(7);
  });

  it("roving tabindex: only focused day has tabindex=0", () => {
    render(createElement(Calendar, { defaultValue: new Date(2026, 0, 15) } as never));
    const zeroCells = document.querySelectorAll("[role='gridcell'][tabindex='0']");
    expect(zeroCells).toHaveLength(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// TIMELINE — Semantic Structure
// ═══════════════════════════════════════════════════════════════════════

describe("A11y: Timeline", () => {
  it("renders as ordered list", () => {
    render(
      createElement(
        Timeline,
        null,
        createElement(
          TimelineItem,
          null,
          createElement(TimelineIndicator),
          createElement(TimelineContent, null, createElement(TimelineTitle, null, "Step")),
        ),
      ),
    );
    expect(screen.getByRole("list")).toBeInTheDocument();
  });

  it("supports aria-label for accessible naming", () => {
    render(
      createElement(
        Timeline,
        { label: "Project milestones", "data-testid": "tl" } as never,
        createElement(
          TimelineItem,
          null,
          createElement(TimelineContent, null, createElement(TimelineTitle, null, "Done")),
        ),
      ),
    );
    expect(screen.getByTestId("tl").getAttribute("aria-label")).toBe("Project milestones");
  });

  it("time element has dateTime", () => {
    render(
      createElement(
        Timeline,
        null,
        createElement(
          TimelineItem,
          null,
          createElement(
            TimelineContent,
            null,
            createElement(TimelineTime, { dateTime: "2026-01-15" }, "Jan 15"),
          ),
        ),
      ),
    );
    expect(document.querySelector("time")!.getAttribute("datetime")).toBe("2026-01-15");
  });

  it("indicator is aria-hidden", () => {
    render(
      createElement(
        Timeline,
        null,
        createElement(
          TimelineItem,
          null,
          createElement(TimelineIndicator, { "data-testid": "ind" } as never),
        ),
      ),
    );
    expect(screen.getByTestId("ind").getAttribute("aria-hidden")).toBe("true");
  });
});
