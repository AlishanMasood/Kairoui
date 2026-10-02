/* eslint-disable @typescript-eslint/no-unsafe-call */
import { execSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { brotliCompressSync, constants, gzipSync } from "node:zlib";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const TEMP_DIR = resolve(ROOT, "apps/docs/.enterprise-bundle-measure");

const COMPONENTS = [
  { name: "DataGrid", packageName: "@kairoui-pro/data-grid", exportName: "DataGrid" },
  { name: "Command", packageName: "@kairoui-pro/command", exportName: "Command" },
  { name: "Scheduler", packageName: "@kairoui-pro/scheduler", exportName: "Scheduler" },
  { name: "Kanban", packageName: "@kairoui-pro/kanban", exportName: "Kanban" },
  {
    name: "PermissionMatrix",
    packageName: "@kairoui-pro/permission-matrix",
    exportName: "PermissionMatrix",
  },
  { name: "Workflow", packageName: "@kairoui-pro/workflow", exportName: "Workflow" },
] as const;

const SHARED_INFRASTRUCTURE = {
  name: "Shared enterprise infrastructure",
  source: `import { DismissableLayer, FocusScope, Portal } from "@kairoui/core/components/overlay/command";
import { getCellValue } from "@kairoui/core/components/data-grid";
import { useControllableState, useEventCallback } from "@kairoui/hooks";
import { computeVirtualizedRange } from "@kairoui/utils";
console.log(DismissableLayer, FocusScope, Portal, getCellValue, useControllableState, useEventCallback, computeVirtualizedRange);`,
};

interface CompressedMeasurement {
  readonly raw: number;
  readonly minified: number;
  readonly gzip: number;
  readonly brotli: number;
}

export interface EnterpriseBundleMeasurement extends CompressedMeasurement {
  readonly name: string;
}

export interface EnterpriseCssMeasurement extends CompressedMeasurement {
  readonly packageName: string;
  readonly file: string;
}

export interface EnterpriseBundleReport {
  readonly bundles: readonly EnterpriseBundleMeasurement[];
  readonly styles: readonly EnterpriseCssMeasurement[];
}

function compress(content: Buffer): Pick<CompressedMeasurement, "gzip" | "brotli"> {
  return {
    gzip: gzipSync(content, { level: 9 }).length,
    brotli: brotliCompressSync(content, {
      params: { [constants.BROTLI_PARAM_QUALITY]: 11 },
    }).length,
  };
}

function quote(value: string): string {
  return `"${value.replaceAll('"', '\\"')}"`;
}

function bundle(source: string, name: string): CompressedMeasurement {
  const inputFile = resolve(TEMP_DIR, `${name}.ts`);
  const rawFile = resolve(TEMP_DIR, `${name}.raw.js`);
  const minifiedFile = resolve(TEMP_DIR, `${name}.min.js`);
  writeFileSync(inputFile, source, "utf-8");

  const common = [
    `pnpm exec esbuild ${quote(inputFile)}`,
    "--bundle",
    "--format=esm",
    "--platform=browser",
    "--external:react",
    "--external:react-dom",
    "--external:react/jsx-runtime",
  ].join(" ");
  execSync(`${common} --outfile=${quote(rawFile)}`, {
    cwd: ROOT,
    stdio: "pipe",
  });
  execSync(`${common} --minify --outfile=${quote(minifiedFile)}`, {
    cwd: ROOT,
    stdio: "pipe",
  });

  const rawContent = readFileSync(rawFile);
  const minifiedContent = readFileSync(minifiedFile);
  return {
    raw: rawContent.length,
    minified: minifiedContent.length,
    ...compress(minifiedContent),
  };
}

function measureCss(packageName: string): EnterpriseCssMeasurement {
  const file = "dist/styles.css";
  const sourceFile = resolve(ROOT, "packages", packageName, file);
  const outputFile = resolve(TEMP_DIR, `${packageName}.min.css`);
  execSync(`pnpm exec esbuild ${quote(sourceFile)} --minify --outfile=${quote(outputFile)}`, {
    cwd: ROOT,
    stdio: "pipe",
  });
  const rawContent = readFileSync(sourceFile);
  const minifiedContent = readFileSync(outputFile);
  return {
    packageName: `@kairoui-pro/${packageName}`,
    file,
    raw: rawContent.length,
    minified: minifiedContent.length,
    ...compress(minifiedContent),
  };
}

export function measureEnterpriseBundles(): EnterpriseBundleReport {
  mkdirSync(TEMP_DIR, { recursive: true });
  try {
    const bundles = COMPONENTS.map(({ name, packageName, exportName }) => ({
      name,
      ...bundle(
        `import { ${exportName} } from "${packageName}";\nconsole.log(${exportName});`,
        name,
      ),
    }));
    bundles.push({
      name: SHARED_INFRASTRUCTURE.name,
      ...bundle(SHARED_INFRASTRUCTURE.source, "shared-infrastructure"),
    });
    const styles = ["scheduler", "kanban", "permission-matrix", "workflow"].map(measureCss);
    return { bundles, styles };
  } finally {
    rmSync(TEMP_DIR, { recursive: true, force: true });
  }
}

function formatBytes(bytes: number): string {
  return bytes < 1024 ? `${String(bytes)} B` : `${(bytes / 1024).toFixed(2)} KB`;
}

function printReport(report: EnterpriseBundleReport): void {
  console.log("Enterprise consumer bundles (React externals; minified compression inputs)");
  console.log("Name | Raw JS | Minified JS | Gzip | Brotli");
  for (const item of report.bundles) {
    console.log(
      `${item.name} | ${formatBytes(item.raw)} | ${formatBytes(item.minified)} | ${formatBytes(item.gzip)} | ${formatBytes(item.brotli)}`,
    );
  }
  console.log("\nEnterprise styles");
  console.log("Package | Raw CSS | Minified CSS | Gzip | Brotli");
  for (const item of report.styles) {
    console.log(
      `${item.packageName} | ${formatBytes(item.raw)} | ${formatBytes(item.minified)} | ${formatBytes(item.gzip)} | ${formatBytes(item.brotli)}`,
    );
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  printReport(measureEnterpriseBundles());
}
