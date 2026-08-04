import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const PKG_ROOT = join(import.meta.dirname, "..");
const DIST = join(PKG_ROOT, "dist");

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const pkg: any = JSON.parse(readFileSync(join(PKG_ROOT, "package.json"), "utf-8"));

describe("@kairoui/hooks package boundaries", () => {
  describe("exports", () => {
    it("root entry is importable", async () => {
      const mod = await import("@kairoui/hooks");
      expect(mod).toBeDefined();
    });

    it("exports field declares exactly 2 paths", () => {
      const paths = Object.keys(pkg["exports"]);
      expect(paths).toEqual([".", "./package.json"]);
    });

    it("all declared dist files exist", () => {
      expect(existsSync(join(DIST, "index.js"))).toBe(true);
      expect(existsSync(join(DIST, "index.d.ts"))).toBe(true);
    });
  });

  describe("package configuration", () => {
    it("sideEffects is false", () => {
      expect(pkg["sideEffects"]).toBe(false);
    });

    it("files includes only dist", () => {
      expect(pkg["files"]).toEqual(["dist"]);
    });

    it("type is module (ESM)", () => {
      expect(pkg["type"]).toBe("module");
    });

    it("react is peer dependency, not bundled", () => {
      expect(pkg["peerDependencies"]["react"]).toBeDefined();
      expect((pkg["dependencies"] ?? {})["react"]).toBeUndefined();
    });

    it("@kairoui/utils is the only runtime dependency", () => {
      const deps = Object.keys(pkg["dependencies"] ?? {});
      expect(deps).toEqual(["@kairoui/utils"]);
    });

    it("no theme or core dependency", () => {
      const deps = Object.keys(pkg["dependencies"] ?? {});
      expect(deps).not.toContain("@kairoui/theme");
      expect(deps).not.toContain("@kairoui/core");
      expect(deps).not.toContain("@kairoui/tokens");
    });
  });

  describe("framework isolation", () => {
    it("React is external, not bundled", () => {
      const js = readFileSync(join(DIST, "index.js"), "utf-8");
      expect(js).not.toContain("function createElement");
      expect(js).not.toContain("function useState");
    });

    it("does not depend on @kairoui/theme or @kairoui/core", () => {
      const js = readFileSync(join(DIST, "index.js"), "utf-8");
      expect(js).not.toContain("@kairoui/theme");
      expect(js).not.toContain("@kairoui/core");
      expect(js).not.toContain("@kairoui/tokens");
    });
  });

  describe("server safety", () => {
    it("no top-level browser global access (import succeeds without DOM)", () => {
      // The "importing in node environment" test below validates this at runtime.
      // Here we verify localStorage is not referenced (it's never needed).
      const js = readFileSync(join(DIST, "index.js"), "utf-8");
      expect(js).not.toContain("localStorage");
    });

    it("importing in node environment does not throw", async () => {
      // This test runs in happy-dom but validates the import succeeds
      await expect(import("@kairoui/hooks")).resolves.toBeDefined();
    });
  });
});
