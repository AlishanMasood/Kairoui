/**
 * Consumer integration test — validates Phase 12 data components from an
 * external consumer perspective. Imports ONLY from approved package exports.
 */
import { describe, it, expect, afterEach, vi } from "vitest";
import { createElement, createRef, StrictMode } from "react";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Consumer imports ONLY from approved package export paths
import {
  List,
  ListItem,
  DescriptionList,
  DescriptionTerm,
  DescriptionDetails,
  EmptyState,
  EmptyStateTitle,
  EmptyStateDescription,
  EmptyStateActions,
  Table,
  TableCaption,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  DataTable,
  column,
  TreeView,
  TreeViewItem,
  TreeViewItemTrigger,
  TreeViewItemContent,
  TreeViewIndicator,
  Timeline,
  TimelineItem,
  TimelineIndicator,
  TimelineContent,
  TimelineTitle,
  Calendar,
} from "@kairoui/core/components";

afterEach(cleanup);

// ═══════════════════════════════════════════════════════════════════════
// PACKAGE EXPORTS
// ═══════════════════════════════════════════════════════════════════════

describe("Consumer: Phase 12 package exports", () => {
  it("List components are available", () => {
    expect(typeof List).toBe("object");
    expect(typeof ListItem).toBe("object");
  });

  it("DescriptionList components are available", () => {
    expect(typeof DescriptionList).toBe("object");
    expect(typeof DescriptionTerm).toBe("object");
    expect(typeof DescriptionDetails).toBe("object");
  });

  it("EmptyState components are available", () => {
    expect(typeof EmptyState).toBe("object");
    expect(typeof EmptyStateTitle).toBe("object");
    expect(typeof EmptyStateDescription).toBe("object");
    expect(typeof EmptyStateActions).toBe("object");
  });

  it("Table components are available", () => {
    expect(typeof Table).toBe("object");
    expect(typeof TableHeader).toBe("object");
    expect(typeof TableBody).toBe("object");
    expect(typeof TableRow).toBe("object");
    expect(typeof TableHead).toBe("object");
    expect(typeof TableCell).toBe("object");
  });

  it("DataTable and column helper are available", () => {
    expect(typeof DataTable).toBe("object");
    expect(typeof column).toBe("function");
  });

  it("TreeView components are available", () => {
    expect(typeof TreeView).toBe("object");
    expect(typeof TreeViewItem).toBe("object");
    expect(typeof TreeViewItemTrigger).toBe("object");
    expect(typeof TreeViewItemContent).toBe("object");
    expect(typeof TreeViewIndicator).toBe("object");
  });

  it("Timeline components are available", () => {
    expect(typeof Timeline).toBe("object");
    expect(typeof TimelineItem).toBe("object");
    expect(typeof TimelineIndicator).toBe("object");
    expect(typeof TimelineContent).toBe("object");
    expect(typeof TimelineTitle).toBe("object");
  });

  it("Calendar is available", () => {
    expect(typeof Calendar).toBe("object");
  });
});

// ═══════════════════════════════════════════════════════════════════════
// SEMANTIC TABLE — Consumer Usage
// ═══════════════════════════════════════════════════════════════════════

