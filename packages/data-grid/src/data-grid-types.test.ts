import { describe, it, expectTypeOf } from "vitest";
import type {
  ColumnFilter,
  ExpansionState,
  FilterState,
  RowId,
  SelectionMode,
  SortState,
} from "@kairoui/core/components";
import { DataGrid } from "./data-grid";
import type { DataGridRootProps, FocusState } from "./data-grid-types";
import type {
  ColumnOrder,
  ColumnPinning,
  ColumnSizing,
  ColumnVisibility,
  DataGridColumnDef,
} from "./column-types";
import type { CellEditEvent, EditingMode, RowEditEvent } from "./editing-types";

interface Person {
  readonly id: string;
  readonly name: string;
  readonly age: number;
}

describe("DataGridRootProps type contract", () => {
  it("carries all controlled/uncontrolled state slices with matching shapes", () => {
    expectTypeOf<DataGridRootProps<Person>["sort"]>().toEqualTypeOf<
      readonly SortState[] | undefined
    >();
    expectTypeOf<DataGridRootProps<Person>["filterState"]>().toEqualTypeOf<
      FilterState | undefined
    >();
    expectTypeOf<DataGridRootProps<Person>["selectedIds"]>().toEqualTypeOf<
      ReadonlySet<RowId> | undefined
    >();
    expectTypeOf<DataGridRootProps<Person>["expanded"]>().toEqualTypeOf<
      ExpansionState | undefined
    >();
    expectTypeOf<DataGridRootProps<Person>["columnPinning"]>().toEqualTypeOf<
      ColumnPinning | undefined
    >();
    expectTypeOf<DataGridRootProps<Person>["columnOrder"]>().toEqualTypeOf<
      ColumnOrder | undefined
    >();
    expectTypeOf<DataGridRootProps<Person>["columnSizing"]>().toEqualTypeOf<
      ColumnSizing | undefined
    >();
    expectTypeOf<DataGridRootProps<Person>["columnVisibility"]>().toEqualTypeOf<
      ColumnVisibility | undefined
    >();
  });

  it("selectionMode uses the free-tier SelectionMode union", () => {
    expectTypeOf<DataGridRootProps<Person>["selectionMode"]>().toEqualTypeOf<
      SelectionMode | undefined
    >();
  });

  it("editMode uses the Pro EditingMode union", () => {
    expectTypeOf<DataGridRootProps<Person>["editMode"]>().toEqualTypeOf<EditingMode | undefined>();
  });

  it("onCellEdit and onRowEdit carry the TRow generic", () => {
    expectTypeOf<DataGridRootProps<Person>["onCellEdit"]>().toEqualTypeOf<
      ((event: CellEditEvent<Person>) => void | Promise<void>) | undefined
    >();
    expectTypeOf<DataGridRootProps<Person>["onRowEdit"]>().toEqualTypeOf<
      ((event: RowEditEvent<Person>) => void | Promise<void>) | undefined
    >();
  });

  it("focus state uses the FocusState shape", () => {
    expectTypeOf<DataGridRootProps<Person>["focusState"]>().toEqualTypeOf<FocusState | undefined>();
  });

  it("re-exports ColumnFilter for consumer convenience", () => {
    expectTypeOf<ColumnFilter>().toHaveProperty("columnId");
    expectTypeOf<ColumnFilter>().toHaveProperty("op");
  });
});

describe("DataGrid component type", () => {
  it("accepts DataGridColumnDef<TRow> arrays", () => {
    const columns: readonly DataGridColumnDef<Person>[] = [
      { id: "name", header: "Name", accessorKey: "name" },
    ];
    expectTypeOf(columns).toExtend<readonly DataGridColumnDef<Person>[]>();
  });

  it("data is a readonly TRow array", () => {
    expectTypeOf<DataGridRootProps<Person>["data"]>().toEqualTypeOf<readonly Person[]>();
  });

  it("getRowId returns RowId", () => {
    expectTypeOf<DataGridRootProps<Person>["getRowId"]>().toEqualTypeOf<(row: Person) => RowId>();
  });
});

describe("DataGrid — generic inference", () => {
  it("infers TRow through the columns generic", () => {
    // Compile-time only: this block should typecheck.
    type ColumnsForPerson = DataGridRootProps<Person>["columns"];
    expectTypeOf<ColumnsForPerson>().toEqualTypeOf<readonly DataGridColumnDef<Person>[]>();

    const personGetter: DataGridRootProps<Person>["getRowId"] = (row) => {
      expectTypeOf(row).toEqualTypeOf<Person>();
      return row.id;
    };
    expectTypeOf(personGetter).toEqualTypeOf<(row: Person) => RowId>();
    void DataGrid;
  });
});
