import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const PKG_ROOT = join(import.meta.dirname, "..");
const DIST = join(PKG_ROOT, "dist");

interface PkgJson {
  readonly name?: string;
  readonly type?: string;
  readonly sideEffects?: boolean | readonly string[];
  readonly files?: readonly string[];
  readonly exports?: Readonly<Record<string, unknown>>;
  readonly dependencies?: Readonly<Record<string, string>>;
  readonly peerDependencies?: Readonly<Record<string, string>>;
}

const pkg: PkgJson = JSON.parse(readFileSync(join(PKG_ROOT, "package.json"), "utf-8")) as PkgJson;

describe("@kairoui-pro/scheduler package boundaries", () => {
  describe("identity", () => {
    it("belongs to the @kairoui-pro scope", () => {
      expect(pkg.name).toBe("@kairoui-pro/scheduler");
    });

    it("declares type=module (ESM)", () => {
      expect(pkg.type).toBe("module");
    });

    it("declares sideEffects covering CSS only", () => {
      expect(pkg.sideEffects).toEqual(["**/*.css"]);
    });

    it("publishes only dist", () => {
      expect(pkg.files).toEqual(["dist"]);
    });
  });

  describe("exports", () => {
    it("declares root + styles.css + package.json", () => {
      const paths = Object.keys(pkg.exports ?? {});
      expect(paths.sort()).toEqual([".", "./package.json", "./styles.css"]);
    });

    it("root entry resolves and exposes the layout API + React root", async () => {
      const mod = await import("@kairoui-pro/scheduler");
      expect(mod.computeEventLayout).toBeTypeOf("function");
      expect(mod.computeAllDayLayout).toBeTypeOf("function");
      expect(mod.computeVisibleRange).toBeTypeOf("function");
      expect(mod.computeSlots).toBeTypeOf("function");
      expect(mod.assertValidSchedulerEvent).toBeTypeOf("function");
      expect(mod.DEFAULT_MAX_EVENTS_PER_SLOT).toBe(6);
      expect(mod.Scheduler).toBeTypeOf("function");
      expect(mod.Scheduler.Root).toBeTypeOf("function");
      expect(mod.Scheduler.Toolbar).toBeTypeOf("function");
      expect(mod.Scheduler.WeekView).toBeTypeOf("function");
      expect(mod.Scheduler.TimelineView).toBeTypeOf("function");
      expect(mod.Scheduler.NowIndicator).toBeTypeOf("function");
      expect(mod.useScheduler).toBeTypeOf("function");
    });

    it("all declared dist files exist", () => {
      expect(existsSync(join(DIST, "index.js"))).toBe(true);
      expect(existsSync(join(DIST, "index.d.ts"))).toBe(true);
      expect(existsSync(join(DIST, "styles.css"))).toBe(true);
    });
  });

  describe("dependency direction", () => {
    it("depends only on approved @kairoui/* packages", () => {
      const deps = Object.keys(pkg.dependencies ?? {});
      expect(deps.sort()).toEqual(["@kairoui/core", "@kairoui/hooks", "@kairoui/utils"]);
    });

    it("depends on no other @kairoui-pro/* package", () => {
      const allDeps = {
        ...(pkg.dependencies ?? {}),
        ...(pkg.peerDependencies ?? {}),
      };
      for (const name of Object.keys(allDeps)) {
        if (name.startsWith("@kairoui-pro/")) {
          throw new Error(
            `KUI-ENT-001 boundary violation: ${name} listed as a runtime or peer dependency.`,
          );
        }
      }
    });

    it("declares react as peer, not runtime", () => {
      expect(pkg.peerDependencies?.["react"]).toBeDefined();
      expect(pkg.dependencies?.["react"]).toBeUndefined();
    });
  });

  describe("built artifact hygiene", () => {
    it("does not bundle react", () => {
      const bundle = readFileSync(join(DIST, "index.js"), "utf-8");
      expect(bundle).not.toContain("function createElement");
      expect(bundle).not.toContain("function useState");
    });

    it("does not reference any other @kairoui-pro/* peer package in the bundle", () => {
      const bundle = readFileSync(join(DIST, "index.js"), "utf-8");
      const violations = bundle.match(/@kairoui-pro\/(?!scheduler)/g);
      expect(violations ?? []).toHaveLength(0);
    });
  });
});
