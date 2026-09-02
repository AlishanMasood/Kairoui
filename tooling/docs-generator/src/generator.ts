import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync, existsSync } from "node:fs";
import { createProgramFromFiles } from "./discovery";
import { extractComponentMeta } from "./extractor";
import { extractDefaultsFromComponentDir, mergeDefaultsIntoPropMeta } from "./defaults";
import { groupCompoundComponents } from "./compound";
import { normalizeComponents, createGeneratorOutput } from "./normalization";
import { writeMetadata, writePerComponentMetadata } from "./serialization";
import { discoverPackages, discoverExportsFromDts } from "./package-discovery";
import type { ComponentMeta, GeneratorOutput } from "./schema";
import type { DiscoveryConfig } from "./package-discovery";
import { validateMetadata, formatReport, isStaleAgainst } from "./validation";

// ─── Config ─────────────────────────────────────────────────────────

const THIS_DIR =
  typeof import.meta.dirname === "string"
    ? import.meta.dirname
    : dirname(fileURLToPath(import.meta.url));

const MONOREPO_ROOT = resolve(THIS_DIR, "../../..");

// Props interface naming convention: ComponentNameOwnProps, ComponentNameRootProps, or ComponentNameProps
const PROPS_SUFFIXES = ["OwnProps", "RootProps", "Props"];

// ─── Timing ─────────────────────────────────────────────────────────

export interface PhaseTimings {
  readonly discovery: number;
  readonly program: number;
  readonly extraction: number;
  readonly grouping: number;
  readonly normalization: number;
  readonly serialization: number;
  readonly validation: number;
  readonly total: number;
}

function formatMs(ms: number): string {
  return `${ms.toFixed(0)}ms`;
}

function reportTimings(timings: PhaseTimings, componentCount: number): void {
  const rows: [string, number][] = [
    ["discovery       ", timings.discovery],
    ["program create  ", timings.program],
    ["extraction      ", timings.extraction],
    ["compound group  ", timings.grouping],
    ["normalization   ", timings.normalization],
    ["serialization   ", timings.serialization],
    ["validation      ", timings.validation],
  ];
  console.log("[docs-generator] Phase timings:");
  for (const [label, ms] of rows) {
    const pct = timings.total > 0 ? ((ms / timings.total) * 100).toFixed(1) : "0.0";
    console.log(`  ${label} ${formatMs(ms).padStart(8)}  (${pct.padStart(4)}%)`);
  }
  console.log(`  ${"total           ".padEnd(16)} ${formatMs(timings.total).padStart(8)}`);
  const perComp = componentCount > 0 ? (timings.total / componentCount).toFixed(1) : "0";
  console.log(`  ${"per component   ".padEnd(16)} ${perComp}ms`);
}

// ─── Pipeline ───────────────────────────────────────────────────────

export interface GenerateOptions {
  readonly monorepoRoot: string;
  readonly outputDir: string;
  readonly perComponentOutputDir?: string;
  readonly packages?: readonly string[];
  readonly check?: boolean;
  readonly reportTimings?: boolean;
}

