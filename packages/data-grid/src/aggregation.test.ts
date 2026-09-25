import { describe, it, expect } from "vitest";
import {
  applyReducer,
  computeAggregates,
  computeFooterAggregates,
  hasFooterAggregate,
  reduceAverage,
  reduceCount,
  reduceCountUnique,
  reduceMax,
  reduceMin,
  reduceSum,
} from "./aggregation";
import type { DataGridColumnDef } from "./column-types";

interface Sale {
  readonly region: string;
  readonly amount: number;
  readonly label: string | null;
}

const rows: readonly Sale[] = [
  { region: "north", amount: 100, label: "A" },
  { region: "north", amount: 250, label: "B" },
  { region: "south", amount: 175, label: "A" },
];

// ─── Built-ins ─────────────────────────────────────────────────────

describe("reduceCount", () => {
  it("returns the row count regardless of cell values", () => {
    expect(reduceCount([], [1, 2, 3])).toBe(3);
  });

  it("returns 0 for an empty input", () => {
    expect(reduceCount([], [])).toBe(0);
  });
});

describe("reduceCountUnique", () => {
  it("counts distinct values", () => {
    expect(reduceCountUnique(["a", "b", "a", "c"])).toBe(3);
  });

  it("collapses each of null / undefined into a single bucket", () => {
    expect(reduceCountUnique([null, null, undefined, undefined])).toBe(2);
  });
});

describe("reduceSum", () => {
  it("sums numeric values", () => {
    expect(reduceSum([1, 2, 3])).toBe(6);
  });

  it("skips non-numeric values", () => {
    expect(reduceSum([1, "two", null, 3])).toBe(4);
  });

  it("returns null when no numeric values are present", () => {
    expect(reduceSum([])).toBeNull();
    expect(reduceSum(["a", "b", null])).toBeNull();
  });

  it("skips NaN and infinity", () => {
    expect(reduceSum([1, Number.NaN, Number.POSITIVE_INFINITY, 2])).toBe(3);
  });
});

describe("reduceAverage", () => {
  it("averages numeric values", () => {
    expect(reduceAverage([1, 3, 5])).toBe(3);
  });

  it("ignores non-numeric values when averaging", () => {
    expect(reduceAverage([1, "x", 3])).toBe(2);
  });

  it("returns null when no numeric values are present", () => {
    expect(reduceAverage([])).toBeNull();
    expect(reduceAverage(["a", null])).toBeNull();
  });
});

describe("reduceMin", () => {
  it("returns the numeric minimum", () => {
    expect(reduceMin([3, 1, 2])).toBe(1);
  });

  it("returns the lexicographic minimum for strings", () => {
    expect(reduceMin(["banana", "apple", "cherry"])).toBe("apple");
  });

  it("returns the earliest Date", () => {
    const earlier = new Date("2020-01-01");
    const later = new Date("2026-01-01");
    expect(reduceMin([later, earlier])).toBe(earlier);
  });

  it("ignores incomparable values", () => {
    expect(reduceMin([{ id: 1 }, 5, { id: 2 }, 2])).toBe(2);
  });

  it("returns null when no comparable values are present", () => {
    expect(reduceMin([null, undefined, {}])).toBeNull();
  });
});

describe("reduceMax", () => {
  it("returns the numeric maximum", () => {
    expect(reduceMax([3, 1, 2])).toBe(3);
  });

  it("returns the lexicographic maximum for strings", () => {
    expect(reduceMax(["banana", "apple", "cherry"])).toBe("cherry");
  });

  it("returns the latest Date", () => {
    const earlier = new Date("2020-01-01");
    const later = new Date("2026-01-01");
    expect(reduceMax([earlier, later])).toBe(later);
  });

  it("returns null when no comparable values are present", () => {
    expect(reduceMax([])).toBeNull();
  });
});

// ─── Reducer dispatch ──────────────────────────────────────────────