describe("Consumer: semantic Table", () => {
  it("renders accessible table with caption", () => {
    render(
      createElement(
        Table,
        null,
        createElement(TableCaption, null, "Sales Data"),
        createElement(
          TableHeader,
          null,
          createElement(
            TableRow,
            null,
            createElement(TableHead, null, "Product"),
            createElement(TableHead, { align: "end" } as never, "Revenue"),
          ),
        ),
        createElement(
          TableBody,
          null,
          createElement(
            TableRow,
            null,
            createElement(TableCell, null, "Widget"),
            createElement(TableCell, { align: "end" } as never, "$1,200"),
          ),
        ),
      ),
    );
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByText("Sales Data").tagName).toBe("CAPTION");
    expect(screen.getAllByRole("columnheader")).toHaveLength(2);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// DATATABLE — Typed Consumer Usage
// ═══════════════════════════════════════════════════════════════════════

describe("Consumer: typed DataTable", () => {
  interface Product {
    id: string;
    name: string;
    price: number;
    inStock: boolean;
  }

  const products: Product[] = [
    { id: "p1", name: "Widget", price: 29.99, inStock: true },
    { id: "p2", name: "Gadget", price: 49.99, inStock: false },
    { id: "p3", name: "Doohickey", price: 9.99, inStock: true },
  ];

  const productCols = [
    column<Product>({ id: "name", header: "Name", accessorKey: "name", sortable: true }),
    column<Product>({
      id: "price",
      header: "Price",
      accessorKey: "price",
      sortable: true,
      align: "end",
      cell: (value) => `$${(value as number).toFixed(2)}`,
    }),
    column<Product>({
      id: "stock",
      header: "In Stock",
      accessorFn: (row) => (row.inStock ? "Yes" : "No"),
    }),
  ];

  it("renders with typed columns and custom cell renderer", () => {
    render(
      createElement(DataTable, {
        data: products,
        columns: productCols,
        getRowId: (p: Product) => p.id,
      } as never),
    );
    expect(screen.getByText("Widget")).toBeInTheDocument();
    expect(screen.getByText("$29.99")).toBeInTheDocument();
    expect(screen.getAllByText("Yes")).toHaveLength(2);
  });

  it("controlled sorting", () => {
    const onSortChange = vi.fn();
    render(
      createElement(DataTable, {
        data: products,
        columns: productCols,
        getRowId: (p: Product) => p.id,
        sort: { columnId: "name", direction: "ascending" },
        onSortChange,
      } as never),
    );
    const nameHeader = screen.getByText("Name").closest("th")!;
    expect(nameHeader.getAttribute("aria-sort")).toBe("ascending");
    fireEvent.click(nameHeader);
    expect(onSortChange).toHaveBeenCalled();
  });

  it("controlled selection", () => {
    const onSelectionChange = vi.fn();
    const selected = new Set(["p1"]);
    render(
      createElement(DataTable, {
        data: products,
        columns: productCols,
        getRowId: (p: Product) => p.id,
        selectionMode: "multiple",
        selectedIds: selected,
        onSelectionChange,
      } as never),
    );
    const rows = screen.getAllByRole("row");
    expect(rows[1]!.getAttribute("aria-selected")).toBe("true");
  });

  it("empty state renders when data is empty", () => {
    render(
      createElement(DataTable, {
        data: [],
        columns: productCols,
        getRowId: (p: Product) => p.id,
        emptyState: createElement(
          EmptyState,
          null,
          createElement(EmptyStateTitle, null, "No products"),
          createElement(EmptyStateDescription, null, "Add some products to see them here."),
        ),
      } as never),
    );
    expect(screen.getByText("No products")).toBeInTheDocument();
  });
});

// ═══════════════════════════════════════════════════════════════════════
// TREEVIEW — Hierarchical Consumer Usage
// ═══════════════════════════════════════════════════════════════════════

describe("Consumer: TreeView hierarchy", () => {
  it("renders hierarchical tree with expansion control", () => {
    const onExpandedChange = vi.fn();
    render(
      createElement(
        TreeView,
        {
          expandedIds: new Set(["src"]),
          onExpandedChange,
        } as never,
        createElement(
          TreeViewItem,
          { value: "src" },
          createElement(TreeViewItemTrigger, null, createElement(TreeViewIndicator), " src"),
          createElement(
            TreeViewItemContent,
            null,
            createElement(
              TreeViewItem,
              { value: "index.ts" },
              createElement(TreeViewItemTrigger, null, "index.ts"),
            ),
            createElement(
              TreeViewItem,
              { value: "utils.ts" },
              createElement(TreeViewItemTrigger, null, "utils.ts"),
            ),
          ),
        ),
      ),
    );
    expect(screen.getByRole("tree")).toBeInTheDocument();
    expect(screen.getByText("index.ts")).toBeInTheDocument();
    expect(screen.getByText("utils.ts")).toBeInTheDocument();
  });

  it("controlled expansion calls onExpandedChange", () => {
    const onExpandedChange = vi.fn();
    render(
      createElement(
        TreeView,
        { expandedIds: new Set<string>(), onExpandedChange } as never,
        createElement(
          TreeViewItem,
          { value: "folder" },
          createElement(TreeViewItemTrigger, { "data-testid": "trigger" } as never, "Folder"),
          createElement(
            TreeViewItemContent,
            null,
            createElement(
              TreeViewItem,
              { value: "file" },
              createElement(TreeViewItemTrigger, null, "File"),
            ),
          ),
        ),
      ),
    );
    fireEvent.keyDown(screen.getByTestId("trigger"), { key: "ArrowRight" });
    expect(onExpandedChange).toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════
// CALENDAR — Controlled Selection
// ═══════════════════════════════════════════════════════════════════════

describe("Consumer: Calendar controlled selection", () => {
  it("controlled value shows selected date", () => {
    render(createElement(Calendar, { value: new Date(2026, 0, 20) } as never));
    const day20 = screen.getByText("20");
    expect(day20.getAttribute("aria-selected")).toBe("true");
  });

  it("calls onValueChange on date click", () => {
    const onChange = vi.fn();
    render(
      createElement(Calendar, {
        value: new Date(2026, 0, 15),
        onValueChange: onChange,
      } as never),
    );
    fireEvent.click(screen.getByText("22"));
    expect(onChange).toHaveBeenCalled();
    const selected = onChange.mock.calls[0]![0] as Date;
    expect(selected.getDate()).toBe(22);
  });

  it("supports min/max constraints from consumer", () => {
    render(
      createElement(Calendar, {
        value: new Date(2026, 0, 15),
        min: new Date(2026, 0, 10),
        max: new Date(2026, 0, 25),
      } as never),
    );
    // Day 5 is before min — should be disabled
    const day5 = screen.getByText("5");
    expect(day5.getAttribute("aria-disabled")).toBe("true");
    // Day 15 is in range — should not be disabled
    const day15 = screen.getByText("15");
    expect(day15.getAttribute("aria-disabled")).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════
// REF FORWARDING
// ═══════════════════════════════════════════════════════════════════════

describe("Consumer: ref forwarding", () => {
  it("Table forwards ref", () => {
    const ref = createRef<HTMLTableElement>();
    render(createElement(Table, { ref }, createElement(TableBody, null)));
    expect(ref.current?.tagName).toBe("TABLE");
  });

  it("TreeView forwards ref", () => {
    const ref = createRef<HTMLUListElement>();
    render(createElement(TreeView, { ref }));
    expect(ref.current?.tagName).toBe("UL");
  });

  it("Calendar forwards ref", () => {
    const ref = createRef<HTMLDivElement>();
    render(createElement(Calendar, { ref }));
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it("Timeline forwards ref", () => {
    const ref = createRef<HTMLOListElement>();
    render(createElement(Timeline, { ref }));
    expect(ref.current?.tagName).toBe("OL");
  });

  it("List forwards ref", () => {
    const ref = createRef<HTMLUListElement>();
    render(createElement(List, { ref }, createElement(ListItem, null, "A")));
    expect(ref.current?.tagName).toBe("UL");
  });

  it("EmptyState forwards ref", () => {
    const ref = createRef<HTMLDivElement>();
    render(createElement(EmptyState, { ref }, createElement(EmptyStateTitle, null, "E")));
    expect(ref.current?.tagName).toBe("DIV");
  });
});

// ═══════════════════════════════════════════════════════════════════════
// SSR
// ═══════════════════════════════════════════════════════════════════════

describe("Consumer: SSR rendering", () => {
  it("DataTable renders to string", () => {
    interface User {
      id: number;
      name: string;
    }
    const html = renderToString(
      createElement(DataTable, {
        data: [{ id: 1, name: "Alice" }],
        columns: [column<User>({ id: "name", header: "Name", accessorKey: "name" })],
        getRowId: (u: User) => u.id,
      } as never),
    );
    expect(html).toContain("Alice");
    expect(html).toContain("<table");
  });

  it("TreeView renders to string", () => {
    const html = renderToString(
      createElement(
        TreeView,
        { defaultExpandedIds: new Set(["root"]) } as never,
        createElement(
          TreeViewItem,
          { value: "root" },
          createElement(TreeViewItemTrigger, null, "Root"),
          createElement(
            TreeViewItemContent,
            null,
            createElement(
              TreeViewItem,
              { value: "child" },
              createElement(TreeViewItemTrigger, null, "Child"),
            ),
          ),
        ),
      ),
    );
    expect(html).toContain('role="tree"');
    expect(html).toContain("Root");
    expect(html).toContain("Child");
  });

  it("Calendar renders to string", () => {
    const html = renderToString(
      createElement(Calendar, { defaultValue: new Date(2026, 5, 15) } as never),
    );
    expect(html).toContain('role="grid"');
    expect(html).toContain("June");
  });

  it("Timeline renders to string", () => {
    const html = renderToString(
      createElement(
        Timeline,
        null,
        createElement(
          TimelineItem,
          null,
          createElement(TimelineIndicator),
          createElement(TimelineContent, null, createElement(TimelineTitle, null, "Event")),
        ),
      ),
    );
    expect(html).toContain("<ol");
    expect(html).toContain("Event");
  });
});

// ═══════════════════════════════════════════════════════════════════════
// STRICT MODE
// ═══════════════════════════════════════════════════════════════════════

describe("Consumer: Strict Mode", () => {
  it("DataTable works in StrictMode", () => {
    interface Item {
      id: number;
      x: string;
    }
    render(
      createElement(
        StrictMode,
        null,
        createElement(DataTable, {
          data: [{ id: 1, x: "a" }],
          columns: [column<Item>({ id: "x", header: "X", accessorKey: "x" })],
          getRowId: (i: Item) => i.id,
        } as never),
      ),
    );
    expect(screen.getByRole("table")).toBeInTheDocument();
  });

  it("TreeView works in StrictMode", () => {
    render(
      createElement(
        StrictMode,
        null,
        createElement(
          TreeView,
          null,
          createElement(
            TreeViewItem,
            { value: "a" },
            createElement(TreeViewItemTrigger, null, "A"),
          ),
        ),
      ),
    );
    expect(screen.getByRole("tree")).toBeInTheDocument();
  });

  it("Calendar works in StrictMode", () => {
    render(createElement(StrictMode, null, createElement(Calendar)));
    expect(screen.getByRole("grid")).toBeInTheDocument();
  });
});

// ═══════════════════════════════════════════════════════════════════════
// TREE SHAKING
// ═══════════════════════════════════════════════════════════════════════

describe("Consumer: tree-shaking readiness", () => {
  it("sideEffects configured for CSS only", () => {
    const pkgPath = resolve(import.meta.dirname, "../../package.json");
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8")) as { sideEffects: string[] };
    expect(pkg.sideEffects).toEqual(["**/*.css"]);
  });
});
