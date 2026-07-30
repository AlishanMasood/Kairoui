/**
 * Public API consumer tests.
 *
 * These validate what an external consumer of @kairoui/tokens can access.
 * Tests import from the package entry point (../index) to simulate
 * consumer behavior via the built JS/DTS exports.
 */

import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const DIST = join(import.meta.dirname, "../../dist");
const PKG_JSON_PATH = join(import.meta.dirname, "../../package.json");

describe("public token API", () => {
  // ─── Primitive Imports ───────────────────────────────────────────

  describe("primitive token values", () => {
    it("exports neutral color scale", async () => {
      const t = await import("../index");
      expect(t.neutral["500"]).toBeDefined();
      expect(typeof t.neutral["500"]).toBe("string");
    });

    it("exports blue (brand) color scale", async () => {
      const t = await import("../index");
      expect(t.blue["600"]).toBeDefined();
    });

    it("exports status color scales", async () => {
      const t = await import("../index");
      expect(t.green["500"]).toBeDefined();
      expect(t.red["500"]).toBeDefined();
      expect(t.orange["500"]).toBeDefined();
      expect(t.teal["500"]).toBeDefined();
    });

    it("exports spacing scale", async () => {
      const t = await import("../index");
      expect(t.spacing["4"]).toBe("1rem");
    });

    it("exports sizing tokens", async () => {
      const t = await import("../index");
      expect(t.controlHeight.md).toBeDefined();
      expect(t.iconSize.md).toBeDefined();
      expect(t.contentWidth.reading).toBeDefined();
    });

    it("exports border and radius tokens", async () => {
      const t = await import("../index");
      expect(t.radius.md).toBeDefined();
      expect(t.borderWidth.default).toBeDefined();
      expect(t.focusRing.width).toBe("2px");
    });

    it("exports typography tokens", async () => {
      const t = await import("../index");
      expect(t.fontFamily.sans).toContain("Inter");
      expect(t.fontSize.base).toBe("0.875rem");
      expect(t.fontWeight.medium).toBe(500);
    });

    it("exports shadow scale", async () => {
      const t = await import("../index");
      expect(t.shadow.md).toContain("rgba");
    });

    it("exports motion tokens", async () => {
      const t = await import("../index");
      expect(t.duration.fast).toBe("100ms");
      expect(t.easing.default).toContain("cubic-bezier");
    });

    it("exports layering tokens", async () => {
      const t = await import("../index");
      expect(t.opacity["50"]).toBe("0.5");
      expect(t.zIndex.modal).toBe(400);
    });

    it("exports breakpoints", async () => {
      const t = await import("../index");
      expect(t.breakpoint.lg).toBe("1024px");
    });
  });

  // ─── Theme Imports ───────────────────────────────────────────────

  describe("themes", () => {
    it("exports lightTheme", async () => {
      const t = await import("../index");
      expect(t.lightTheme.color.background.page).toBeDefined();
      expect(t.lightTheme.typography.body.fontSize).toBeDefined();
      expect(t.lightTheme.spacing.form.fieldGap).toBeDefined();
    });

    it("exports darkTheme", async () => {
      const t = await import("../index");
      expect(t.darkTheme.color.background.page).toBeDefined();
    });

    it("light and dark themes have the same structure", async () => {
      const t = await import("../index");
      const lightKeys = Object.keys(t.lightTheme);
      const darkKeys = Object.keys(t.darkTheme);
      expect(darkKeys).toEqual(lightKeys);
    });
  });

  // ─── Density Imports ─────────────────────────────────────────────

  describe("density definitions", () => {
    it("exports comfortable, standard, compact", async () => {
      const t = await import("../index");
      expect(t.comfortable).toBeDefined();
      expect(t.standard).toBeDefined();
      expect(t.compact).toBeDefined();
    });

    it("exports densities map", async () => {
      const t = await import("../index");
      expect(t.densities.comfortable).toBeDefined();
      expect(t.densities.standard).toBeDefined();
      expect(t.densities.compact).toBeDefined();
    });
  });

  // ─── Override Utilities ──────────────────────────────────────────

  describe("override utilities", () => {
    it("exports resolveTheme function", async () => {
      const t = await import("../index");
      expect(typeof t.resolveTheme).toBe("function");
    });

    it("resolveTheme works with partial overrides", async () => {
      const t = await import("../index");
      const { theme } = t.resolveTheme({
        base: t.lightTheme,
        overrides: { color: { background: { page: "#ffffff" } } },
      });
      expect(theme.color.background.page).toBe("#ffffff");
      expect(theme.color.text.primary).toBe(t.lightTheme.color.text.primary);
    });
  });

  // ─── Naming Utilities ────────────────────────────────────────────

  describe("naming utilities", () => {
    it("exports tokenPathToCssVar", async () => {
      const t = await import("../index");
      expect(t.tokenPathToCssVar("color.background.page")).toBe("--kui-color-bg-page");
    });

    it("exports camelToKebab", async () => {
      const t = await import("../index");
      expect(t.camelToKebab("fontSize")).toBe("font-size");
    });
  });

  // ─── CSS Generation ──────────────────────────────────────────────

  describe("CSS generation utilities", () => {
    it("exports generateCss function", async () => {
      const t = await import("../index");
      expect(typeof t.generateCss).toBe("function");
    });

    it("exports generateThemeCss and generateDensityCss", async () => {
      const t = await import("../index");
      expect(typeof t.generateThemeCss).toBe("function");
      expect(typeof t.generateDensityCss).toBe("function");
    });
  });

  // ─── Manifest Utilities ──────────────────────────────────────────

  describe("manifest utilities", () => {
    it("exports buildManifest and flattenToManifest", async () => {
      const t = await import("../index");
      expect(typeof t.buildManifest).toBe("function");
      expect(typeof t.flattenToManifest).toBe("function");
    });

    it("exports MANIFEST_SCHEMA_VERSION", async () => {
      const t = await import("../index");
      expect(t.MANIFEST_SCHEMA_VERSION).toBe("1.0.0");
    });
  });

  // ─── Validation Utilities ────────────────────────────────────────

  describe("validation utilities", () => {
    it("exports schema validation", async () => {
      const t = await import("../index");
      expect(typeof t.validateTokenSchema).toBe("function");
      expect(typeof t.validateThemeStructure).toBe("function");
      expect(typeof t.validateNoDuplicateCssVars).toBe("function");
    });

    it("exports contrast validation", async () => {
      const t = await import("../index");
      expect(typeof t.contrastRatio).toBe("function");
      expect(typeof t.checkContrast).toBe("function");
    });
  });

  // ─── Component Contracts ─────────────────────────────────────────

  describe("component token contracts", () => {
    it("exports sharedControlTokens", async () => {
      const t = await import("../index");
      expect(t.sharedControlTokens.size.md.height).toBeDefined();
    });

    it("exports buttonTokens", async () => {
      const t = await import("../index");
      expect(t.buttonTokens.variant.primary.default.background).toBeDefined();
    });

    it("exports formControlTokens", async () => {
      const t = await import("../index");
      expect(t.formControlTokens.input.states.default.background).toBeDefined();
    });

    it("exports surfaceTokens", async () => {
      const t = await import("../index");
      expect(t.surfaceTokens.card.background).toBeDefined();
      expect(t.surfaceTokens.dialog.zIndex).toBeDefined();
    });

    it("exports navigationTokens and activeRail", async () => {
      const t = await import("../index");
      expect(t.navigationTokens.tabs.rail.thickness).toBe("2px");
      expect(t.activeRail.color).toBeDefined();
    });
  });

  // ─── Reference Factories ────────────────────────────────────────

  describe("reference factories", () => {
    it("exports literal, primitiveRef, semanticRef, componentRef", async () => {
      const t = await import("../index");
      expect(t.literal("#fff").kind).toBe("literal");
      expect(t.primitiveRef("color.blue.500").kind).toBe("primitive");
      expect(t.semanticRef("color.text.primary").kind).toBe("semantic");
      expect(t.componentRef("button.primary.background").kind).toBe("component");
    });
  });

  // ─── CSS File Exports ────────────────────────────────────────────

  describe("CSS file exports", () => {
    it("dist/tokens.css exists and is valid", () => {
      const cssPath = join(DIST, "tokens.css");
      expect(existsSync(cssPath)).toBe(true);
      const content = readFileSync(cssPath, "utf-8");
      expect(content).toContain("--kui-");
      expect(content).toContain(":root {");
    });

    it("dist/themes/light.css exists", () => {
      expect(existsSync(join(DIST, "themes", "light.css"))).toBe(true);
    });

    it("dist/themes/dark.css exists", () => {
      expect(existsSync(join(DIST, "themes", "dark.css"))).toBe(true);
    });

    it("dist/density/*.css files exist", () => {
      expect(existsSync(join(DIST, "density", "comfortable.css"))).toBe(true);
      expect(existsSync(join(DIST, "density", "standard.css"))).toBe(true);
      expect(existsSync(join(DIST, "density", "compact.css"))).toBe(true);
    });
  });

  // ─── JSON Manifest Export ────────────────────────────────────────

  describe("JSON manifest export", () => {
    it("dist/tokens.json exists and is valid JSON", () => {
      const jsonPath = join(DIST, "tokens.json");
      expect(existsSync(jsonPath)).toBe(true);
      const content = readFileSync(jsonPath, "utf-8");
      const parsed = JSON.parse(content) as { tokenCount: number };
      expect(parsed.tokenCount).toBeGreaterThan(0);
    });
  });

  // ─── Package Exports Metadata ────────────────────────────────────

  describe("package.json exports", () => {
    it("declares . entry point", () => {
      const pkg = JSON.parse(readFileSync(PKG_JSON_PATH, "utf-8")) as Record<string, unknown>;
      const exports = pkg["exports"] as Record<string, unknown>;
      expect(exports["."]).toBeDefined();
    });

    it("declares ./css entry point", () => {
      const pkg = JSON.parse(readFileSync(PKG_JSON_PATH, "utf-8")) as Record<string, unknown>;
      const exports = pkg["exports"] as Record<string, unknown>;
      expect(exports["./css"]).toBeDefined();
    });

    it("declares theme CSS entry points", () => {
      const pkg = JSON.parse(readFileSync(PKG_JSON_PATH, "utf-8")) as Record<string, unknown>;
      const exports = pkg["exports"] as Record<string, unknown>;
      expect(exports["./css/light"]).toBeDefined();
      expect(exports["./css/dark"]).toBeDefined();
    });

    it("declares density CSS entry points", () => {
      const pkg = JSON.parse(readFileSync(PKG_JSON_PATH, "utf-8")) as Record<string, unknown>;
      const exports = pkg["exports"] as Record<string, unknown>;
      expect(exports["./css/density/comfortable"]).toBeDefined();
      expect(exports["./css/density/standard"]).toBeDefined();
      expect(exports["./css/density/compact"]).toBeDefined();
    });

    it("declares ./manifest entry point", () => {
      const pkg = JSON.parse(readFileSync(PKG_JSON_PATH, "utf-8")) as Record<string, unknown>;
      const exports = pkg["exports"] as Record<string, unknown>;
      expect(exports["./manifest"]).toBeDefined();
    });

    it("files field includes only dist", () => {
      const pkg = JSON.parse(readFileSync(PKG_JSON_PATH, "utf-8")) as { files: string[] };
      expect(pkg.files).toEqual(["dist"]);
    });
  });

  // ─── Built Declarations ──────────────────────────────────────────

  describe("built declarations", () => {
    it("dist/index.d.ts exists", () => {
      expect(existsSync(join(DIST, "index.d.ts"))).toBe(true);
    });

    it("declarations export key public types", () => {
      const dts = readFileSync(join(DIST, "index.d.ts"), "utf-8");
      expect(dts).toContain("SemanticTokens");
      expect(dts).toContain("PrimitiveTokens");
      expect(dts).toContain("ThemeName");
      expect(dts).toContain("DensityName");
      expect(dts).toContain("ButtonContract");
      expect(dts).toContain("lightTheme");
      expect(dts).toContain("darkTheme");
    });

    it("declarations do not export DeepTokenRefMap (internal utility)", () => {
      const dts = readFileSync(join(DIST, "index.d.ts"), "utf-8");
      const exportLine = dts
        .split("\n")
        .filter((l) => l.startsWith("export"))
        .join("\n");
      expect(exportLine).not.toContain("export { DeepTokenRefMap");
      expect(exportLine).not.toContain("export { DeepPartialTokenRefMap");
    });
  });

  // ─── No Private Leakage ──────────────────────────────────────────

  describe("no private leakage in built output", () => {
    it("dist/index.js does not contain filesystem paths", () => {
      const js = readFileSync(join(DIST, "index.js"), "utf-8");
      expect(js).not.toMatch(/[A-Z]:[/\\]/);
      expect(js).not.toContain("import.meta.dirname");
    });

    it("no source .ts files in dist", () => {
      expect(existsSync(join(DIST, "naming.ts"))).toBe(false);
      expect(existsSync(join(DIST, "themes", "light.ts"))).toBe(false);
    });
  });
});