export function generate(options: GenerateOptions): {
  success: boolean;
  componentCount: number;
  timings: PhaseTimings;
} {
  const {
    monorepoRoot,
    outputDir,
    perComponentOutputDir,
    packages: pkgFilter,
    check = false,
    reportTimings: shouldReportTimings = true,
  } = options;

  const totalStart = performance.now();

  const config: DiscoveryConfig = {
    monorepoRoot,
    ...(pkgFilter ? { packages: [...pkgFilter] } : undefined),
  };

  // 1. Discover packages and exports
  const discoveryStart = performance.now();
  const pkgs = discoverPackages(config);
  const allComponents: ComponentMeta[] = [];
  const discoveryTime = performance.now() - discoveryStart;

  let programTime = 0;
  let extractionTime = 0;

  for (const pkg of pkgs) {
    const exports = discoverExportsFromDts(pkg, config);
    const componentExports = exports.filter((e) => e.kind === "component");

    // Find the components .d.ts for this package
    const componentsDts = pkg.exports.find((e) => e.subpath === "./components");
    const mainDts = pkg.exports.find((e) => e.subpath === ".");
    const dtsEntry = componentsDts ?? mainDts;
    if (!dtsEntry?.typesPath) continue;

    const dtsPath = resolve(pkg.path, dtsEntry.typesPath);
    if (!existsSync(dtsPath)) continue;

    const programStart = performance.now();
    const { program, checker } = createProgramFromFiles([dtsPath]);
    const sourceFile = program.getSourceFile(dtsPath);
    programTime += performance.now() - programStart;
    if (!sourceFile) continue;

    const packagePath = `${pkg.name}${dtsEntry.subpath === "." ? "" : `/${dtsEntry.subpath.slice(2)}`}`;

    const extractionStart = performance.now();
    for (const exp of componentExports) {
      // Try each props suffix convention
      for (const suffix of PROPS_SUFFIXES) {
        const propsName = `${exp.name}${suffix}`;
        const meta = extractComponentMeta(checker, sourceFile, exp.name, propsName, packagePath);
        if (meta) {
          // Merge source defaults
          const componentDir = findComponentDir(monorepoRoot, pkg.name, exp.name);
          if (componentDir) {
            const defaults = extractDefaultsFromComponentDir(componentDir);
            const mergedProps = mergeDefaultsIntoPropMeta(meta.props, defaults);
            allComponents.push({ ...meta, props: mergedProps });
          } else {
            allComponents.push(meta);
          }
          break;
        }
      }
    }
    extractionTime += performance.now() - extractionStart;
  }

  // 2. Group compound components
  const groupingStart = performance.now();
  const _compounds = groupCompoundComponents(allComponents);
  const groupingTime = performance.now() - groupingStart;

  // 3. Build output
  const normalizationStart = performance.now();
  const packageDocs = pkgs
    .map((pkg) => {
      const pkgComponents = allComponents.filter((c) => c.packagePath.startsWith(pkg.name));
      const entry = pkg.exports.find((e) => e.subpath === "./components") ?? pkg.exports[0];
      return normalizeComponents(pkgComponents, pkg.name, entry?.subpath ?? ".");
    })
    .filter((p) => p.components.length > 0);

  const output = createGeneratorOutput(packageDocs);
  const normalizationTime = performance.now() - normalizationStart;

  const discoveredComponentNames = collectDiscoveredComponentNames(pkgs, config);

  if (check) {
    const outPath = resolve(outputDir, "api-metadata.json");
    if (!existsSync(outPath)) {
      console.error("[docs-generator] CHECK FAILED: api-metadata.json not found");
      console.error("[docs-generator] Run 'pnpm generate:docs' to create it.");
      const total = performance.now() - totalStart;
      return {
        success: false,
        componentCount: allComponents.length,
        timings: makeTimings({
          discovery: discoveryTime,
          program: programTime,
          extraction: extractionTime,
          grouping: groupingTime,
          normalization: normalizationTime,
          serialization: 0,
          validation: 0,
          total,
        }),
      };
    }

    const existingRaw = readFileSync(outPath, "utf-8");
    const existingParsed = JSON.parse(existingRaw) as GeneratorOutput;

    if (isStaleAgainst(existingParsed, output)) {
      console.error("[docs-generator] CHECK FAILED [DOC010]: metadata is stale.");
      console.error(
        "[docs-generator] The current generator output differs from generated/api-metadata.json.",
      );
      console.error("[docs-generator] Run 'pnpm generate:docs' and commit the result.");
      const total = performance.now() - totalStart;
      return {
        success: false,
        componentCount: allComponents.length,
        timings: makeTimings({
          discovery: discoveryTime,
          program: programTime,
          extraction: extractionTime,
          grouping: groupingTime,
          normalization: normalizationTime,
          serialization: 0,
          validation: 0,
          total,
        }),
      };
    }

    const validationStart = performance.now();
    const validation = validateMetadata(existingParsed, {
      monorepoRoot,
      discoveredComponents: discoveredComponentNames,
    });
    const validationTime = performance.now() - validationStart;
    console.log(formatReport(validation));

    const total = performance.now() - totalStart;
    const timings = makeTimings({
      discovery: discoveryTime,
      program: programTime,
      extraction: extractionTime,
      grouping: groupingTime,
      normalization: normalizationTime,
      serialization: 0,
      validation: validationTime,
      total,
    });
    if (shouldReportTimings) reportTimings(timings, allComponents.length);

    if (!validation.ok) {
      console.error("[docs-generator] CHECK FAILED: validation errors present.");
      return { success: false, componentCount: allComponents.length, timings };
    }

    console.log("[docs-generator] CHECK PASSED: metadata is up to date and valid.");
    return { success: true, componentCount: allComponents.length, timings };
  }

  // 4. Write output
  const serializationStart = performance.now();
  writeMetadata(output, resolve(outputDir, "api-metadata.json"));
  const perCompDir = perComponentOutputDir ?? resolve(outputDir, "components");
  const perComp = writePerComponentMetadata(output, perCompDir);
  const serializationTime = performance.now() - serializationStart;
  console.log(
    `[docs-generator] Generated ${String(allComponents.length)} components (${String(perComp.count)} per-component files, ${(perComp.totalBytes / 1024).toFixed(1)} KB total)`,
  );

  const validationStart = performance.now();
  const validation = validateMetadata(output, {
    monorepoRoot,
    discoveredComponents: discoveredComponentNames,
  });
  const validationTime = performance.now() - validationStart;
  if (validation.warningCount > 0 || validation.errorCount > 0) {
    console.log(formatReport(validation));
  }

  const total = performance.now() - totalStart;
  const timings = makeTimings({
    discovery: discoveryTime,
    program: programTime,
    extraction: extractionTime,
    grouping: groupingTime,
    normalization: normalizationTime,
    serialization: serializationTime,
    validation: validationTime,
    total,
  });
  if (shouldReportTimings) reportTimings(timings, allComponents.length);

  return {
    success: validation.errorCount === 0,
    componentCount: allComponents.length,
    timings,
  };
}

