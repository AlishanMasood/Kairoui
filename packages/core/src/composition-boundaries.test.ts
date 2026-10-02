import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const PKG_ROOT = join(import.meta.dirname, "..");
const DIST = join(PKG_ROOT, "dist");

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const pkg: any = JSON.parse(readFileSync(join(PKG_ROOT, "package.json"), "utf-8"));

describe("@kairoui/core composition package boundaries", () => {
  describe("exports", () => {
    it("composition entry is importable", async () => {
      const mod = await import("@kairoui/core/composition");
      expect(mod).toBeDefined();
    });

    it("composition dist files exist", () => {
      expect(existsSync(join(DIST, "composition.js"))).toBe(true);
      expect(existsSync(join(DIST, "composition.d.ts"))).toBe(true);
    });

    it("exports field includes composition path", () => {
      const paths = Object.keys(pkg["exports"]);
      expect(paths).toContain("./composition");
    });

    it("exports narrow DataGrid and Command interop paths", () => {
      const paths = Object.keys(pkg["exports"]);
      expect(paths).toContain("./components/data-grid");
      expect(paths).toContain("./components/overlay/command");
      expect(existsSync(join(DIST, "components/data-table/data-grid.js"))).toBe(true);
      expect(existsSync(join(DIST, "components/overlay/command.js"))).toBe(true);
    });

    it("data-grid interop exports the required utilities without the full table component", async () => {
      // eslint-disable-next-line import-x/no-internal-modules
      const mod = await import("@kairoui/core/components/data-grid");
      expect(mod.applyFilters).toBeTypeOf("function");
      expect(mod.getCellContent).toBeTypeOf("function");
      expect(mod.getCellValue).toBeTypeOf("function");
      expect(mod.getHeaderContent).toBeTypeOf("function");
      expect("DataTable" in mod).toBe(false);
    });
  });

  describe("dependencies", () => {
    it("depends on @kairoui/utils", () => {
      expect(pkg["dependencies"]["@kairoui/utils"]).toBeDefined();
    });

    it("depends on @kairoui/hooks", () => {
      expect(pkg["dependencies"]["@kairoui/hooks"]).toBeDefined();
    });

    it("depends on @kairoui/theme", () => {
      expect(pkg["dependencies"]["@kairoui/theme"]).toBeDefined();
    });

    it("react is peer dependency, not bundled", () => {
      expect(pkg["peerDependencies"]["react"]).toBeDefined();
      expect(pkg["dependencies"]["react"]).toBeUndefined();
    });
  });

  describe("isolation", () => {
    it("composition entry does not bundle React", () => {
      const js = readFileSync(join(DIST, "composition.js"), "utf-8");
      expect(js).not.toContain("function createElement");
      expect(js).not.toContain("function useState");
    });

    it("composition entry has no module-level browser globals", () => {
      const js = readFileSync(join(DIST, "composition.js"), "utf-8");
      expect(js).not.toContain("localStorage");
    });

    it("does not depend on individual component packages", () => {
      const deps = Object.keys(pkg["dependencies"]);
      const componentPkgs = deps.filter(
        (d: string) =>
          d.startsWith("@kairoui/") &&
          !["@kairoui/theme", "@kairoui/hooks", "@kairoui/utils"].includes(d),
      );
      expect(componentPkgs).toEqual([]);
    });
  });

  describe("package configuration", () => {
    it("type is module (ESM)", () => {
      expect(pkg["type"]).toBe("module");
    });

    it("publishes dist while excluding sourcemaps", () => {
      expect(pkg["files"]).toEqual(["dist", "!dist/**/*.map"]);
    });
  });
});
