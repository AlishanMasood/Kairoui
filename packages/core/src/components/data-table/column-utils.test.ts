import { describe, it, expect, expectTypeOf } from "vitest";
import { createElement } from "react";
import {
  column,
  columns,
  getCellValue,
  getHeaderContent,
  getCellContent,
  buildColumnMap,
  getColumnAlign,
} from "./column-utils";
import type { DataTableColumnDef } from "./data-table-types";

// ─── Test data ──────────────────────────────────────────────────────

interface User {
  id: number;
  name: string;
  email: string;
  age: number;
}

const alice: User = { id: 1, name: "Alice", email: "alice@example.com", age: 30 };

// ─── column() helper ───────────────────────────────────────────────

describe("column(): type-safe column creation", () => {
  it("returns the definition unchanged", () => {
    const def = column<User>({ id: "name", header: "Name", accessorKey: "name" });
    expect(def.id).toBe("name");
    expect(def.accessorKey).toBe("name");
  });

  it("infers TRow from accessorKey constraint", () => {
    const def = column<User>({ id: "age", header: "Age", accessorKey: "age" });
    expectTypeOf(def).toEqualTypeOf<DataTableColumnDef<User>>();
  });

  it("accepts accessorFn", () => {
    const def = column<User>({
      id: "fullName",
      header: "Full Name",
      accessorFn: (row) => `${row.name} (${String(row.age)})`,
    });
    expect(def.accessorFn).toBeDefined();
  });

  it("accepts function header", () => {
    const def = column<User>({
      id: "name",
      header: () => createElement("strong", null, "Name"),
    });
    expect(typeof def.header).toBe("function");
  });

  it("accepts cell renderer", () => {
    const def = column<User>({
      id: "name",
      header: "Name",
      accessorKey: "name",
      cell: (value) => createElement("em", null, String(value)),
    });
    expect(def.cell).toBeDefined();
  });

  it("accepts sortable flag", () => {
    const def = column<User>({ id: "name", header: "Name", sortable: true });
    expect(def.sortable).toBe(true);
  });

  it("accepts alignment", () => {
    const def = column<User>({ id: "age", header: "Age", align: "end" });
    expect(def.align).toBe("end");
  });
});

// ─── columns() helper ──────────────────────────────────────────────

describe("columns(): array creation", () => {
  it("returns the definitions array", () => {
    const defs = columns<User>([
      { id: "name", header: "Name", accessorKey: "name" },
      { id: "age", header: "Age", accessorKey: "age", align: "end" },
    ]);
    expect(defs).toHaveLength(2);
    expect(defs[0]!.id).toBe("name");
  });

  it("preserves type inference across the array", () => {
    const defs = columns<User>([
      { id: "name", header: "Name", accessorKey: "name" },
      { id: "email", header: "Email", accessorKey: "email" },
    ]);
    expectTypeOf(defs).toEqualTypeOf<readonly DataTableColumnDef<User>[]>();
  });
});

// ─── getCellValue ───────────────────────────────────────────────────

describe("getCellValue", () => {
  it("resolves value from accessorKey", () => {
    const col = column<User>({ id: "name", header: "Name", accessorKey: "name" });
    expect(getCellValue(col, alice)).toBe("Alice");
  });

  it("resolves value from accessorFn", () => {
    const col = column<User>({
      id: "display",
      header: "Display",
      accessorFn: (row) => `${row.name} <${row.email}>`,
    });
    expect(getCellValue(col, alice)).toBe("Alice <alice@example.com>");
  });

  it("prefers accessorFn over accessorKey when both provided", () => {
    const col = column<User>({
      id: "name",
      header: "Name",
      accessorKey: "name",
      accessorFn: (row) => row.name.toUpperCase(),
    });
    expect(getCellValue(col, alice)).toBe("ALICE");
  });

  it("returns undefined when no accessor", () => {
    const col = column<User>({ id: "actions", header: "Actions" });
    expect(getCellValue(col, alice)).toBeUndefined();
  });
});