describe("applyReducer", () => {
  it("dispatches built-in string reducers", () => {
    expect(applyReducer("sum", [1, 2, 3], rows)).toBe(6);
    expect(applyReducer("count", [], rows)).toBe(3);
    expect(applyReducer("avg", [1, 2, 3], rows)).toBe(2);
  });

  it("invokes function reducers with values and rows", () => {
    const custom = (values: readonly unknown[], srcRows: readonly Sale[]): number => {
      expect(srcRows).toEqual(rows);
      let total = 0;
      for (const v of values) if (typeof v === "number") total += v * 2;
      return total;
    };
    expect(applyReducer(custom, [1, 2, 3], rows)).toBe(12);
  });
});

// ─── Column-scoped aggregation ─────────────────────────────────────

describe("computeAggregates", () => {
  const cols: readonly DataGridColumnDef<Sale>[] = [
    { id: "region", header: "Region", accessorKey: "region" },
    {
      id: "amount",
      header: "Amount",
      accessorKey: "amount",
      aggregate: { reducer: "sum" },
    },
    {
      id: "label",
      header: "Label",
      accessorKey: "label",
      aggregate: { reducer: "countUnique" },
    },
  ];

  it("emits an entry only for columns with an aggregate spec", () => {
    const result = computeAggregates(cols, rows);
    expect(Object.keys(result).sort()).toEqual(["amount", "label"]);
  });

  it("applies the per-column reducer", () => {
    const result = computeAggregates(cols, rows);
    expect(result["amount"]).toBe(525);
    expect(result["label"]).toBe(2);
  });

  it("returns an empty object when no column has a spec", () => {
    const bare: readonly DataGridColumnDef<Sale>[] = [
      { id: "region", header: "Region", accessorKey: "region" },
    ];
    expect(computeAggregates(bare, rows)).toEqual({});
  });

  it("passes both values and rows through a function reducer", () => {
    const rowCountCol: readonly DataGridColumnDef<Sale>[] = [
      {
        id: "amount",
        header: "Amount",
        accessorKey: "amount",
        aggregate: {
          reducer: (values, sourceRows) => `${String(values.length)}/${String(sourceRows.length)}`,
        },
      },
    ];
    expect(computeAggregates(rowCountCol, rows)["amount"]).toBe("3/3");
  });
});

// ─── Footer aggregation ────────────────────────────────────────────

describe("computeFooterAggregates / hasFooterAggregate", () => {
  const cols: readonly DataGridColumnDef<Sale>[] = [
    {
      id: "amount",
      header: "Amount",
      accessorKey: "amount",
      aggregate: { reducer: "sum", footer: true },
    },
    {
      id: "label",
      header: "Label",
      accessorKey: "label",
      aggregate: { reducer: "countUnique" },
    },
  ];

  it("only includes columns with aggregate.footer === true", () => {
    const result = computeFooterAggregates(cols, rows);
    expect(Object.keys(result)).toEqual(["amount"]);
    expect(result["amount"]).toBe(525);
  });

  it("hasFooterAggregate reflects the spec", () => {
    const [amount, label] = cols;
    if (!amount || !label) throw new Error("test fixture");
    expect(hasFooterAggregate(amount)).toBe(true);
    expect(hasFooterAggregate(label)).toBe(false);
  });
});

// ─── Row immutability ──────────────────────────────────────────────

describe("aggregation — never mutates inputs", () => {
  it("leaves the source rows untouched", () => {
    const originals = rows.map((r) => ({ ...r }));
    const cols: readonly DataGridColumnDef<Sale>[] = [
      {
        id: "amount",
        header: "Amount",
        accessorKey: "amount",
        aggregate: { reducer: "sum" },
      },
    ];
    computeAggregates(cols, rows);
    computeFooterAggregates(cols, rows);
    for (let i = 0; i < rows.length; i++) {
      expect(rows[i]).toEqual(originals[i]);
    }
  });
});
