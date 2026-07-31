import { describe, it, expect } from "vitest";
import { resolvePreference } from "./resolve-preference";

describe("resolvePreference", () => {
  // ─── Explicit Runtime Value (Highest Priority) ─────────────────

  describe("explicit runtime value", () => {
    it("uses explicit mode", () => {
      const result = resolvePreference({ explicit: { mode: "dark" } });
      expect(result.mode).toBe("dark");
      expect(result.modeSource).toBe("controlled");
    });

    it("uses explicit density", () => {
      const result = resolvePreference({ explicit: { density: "compact" } });
      expect(result.density).toBe("compact");
      expect(result.densitySource).toBe("controlled");
    });

    it("explicit overrides persisted", () => {
      const result = resolvePreference({
        explicit: { mode: "dark" },
        persisted: { mode: "light", density: "comfortable" },
      });
      expect(result.mode).toBe("dark");
      expect(result.modeSource).toBe("controlled");
    });

    it("explicit overrides app default", () => {
      const result = resolvePreference({
        explicit: { mode: "dark" },
        appDefault: { mode: "light" },
      });
      expect(result.mode).toBe("dark");
    });

    it("invalid explicit falls through to persisted", () => {
      const result = resolvePreference({
        explicit: { mode: "invalid" as "light" },
        persisted: { mode: "dark", density: "compact" },
      });
      expect(result.mode).toBe("dark");
      expect(result.modeSource).toBe("persisted");
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  // ─── Persisted Preference ──────────────────────────────────────

  describe("persisted preference", () => {
    it("uses persisted mode when no explicit", () => {
      const result = resolvePreference({
        persisted: { mode: "dark", density: "standard" },
      });
      expect(result.mode).toBe("dark");
      expect(result.modeSource).toBe("persisted");
    });

    it("uses persisted density when no explicit", () => {
      const result = resolvePreference({
        persisted: { mode: "light", density: "compact" },
      });
      expect(result.density).toBe("compact");
      expect(result.densitySource).toBe("persisted");
    });

    it("invalid persisted falls through to app default", () => {
      const result = resolvePreference({
        persisted: { mode: "bogus" as "light", density: "compact" },
        appDefault: { mode: "dark" },
      });
      expect(result.mode).toBe("dark");
      expect(result.modeSource).toBe("default");
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it("null persisted falls through to app default", () => {
      const result = resolvePreference({
        persisted: null,
        appDefault: { mode: "dark" },
      });
      expect(result.mode).toBe("dark");
      expect(result.modeSource).toBe("default");
    });
  });

  // ─── Application Default ───────────────────────────────────────

  describe("application default", () => {
    it("uses app default mode when no explicit or persisted", () => {
      const result = resolvePreference({
        appDefault: { mode: "dark" },
      });
      expect(result.mode).toBe("dark");
      expect(result.modeSource).toBe("default");
    });

    it("uses app default density", () => {
      const result = resolvePreference({
        appDefault: { density: "compact" },
      });
      expect(result.density).toBe("compact");
      expect(result.densitySource).toBe("default");
    });

    it("invalid app default uses KairoUI fallback", () => {
      const result = resolvePreference({
        appDefault: { mode: "bad" as "light" },
      });
      expect(result.mode).toBe("system");
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  // ─── KairoUI Fallback ─────────────────────────────────────────

  describe("KairoUI fallback", () => {
    it("defaults to system mode when nothing provided", () => {
      const result = resolvePreference({});
      expect(result.mode).toBe("system");
      expect(result.modeSource).toBe("default");
    });

    it("defaults to comfortable density when nothing provided", () => {
      const result = resolvePreference({});
      expect(result.density).toBe("comfortable");
      expect(result.densitySource).toBe("default");
    });
  });

  // ─── System Mode Resolution ────────────────────────────────────

  describe("system mode resolution", () => {
    it("resolves system mode to dark when OS is dark", () => {
      const result = resolvePreference({
        explicit: { mode: "system" },
        systemColorScheme: "dark",
      });
      expect(result.mode).toBe("system");
      expect(result.resolvedMode).toBe("dark");
      expect(result.resolvedModeSource).toBe("system");
    });

    it("resolves system mode to light when OS is light", () => {
      const result = resolvePreference({
        explicit: { mode: "system" },
        systemColorScheme: "light",
      });
      expect(result.resolvedMode).toBe("light");
      expect(result.resolvedModeSource).toBe("system");
    });

    it("resolves system mode to light when system unavailable", () => {
      const result = resolvePreference({
        explicit: { mode: "system" },
        systemColorScheme: null,
      });
      expect(result.resolvedMode).toBe("light");
      expect(result.resolvedModeSource).toBe("fallback");
    });

    it("resolves system mode to light when systemColorScheme omitted", () => {
      const result = resolvePreference({
        explicit: { mode: "system" },
      });
      expect(result.resolvedMode).toBe("light");
      expect(result.resolvedModeSource).toBe("fallback");
    });

    it("explicit dark resolves directly without system", () => {
      const result = resolvePreference({
        explicit: { mode: "dark" },
        systemColorScheme: "light",
      });
      expect(result.resolvedMode).toBe("dark");
      expect(result.resolvedModeSource).toBe("explicit");
    });

    it("explicit light resolves directly without system", () => {
      const result = resolvePreference({
        explicit: { mode: "light" },
        systemColorScheme: "dark",
      });
      expect(result.resolvedMode).toBe("light");
      expect(result.resolvedModeSource).toBe("explicit");
    });

    it("persisted system uses system color scheme", () => {
      const result = resolvePreference({
        persisted: { mode: "system", density: "comfortable" },
        systemColorScheme: "dark",
      });
      expect(result.mode).toBe("system");
      expect(result.resolvedMode).toBe("dark");
      expect(result.resolvedModeSource).toBe("system");
    });
  });

  // ─── Partial Preferences ───────────────────────────────────────

  describe("partial preferences", () => {
    it("explicit mode + persisted density", () => {
      const result = resolvePreference({
        explicit: { mode: "dark" },
        persisted: { mode: "light", density: "compact" },
      });
      expect(result.mode).toBe("dark");
      expect(result.density).toBe("compact");
      expect(result.modeSource).toBe("controlled");
      expect(result.densitySource).toBe("persisted");
    });

    it("persisted mode + app default density", () => {
      const result = resolvePreference({
        persisted: { mode: "dark", density: "comfortable" },
        appDefault: { density: "standard" },
      });
      expect(result.mode).toBe("dark");
      // Persisted density is valid, so it wins over app default
      expect(result.density).toBe("comfortable");
    });

    it("explicit density only + default mode", () => {
      const result = resolvePreference({
        explicit: { density: "compact" },
      });
      expect(result.mode).toBe("system");
      expect(result.density).toBe("compact");
    });
  });

  // ─── Warnings ──────────────────────────────────────────────────

  describe("warnings", () => {
    it("no warnings for valid inputs", () => {
      const result = resolvePreference({
        explicit: { mode: "dark", density: "compact" },
      });
      expect(result.warnings).toEqual([]);
    });

    it("warns on invalid explicit mode", () => {
      const result = resolvePreference({
        explicit: { mode: "invalid" as "light" },
      });
      expect(result.warnings.some((w) => w.field === "mode" && w.source === "explicit")).toBe(true);
    });

    it("warns on invalid persisted mode", () => {
      const result = resolvePreference({
        persisted: { mode: "old-value" as "light", density: "comfortable" },
      });
      expect(result.warnings.some((w) => w.field === "mode" && w.source === "persisted")).toBe(
        true,
      );
    });

    it("warns on invalid app default density", () => {
      const result = resolvePreference({
        appDefault: { density: "huge" as "compact" },
      });
      expect(result.warnings.some((w) => w.field === "density")).toBe(true);
    });
  });

  // ─── Immutability ──────────────────────────────────────────────

  describe("immutability", () => {
    it("does not mutate inputs", () => {
      const inputs = {
        explicit: { mode: "dark" as const },
        persisted: { mode: "light" as const, density: "comfortable" as const },
        appDefault: { density: "standard" as const },
      };
      const copy = JSON.stringify(inputs);
      resolvePreference(inputs);
      expect(JSON.stringify(inputs)).toBe(copy);
    });
  });

  // ─── Full Precedence Chain ─────────────────────────────────────

  describe("full precedence chain", () => {
    it("explicit > persisted > appDefault > fallback", () => {
      const result = resolvePreference({
        explicit: { mode: "dark", density: "compact" },
        persisted: { mode: "light", density: "standard" },
        appDefault: { mode: "system", density: "comfortable" },
        systemColorScheme: "light",
      });
      expect(result.mode).toBe("dark");
      expect(result.density).toBe("compact");
      expect(result.resolvedMode).toBe("dark");
    });

    it("persisted wins when no explicit", () => {
      const result = resolvePreference({
        persisted: { mode: "dark", density: "standard" },
        appDefault: { mode: "system", density: "comfortable" },
        systemColorScheme: "light",
      });
      expect(result.mode).toBe("dark");
      expect(result.density).toBe("standard");
    });

    it("appDefault wins when no explicit or persisted", () => {
      const result = resolvePreference({
        appDefault: { mode: "dark", density: "standard" },
        systemColorScheme: "light",
      });
      expect(result.mode).toBe("dark");
      expect(result.density).toBe("standard");
    });
  });
});
