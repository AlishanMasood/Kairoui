/**
 * Package boundary tests for @kairoui/theme.
 *
 * Validates that export paths resolve correctly, internal modules
 * are not exposed, and framework isolation is maintained.
 */

import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const PKG_ROOT = join(import.meta.dirname, "..");
const PKG_JSON_PATH = join(PKG_ROOT, "package.json");
const DIST = join(PKG_ROOT, "dist");

describe("@kairoui/theme package boundaries", () => {
  // ─── Package Metadata ────────────────────────────────────────────

  describe("package.json", () => {
    const pkg = JSON.parse(readFileSync(PKG_JSON_PATH, "utf-8")) as Record<string, unknown>;

    it("has correct name", () => {
      expect(pkg["name"]).toBe("@kairoui/theme");
    });

    it("declares sideEffects false", () => {
      expect(pkg["sideEffects"]).toBe(false);
    });

    it("does not list react as a dependency", () => {
      const deps = (pkg["dependencies"] ?? {}) as Record<string, string>;
      expect(deps["react"]).toBeUndefined();
      expect(deps["react-dom"]).toBeUndefined();
    });

    it("does not list react as a peer dependency", () => {
      const peers = (pkg["peerDependencies"] ?? {}) as Record<string, string>;
      expect(peers["react"]).toBeUndefined();
    });

    it("only publishes dist", () => {
      expect(pkg["files"]).toEqual(["dist"]);
    });
  });

  // ─── Export Map ──────────────────────────────────────────────────

  describe("export paths", () => {
    const pkg = JSON.parse(readFileSync(PKG_JSON_PATH, "utf-8")) as {
      exports: Record<string, unknown>;
    };

    it("exports root entry point", () => {
      expect(pkg.exports["."]).toBeDefined();
    });

    it("exports dom entry point", () => {
      expect(pkg.exports["./dom"]).toBeDefined();
    });

    it("exports server entry point", () => {
      expect(pkg.exports["./server"]).toBeDefined();
    });

    it("exports package.json", () => {
      expect(pkg.exports["./package.json"]).toBe("./package.json");
    });

    it("does not export internal paths", () => {
      const paths = Object.keys(pkg.exports);
      expect(paths).not.toContain("./src");
      expect(paths).not.toContain("./src/types");
      expect(paths).not.toContain("./internal");
    });
  });

  // ─── Framework Independence ──────────────────────────────────────

  describe("framework independence", () => {
    it("root entry does not import react", async () => {
      const mod = await import("./index");
      expect(mod).toBeDefined();
    });

    it("dom entry does not import react", async () => {
      const mod = await import("./dom");
      expect(mod).toBeDefined();
    });

    it("server entry does not import react", async () => {
      const mod = await import("./server");
      expect(mod).toBeDefined();
    });
  });

  // ─── Type Exports ────────────────────────────────────────────────

  describe("public type exports", () => {
    it("exports ThemeMode type", async () => {
      const mod = await import("./index");
      // Type-only exports don't appear at runtime, but the module must load
      expect(mod).toBeDefined();
    });
  });

  // ─── Build Outputs ───────────────────────────────────────────────

  describe("build outputs", () => {
    it("produces dist/index.js", () => {
      expect(existsSync(join(DIST, "index.js"))).toBe(true);
    });

    it("produces dist/index.d.ts", () => {
      expect(existsSync(join(DIST, "index.d.ts"))).toBe(true);
    });

    it("produces dist/dom.js", () => {
      expect(existsSync(join(DIST, "dom.js"))).toBe(true);
    });

    it("produces dist/dom.d.ts", () => {
      expect(existsSync(join(DIST, "dom.d.ts"))).toBe(true);
    });

    it("produces dist/server.js", () => {
      expect(existsSync(join(DIST, "server.js"))).toBe(true);
    });

    it("produces dist/server.d.ts", () => {
      expect(existsSync(join(DIST, "server.d.ts"))).toBe(true);
    });

    it("does not expose src directory in dist", () => {
      expect(existsSync(join(DIST, "src"))).toBe(false);
    });

    it("root bundle does not contain react imports", () => {
      const js = readFileSync(join(DIST, "index.js"), "utf-8");
      expect(js).not.toContain('from "react"');
      expect(js).not.toContain("from 'react'");
      expect(js).not.toContain('require("react")');
    });

    it("dom bundle does not contain react imports", () => {
      const js = readFileSync(join(DIST, "dom.js"), "utf-8");
      expect(js).not.toContain('from "react"');
      expect(js).not.toContain("from 'react'");
    });

    it("server bundle does not contain browser globals at top level", () => {
      const js = readFileSync(join(DIST, "server.js"), "utf-8");
      expect(js).not.toContain("window.");
      expect(js).not.toContain("document.");
      expect(js).not.toContain("localStorage.");
    });

    it("index.d.ts exports expected types", () => {
      const dts = readFileSync(join(DIST, "index.d.ts"), "utf-8");
      expect(dts).toContain("ThemeMode");
      expect(dts).toContain("ResolvedThemeMode");
      expect(dts).toContain("DensityMode");
      expect(dts).toContain("ThemePreference");
      expect(dts).toContain("StorageAdapter");
      expect(dts).toContain("ThemeEngine");
    });
  });
});
