import { describe, it, expect } from "vitest";
import { generateCss, generateThemeCss, generateDensityCss } from "./index";

describe("CSS variable conversion", () => {
  describe("naming conversion", () => {
    it("converts simple paths to --kui-* variables", () => {
      const { declarations } = generateCss({ color: { neutral: { "500": "#6b7588" } } });
      expect(declarations[0]?.variable).toBe("--kui-color-neutral-500");
    });

    it("applies abbreviations (background → bg, spacing → space)", () => {
      const { declarations } = generateCss({
        color: { background: { page: "#f8f9fb" } },
        spacing: { "4": "1rem" },
      });
      const vars = declarations.map((d) => d.variable);
      expect(vars).toContain("--kui-color-bg-page");
      expect(vars).toContain("--kui-space-4");
    });

    it("converts camelCase to kebab-case", () => {
      const { declarations } = generateCss({ fontSize: { base: "0.875rem" } });
      expect(declarations[0]?.variable).toBe("--kui-font-size-base");
    });
  });

  describe("nested traversal", () => {
    it("flattens deeply nested objects", () => {
      const tokens = {
        color: {
          status: {
            success: {
              subtle: "#f0fdf4",
              text: "#15803d",
            },
          },
        },
      };
      const { declarations } = generateCss(tokens);
      expect(declarations).toHaveLength(2);
      expect(declarations.map((d) => d.path)).toContain("color.status.success.subtle");
      expect(declarations.map((d) => d.path)).toContain("color.status.success.text");
    });

    it("handles numeric values", () => {
      const { declarations } = generateCss({ fontWeight: { bold: 700 } });
      expect(declarations[0]?.value).toBe("700");
    });
  });

  describe("deterministic ordering", () => {
    it("produces alphabetically sorted output regardless of input order", () => {
      const tokens1 = { z: "1", a: "2", m: "3" };
      const tokens2 = { m: "3", z: "1", a: "2" };
      const result1 = generateCss(tokens1);
      const result2 = generateCss(tokens2);
      expect(result1.declarations.map((d) => d.variable)).toEqual(
        result2.declarations.map((d) => d.variable),
      );
    });

    it("nested keys are also sorted", () => {
      const tokens = { b: { z: "1", a: "2" }, a: { y: "3", x: "4" } };
      const { declarations } = generateCss(tokens);
      const paths = declarations.map((d) => d.path);
      expect(paths).toEqual([...paths].sort());
    });
  });

  describe("duplicate detection", () => {
    it("reports duplicate variable names", () => {
      // Two different paths that produce the same CSS variable (hypothetical)
      const tokens = { color: { bg: { page: "#fff" }, background: { page: "#fff" } } };
      const { errors } = generateCss(tokens);
      const dupes = errors.filter((e) => e.type === "duplicate_variable");
      expect(dupes.length).toBeGreaterThan(0);
    });
  });

  describe("invalid value detection", () => {
    it("reports null values", () => {
      const tokens = { color: { page: null } } as unknown as Record<string, unknown>;
      const { errors } = generateCss(tokens);
      expect(errors.some((e) => e.type === "invalid_value")).toBe(true);
    });

    it("reports undefined values", () => {
      const tokens = { color: { page: undefined } } as unknown as Record<string, unknown>;
      const { errors } = generateCss(tokens);
      expect(errors.some((e) => e.type === "invalid_value")).toBe(true);
    });

    it("reports array values", () => {
      const tokens = { color: { values: [1, 2, 3] } } as unknown as Record<string, unknown>;
      const { errors } = generateCss(tokens);
      expect(errors.some((e) => e.type === "invalid_value")).toBe(true);
    });
  });

  describe("theme scopes", () => {
    it("wraps in [data-kui-theme] selector", () => {
      const tokens = { color: { background: { page: "#f8f9fb" } } };
      const { css } = generateThemeCss(tokens, "light");
      expect(css).toContain('[data-kui-theme="light"]');
      expect(css).toContain("--kui-color-bg-page: #f8f9fb;");
    });

    it("dark theme uses dark selector", () => {
      const tokens = { color: { background: { page: "#131822" } } };
      const { css } = generateThemeCss(tokens, "dark");
      expect(css).toContain('[data-kui-theme="dark"]');
    });
  });

  describe("density scopes", () => {
    it("wraps in [data-kui-density] selector", () => {
      const tokens = { spacing: { inline: { xs: "0.125rem" } } };
      const { css } = generateDensityCss(tokens, "compact");
      expect(css).toContain('[data-kui-density="compact"]');
      expect(css).toContain("--kui-space-inline-xs: 0.125rem;");
    });
  });

  describe("scope options", () => {
    it("defaults to :root scope", () => {
      const { css } = generateCss({ radius: { md: "0.375rem" } });
      expect(css.startsWith(":root {")).toBe(true);
    });

    it("accepts custom scope", () => {
      const { css } = generateCss({ radius: { md: "0.375rem" } }, { scope: ".my-app" });
      expect(css.startsWith(".my-app {")).toBe(true);
    });

    it("respects custom indent", () => {
      const { css } = generateCss({ radius: { md: "0.375rem" } }, { indent: "    " });
      expect(css).toContain("    --kui-radius-md:");
    });
  });

  describe("empty token sets", () => {
    it("produces empty string for empty input", () => {
      const { css, declarations } = generateCss({});
      expect(css).toBe("");
      expect(declarations).toHaveLength(0);
    });
  });

  describe("metadata", () => {
    it("reports total variable count", () => {
      const tokens = { a: "1", b: "2", c: "3" };
      const { metadata } = generateCss(tokens);
      expect(metadata.totalVariables).toBe(3);
    });

    it("reports the scope used", () => {
      const { metadata } = generateCss({ a: "1" }, { scope: ":root" });
      expect(metadata.scope).toBe(":root");
    });

    it("includes generation timestamp", () => {
      const { metadata } = generateCss({ a: "1" });
      expect(metadata.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
  });

  describe("CSS output format", () => {
    it("produces valid CSS declaration block", () => {
      const tokens = { color: { text: { primary: "#1e2433" } } };
      const { css } = generateCss(tokens);
      expect(css).toMatch(/^:root \{\n\s+--kui-[\w-]+: .+;\n\}$/);
    });

    it("each declaration ends with semicolon", () => {
      const tokens = { a: "1", b: "2" };
      const { css } = generateCss(tokens);
      const lines = css.split("\n").filter((l) => l.includes("--kui-"));
      for (const line of lines) {
        expect(line.trimEnd()).toMatch(/;$/);
      }
    });
  });

  describe("real theme generation", () => {
    it("generates CSS from the light theme color subset", async () => {
      const { lightTheme } = await import("../themes/light");
      const { css, errors } = generateCss(lightTheme.color as unknown as Record<string, unknown>, {
        scope: '[data-kui-theme="light"]',
      });
      expect(errors.filter((e) => e.type !== "duplicate_variable")).toHaveLength(0);
      expect(css).toContain("--kui-");
      expect(css.length).toBeGreaterThan(100);
    });
  });

  describe("public import", () => {
    it("CSS generation utilities are importable from the package entry point", async () => {
      const tokens = await import("../index");
      expect(tokens.generateCss).toBeDefined();
      expect(tokens.generateThemeCss).toBeDefined();
      expect(tokens.generateDensityCss).toBeDefined();
    });
  });
});