// ─── getHeaderContent ───────────────────────────────────────────────

describe("getHeaderContent", () => {
  it("returns string header directly", () => {
    const col = column<User>({ id: "name", header: "Name" });
    expect(getHeaderContent(col)).toBe("Name");
  });

  it("calls function header", () => {
    const col = column<User>({
      id: "name",
      header: () => "Dynamic Name",
    });
    expect(getHeaderContent(col)).toBe("Dynamic Name");
  });

  it("returns ReactNode header", () => {
    const node = createElement("span", null, "Header");
    const col = column<User>({ id: "name", header: node });
    expect(getHeaderContent(col)).toBe(node);
  });
});

// ─── getCellContent ─────────────────────────────────────────────────

describe("getCellContent", () => {
  it("returns stringified value when no cell renderer", () => {
    const col = column<User>({ id: "name", header: "Name", accessorKey: "name" });
    expect(getCellContent(col, alice)).toBe("Alice");
  });

  it("returns number stringified when no cell renderer", () => {
    const col = column<User>({ id: "age", header: "Age", accessorKey: "age" });
    expect(getCellContent(col, alice)).toBe("30");
  });

  it("calls cell renderer with value and row", () => {
    const col = column<User>({
      id: "name",
      header: "Name",
      accessorKey: "name",
      cell: (value, row) => `${String(value)} (${String(row.age)})`,
    });
    expect(getCellContent(col, alice)).toBe("Alice (30)");
  });

  it("returns null for null/undefined values without renderer", () => {
    const col = column<User>({ id: "x", header: "X" });
    expect(getCellContent(col, alice)).toBeNull();
  });
});

// ─── buildColumnMap ─────────────────────────────────────────────────

describe("buildColumnMap", () => {
  it("builds id→column map", () => {
    const defs = columns<User>([
      { id: "name", header: "Name", accessorKey: "name" },
      { id: "age", header: "Age", accessorKey: "age" },
    ]);
    const map = buildColumnMap(defs);
    expect(map.size).toBe(2);
    expect(map.get("name")!.accessorKey).toBe("name");
    expect(map.get("age")!.accessorKey).toBe("age");
  });

  it("returns empty map for empty columns", () => {
    const map = buildColumnMap<User>([]);
    expect(map.size).toBe(0);
  });
});

// ─── getColumnAlign ─────────────────────────────────────────────────

describe("getColumnAlign", () => {
  it("returns specified alignment", () => {
    const col = column<User>({ id: "age", header: "Age", align: "end" });
    expect(getColumnAlign(col)).toBe("end");
  });

  it("defaults to start", () => {
    const col = column<User>({ id: "name", header: "Name" });
    expect(getColumnAlign(col)).toBe("start");
  });
});

// ─── Type safety ────────────────────────────────────────────────────

describe("column definitions: type safety", () => {
  it("accessorKey only accepts string keys of TRow", () => {
    type Col = DataTableColumnDef<User>;
    expectTypeOf<Col["accessorKey"]>().toEqualTypeOf<"id" | "name" | "email" | "age" | undefined>();
  });

  it("accessorFn parameter is typed as TRow", () => {
    type Col = DataTableColumnDef<User>;
    type Fn = NonNullable<Col["accessorFn"]>;
    expectTypeOf<Parameters<Fn>[0]>().toEqualTypeOf<User>();
  });

  it("cell renderer parameter is typed as TRow", () => {
    type Col = DataTableColumnDef<User>;
    type Fn = NonNullable<Col["cell"]>;
    expectTypeOf<Parameters<Fn>[1]>().toEqualTypeOf<User>();
  });

  it("getCellValue returns unknown", () => {
    const col = column<User>({ id: "name", header: "Name", accessorKey: "name" });
    expectTypeOf(getCellValue(col, alice)).toEqualTypeOf<unknown>();
  });
});
