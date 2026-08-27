import { describe, it, expect } from "vitest";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  discoverPackages,
  classifyExport,
  discoverExportsFromDts,
  runDiscovery,
} from "./package-discovery";
import type { DiscoveryConfig } from "./package-discovery";

// Resolve monorepo root from this file's location
const THIS_DIR =
  typeof import.meta.dirname === "string"
    ? import.meta.dirname
    : dirname(fileURLToPath(import.meta.url));
const MONOREPO_ROOT = resolve(THIS_DIR, "../../..");

const defaultConfig: DiscoveryConfig = { monorepoRoot: MONOREPO_ROOT };

// ─── discoverPackages ───────────────────────────────────────────────

describe("discoverPackages", () => {
  it("discovers all default packages", () => {
    const packages = discoverPackages(defaultConfig);
    const names = packages.map((p) => p.name);
    expect(names).toContain("@kairoui/core");
    expect(names).toContain("@kairoui/hooks");
    expect(names).toContain("@kairoui/tokens");
    expect(names).toContain("@kairoui/theme");
    expect(names).toContain("@kairoui/utils");
  });

  it("discovers core entry points", () => {
    const packages = discoverPackages(defaultConfig);
    const core = packages.find((p) => p.name === "@kairoui/core");
    expect(core).toBeDefined();
    const subpaths = core!.exports.map((e) => e.subpath);
    expect(subpaths).toContain(".");
    expect(subpaths).toContain("./components");
    expect(subpaths).toContain("./composition");
    expect(subpaths).toContain("./primitives");
  });

  it("excludes package.json and CSS subpaths", () => {
    const packages = discoverPackages(defaultConfig);
    const core = packages.find((p) => p.name === "@kairoui/core")!;
    const subpaths = core.exports.map((e) => e.subpath);
    expect(subpaths).not.toContain("./package.json");
    expect(subpaths).not.toContain("./styles.css");
  });

  it("resolves types and import paths", () => {
    const packages = discoverPackages(defaultConfig);
    const core = packages.find((p) => p.name === "@kairoui/core")!;
    const main = core.exports.find((e) => e.subpath === ".");
    expect(main?.typesPath).toContain(".d.ts");
    expect(main?.importPath).toContain(".js");
  });

  it("supports scoping to specific packages", () => {
    const packages = discoverPackages({ ...defaultConfig, packages: ["core"] });
    expect(packages).toHaveLength(1);
    expect(packages[0]!.name).toBe("@kairoui/core");
  });

  it("skips missing packages gracefully", () => {
    const packages = discoverPackages({ ...defaultConfig, packages: ["nonexistent"] });
    expect(packages).toHaveLength(0);
  });
});

// ─── classifyExport ─────────────────────────────────────────────────

describe("classifyExport", () => {
  it("classifies PascalCase as component", () => {
    expect(classifyExport("Button")).toBe("component");
    expect(classifyExport("DataTable")).toBe("component");
    expect(classifyExport("TreeView")).toBe("component");
  });

  it("classifies useX as hook", () => {
    expect(classifyExport("useControllableState")).toBe("hook");
    expect(classifyExport("useSortState")).toBe("hook");
  });

  it("classifies XContext as context", () => {
    expect(classifyExport("TabsContext")).toBe("context");
    expect(classifyExport("TreeViewContext")).toBe("context");
  });

  it("classifies camelCase as function", () => {
    expect(classifyExport("column")).toBe("function");
    expect(classifyExport("createRowModel")).toBe("function");
    expect(classifyExport("computePageRange")).toBe("function");
  });

  it("classifies Props/Contract suffixes as type", () => {
    expect(classifyExport("ButtonOwnProps")).toBe("type");
    expect(classifyExport("TableContract")).toBe("type");
  });
});

// ─── discoverExportsFromDts ─────────────────────────────────────────

describe("discoverExportsFromDts", () => {
  it("discovers exports from core/components .d.ts", () => {
    const packages = discoverPackages({ ...defaultConfig, packages: ["core"] });
    const core = packages[0]!;
    const exports = discoverExportsFromDts(core, defaultConfig);
    const names = exports.map((e) => e.name);

    // Phase 9 components
    expect(names).toContain("Button");
    expect(names).toContain("Checkbox");
    expect(names).toContain("Input");

    // Phase 11 navigation
    expect(names).toContain("Tabs");
    expect(names).toContain("Accordion");
    expect(names).toContain("Breadcrumbs");

    // Phase 12 data
    expect(names).toContain("DataTable");
    expect(names).toContain("TreeView");
    expect(names).toContain("Calendar");
    expect(names).toContain("Timeline");
  });

  it("discovers hooks", () => {
    const packages = discoverPackages({ ...defaultConfig, packages: ["hooks"] });
    const hooks = packages[0]!;
    const exports = discoverExportsFromDts(hooks, defaultConfig);
    const hookNames = exports.filter((e) => e.kind === "hook").map((e) => e.name);
    expect(hookNames.length).toBeGreaterThan(0);
  });

  it("assigns correct package name and entry point", () => {
    const packages = discoverPackages({ ...defaultConfig, packages: ["core"] });
    const core = packages[0]!;
    const exports = discoverExportsFromDts(core, defaultConfig);
    const button = exports.find((e) => e.name === "Button");
    expect(button?.packageName).toBe("@kairoui/core");
  });

  it("exports within each entry point are sorted alphabetically", () => {
    const packages = discoverPackages({ ...defaultConfig, packages: ["core"] });
    const core = packages[0]!;
    for (const entry of core.exports) {
      const entryExports = discoverExportsFromDts({ ...core, exports: [entry] }, defaultConfig);
      const names = entryExports.map((e) => e.name);
      const sorted = [...names].sort();
      expect(names).toEqual(sorted);
    }
  });

  it("supports exclude patterns", () => {
    const config: DiscoveryConfig = {
      ...defaultConfig,
      packages: ["core"],
      excludePatterns: [/^button/i],
    };
    const packages = discoverPackages(config);
    const exports = discoverExportsFromDts(packages[0]!, config);
    const names = exports.map((e) => e.name);
    expect(names).not.toContain("Button");
    expect(names).not.toContain("buttonStyleContract");
  });
});

// ─── runDiscovery (full pipeline) ───────────────────────────────────

describe("runDiscovery", () => {
  it("produces a manifest with packages and exports", () => {
    const manifest = runDiscovery({ ...defaultConfig, packages: ["core"] });
    expect(manifest.packages).toHaveLength(1);
    expect(manifest.exports.length).toBeGreaterThan(50);
  });

  it("includes compound component parts", () => {
    const manifest = runDiscovery({ ...defaultConfig, packages: ["core"] });
    const names = manifest.exports.map((e) => e.name);
    // Tabs compound parts
    expect(names).toContain("TabsList");
    expect(names).toContain("TabsTrigger");
    expect(names).toContain("TabsContent");
    // DataTable parts
    expect(names).toContain("Table");
    expect(names).toContain("TableHead");
    expect(names).toContain("TableCell");
  });

  it("classifies exports correctly across the manifest", () => {
    const manifest = runDiscovery({ ...defaultConfig, packages: ["core"] });
    const components = manifest.exports.filter((e) => e.kind === "component");
    const hooks = manifest.exports.filter((e) => e.kind === "hook");
    const functions = manifest.exports.filter((e) => e.kind === "function");
    expect(components.length).toBeGreaterThan(30);
    expect(hooks.length).toBeGreaterThan(0);
    expect(functions.length).toBeGreaterThan(0);
  });
});
