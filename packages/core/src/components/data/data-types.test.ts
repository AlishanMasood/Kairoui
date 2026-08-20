import { describe, it, expectTypeOf } from "vitest";
import type {
  RowId,
  SortDirection,
  SortState,
  SelectionMode,
  ExpansionState,
  ColumnAlign,
  ColumnDef,
  TreeNodeMeta,
  CalendarDay,
  CalendarWeek,
  ListProps,
  ListItemProps,
  DescriptionListProps,
  DescriptionTermProps,
  DescriptionDetailsProps,
  EmptyStateProps,
  EmptyStateTitleProps,
  EmptyStateDescriptionProps,
  EmptyStateIconProps,
  EmptyStateActionsProps,
  TableProps,
  TableCaptionProps,
  TableHeaderProps,
  TableBodyProps,
  TableFooterProps,
  TableRowProps,
  TableHeadProps,
  TableCellProps,
  DataTableProps,
  TreeViewProps,
  TreeViewItemProps,
  TimelineProps,
  TimelineItemProps,
  CalendarProps,
} from "./data-types";

// ─── Shared data concepts ───────────────────────────────────────────

describe("Data architecture: shared concepts", () => {
  it("RowId is string | number", () => {
    expectTypeOf<RowId>().toEqualTypeOf<string | number>();
  });

  it("SortDirection is ascending | descending", () => {
    expectTypeOf<SortDirection>().toEqualTypeOf<"ascending" | "descending">();
  });

  it("SortState has columnId and direction", () => {
    expectTypeOf<SortState>().toHaveProperty("columnId");
    expectTypeOf<SortState>().toHaveProperty("direction");
  });

  it("SelectionMode is none | single | multiple", () => {
    expectTypeOf<SelectionMode>().toEqualTypeOf<"none" | "single" | "multiple">();
  });

  it("ExpansionState has expandedIds as ReadonlySet", () => {
    expectTypeOf<ExpansionState>().toHaveProperty("expandedIds");
    expectTypeOf<ExpansionState["expandedIds"]>().toEqualTypeOf<ReadonlySet<RowId>>();
  });

  it("ColumnAlign is start | center | end", () => {
    expectTypeOf<ColumnAlign>().toEqualTypeOf<"start" | "center" | "end">();
  });
});

// ─── Column definitions ─────────────────────────────────────────────

describe("Data architecture: column definitions", () => {
  it("ColumnDef is generic over row type", () => {
    type Row = { name: string; age: number };
    type Col = ColumnDef<Row>;
    expectTypeOf<Col>().toHaveProperty("id");
    expectTypeOf<Col>().toHaveProperty("header");
    expectTypeOf<Col>().toHaveProperty("accessorKey");
    expectTypeOf<Col>().toHaveProperty("accessorFn");
    expectTypeOf<Col>().toHaveProperty("cell");
    expectTypeOf<Col>().toHaveProperty("sortable");
    expectTypeOf<Col>().toHaveProperty("align");
  });

  it("accessorKey is constrained to string keys of TRow", () => {
    type Row = { name: string; age: number };
    type Col = ColumnDef<Row>;
    expectTypeOf<Col["accessorKey"]>().toEqualTypeOf<"name" | "age" | undefined>();
  });
});

// ─── Hierarchical data ──────────────────────────────────────────────

describe("Data architecture: hierarchical data", () => {
  it("TreeNodeMeta has id, parentId, depth, hasChildren", () => {
    expectTypeOf<TreeNodeMeta>().toHaveProperty("id");
    expectTypeOf<TreeNodeMeta>().toHaveProperty("parentId");
    expectTypeOf<TreeNodeMeta>().toHaveProperty("depth");
    expectTypeOf<TreeNodeMeta>().toHaveProperty("hasChildren");
  });
});

// ─── Calendar model ─────────────────────────────────────────────────

describe("Data architecture: calendar model", () => {
  it("CalendarDay has date, day, isToday, isOutsideMonth, isDisabled, isSelected", () => {
    expectTypeOf<CalendarDay>().toHaveProperty("date");
    expectTypeOf<CalendarDay>().toHaveProperty("day");
    expectTypeOf<CalendarDay>().toHaveProperty("isToday");
    expectTypeOf<CalendarDay>().toHaveProperty("isOutsideMonth");
    expectTypeOf<CalendarDay>().toHaveProperty("isDisabled");
    expectTypeOf<CalendarDay>().toHaveProperty("isSelected");
  });

  it("CalendarWeek is readonly array of CalendarDay", () => {
    expectTypeOf<CalendarWeek>().toExtend<readonly CalendarDay[]>();
  });
});

// ─── Presentation component contracts ───────────────────────────────

describe("Data architecture: List", () => {
  it("ListProps supports variant", () => {
    expectTypeOf<ListProps>().toHaveProperty("variant");
  });

  it("ListItemProps has children and className", () => {
    expectTypeOf<ListItemProps>().toHaveProperty("children");
    expectTypeOf<ListItemProps>().toHaveProperty("className");
  });
});

describe("Data architecture: DescriptionList", () => {
  it("DescriptionListProps supports layout", () => {
    expectTypeOf<DescriptionListProps>().toHaveProperty("layout");
  });

  it("DescriptionTermProps and DescriptionDetailsProps have children", () => {
    expectTypeOf<DescriptionTermProps>().toHaveProperty("children");
    expectTypeOf<DescriptionDetailsProps>().toHaveProperty("children");
  });
});

