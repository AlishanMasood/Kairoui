import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const PKG_ROOT = join(import.meta.dirname, "..");
const DIST = join(PKG_ROOT, "dist");

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const pkg: any = JSON.parse(readFileSync(join(PKG_ROOT, "package.json"), "utf-8"));

describe("@kairoui/utils package boundaries", () => {
  describe("exports", () => {
    it("root entry is importable", async () => {
      const mod = await import("@kairoui/utils");
      expect(mod.noop).toBeTypeOf("function");
      expect(mod.identity).toBeTypeOf("function");
    });

    it("dom entry is importable", async () => {
      const mod = await import("@kairoui/utils/dom");
      expect(mod).toBeDefined();
    });

    it("events entry is importable", async () => {
      const mod = await import("@kairoui/utils/events");
      expect(mod).toBeDefined();
    });

    it("exports field declares exactly 4 paths", () => {
      const paths = Object.keys(pkg["exports"]);
      expect(paths).toEqual([".", "./dom", "./events", "./package.json"]);
    });

    it("all declared dist files exist", () => {
      expect(existsSync(join(DIST, "index.js"))).toBe(true);
      expect(existsSync(join(DIST, "index.d.ts"))).toBe(true);
      expect(existsSync(join(DIST, "dom.js"))).toBe(true);
      expect(existsSync(join(DIST, "dom.d.ts"))).toBe(true);
      expect(existsSync(join(DIST, "events.js"))).toBe(true);
      expect(existsSync(join(DIST, "events.d.ts"))).toBe(true);
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

    it("has no runtime dependencies", () => {
      expect(pkg["dependencies"]).toBeUndefined();
    });

    it("has no peer dependencies", () => {
      expect(pkg["peerDependencies"]).toBeUndefined();
    });
  });

  describe("isolation", () => {
    it("root entry has no React references", () => {
      const js = readFileSync(join(DIST, "index.js"), "utf-8");
      expect(js).not.toContain("'react'");
      expect(js).not.toContain('"react"');
    });

    it("dom entry has no React references", () => {
      const js = readFileSync(join(DIST, "dom.js"), "utf-8");
      expect(js).not.toContain("'react'");
      expect(js).not.toContain('"react"');
    });

    it("events entry has no React references", () => {
      const js = readFileSync(join(DIST, "events.js"), "utf-8");
      expect(js).not.toContain("'react'");
      expect(js).not.toContain('"react"');
    });

    it("no module-level browser globals in root entry", () => {
      const js = readFileSync(join(DIST, "index.js"), "utf-8");
      expect(js).not.toContain("document.");
      expect(js).not.toContain("window.");
      expect(js).not.toContain("localStorage");
    });
  });
});
