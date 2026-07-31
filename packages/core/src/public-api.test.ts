import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const CORE_ROOT = join(import.meta.dirname, "..");
const CORE_DIST = join(CORE_ROOT, "dist");
const CORE_PKG = JSON.parse(readFileSync(join(CORE_ROOT, "package.json"), "utf-8")) as Record<
  string,
  unknown
>;

describe("@kairoui/core public package APIs", () => {
  // ─── Package Metadata ──────────────────────────────────────────

  describe("package metadata", () => {
    it("has correct name", () => {
      expect(CORE_PKG["name"]).toBe("@kairoui/core");
    });

    it("has @kairoui/theme as dependency", () => {
      const deps = CORE_PKG["dependencies"] as Record<string, string>;
      expect(deps["@kairoui/theme"]).toBeDefined();
    });

    it("has react as peer dependency", () => {
      const peers = CORE_PKG["peerDependencies"] as Record<string, string>;
      expect(peers["react"]).toBeDefined();
    });

    it("react is NOT a runtime dependency", () => {
      const deps = (CORE_PKG["dependencies"] ?? {}) as Record<string, string>;
      expect(deps["react"]).toBeUndefined();
      expect(deps["react-dom"]).toBeUndefined();
    });

    it("only publishes dist", () => {
      expect(CORE_PKG["files"]).toEqual(["dist"]);
    });
  });

  // ─── Build Outputs ─────────────────────────────────────────────

  describe("build outputs", () => {
    it("dist/index.js exists", () => {
      expect(existsSync(join(CORE_DIST, "index.js"))).toBe(true);
    });

    it("dist/index.d.ts exists", () => {
      expect(existsSync(join(CORE_DIST, "index.d.ts"))).toBe(true);
    });

    it("no src directory in dist", () => {
      expect(existsSync(join(CORE_DIST, "src"))).toBe(false);
    });
  });

  // ─── Provider Exports ──────────────────────────────────────────

  describe("provider exports", () => {
    it("exports KairoProvider", async () => {
      const mod = await import("./index");
      expect(mod.KairoProvider).toBeDefined();
    });

    it("exports KairoScopeProvider", async () => {
      const mod = await import("./index");
      expect(mod.KairoScopeProvider).toBeDefined();
    });

    it("exports KairoThemeContext", async () => {
      const mod = await import("./index");
      expect(mod.KairoThemeContext).toBeDefined();
    });
  });

  // ─── Hook Exports ──────────────────────────────────────────────

  describe("hook exports", () => {
    it("exports useTheme", async () => {
      const mod = await import("./index");
      expect(mod.useTheme).toBeDefined();
    });

    it("exports useThemeMode", async () => {
      const mod = await import("./index");
      expect(mod.useThemeMode).toBeDefined();
    });

    it("exports useDensity", async () => {
      const mod = await import("./index");
      expect(mod.useDensity).toBeDefined();
    });

    it("exports useResolvedTheme", async () => {
      const mod = await import("./index");
      expect(mod.useResolvedTheme).toBeDefined();
    });

    it("exports useSystemColorScheme", async () => {
      const mod = await import("./index");
      expect(mod.useSystemColorScheme).toBeDefined();
    });

    it("exports selector hooks", async () => {
      const mod = await import("./index");
      expect(mod.useThemeName).toBeDefined();
      expect(mod.useRequestedMode).toBeDefined();
      expect(mod.useResolvedMode).toBeDefined();
      expect(mod.useCurrentDensity).toBeDefined();
      expect(mod.useIsNested).toBeDefined();
      expect(mod.useIsSystemMode).toBeDefined();
    });
  });

  // ─── Type Declarations ─────────────────────────────────────────

  describe("type declarations", () => {
    it("declares KairoProvider", () => {
      const dts = readFileSync(join(CORE_DIST, "index.d.ts"), "utf-8");
      expect(dts).toContain("KairoProvider");
    });

    it("declares useTheme", () => {
      const dts = readFileSync(join(CORE_DIST, "index.d.ts"), "utf-8");
      expect(dts).toContain("useTheme");
    });

    it("declares KairoProviderProps", () => {
      const dts = readFileSync(join(CORE_DIST, "index.d.ts"), "utf-8");
      expect(dts).toContain("KairoProviderProps");
    });
  });

  // ─── React Not Bundled ─────────────────────────────────────────

  describe("React externalization", () => {
    it("react is external (not bundled)", () => {
      const js = readFileSync(join(CORE_DIST, "index.js"), "utf-8");
      // React should be imported, not inlined
      expect(js).toContain("react");
      // But it should not contain the React source code
      expect(js).not.toContain("__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED");
    });
  });
});