describe("Data architecture: EmptyState", () => {
  it("EmptyState has compound component props", () => {
    expectTypeOf<EmptyStateProps>().toHaveProperty("children");
    expectTypeOf<EmptyStateTitleProps>().toHaveProperty("children");
    expectTypeOf<EmptyStateDescriptionProps>().toHaveProperty("children");
    expectTypeOf<EmptyStateIconProps>().toHaveProperty("children");
    expectTypeOf<EmptyStateActionsProps>().toHaveProperty("children");
  });
});

// ─── Table (presentation) ───────────────────────────────────────────

describe("Data architecture: Table", () => {
  it("Table has standard table section props", () => {
    expectTypeOf<TableProps>().toHaveProperty("children");
    expectTypeOf<TableCaptionProps>().toHaveProperty("children");
    expectTypeOf<TableHeaderProps>().toHaveProperty("children");
    expectTypeOf<TableBodyProps>().toHaveProperty("children");
    expectTypeOf<TableFooterProps>().toHaveProperty("children");
  });

  it("TableRowProps supports selected state", () => {
    expectTypeOf<TableRowProps>().toHaveProperty("selected");
  });

  it("TableHeadProps supports sort metadata", () => {
    expectTypeOf<TableHeadProps>().toHaveProperty("align");
    expectTypeOf<TableHeadProps>().toHaveProperty("sortDirection");
    expectTypeOf<TableHeadProps>().toHaveProperty("onSort");
  });

  it("TableCellProps supports alignment", () => {
    expectTypeOf<TableCellProps>().toHaveProperty("align");
  });
});

// ─── DataTable (stateful) ───────────────────────────────────────────

describe("Data architecture: DataTable", () => {
  it("DataTableProps is generic over row type", () => {
    type Row = { id: number; name: string };
    type Props = DataTableProps<Row>;
    expectTypeOf<Props>().toHaveProperty("data");
    expectTypeOf<Props>().toHaveProperty("columns");
    expectTypeOf<Props>().toHaveProperty("getRowId");
  });

  it("DataTableProps supports controlled sort", () => {
    type Props = DataTableProps<{ x: string }>;
    expectTypeOf<Props>().toHaveProperty("sort");
    expectTypeOf<Props>().toHaveProperty("defaultSort");
    expectTypeOf<Props>().toHaveProperty("onSortChange");
  });

  it("DataTableProps supports selection", () => {
    type Props = DataTableProps<{ x: string }>;
    expectTypeOf<Props>().toHaveProperty("selectionMode");
    expectTypeOf<Props>().toHaveProperty("selectedIds");
    expectTypeOf<Props>().toHaveProperty("defaultSelectedIds");
    expectTypeOf<Props>().toHaveProperty("onSelectionChange");
  });

  it("DataTableProps supports empty and loading states", () => {
    type Props = DataTableProps<{ x: string }>;
    expectTypeOf<Props>().toHaveProperty("emptyState");
    expectTypeOf<Props>().toHaveProperty("loading");
  });
});

// ─── TreeView ───────────────────────────────────────────────────────

describe("Data architecture: TreeView", () => {
  it("TreeViewProps supports expansion", () => {
    expectTypeOf<TreeViewProps>().toHaveProperty("expandedIds");
    expectTypeOf<TreeViewProps>().toHaveProperty("defaultExpandedIds");
    expectTypeOf<TreeViewProps>().toHaveProperty("onExpandedChange");
  });

  it("TreeViewProps supports selection", () => {
    expectTypeOf<TreeViewProps>().toHaveProperty("selectionMode");
    expectTypeOf<TreeViewProps>().toHaveProperty("selectedIds");
    expectTypeOf<TreeViewProps>().toHaveProperty("onSelectionChange");
  });

  it("TreeViewItemProps requires value", () => {
    expectTypeOf<TreeViewItemProps>().toHaveProperty("value");
    expectTypeOf<TreeViewItemProps>().toHaveProperty("disabled");
  });
});

// ─── Timeline ───────────────────────────────────────────────────────

describe("Data architecture: Timeline", () => {
  it("TimelineProps supports orientation", () => {
    expectTypeOf<TimelineProps>().toHaveProperty("orientation");
  });

  it("TimelineItemProps has children", () => {
    expectTypeOf<TimelineItemProps>().toHaveProperty("children");
  });
});

// ─── Calendar ───────────────────────────────────────────────────────

describe("Data architecture: Calendar", () => {
  it("CalendarProps supports controlled/uncontrolled date", () => {
    expectTypeOf<CalendarProps>().toHaveProperty("value");
    expectTypeOf<CalendarProps>().toHaveProperty("defaultValue");
    expectTypeOf<CalendarProps>().toHaveProperty("onValueChange");
  });

  it("CalendarProps supports constraints", () => {
    expectTypeOf<CalendarProps>().toHaveProperty("min");
    expectTypeOf<CalendarProps>().toHaveProperty("max");
    expectTypeOf<CalendarProps>().toHaveProperty("disabled");
  });

  it("CalendarProps supports locale and week start", () => {
    expectTypeOf<CalendarProps>().toHaveProperty("locale");
    expectTypeOf<CalendarProps>().toHaveProperty("weekStartsOn");
    expectTypeOf<CalendarProps>().toHaveProperty("dir");
  });
});
