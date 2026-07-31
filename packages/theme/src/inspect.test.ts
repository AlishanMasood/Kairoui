import { describe, it, expect } from "vitest";
import { createTheme } from "./create-theme";
import { resolveTheme } from "./resolve-theme";
import { composeThemes } from "./compose-themes";
import { inspectTheme, inspectResolvedTheme } from "./inspect";

describe("inspectTheme", () => {
  describe("default theme", () => {
    it("reports basic info for minimal theme", () => {
      const def = createTheme({ name: "test", base: "light" });
      const report = inspectTheme(def);

      expect(report.name).toBe("test");
      expect(report.base).toBe("light");
      expect(report.defaultDensity).toBe("comfortable");
      expect(report.overrideGroups).toEqual([]);
      expect(report.overrideCount).toBe(0);
      expect(report.metadataKeys).toEqual([]);
    });

    it("warns about missing description", () => {
      const def = createTheme({ name: "test", base: "light" });
      const report = inspectTheme(def);
      expect(report.warnings.some((w) => w.includes("description"))).toBe(true);
    });
  });

  describe("custom theme", () => {
    it("reports overrides", () => {
      const def = createTheme({
        name: "brand",
        base: "dark",
        description: "Brand theme",
        overrides: {
          color: { interactive: { default: "#0066cc" } },
          elevation: { raised: "none" },
        },
        metadata: { author: "Team", version: "2.0" },
      });
      const report = inspectTheme(def);

      expect(report.name).toBe("brand");
      expect(report.base).toBe("dark");
      expect(report.description).toBe("Brand theme");
      expect(report.overrideGroups).toEqual(["color", "elevation"]);
      expect(report.overrideCount).toBeGreaterThan(0);
      expect(report.metadataKeys).toEqual(["author", "version"]);
      expect(report.warnings).toEqual([]);
    });
  });

  describe("composed theme", () => {
    it("inspects a composed definition", () => {
      const result = composeThemes([
        { name: "base", base: "light", description: "Base layer" },
        {
          name: "brand",
          description: "Brand overrides",
          overrides: { color: { text: { primary: "#000" } } },
          metadata: { org: "Acme" },
        },
      ]);
      const report = inspectTheme(result.definition);

      expect(report.name).toBe("brand");
      expect(report.base).toBe("light");
      expect(report.overrideGroups).toContain("color");
      expect(report.metadataKeys).toContain("org");
    });
  });

  describe("deterministic output", () => {
    it("produces identical reports for same input", () => {
      const def = createTheme({
        name: "test",
        base: "light",
        overrides: { color: { text: { primary: "#000" } } },
      });
      const a = inspectTheme(def);
      const b = inspectTheme(def);
      expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    });
  });

  describe("does not mutate input", () => {
    it("theme definition is unchanged", () => {
      const def = createTheme({ name: "test", base: "light" });
      const copy = JSON.stringify(def);
      inspectTheme(def);
      expect(JSON.stringify(def)).toBe(copy);
    });
  });
});

describe("inspectResolvedTheme", () => {
  describe("default resolved", () => {
    it("reports resolved theme info", async () => {
      const def = createTheme({ name: "light-test", base: "light" });
      const resolved = await resolveTheme({ definition: def });
      const report = inspectResolvedTheme(resolved);

      expect(report.name).toBe("light-test");
      expect(report.base).toBe("light");
      expect(report.resolvedMode).toBe("light");
      expect(report.density).toBe("comfortable");
      expect(report.tokenCount).toBeGreaterThan(100);
      expect(report.tokenGroups).toContain("color");
      expect(report.tokenGroups).toContain("typography");
      expect(report.warnings).toEqual([]);
    });
  });

  describe("resolved with warnings", () => {
    it("includes resolution warnings", async () => {
      const def = createTheme({
        name: "warn-test",
        base: "light",
        overrides: { color: { interactive: { nonexistent: "#ff0000" } } },
      });
      const resolved = await resolveTheme({ definition: def });
      const report = inspectResolvedTheme(resolved);

      expect(report.warnings.length).toBeGreaterThan(0);
      expect(report.warnings[0]).toContain("nonexistent");
    });
  });

  describe("dark resolved", () => {
    it("reports dark mode", async () => {
      const def = createTheme({ name: "dark-test", base: "dark" });
      const resolved = await resolveTheme({ definition: def });
      const report = inspectResolvedTheme(resolved);

      expect(report.resolvedMode).toBe("dark");
    });
  });

  describe("custom density", () => {
    it("reports configured density", async () => {
      const def = createTheme({
        name: "compact-test",
        base: "light",
        defaultDensity: "compact",
      });
      const resolved = await resolveTheme({ definition: def });
      const report = inspectResolvedTheme(resolved);

      expect(report.density).toBe("compact");
    });
  });

  describe("serializable output", () => {
    it("can be JSON stringified", async () => {
      const def = createTheme({ name: "test", base: "light" });
      const resolved = await resolveTheme({ definition: def });
      const report = inspectResolvedTheme(resolved);

      const json = JSON.stringify(report);
      expect(json).not.toContain("undefined");
      expect(json).not.toContain("[object");
    });
  });
});
