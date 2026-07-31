import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const THEME_ROOT = join(import.meta.dirname, "..");
const THEME_DIST = join(THEME_ROOT, "dist");
const THEME_PKG = JSON.parse(readFileSync(join(THEME_ROOT, "package.json"), "utf-8")) as Record<
  string,
  unknown
>;

describe("@kairoui/theme public package APIs", () => {
  // ─── Package Metadata ──────────────────────────────────────────

  describe("package metadata", () => {
    it("has correct name", () => {
      expect(THEME_PKG["name"]).toBe("@kairoui/theme");
    });

    it("declares sideEffects false", () => {
      expect(THEME_PKG["sideEffects"]).toBe(false);
    });

    it("has @kairoui/tokens dependency", () => {
      const deps = THEME_PKG["dependencies"] as Record<string, string>;
      expect(deps["@kairoui/tokens"]).toBeDefined();
    });

    it("does not have react as dependency", () => {
      const deps = THEME_PKG["dependencies"] as Record<string, string>;
      expect(deps["react"]).toBeUndefined();
    });

    it("does not have react as peer dependency", () => {
      const peers = (THEME_PKG["peerDependencies"] ?? {}) as Record<string, string>;
      expect(peers["react"]).toBeUndefined();
    });

    it("only publishes dist", () => {
      expect(THEME_PKG["files"]).toEqual(["dist"]);
    });
  });

  // ─── Export Paths in package.json ──────────────────────────────

  describe("export paths", () => {
    const exports = THEME_PKG["exports"] as Record<string, unknown>;

    it("exports root entry (.)", () => {
      expect(exports["."]).toBeDefined();
    });

    it("exports dom entry (./dom)", () => {
      expect(exports["./dom"]).toBeDefined();
    });

    it("exports server entry (./server)", () => {
      expect(exports["./server"]).toBeDefined();
    });

    it("exports package.json", () => {
      expect(exports["./package.json"]).toBe("./package.json");
    });

    it("does not export ./src", () => {
      expect(exports["./src"]).toBeUndefined();
    });

    it("does not export ./react", () => {
      expect(exports["./react"]).toBeUndefined();
    });

    it("does not export ./internal", () => {
      expect(exports["./internal"]).toBeUndefined();
    });
  });

  // ─── Build Outputs Exist ───────────────────────────────────────

  describe("build outputs", () => {
    it("dist/index.js exists", () => {
      expect(existsSync(join(THEME_DIST, "index.js"))).toBe(true);
    });

    it("dist/index.d.ts exists", () => {
      expect(existsSync(join(THEME_DIST, "index.d.ts"))).toBe(true);
    });

    it("dist/dom.js exists", () => {
      expect(existsSync(join(THEME_DIST, "dom.js"))).toBe(true);
    });

    it("dist/dom.d.ts exists", () => {
      expect(existsSync(join(THEME_DIST, "dom.d.ts"))).toBe(true);
    });

    it("dist/server.js exists", () => {
      expect(existsSync(join(THEME_DIST, "server.js"))).toBe(true);
    });

    it("dist/server.d.ts exists", () => {
      expect(existsSync(join(THEME_DIST, "server.d.ts"))).toBe(true);
    });
  });

  // ─── Core Imports ──────────────────────────────────────────────

  describe("core imports (@kairoui/theme)", () => {
    it("exports createTheme", async () => {
      const mod = await import("./index");
      expect(mod.createTheme).toBeDefined();
      expect(typeof mod.createTheme).toBe("function");
    });

    it("exports resolveTheme", async () => {
      const mod = await import("./index");
      expect(mod.resolveTheme).toBeDefined();
    });

    it("exports composeThemes", async () => {
      const mod = await import("./index");
      expect(mod.composeThemes).toBeDefined();
    });

    it("exports validateThemeDefinition", async () => {
      const mod = await import("./index");
      expect(mod.validateThemeDefinition).toBeDefined();
    });

    it("exports preference utilities", async () => {
      const mod = await import("./index");
      expect(mod.validateMode).toBeDefined();
      expect(mod.validateDensity).toBeDefined();
      expect(mod.DEFAULT_PREFERENCE).toBeDefined();
      expect(mod.resolvePreference).toBeDefined();
    });

    it("exports storage adapters", async () => {
      const mod = await import("./index");
      expect(mod.createMemoryAdapter).toBeDefined();
      expect(mod.noopStorageAdapter).toBeDefined();
    });

    it("exports selectors", async () => {
      const mod = await import("./index");
      expect(mod.THEME_ATTRIBUTE).toBe("data-kui-theme");
      expect(mod.DENSITY_ATTRIBUTE).toBe("data-kui-density");
      expect(mod.themeSelector).toBeDefined();
    });

    it("exports serialization", async () => {
      const mod = await import("./index");
      expect(mod.serializeTheme).toBeDefined();
      expect(mod.generateCssVariables).toBeDefined();
      expect(mod.THEME_SERIALIZATION_VERSION).toBeDefined();
    });

    it("exports diagnostics", async () => {
      const mod = await import("./index");
      expect(mod.devWarn).toBeDefined();
      expect(mod.warnMissingProvider).toBeDefined();
    });

    it("exports inspection", async () => {
      const mod = await import("./index");
      expect(mod.inspectTheme).toBeDefined();
      expect(mod.inspectResolvedTheme).toBeDefined();
    });

    it("does NOT contain react imports", () => {
      const js = readFileSync(join(THEME_DIST, "index.js"), "utf-8");
      expect(js).not.toContain('from "react"');
      expect(js).not.toContain("from 'react'");
    });
  });

  // ─── DOM Imports ───────────────────────────────────────────────

  describe("DOM imports (@kairoui/theme/dom)", () => {
    it("exports applyTheme", async () => {
      const mod = await import("./dom");
      expect(mod.applyTheme).toBeDefined();
    });

    it("exports removeTheme", async () => {
      const mod = await import("./dom");
      expect(mod.removeTheme).toBeDefined();
    });

    it("exports applyScopedTheme", async () => {
      const mod = await import("./dom");
      expect(mod.applyScopedTheme).toBeDefined();
    });

    it("exports cleanup utilities", async () => {
      const mod = await import("./dom");
      expect(mod.cleanupTheme).toBeDefined();
      expect(mod.hasThemeState).toBeDefined();
    });

    it("exports system color scheme detection", async () => {
      const mod = await import("./dom");
      expect(mod.getSystemColorScheme).toBeDefined();
      expect(mod.subscribeToColorScheme).toBeDefined();
    });

    it("exports localStorage adapter", async () => {
      const mod = await import("./dom");
      expect(mod.createLocalStorageAdapter).toBeDefined();
    });

    it("exports cross-tab sync", async () => {
      const mod = await import("./dom");
      expect(mod.createCrossTabSync).toBeDefined();
    });

    it("does NOT contain react imports", () => {
      const js = readFileSync(join(THEME_DIST, "dom.js"), "utf-8");
      expect(js).not.toContain('from "react"');
    });
  });

  // ─── Server Imports ────────────────────────────────────────────

  describe("server imports (@kairoui/theme/server)", () => {
    it("exports getNoFlashScript", async () => {
      const mod = await import("./server");
      expect(mod.getNoFlashScript).toBeDefined();
    });

    it("exports getNoFlashScriptReadable", async () => {
      const mod = await import("./server");
      expect(mod.getNoFlashScriptReadable).toBeDefined();
    });

    it("exports serializeServerState", async () => {
      const mod = await import("./server");
      expect(mod.serializeServerState).toBeDefined();
    });

    it("exports parseServerState", async () => {
      const mod = await import("./server");
      expect(mod.parseServerState).toBeDefined();
    });

    it("exports getServerHtmlAttributes", async () => {
      const mod = await import("./server");
      expect(mod.getServerHtmlAttributes).toBeDefined();
    });

    it("does NOT contain DOM globals in non-template code", () => {
      const js = readFileSync(join(THEME_DIST, "server.js"), "utf-8");
      const withoutTemplates = js.replace(/`[^`]*`/gs, "");
      expect(withoutTemplates).not.toContain("window.");
      expect(withoutTemplates).not.toContain("document.");
    });
  });

  // ─── Type Declarations ─────────────────────────────────────────

  describe("type declarations", () => {
    it("index.d.ts exports ThemeMode", () => {
      const dts = readFileSync(join(THEME_DIST, "index.d.ts"), "utf-8");
      expect(dts).toContain("ThemeMode");
    });

    it("index.d.ts exports DensityMode", () => {
      const dts = readFileSync(join(THEME_DIST, "index.d.ts"), "utf-8");
      expect(dts).toContain("DensityMode");
    });

    it("index.d.ts exports ThemeDefinition", () => {
      const dts = readFileSync(join(THEME_DIST, "index.d.ts"), "utf-8");
      expect(dts).toContain("ThemeDefinition");
    });

    it("dom.d.ts exports applyTheme", () => {
      const dts = readFileSync(join(THEME_DIST, "dom.d.ts"), "utf-8");
      expect(dts).toContain("applyTheme");
    });

    it("server.d.ts exports getNoFlashScript", () => {
      const dts = readFileSync(join(THEME_DIST, "server.d.ts"), "utf-8");
      expect(dts).toContain("getNoFlashScript");
    });
  });

  // ─── Private Paths ─────────────────────────────────────────────

  describe("private paths", () => {
    it("no src directory in dist", () => {
      expect(existsSync(join(THEME_DIST, "src"))).toBe(false);
    });

    it("no test files in dist", () => {
      expect(existsSync(join(THEME_DIST, "create-theme.test.js"))).toBe(false);
    });
  });
});