function makeTimings(t: PhaseTimings): PhaseTimings {
  return t;
}

function collectDiscoveredComponentNames(
  pkgs: readonly ReturnType<typeof discoverPackages>[number][],
  config: DiscoveryConfig,
): readonly string[] {
  const names = new Set<string>();
  for (const pkg of pkgs) {
    const exports = discoverExportsFromDts(pkg, config);
    for (const exp of exports) {
      if (exp.kind === "component") names.add(exp.name);
    }
  }
  return [...names];
}

// ─── Component directory finder ─────────────────────────────────────

function findComponentDir(
  monorepoRoot: string,
  packageName: string,
  componentName: string,
): string | undefined {
  const pkgShort = packageName.replace("@kairoui/", "");
  const kebab = componentName.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
  const dir = resolve(monorepoRoot, "packages", pkgShort, "src/components", kebab);
  return existsSync(dir) ? dir : undefined;
}

// ─── CLI entry point ────────────────────────────────────────────────

export function runCli(argv: readonly string[] = process.argv.slice(2)): void {
  const checkMode = argv.includes("--check");

  const outputIdx = argv.indexOf("--output");
  const outputDir =
    outputIdx >= 0 && argv[outputIdx + 1]
      ? argv[outputIdx + 1]
      : resolve(MONOREPO_ROOT, "tooling/docs-generator/generated");

  const perCompIdx = argv.indexOf("--per-component-output");
  const perComponentOutputDir =
    perCompIdx >= 0 && argv[perCompIdx + 1]
      ? argv[perCompIdx + 1]
      : resolve(MONOREPO_ROOT, "apps/docs/src/generated/components");

  const pkgIdx = argv.indexOf("--package");
  const pkgFilter = pkgIdx >= 0 && argv[pkgIdx + 1] ? [argv[pkgIdx + 1]] : undefined;

  console.log("[docs-generator] Starting...");
  console.log(`[docs-generator] Mode: ${checkMode ? "check" : "generate"}`);
  console.log(`[docs-generator] Output: ${outputDir}`);
  console.log(`[docs-generator] Per-component output: ${perComponentOutputDir}`);

  const result = generate({
    monorepoRoot: MONOREPO_ROOT,
    outputDir,
    perComponentOutputDir,
    packages: pkgFilter,
    check: checkMode,
  });

  if (!result.success) {
    process.exitCode = 1;
  }
}
