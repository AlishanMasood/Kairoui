import { describe, it, expect } from "vitest";
import { generateCss, generateThemeCss, generateDensityCss } from "./index";
import { lightTheme } from "../themes/light";
import { darkTheme } from "../themes/dark";
import { comfortable, standard, compact } from "../density";
import { neutral } from "../primitives/colors";
import { spacing } from "../primitives/spacing";
import { resolveTheme } from "../override";

// ─── Helpers ─────────────────────────────────────────────────────────

function themeToRecord(t: object): Record<string, unknown> {
  return t as unknown as Record<string, unknown>;
}

function extractVars(css: string): string[] {
  return css
    .split("\n")
    .filter((l) => l.includes("--kui-"))
    .map((l) => (l.trim().split(":")[0] ?? "").trim());
}

describe("CSS variable generation — comprehensive", () => {
  // ─── Stable Naming ───────────────────────────────────────────────

  describe("stable variable naming", () => {
    it("primitive color tokens produce correct --kui-color-* names", () => {
      const { declarations } = generateCss({
        color: { neutral: { "50": "#f8f9fb", "900": "#1e2433" } },
      });
      const vars = declarations.map((d) => d.variable);
      expect(vars).toContain("--kui-color-neutral-50");
      expect(vars).toContain("--kui-color-neutral-900");
    });

    it("spacing tokens abbreviate to --kui-space-*", () => {
      const { declarations } = generateCss({ spacing: { "4": "1rem", "8": "2rem" } });
      const vars = declarations.map((d) => d.variable);
      expect(vars).toContain("--kui-space-4");
      expect(vars).toContain("--kui-space-8");
    });

    it("background abbreviates to bg", () => {
      const { declarations } = generateCss({ color: { background: { page: "#fff" } } });
      expect(declarations[0]?.variable).toBe("--kui-color-bg-page");
    });

    it("camelCase segments become kebab-case", () => {
      const { declarations } = generateCss({ lineHeight: { normal: "1.5" } });
      expect(declarations[0]?.variable).toBe("--kui-line-height-normal");
    });
  });

  // ─── Primitive Variables ─────────────────────────────────────────

  describe("primitive variable generation", () => {
    it("generates variables from a color scale", () => {
      const { declarations, errors } = generateCss({ color: { neutral } });
      expect(declarations.length).toBe(11);
      expect(errors.filter((e) => e.type === "invalid_value")).toHaveLength(0);
    });

    it("generates spacing variables", () => {
      const { declarations } = generateCss({ spacing });
      expect(declarations.length).toBe(34);
    });
  });

  // ─── Semantic Variables ──────────────────────────────────────────

  describe("semantic variable generation", () => {
    it("generates color semantic variables", () => {
      const { declarations } = generateCss(themeToRecord(lightTheme.color));
      expect(declarations.length).toBeGreaterThan(40);
      const vars = declarations.map((d) => d.variable);
      expect(vars.some((v) => v.startsWith("--kui-bg-"))).toBe(true);
      expect(vars.some((v) => v.startsWith("--kui-text-"))).toBe(true);
      expect(vars.some((v) => v.startsWith("--kui-border-"))).toBe(true);
    });

    it("generates typography variables", () => {
      const { declarations } = generateCss(themeToRecord(lightTheme.typography));
      expect(declarations.length).toBeGreaterThan(50);
    });

    it("generates interaction state variables", () => {
      const { declarations } = generateCss(themeToRecord(lightTheme.interaction));
      expect(declarations.length).toBeGreaterThan(50);
    });
  });

  // ─── Light Theme Output ──────────────────────────────────────────

  describe("light theme output", () => {
    it("produces valid CSS with light selector", () => {
      const result = generateThemeCss(themeToRecord(lightTheme), "light");
      expect(result.css).toContain('[data-kui-theme="light"]');
      expect(result.css).toContain("--kui-");
      expect(result.metadata.totalVariables).toBeGreaterThan(100);
    });

    it("all declarations end with semicolons", () => {
      const result = generateThemeCss(themeToRecord(lightTheme), "light");
      const varLines = result.css.split("\n").filter((l) => l.includes("--kui-"));
      for (const line of varLines) {
        expect(line.trimEnd().endsWith(";")).toBe(true);
      }
    });
  });

  // ─── Dark Theme Output ───────────────────────────────────────────

  describe("dark theme output", () => {
    it("produces valid CSS with dark selector", () => {
      const result = generateThemeCss(themeToRecord(darkTheme), "dark");
      expect(result.css).toContain('[data-kui-theme="dark"]');
      expect(result.metadata.totalVariables).toBeGreaterThan(100);
    });

    it("has same variable count as light theme", () => {
      const light = generateThemeCss(themeToRecord(lightTheme), "light");
      const dark = generateThemeCss(themeToRecord(darkTheme), "dark");
      expect(dark.metadata.totalVariables).toBe(light.metadata.totalVariables);
    });
  });

  // ─── Density Outputs ─────────────────────────────────────────────

  describe("density outputs", () => {
    it("comfortable density produces variables", () => {
      const result = generateDensityCss(themeToRecord(comfortable), "comfortable");
      expect(result.css).toContain('[data-kui-density="comfortable"]');
      expect(result.metadata.totalVariables).toBeGreaterThan(10);
    });

    it("standard density produces variables", () => {
      const result = generateDensityCss(themeToRecord(standard), "standard");
      expect(result.css).toContain('[data-kui-density="standard"]');
    });

    it("compact density produces variables", () => {
      const result = generateDensityCss(themeToRecord(compact), "compact");
      expect(result.css).toContain('[data-kui-density="compact"]');
    });

    it("all densities produce the same variable names", () => {
      const comfVars = extractVars(
        generateDensityCss(themeToRecord(comfortable), "comfortable").css,
      );
      const stdVars = extractVars(generateDensityCss(themeToRecord(standard), "standard").css);
      const compVars = extractVars(generateDensityCss(themeToRecord(compact), "compact").css);
      expect(stdVars).toEqual(comfVars);
      expect(compVars).toEqual(comfVars);
    });
  });

  // ─── Combined Output ─────────────────────────────────────────────

  describe("combined CSS output", () => {
    it("root scope + theme + density produce a complete stylesheet", () => {
      const root = generateCss(themeToRecord(lightTheme), { scope: ":root" });
      const dark = generateThemeCss(themeToRecord(darkTheme), "dark");
      const compactD = generateDensityCss(themeToRecord(compact), "compact");
      const combined = [root.css, dark.css, compactD.css].join("\n\n");
      expect(combined).toContain(":root {");
      expect(combined).toContain('[data-kui-theme="dark"]');
      expect(combined).toContain('[data-kui-density="compact"]');
    });
  });

  // ─── Deterministic Ordering ──────────────────────────────────────

  describe("deterministic ordering", () => {
    it("same input produces identical output on repeated calls", () => {
      const tokens = { b: "2", a: "1", c: "3" };
      const result1 = generateCss(tokens);
      const result2 = generateCss(tokens);
      expect(result1.css).toBe(result2.css);
    });

    it("variables are sorted by name (localeCompare)", () => {
      const tokens = { z: "last", a: "first", m: "middle" };
      const { declarations } = generateCss(tokens);
      const vars = declarations.map((d) => d.variable);
      const sorted = [...vars].sort((a, b) => a.localeCompare(b));
      expect(vars).toEqual(sorted);
    });

    it("nested objects produce sorted output regardless of key order", () => {
      const t1 = { color: { z: "1", a: "2" } };
      const t2 = { color: { a: "2", z: "1" } };
      expect(generateCss(t1).css).toBe(generateCss(t2).css);
    });
  });

  // ─── Duplicate Name Rejection ────────────────────────────────────

  describe("duplicate name rejection", () => {
    it("reports when different paths produce the same CSS variable", () => {
      const tokens = { color: { bg: { page: "#fff" }, background: { page: "#fff" } } };
      const { errors } = generateCss(tokens);
      expect(errors.some((e) => e.type === "duplicate_variable")).toBe(true);
    });

    it("includes both paths in the error", () => {
      const tokens = { color: { bg: { page: "#a" }, background: { page: "#b" } } };
      const { errors } = generateCss(tokens);
      const dupe = errors.find((e) => e.type === "duplicate_variable");
      expect(dupe?.message).toContain("--kui-color-bg-page");
    });
  });

  // ─── Invalid Token Rejection ─────────────────────────────────────

  describe("invalid token rejection", () => {
    it("rejects null values", () => {
      const { errors } = generateCss({ a: null });
      expect(errors.some((e) => e.type === "invalid_value")).toBe(true);
    });

    it("rejects undefined values", () => {
      const { errors } = generateCss({ a: undefined });
      expect(errors.some((e) => e.type === "invalid_value")).toBe(true);
    });

    it("rejects array values", () => {
      const { errors } = generateCss({ a: [1, 2] });
      expect(errors.some((e) => e.type === "invalid_value")).toBe(true);
    });
  });

  // ─── Partial Theme Overrides ─────────────────────────────────────

  describe("partial theme overrides", () => {
    it("override produces different values but same variable names", () => {
      const base = generateCss(themeToRecord(lightTheme), { scope: ":root" });
      const resolved = resolveTheme({
        base: lightTheme,
        overrides: { color: { background: { page: "#ffffff" } } },
      });
      const overridden = generateCss(themeToRecord(resolved.theme), { scope: ":root" });

      const baseVars = extractVars(base.css);
      const overriddenVars = extractVars(overridden.css);
      expect(overriddenVars).toEqual(baseVars);
      expect(overridden.css).toContain("--kui-color-bg-page: #ffffff;");
    });
  });

  // ─── Empty Input ─────────────────────────────────────────────────

  describe("empty input", () => {
    it("returns empty string and zero declarations", () => {
      const result = generateCss({});
      expect(result.css).toBe("");
      expect(result.declarations).toHaveLength(0);
      expect(result.metadata.totalVariables).toBe(0);
    });
  });

  // ─── Reproducibility ────────────────────────────────────────────

  describe("reproducibility", () => {
    it("full light theme CSS is identical across calls", () => {
      const css1 = generateThemeCss(themeToRecord(lightTheme), "light").css;
      const css2 = generateThemeCss(themeToRecord(lightTheme), "light").css;
      expect(css1).toBe(css2);
    });

    it("full dark theme CSS is identical across calls", () => {
      const css1 = generateThemeCss(themeToRecord(darkTheme), "dark").css;
      const css2 = generateThemeCss(themeToRecord(darkTheme), "dark").css;
      expect(css1).toBe(css2);
    });
  });
});
