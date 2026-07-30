import { describe, it, expect } from "vitest";
import { createTheme } from "./create-theme";
import { resolveTheme } from "./resolve-theme";
import { generateCssVariables } from "./css-variables";

async function resolveLight() {
  return resolveTheme({ definition: createTheme({ name: "light", base: "light" }) });
}

async function resolveDark() {
  return resolveTheme({ definition: createTheme({ name: "dark", base: "dark" }) });
}

describe("generateCssVariables", () => {
  describe("light theme", () => {
    it("generates variables from a light theme", async () => {
      const resolved = await resolveLight();
      const result = generateCssVariables(resolved);
      expect(result.count).toBeGreaterThan(100);
      expect(result.duplicates).toEqual([]);
      expect(result.invalid).toEqual([]);
    });

    it("all variable names start with --kui-", async () => {
      const resolved = await resolveLight();
      const result = generateCssVariables(resolved);
      for (const name of Object.keys(result.variables)) {
        expect(name).toMatch(/^--kui-/);
      }
    });

    it("all values are non-empty strings", async () => {
      const resolved = await resolveLight();
      const result = generateCssVariables(resolved);
      for (const value of Object.values(result.variables)) {
        expect(typeof value).toBe("string");
        expect(value.length).toBeGreaterThan(0);
      }
    });

    it("contains known token variables", async () => {
      const resolved = await resolveLight();
      const result = generateCssVariables(resolved);
      expect(result.variables["--kui-color-bg-page"]).toBeDefined();
      expect(result.variables["--kui-color-text-primary"]).toBeDefined();
      expect(result.variables["--kui-color-border-default"]).toBeDefined();
    });

    it("uses Phase 2 abbreviations", async () => {
      const resolved = await resolveLight();
      const result = generateCssVariables(resolved);
      // "background" should be abbreviated to "bg"
      const bgVars = Object.keys(result.variables).filter((k) => k.includes("-bg-"));
      expect(bgVars.length).toBeGreaterThan(0);
      // "spacing" should be abbreviated to "space"
      const spaceVars = Object.keys(result.variables).filter((k) => k.includes("-space-"));
      expect(spaceVars.length).toBeGreaterThan(0);
    });
  });

  describe("dark theme", () => {
    it("generates variables from a dark theme", async () => {
      const resolved = await resolveDark();
      const result = generateCssVariables(resolved);
      expect(result.count).toBeGreaterThan(100);
    });

    it("dark values differ from light for key tokens", async () => {
      const lightResult = generateCssVariables(await resolveLight());
      const darkResult = generateCssVariables(await resolveDark());
      expect(lightResult.variables["--kui-color-bg-page"]).not.toBe(
        darkResult.variables["--kui-color-bg-page"],
      );
    });
  });

  describe("density modes", () => {
    it("different densities produce different spacing variables", async () => {
      const comfortable = await resolveTheme({
        definition: createTheme({ name: "c", base: "light" }),
        density: "comfortable",
      });
      const compact = await resolveTheme({
        definition: createTheme({ name: "c", base: "light" }),
        density: "compact",
      });

      const comfVars = generateCssVariables(comfortable);
      const compVars = generateCssVariables(compact);

      // Spacing values should differ
      const comfSpacing = Object.entries(comfVars.variables).filter(([k]) => k.includes("-space-"));
      const compSpacing = Object.entries(compVars.variables).filter(([k]) => k.includes("-space-"));
      expect(JSON.stringify(comfSpacing)).not.toBe(JSON.stringify(compSpacing));
    });
  });

  describe("filtering", () => {
    it("filter=theme excludes density keys", async () => {
      const resolved = await resolveLight();
      const result = generateCssVariables(resolved, { filter: "theme" });
      const hasSpacing = Object.keys(result.variables).some((k) => k.includes("-space-"));
      const hasControl = Object.keys(result.variables).some((k) => k.includes("-control-"));
      expect(hasSpacing).toBe(false);
      expect(hasControl).toBe(false);
      // But still has color tokens
      expect(result.variables["--kui-color-bg-page"]).toBeDefined();
    });

    it("filter=density excludes theme keys", async () => {
      const resolved = await resolveLight();
      const result = generateCssVariables(resolved, { filter: "density" });
      const hasColor = Object.keys(result.variables).some((k) => k.includes("-color-"));
      expect(hasColor).toBe(false);
      // But has spacing tokens
      const hasSpacing = Object.keys(result.variables).some((k) => k.includes("-space-"));
      expect(hasSpacing).toBe(true);
    });

    it("filter=all includes everything", async () => {
      const resolved = await resolveLight();
      const all = generateCssVariables(resolved, { filter: "all" });
      const defaultResult = generateCssVariables(resolved);
      expect(all.count).toBe(defaultResult.count);
    });
  });

  describe("stable ordering", () => {
    it("variables are sorted alphabetically", async () => {
      const resolved = await resolveLight();
      const result = generateCssVariables(resolved);
      const keys = Object.keys(result.variables);
      expect(keys).toEqual([...keys].sort());
    });

    it("produces identical output across calls", async () => {
      const resolved = await resolveLight();
      const a = generateCssVariables(resolved);
      const b = generateCssVariables(resolved);
      expect(JSON.stringify(a.variables)).toBe(JSON.stringify(b.variables));
      expect(a.count).toBe(b.count);
    });
  });

  describe("duplicate detection", () => {
    it("reports no duplicates for valid themes", async () => {
      const resolved = await resolveLight();
      const result = generateCssVariables(resolved);
      expect(result.duplicates).toEqual([]);
    });
  });

  describe("invalid values", () => {
    it("reports no invalid values for valid themes", async () => {
      const resolved = await resolveLight();
      const result = generateCssVariables(resolved);
      expect(result.invalid).toEqual([]);
    });
  });

  describe("no mutation", () => {
    it("does not mutate the resolved theme", async () => {
      const resolved = await resolveLight();
      const tokensBefore = JSON.stringify(resolved.tokens);
      generateCssVariables(resolved);
      expect(JSON.stringify(resolved.tokens)).toBe(tokensBefore);
    });
  });

  describe("public import", () => {
    it("can be imported from the package entry", async () => {
      const mod = await import("./index");
      expect(mod.generateCssVariables).toBeDefined();
      expect(typeof mod.generateCssVariables).toBe("function");
    });
  });
});
