import { describe, it, expect } from "vitest";
import { composeThemes } from "./compose-themes";
import { createTheme } from "./create-theme";
import type { CompositionLayer } from "./compose-themes";

describe("composeThemes", () => {
  // ─── Single-Theme Composition ──────────────────────────────────

  describe("single-theme composition", () => {
    it("accepts a single layer", () => {
      const result = composeThemes([{ name: "base", base: "light" }]);
      expect(result.definition.name).toBe("base");
      expect(result.definition.base).toBe("light");
      expect(result.metadata.layerCount).toBe(1);
      expect(result.metadata.chain).toEqual(["base"]);
    });

    it("passes through all properties from a single layer", () => {
      const result = composeThemes([
        {
          name: "corp",
          base: "dark",
          description: "Corporate dark",
          defaultDensity: "standard",
          overrides: { color: { interactive: { default: "#0066cc" } } },
          metadata: { version: "1.0" },
        },
      ]);
      expect(result.definition.base).toBe("dark");
      expect(result.definition.description).toBe("Corporate dark");
      expect(result.definition.defaultDensity).toBe("standard");
      expect(result.definition.metadata).toEqual({ version: "1.0" });
    });
  });

  // ─── Multi-Layer Composition ───────────────────────────────────

  describe("multi-layer composition", () => {
    it("applies layers in order — last name wins", () => {
      const result = composeThemes([
        { name: "kairo", base: "light" },
        { name: "org" },
        { name: "product" },
      ]);
      expect(result.definition.name).toBe("product");
      expect(result.metadata.chain).toEqual(["kairo", "org", "product"]);
    });

    it("merges overrides with later layers taking precedence", () => {
      const result = composeThemes([
        {
          name: "base",
          base: "light",
          overrides: {
            color: { interactive: { default: "#0066cc", hover: "#0052a3" } },
          },
        },
        {
          name: "product",
          overrides: {
            color: { interactive: { default: "#ff0000" } },
          },
        },
      ]);

      const colorOverrides = result.definition.overrides.color;
      expect(colorOverrides?.interactive?.["default"]).toBe("#ff0000");
      // Preserves non-conflicting values from earlier layers
      expect(colorOverrides?.interactive?.["hover"]).toBe("#0052a3");
    });

    it("merges metadata with later keys winning", () => {
      const result = composeThemes([
        { name: "a", base: "light", metadata: { author: "A", version: "1" } },
        { name: "b", metadata: { version: "2", team: "B" } },
      ]);
      expect(result.definition.metadata).toEqual({
        author: "A",
        version: "2",
        team: "B",
      });
    });

    it("last density wins", () => {
      const result = composeThemes([
        { name: "a", base: "light", defaultDensity: "comfortable" },
        { name: "b", defaultDensity: "compact" },
      ]);
      expect(result.definition.defaultDensity).toBe("compact");
    });

    it("last description wins", () => {
      const result = composeThemes([
        { name: "a", base: "light", description: "First" },
        { name: "b", description: "Second" },
      ]);
      expect(result.definition.description).toBe("Second");
    });

    it("preserves description from earlier layer if later omits it", () => {
      const result = composeThemes([
        { name: "a", base: "light", description: "First" },
        { name: "b" },
      ]);
      expect(result.definition.description).toBe("First");
    });
  });

  // ─── Override Deep Merge ───────────────────────────────────────

  describe("override deep merge", () => {
    it("merges nested color structures", () => {
      const result = composeThemes([
        {
          name: "base",
          base: "light",
          overrides: {
            color: {
              text: { primary: "#111", secondary: "#222" },
              border: { default: "#ccc" },
            },
          },
        },
        {
          name: "custom",
          overrides: {
            color: {
              text: { primary: "#000" },
              interactive: { default: "#00f" },
            },
          },
        },
      ]);

      const color = result.definition.overrides.color;
      expect(color?.text?.["primary"]).toBe("#000");
      expect(color?.text?.["secondary"]).toBe("#222");
      expect(color?.border?.["default"]).toBe("#ccc");
      expect(color?.interactive?.["default"]).toBe("#00f");
    });

    it("merges different override groups independently", () => {
      const result = composeThemes([
        {
          name: "a",
          base: "light",
          overrides: { color: { text: { primary: "#111" } } },
        },
        {
          name: "b",
          overrides: { elevation: { raised: "none" } },
        },
      ]);

      expect(result.definition.overrides.color?.text?.["primary"]).toBe("#111");
      expect(result.definition.overrides.elevation?.["raised"]).toBe("none");
    });
  });

  // ─── Conflicting Bases ─────────────────────────────────────────

  describe("conflicting bases", () => {
    it("reports error when layers have different bases", () => {
      const result = composeThemes([
        { name: "light-theme", base: "light" },
        { name: "dark-override", base: "dark" },
      ]);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]?.message).toContain("Conflicting base");
    });

    it("uses the first base when conflict occurs", () => {
      const result = composeThemes([
        { name: "a", base: "light" },
        { name: "b", base: "dark" },
      ]);
      expect(result.definition.base).toBe("light");
    });

    it("allows layers without base to compose with any base", () => {
      const result = composeThemes([{ name: "a", base: "dark" }, { name: "b" }, { name: "c" }]);
      expect(result.definition.base).toBe("dark");
      expect(result.errors).toEqual([]);
    });
  });

  // ─── Missing Base ──────────────────────────────────────────────

  describe("missing base", () => {
    it("defaults to light when no layer specifies a base", () => {
      const result = composeThemes([{ name: "a" }, { name: "b" }]);
      expect(result.definition.base).toBe("light");
    });

    it("reports a warning error when base is missing", () => {
      const result = composeThemes([{ name: "a" }]);
      expect(result.errors.length).toBe(1);
      expect(result.errors[0]?.message).toContain("No layer specified a base");
    });
  });

  // ─── Empty Composition ─────────────────────────────────────────

  describe("empty composition", () => {
    it("throws for empty layers array", () => {
      expect(() => composeThemes([])).toThrow("composeThemes requires at least one layer");
    });
  });

  // ─── Immutability ──────────────────────────────────────────────

  describe("immutability", () => {
    it("returns a frozen definition", () => {
      const result = composeThemes([{ name: "test", base: "light" }]);
      expect(Object.isFrozen(result.definition)).toBe(true);
    });

    it("deeply freezes overrides", () => {
      const result = composeThemes([
        {
          name: "test",
          base: "light",
          overrides: { color: { text: { primary: "#000" } } },
        },
      ]);
      expect(Object.isFrozen(result.definition.overrides)).toBe(true);
    });

    it("does not mutate input layers", () => {
      const layer: CompositionLayer = {
        name: "a",
        base: "light",
        overrides: { color: { interactive: { default: "#0066cc" } } },
        metadata: { v: "1" },
      };
      const copy = JSON.parse(JSON.stringify(layer)) as typeof layer;
      composeThemes([
        layer,
        { name: "b", overrides: { color: { interactive: { default: "#ff0000" } } } },
      ]);
      expect(JSON.stringify(layer)).toBe(JSON.stringify(copy));
    });
  });

  // ─── Deterministic Output ──────────────────────────────────────

  describe("deterministic output", () => {
    it("produces identical results for the same input", () => {
      const layers: CompositionLayer[] = [
        { name: "a", base: "light", overrides: { color: { text: { primary: "#000" } } } },
        { name: "b", overrides: { elevation: { raised: "none" } } },
      ];
      const a = composeThemes(layers);
      const b = composeThemes(layers);
      expect(JSON.stringify(a.definition)).toBe(JSON.stringify(b.definition));
    });
  });

  // ─── Integration with createTheme ─────────────────────────────

  describe("integration", () => {
    it("composed definition is compatible with resolveTheme input", () => {
      const result = composeThemes([
        { name: "base", base: "light", defaultDensity: "comfortable" },
        { name: "brand", overrides: { color: { interactive: { default: "#0066cc" } } } },
      ]);

      // The definition should have the same shape as createTheme output
      expect(result.definition.name).toBe("brand");
      expect(result.definition.base).toBe("light");
      expect(result.definition.defaultDensity).toBe("comfortable");
      expect(result.definition.overrides).toBeDefined();
    });

    it("composed definition matches ThemeDefinition shape from createTheme", () => {
      const created = createTheme({
        name: "direct",
        base: "light",
        overrides: { color: { interactive: { default: "#0066cc" } } },
      });

      const composed = composeThemes([
        {
          name: "composed",
          base: "light",
          overrides: { color: { interactive: { default: "#0066cc" } } },
        },
      ]);

      // Both should have the same keys
      expect(Object.keys(composed.definition).sort()).toEqual(Object.keys(created).sort());
    });
  });

  // ─── Composition Metadata ──────────────────────────────────────

  describe("composition metadata", () => {
    it("records the full composition chain", () => {
      const result = composeThemes([
        { name: "kairo-base", base: "light" },
        { name: "org-theme" },
        { name: "product-theme" },
        { name: "app-overrides" },
      ]);
      expect(result.metadata.chain).toEqual([
        "kairo-base",
        "org-theme",
        "product-theme",
        "app-overrides",
      ]);
      expect(result.metadata.layerCount).toBe(4);
    });

    it("reports resolved base and density", () => {
      const result = composeThemes([{ name: "a", base: "dark", defaultDensity: "compact" }]);
      expect(result.metadata.base).toBe("dark");
      expect(result.metadata.density).toBe("compact");
    });
  });
});
