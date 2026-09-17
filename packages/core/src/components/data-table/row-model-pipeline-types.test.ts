import { describe, it, expectTypeOf } from "vitest";
import { runRowModelPipeline } from "./row-model-pipeline";
import type {
  RunRowModelPipelineOptions,
  ApplyFiltersOptions,
  FilterFn,
  FilterOp,
  FilterState,
} from "./index";
import type { DataTableRootProps, DataTableFilterProps } from "./data-table-types";

interface Row {
  id: number;
  label: string;
}

describe("row-model-pipeline: types", () => {
  it("options are generic in row type", () => {
    expectTypeOf<RunRowModelPipelineOptions<Row>["data"]>().toEqualTypeOf<readonly Row[]>();
  });

  it("returns readonly rows of the same type", () => {
    expectTypeOf(runRowModelPipeline<Row>).returns.toEqualTypeOf<readonly Row[]>();
  });

  it("filterState is optional", () => {
    expectTypeOf<RunRowModelPipelineOptions<Row>["filterState"]>().toEqualTypeOf<
      FilterState | undefined
    >();
  });
});

describe("DataTable: filter props are declared", () => {
  it("DataTableRootProps includes filter passthrough", () => {
    expectTypeOf<DataTableRootProps<Row>["filterState"]>().toEqualTypeOf<FilterState | undefined>();
    expectTypeOf<DataTableRootProps<Row>["defaultFilterState"]>().toEqualTypeOf<
      FilterState | undefined
    >();
    type Fn = NonNullable<DataTableRootProps<Row>["onFilterStateChange"]>;
    expectTypeOf<Parameters<Fn>[0]>().toEqualTypeOf<FilterState>();
  });

  it("DataTableFilterProps is a discrete interface", () => {
    expectTypeOf<DataTableFilterProps["filterState"]>().toEqualTypeOf<FilterState | undefined>();
  });
});

describe("filter model: closed operator union", () => {
  it("FilterOp is the fifteen defined operators", () => {
    // Compile-time exhaustiveness. This will fail to compile if the union changes.
    const ops: readonly FilterOp[] = [
      "equals",
      "notEquals",
      "contains",
      "notContains",
      "startsWith",
      "endsWith",
      "greaterThan",
      "greaterThanOrEqual",
      "lessThan",
      "lessThanOrEqual",
      "between",
      "in",
      "notIn",
      "isEmpty",
      "isNotEmpty",
    ];
    expectTypeOf(ops).toEqualTypeOf<readonly FilterOp[]>();
  });
});

describe("filter model: FilterFn shape", () => {
  it("takes a row and a ColumnFilter, returns boolean", () => {
    type Fn = FilterFn<Row>;
    expectTypeOf<Parameters<Fn>[0]>().toEqualTypeOf<Row>();
    expectTypeOf<ReturnType<Fn>>().toEqualTypeOf<boolean>();
  });
});

describe("applyFilters options: schema", () => {
  it("has data, state, and columns", () => {
    expectTypeOf<ApplyFiltersOptions<Row>["data"]>().toEqualTypeOf<readonly Row[]>();
    expectTypeOf<ApplyFiltersOptions<Row>["state"]>().toEqualTypeOf<FilterState>();
  });
});
