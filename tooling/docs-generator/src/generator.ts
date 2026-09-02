import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync, existsSync } from "node:fs";
import { createProgramFromFiles } from "./discovery";
import { extractComponentMeta } from "./extractor";
import { extractDefaultsFromComponentDir, mergeDefaultsIntoPropMeta } from "./defaults";
import { groupCompoundComponents } from "./compound";
import { normalizeComponents, createGeneratorOutput } from "./normalization";
import { writeMetadata } from "./serialization";
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

// ─── Pipeline ───────────────────────────────────────────────────────

export interface GenerateOptions {
  readonly monorepoRoot: string;
  readonly outputDir: string;
  readonly packages?: readonly string[];
  readonly check?: boolean;
}

export function generate(options: GenerateOptions): { success: boolean; componentCount: number } {
  const { monorepoRoot, outputDir, packages: pkgFilter, check = false } = options;

  const config: DiscoveryConfig = {
    monorepoRoot,
    ...(pkgFilter ? { packages: [...pkgFilter] } : undefined),
  };

  // 1. Discover packages and exports
  const pkgs = discoverPackages(config);
  const allComponents: ComponentMeta[] = [];

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

    const { program, checker } = createProgramFromFiles([dtsPath]);
    const sourceFile = program.getSourceFile(dtsPath);
    if (!sourceFile) continue;

    const packagePath = `${pkg.name}${dtsEntry.subpath === "." ? "" : `/${dtsEntry.subpath.slice(2)}`}`;

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
  }

  // 2. Group compound components
  const _compounds = groupCompoundComponents(allComponents);

  // 3. Build output
  const packageDocs = pkgs
    .map((pkg) => {
      const pkgComponents = allComponents.filter((c) => c.packagePath.startsWith(pkg.name));
      const entry = pkg.exports.find((e) => e.subpath === "./components") ?? pkg.exports[0];
      return normalizeComponents(pkgComponents, pkg.name, entry?.subpath ?? ".");
    })
    .filter((p) => p.components.length > 0);

  const output = createGeneratorOutput(packageDocs);

  const discoveredComponentNames = collectDiscoveredComponentNames(pkgs, config);

  if (check) {
    const outPath = resolve(outputDir, "api-metadata.json");
    if (!existsSync(outPath)) {
      console.error("[docs-generator] CHECK FAILED: api-metadata.json not found");
      console.error("[docs-generator] Run 'pnpm generate:docs' to create it.");
      return { success: false, componentCount: allComponents.length };
    }

    const existingRaw = readFileSync(outPath, "utf-8");
    const existingParsed = JSON.parse(existingRaw) as GeneratorOutput;

    if (isStaleAgainst(existingParsed, output)) {
      console.error("[docs-generator] CHECK FAILED [DOC010]: metadata is stale.");
      console.error(
        "[docs-generator] The current generator output differs from generated/api-metadata.json.",
      );
      console.error("[docs-generator] Run 'pnpm generate:docs' and commit the result.");
      return { success: false, componentCount: allComponents.length };
    }

    const validation = validateMetadata(existingParsed, {
      monorepoRoot,
      discoveredComponents: discoveredComponentNames,
    });
    console.log(formatReport(validation));

    if (!validation.ok) {
      console.error("[docs-generator] CHECK FAILED: validation errors present.");
      return { success: false, componentCount: allComponents.length };
    }

    console.log("[docs-generator] CHECK PASSED: metadata is up to date and valid.");
    return { success: true, componentCount: allComponents.length };
  }

  // 4. Write output
  writeMetadata(output, resolve(outputDir, "api-metadata.json"));
  console.log(`[docs-generator] Generated ${String(allComponents.length)} components`);

  const validation = validateMetadata(output, {
    monorepoRoot,
    discoveredComponents: discoveredComponentNames,
  });
  if (validation.warningCount > 0 || validation.errorCount > 0) {
    console.log(formatReport(validation));
  }

  return { success: validation.errorCount === 0, componentCount: allComponents.length };
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

  const pkgIdx = argv.indexOf("--package");
  const pkgFilter = pkgIdx >= 0 && argv[pkgIdx + 1] ? [argv[pkgIdx + 1]] : undefined;

  console.log("[docs-generator] Starting...");
  console.log(`[docs-generator] Mode: ${checkMode ? "check" : "generate"}`);
  console.log(`[docs-generator] Output: ${outputDir}`);

  const result = generate({
    monorepoRoot: MONOREPO_ROOT,
    outputDir,
    packages: pkgFilter,
    check: checkMode,
  });

  if (!result.success) {
    process.exitCode = 1;
  }
}
