import { describe, it, expectTypeOf } from "vitest";
import type {
  DataTableColumnDef,
  DataTableSortProps,
  DataTableSelectionProps,
  DataTableRootProps,
  DataTableContextValue,
} from "./data-table-types";
import type { RowId, SortState, SelectionMode } from "../data/data-types";

// ─── Test row type ──────────────────────────────────────────────────

interface User {
  id: number;
  name: string;
  email: string;
  age: number;
}

// ─── Column definition type inference ───────────────────────────────

describe("DataTable architecture: column definitions", () => {
  it("accessorKey is constrained to string keys of TRow", () => {
    type Col = DataTableColumnDef<User>;
    expectTypeOf<Col["accessorKey"]>().toEqualTypeOf<"id" | "name" | "email" | "age" | undefined>();
  });

  it("accessorFn receives the row type", () => {
    type Col = DataTableColumnDef<User>;
    type AccessorFn = NonNullable<Col["accessorFn"]>;
    expectTypeOf<AccessorFn>().toBeFunction();
    expectTypeOf<Parameters<AccessorFn>[0]>().toEqualTypeOf<User>();
  });

  it("cell receives value and row", () => {
    type Col = DataTableColumnDef<User>;
    type CellFn = NonNullable<Col["cell"]>;
    expectTypeOf<Parameters<CellFn>[1]>().toEqualTypeOf<User>();
  });

  it("has required id", () => {
    expectTypeOf<DataTableColumnDef<User>>().toHaveProperty("id");
    expectTypeOf<DataTableColumnDef<User>["id"]>().toEqualTypeOf<string>();
  });

  it("supports sortable and align", () => {
    expectTypeOf<DataTableColumnDef<User>>().toHaveProperty("sortable");
    expectTypeOf<DataTableColumnDef<User>>().toHaveProperty("align");
  });
});

// ─── Sort props ─────────────────────────────────────────────────────

describe("DataTable architecture: sort props", () => {
  it("supports controlled sort state", () => {
    expectTypeOf<DataTableSortProps>().toHaveProperty("sort");
    expectTypeOf<DataTableSortProps["sort"]>().toEqualTypeOf<SortState | undefined>();
  });

  it("supports uncontrolled default sort", () => {
    expectTypeOf<DataTableSortProps>().toHaveProperty("defaultSort");
  });

  it("has sort change callback", () => {
    expectTypeOf<DataTableSortProps>().toHaveProperty("onSortChange");
    type Cb = NonNullable<DataTableSortProps["onSortChange"]>;
    expectTypeOf<Parameters<Cb>[0]>().toEqualTypeOf<SortState | undefined>();
  });
});

// ─── Selection props ────────────────────────────────────────────────

describe("DataTable architecture: selection props", () => {
  it("supports selection mode", () => {
    expectTypeOf<DataTableSelectionProps>().toHaveProperty("selectionMode");
    expectTypeOf<DataTableSelectionProps["selectionMode"]>().toEqualTypeOf<
      SelectionMode | undefined
    >();
  });

  it("supports controlled selection", () => {
    expectTypeOf<DataTableSelectionProps>().toHaveProperty("selectedIds");
    expectTypeOf<DataTableSelectionProps["selectedIds"]>().toEqualTypeOf<
      ReadonlySet<RowId> | undefined
    >();
  });

  it("supports uncontrolled default selection", () => {
    expectTypeOf<DataTableSelectionProps>().toHaveProperty("defaultSelectedIds");
  });

  it("has selection change callback", () => {
    expectTypeOf<DataTableSelectionProps>().toHaveProperty("onSelectionChange");
    type Cb = NonNullable<DataTableSelectionProps["onSelectionChange"]>;
    expectTypeOf<Parameters<Cb>[0]>().toEqualTypeOf<ReadonlySet<RowId>>();
  });
});

// ─── Root props ─────────────────────────────────────────────────────

describe("DataTable architecture: root props", () => {
  it("is generic over row type", () => {
    type Props = DataTableRootProps<User>;
    expectTypeOf<Props["data"]>().toEqualTypeOf<readonly User[]>();
    expectTypeOf<Props["columns"]>().toEqualTypeOf<readonly DataTableColumnDef<User>[]>();
  });

  it("requires getRowId", () => {
    type Props = DataTableRootProps<User>;
    expectTypeOf<Props["getRowId"]>().toBeFunction();
    type Fn = Props["getRowId"];
    expectTypeOf<Parameters<Fn>[0]>().toEqualTypeOf<User>();
    expectTypeOf<ReturnType<Fn>>().toEqualTypeOf<RowId>();
  });

  it("inherits sort props", () => {
    type Props = DataTableRootProps<User>;
    expectTypeOf<Props>().toHaveProperty("sort");
    expectTypeOf<Props>().toHaveProperty("onSortChange");
  });

  it("inherits selection props", () => {
    type Props = DataTableRootProps<User>;
    expectTypeOf<Props>().toHaveProperty("selectionMode");
    expectTypeOf<Props>().toHaveProperty("selectedIds");
    expectTypeOf<Props>().toHaveProperty("onSelectionChange");
  });

  it("supports empty and loading states", () => {
    type Props = DataTableRootProps<User>;
    expectTypeOf<Props>().toHaveProperty("emptyState");
    expectTypeOf<Props>().toHaveProperty("loading");
  });
});

// ─── Context value ──────────────────────────────────────────────────

describe("DataTable architecture: context", () => {
  it("exposes data and columns", () => {
    type Ctx = DataTableContextValue<User>;
    expectTypeOf<Ctx["data"]>().toEqualTypeOf<readonly User[]>();
    expectTypeOf<Ctx["columns"]>().toEqualTypeOf<readonly DataTableColumnDef<User>[]>();
  });

  it("exposes sort state and callback", () => {
    type Ctx = DataTableContextValue<User>;
    expectTypeOf<Ctx["sort"]>().toEqualTypeOf<SortState | undefined>();
    expectTypeOf<Ctx["onSortChange"]>().toBeFunction();
  });

  it("exposes selection state and callback", () => {
    type Ctx = DataTableContextValue<User>;
    expectTypeOf<Ctx["selectionMode"]>().toEqualTypeOf<SelectionMode>();
    expectTypeOf<Ctx["selectedIds"]>().toEqualTypeOf<ReadonlySet<RowId>>();
    expectTypeOf<Ctx["onSelectionChange"]>().toBeFunction();
  });

  it("exposes loading state", () => {
    type Ctx = DataTableContextValue<User>;
    expectTypeOf<Ctx["loading"]>().toEqualTypeOf<boolean>();
  });
});
