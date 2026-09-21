/**
 * Compile-time type contracts for `@kairoui-pro/data-grid` column defs.
 *
 * These tests exercise the type surface without asserting runtime behavior.
 * They fail the build (via `pnpm typecheck`) if the contracts drift.
 */
import { describe, it, expectTypeOf } from "vitest";
import type {
  ColumnFilter,
  DataTableColumnDef,
  FilterState,
  SortDirection,
  SortState,
} from "@kairoui/core/components";
import type {
  AggregationSpec,
  ColumnPinSide,
  ColumnPinning,
  ColumnRuntime,
  ColumnSizing,
  ColumnState,
  ColumnVisibility,
  DataGridColumnDef,
  EditCellRenderer,
  ValidationResult,
} from "./column-types";

interface Person {
  readonly id: string;
  readonly name: string;
  readonly age: number;
}

describe("DataGridColumnDef", () => {
  it("extends DataTableColumnDef structurally", () => {
    expectTypeOf<DataGridColumnDef<Person>>().toExtend<DataTableColumnDef<Person>>();
  });

  it("keeps strong TRow inference through accessorKey", () => {
    const column: DataGridColumnDef<Person> = { id: "name", header: "Name", accessorKey: "name" };
    expectTypeOf(column.accessorKey).toEqualTypeOf<keyof Person | undefined>();
  });

  it("keeps strong TRow inference through accessorFn", () => {
    const column: DataGridColumnDef<Person> = {
      id: "meta",
      header: "Meta",
      accessorFn: (row) => {
        expectTypeOf(row).toEqualTypeOf<Person>();
        return row.name.length;
      },
    };
    expectTypeOf(column.accessorFn).toEqualTypeOf<((row: Person) => unknown) | undefined>();
  });

  it("carries Pro fields with the documented shapes", () => {
    const column: DataGridColumnDef<Person> = {
      id: "age",
      header: "Age",
      width: 100,
      minWidth: 60,
      maxWidth: 400,
      defaultWidth: 120,
      resizable: true,
      reorderable: true,
      pinnable: true,
      hideable: true,
      sortFn: (a, b) => a.age - b.age,
      filterMode: "client",
      groupable: true,
      groupFn: (row) => row.age,
      editable: true,
      editCell: (ctx) => String(ctx.rawInput),
      parseEdit: (input) => Number(input),
      validateEdit: (input): ValidationResult => ({ ok: Number.isFinite(Number(input)) }),
      exportValue: (row) => row.age,
      meta: { badge: "compact" },
    };
    expectTypeOf(column.sortFn).toEqualTypeOf<((a: Person, b: Person) => number) | undefined>();
    expectTypeOf(column.groupFn).toEqualTypeOf<((row: Person) => string | number) | undefined>();
    expectTypeOf(column.exportValue).toEqualTypeOf<((row: Person) => unknown) | undefined>();
  });

  it("does not use `any` on the aggregate reducer", () => {
    const spec: AggregationSpec<Person> = {
      reducer: (values, rows) => {
        expectTypeOf(values).toEqualTypeOf<readonly unknown[]>();
        expectTypeOf(rows).toEqualTypeOf<readonly Person[]>();
        return 0;
      },
    };
    expectTypeOf(spec.reducer).not.toBeAny();
  });
});

describe("EditCellRenderer", () => {
  it("preserves TRow in the render context", () => {
    const renderer: EditCellRenderer<Person> = (ctx) => {
      expectTypeOf(ctx.row).toEqualTypeOf<Person>();
      expectTypeOf(ctx.rawInput).toBeUnknown();
      expectTypeOf(ctx.validation).toEqualTypeOf<ValidationResult>();
      return null;
    };
    void renderer;
  });
});

describe("ColumnState", () => {
  it("keeps slice fields readonly with the documented shapes", () => {
    expectTypeOf<ColumnState["order"]>().toEqualTypeOf<readonly string[]>();
    expectTypeOf<ColumnState["pinned"]>().toEqualTypeOf<ColumnPinning>();
    expectTypeOf<ColumnState["sizing"]>().toEqualTypeOf<ColumnSizing>();
    expectTypeOf<ColumnState["visibility"]>().toEqualTypeOf<ColumnVisibility>();
  });

  it("does not include the byId map — that would leak internal state", () => {
    expectTypeOf<ColumnState>().not.toHaveProperty("byId");
  });
});

describe("ColumnRuntime", () => {
  it("carries sort/filter projections from external state", () => {
    expectTypeOf<ColumnRuntime["sortIndex"]>().toEqualTypeOf<number | null>();
    expectTypeOf<ColumnRuntime["sortDirection"]>().toEqualTypeOf<SortDirection | null>();
    expectTypeOf<ColumnRuntime["filter"]>().toEqualTypeOf<ColumnFilter | null>();
    expectTypeOf<ColumnRuntime["pinned"]>().toEqualTypeOf<ColumnPinSide | null>();
  });
});

describe("Reused free-tier contracts", () => {
  it("uses FilterState and SortState shapes without redefinition", () => {
    expectTypeOf<FilterState>().toHaveProperty("globalFilter");
    expectTypeOf<SortState>().toHaveProperty("direction");
  });
});

describe("Homogenous column arrays", () => {
  it("never widens `readonly DataGridColumnDef<TRow>[]` to a tuple", () => {
    const _columns = [
      { id: "name", header: "Name", accessorKey: "name" },
      { id: "age", header: "Age", accessorKey: "age" },
    ] as const satisfies readonly DataGridColumnDef<Person>[];

    expectTypeOf<typeof _columns>().toExtend<readonly DataGridColumnDef<Person>[]>();
  });
});
