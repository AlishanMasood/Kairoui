import { readFileSync, existsSync } from "node:fs";
import { resolve, relative } from "node:path";

// ─── Types ──────────────────────────────────────────────────────────

export interface PackageInfo {
  readonly name: string;
  readonly path: string;
  readonly exports: readonly EntryPointInfo[];
}

export interface EntryPointInfo {
  readonly subpath: string;
  readonly typesPath: string | undefined;
  readonly importPath: string | undefined;
}

export interface DiscoveredExport {
  readonly name: string;
  readonly kind: "component" | "function" | "type" | "context" | "hook" | "other";
  readonly packageName: string;
  readonly entryPoint: string;
  readonly sourceFile: string;
}

export interface DiscoveryManifest {
  readonly packages: readonly PackageInfo[];
  readonly exports: readonly DiscoveredExport[];
}

export interface DiscoveryConfig {
  readonly monorepoRoot: string;
  readonly packages?: readonly string[];
  readonly excludePatterns?: readonly RegExp[];
}

// ─── Package discovery ──────────────────────────────────────────────

const DEFAULT_PACKAGES = ["core", "hooks", "theme", "tokens", "utils", "icons"];

const EXCLUDE_SUBPATHS = ["./package.json", "./styles.css"];

const CSS_PATTERN = /\.css$/;

export function discoverPackages(config: DiscoveryConfig): readonly PackageInfo[] {
  const packageNames = config.packages ?? DEFAULT_PACKAGES;
  const packages: PackageInfo[] = [];

  for (const pkgName of packageNames) {
    const pkgDir = resolve(config.monorepoRoot, "packages", pkgName);
    const pkgJsonPath = resolve(pkgDir, "package.json");
    if (!existsSync(pkgJsonPath)) continue;

    const pkgJson = JSON.parse(readFileSync(pkgJsonPath, "utf-8")) as {
      name: string;
      exports?: Record<string, unknown>;
    };

    const exportEntries: EntryPointInfo[] = [];

    if (pkgJson.exports) {
      for (const [subpath, value] of Object.entries(pkgJson.exports)) {
        if (EXCLUDE_SUBPATHS.includes(subpath)) continue;
        if (CSS_PATTERN.test(subpath)) continue;

        const entry = resolveEntryPoint(value);
        if (entry) {
          exportEntries.push({ subpath, ...entry });
        }
      }
    }

    packages.push({
      name: pkgJson.name,
      path: pkgDir,
      exports: exportEntries,
    });
  }

  return packages;
}

function resolveEntryPoint(
  value: unknown,
): { typesPath: string | undefined; importPath: string | undefined } | undefined {
  if (typeof value === "string") {
    return { typesPath: undefined, importPath: value };
  }
  if (typeof value === "object" && value !== null) {
    const obj = value as Record<string, unknown>;
    return {
      typesPath: typeof obj["types"] === "string" ? obj["types"] : undefined,
      importPath: typeof obj["import"] === "string" ? obj["import"] : undefined,
    };
  }
  return undefined;
}

// ─── Export classification ──────────────────────────────────────────

const NON_COMPONENT_NAME_SUFFIXES = [
  "Props",
  "Contract",
  "Options",
  "Value",
  "Ref",
  "Type",
  "Result",
  "Config",
  "Info",
  "Handle",
  "State",
  "Callback",
  "Fn",
  "Constructor",
];

const NON_COMPONENT_NAME_PREFIXES = ["CSS_", "DEFAULT_", "PROP_"];

const ALL_CAPS_RE = /^[A-Z0-9_]+$/;

export function classifyExport(name: string): DiscoveredExport["kind"] {
  if (/^use[A-Z]/.test(name)) return "hook";
  if (/Context$/.test(name)) return "context";
  if (ALL_CAPS_RE.test(name)) return "other";
  if (NON_COMPONENT_NAME_PREFIXES.some((p) => name.startsWith(p))) return "other";
  if (/^[A-Z]/.test(name)) {
    for (const suffix of NON_COMPONENT_NAME_SUFFIXES) {
      if (name.endsWith(suffix)) return "type";
    }
    return "component";
  }
  if (/^[a-z]/.test(name)) return "function";
  return "type";
}

// ─── Export discovery from built declarations ───────────────────────

export function discoverExportsFromDts(
  packageInfo: PackageInfo,
  config: DiscoveryConfig,
): readonly DiscoveredExport[] {
  const results: DiscoveredExport[] = [];

  for (const entry of packageInfo.exports) {
    const dtsPath = entry.typesPath;
    if (!dtsPath) continue;

    const fullPath = resolve(packageInfo.path, dtsPath);
    if (!existsSync(fullPath)) continue;

    const content = readFileSync(fullPath, "utf-8");
    const exportKinds = extractExportKinds(content);
    const sortedNames = [...exportKinds.keys()].sort();

    for (const name of sortedNames) {
      if (shouldExclude(name, config.excludePatterns)) continue;

      const declKind = exportKinds.get(name);
      const kind = declKind === "type" ? "type" : classifyExport(name);

      results.push({
        name,
        kind,
        packageName: packageInfo.name,
        entryPoint: entry.subpath,
        sourceFile: relative(config.monorepoRoot, fullPath),
      });
    }
  }

  return results;
}

/**
 * Extracts exported names with their declaration kind from .d.ts content.
 * Names known to be types/interfaces are marked as "type" so they can be
 * excluded from component classification.
 */
function extractExportKinds(content: string): Map<string, "value" | "type"> {
  const kinds = new Map<string, "value" | "type">();

  const declareRe = /export\s+declare\s+(const|function|class|type|interface|enum)\s+(\w+)/g;
  let declMatch = declareRe.exec(content);
  while (declMatch) {
    const kw = declMatch[1] ?? "";
    const name = declMatch[2] ?? "";
    if (name) {
      const kind = kw === "type" || kw === "interface" ? "type" : "value";
      kinds.set(name, kind);
    }
    declMatch = declareRe.exec(content);
  }

  const braceExportRe = /export\s*\{([^}]+)\}/g;
  let match = braceExportRe.exec(content);
  while (match) {
    const matchContent = match[1] ?? "";
    const items = matchContent.split(",");
    for (const item of items) {
      const trimmed = item.trim();
      const isTypeExport = /^type\s+/.test(trimmed);
      const cleaned = trimmed.replace(/^type\s+/, "");
      const asMatch = /(\w+)\s+as\s+(\w+)/.exec(cleaned);
      const name = asMatch ? (asMatch[2] ?? "") : cleaned;
      if (name && /^\w+$/.test(name) && !kinds.has(name)) {
        kinds.set(name, isTypeExport ? "type" : "value");
      }
    }
    match = braceExportRe.exec(content);
  }

  return kinds;
}

function shouldExclude(name: string, patterns?: readonly RegExp[]): boolean {
  if (!patterns) return false;
  return patterns.some((p) => p.test(name));
}

// ─── Full discovery pipeline ────────────────────────────────────────

export function runDiscovery(config: DiscoveryConfig): DiscoveryManifest {
  const packages = discoverPackages(config);
  const allExports: DiscoveredExport[] = [];

  for (const pkg of packages) {
    const exports = discoverExportsFromDts(pkg, config);
    allExports.push(...exports);
  }

  return { packages, exports: allExports };
}
