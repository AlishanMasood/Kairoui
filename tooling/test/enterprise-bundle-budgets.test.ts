import { beforeAll, describe, expect, it } from "vitest";
import { measureEnterpriseBundles } from "../../scripts/measure-enterprise";
import type { EnterpriseBundleReport } from "../../scripts/measure-enterprise";

interface SizeBudget {
  readonly name: string;
  readonly raw: number;
  readonly minified: number;
  readonly gzip: number;
  readonly brotli: number;
}

const BUNDLE_BUDGETS: readonly SizeBudget[] = [
  { name: "DataGrid", raw: 120_000, minified: 52_000, gzip: 17_000, brotli: 15_500 },
  { name: "Command", raw: 60_000, minified: 26_000, gzip: 9_300, brotli: 8_300 },
  { name: "Scheduler", raw: 102_000, minified: 50_000, gzip: 15_500, brotli: 14_000 },
  { name: "Kanban", raw: 72_000, minified: 36_000, gzip: 11_000, brotli: 10_000 },
  {
    name: "PermissionMatrix",
    raw: 65_000,
    minified: 33_000,
    gzip: 10_000,
    brotli: 9_000,
  },
  { name: "Workflow", raw: 42_000, minified: 20_500, gzip: 7_200, brotli: 6_500 },
  {
    name: "Shared enterprise infrastructure",
    raw: 28_000,
    minified: 12_500,
    gzip: 4_800,
    brotli: 4_200,
  },
];

const CSS_BUDGETS: readonly SizeBudget[] = [
  {
    name: "@kairoui-pro/scheduler",
    raw: 13_000,
    minified: 11_500,
    gzip: 2_200,
    brotli: 1_900,
  },
  { name: "@kairoui-pro/kanban", raw: 6_500, minified: 5_500, gzip: 1_600, brotli: 1_300 },
  {
    name: "@kairoui-pro/permission-matrix",
    raw: 9_500,
    minified: 8_500,
    gzip: 1_800,
    brotli: 1_500,
  },
  { name: "@kairoui-pro/workflow", raw: 8_500, minified: 7_200, gzip: 1_800, brotli: 1_500 },
];

function getMeasurement<T extends { readonly name: string }>(
  measurements: readonly T[],
  name: string,
): T {
  const measurement = measurements.find((entry) => entry.name === name);
  if (!measurement) throw new Error(`Missing enterprise measurement: ${name}`);
  return measurement;
}

function getStyleMeasurement(report: EnterpriseBundleReport, packageName: string) {
  const measurement = report.styles.find((entry) => entry.packageName === packageName);
  if (!measurement) throw new Error(`Missing enterprise style measurement: ${packageName}`);
  return measurement;
}

describe("Enterprise bundle and style budgets", () => {
  let report: EnterpriseBundleReport;

  beforeAll(() => {
    report = measureEnterpriseBundles();
  }, 60_000);

  for (const budget of BUNDLE_BUDGETS) {
    describe(budget.name, () => {
      it(`consumer raw JS under ${String(budget.raw)} bytes`, () => {
        expect(getMeasurement(report.bundles, budget.name).raw).toBeLessThanOrEqual(budget.raw);
      });
      it(`consumer minified JS under ${String(budget.minified)} bytes`, () => {
        expect(getMeasurement(report.bundles, budget.name).minified).toBeLessThanOrEqual(
          budget.minified,
        );
      });
      it(`consumer gzip under ${String(budget.gzip)} bytes`, () => {
        expect(getMeasurement(report.bundles, budget.name).gzip).toBeLessThanOrEqual(budget.gzip);
      });
      it(`consumer Brotli under ${String(budget.brotli)} bytes`, () => {
        expect(getMeasurement(report.bundles, budget.name).brotli).toBeLessThanOrEqual(
          budget.brotli,
        );
      });
    });
  }

  for (const budget of CSS_BUDGETS) {
    describe(`${budget.name} CSS`, () => {
      it(`raw CSS under ${String(budget.raw)} bytes`, () => {
        expect(getStyleMeasurement(report, budget.name).raw).toBeLessThanOrEqual(budget.raw);
      });
      it(`minified CSS under ${String(budget.minified)} bytes`, () => {
        expect(getStyleMeasurement(report, budget.name).minified).toBeLessThanOrEqual(
          budget.minified,
        );
      });
      it(`gzip CSS under ${String(budget.gzip)} bytes`, () => {
        expect(getStyleMeasurement(report, budget.name).gzip).toBeLessThanOrEqual(budget.gzip);
      });
      it(`Brotli CSS under ${String(budget.brotli)} bytes`, () => {
        expect(getStyleMeasurement(report, budget.name).brotli).toBeLessThanOrEqual(budget.brotli);
      });
    });
  }
});
