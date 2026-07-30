import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { flattenToManifest, buildManifest, MANIFEST_SCHEMA_VERSION } from "../manifest/index";
import type { TokenManifestJson } from "../manifest/index";

const DIST = join(import.meta.dirname, "../../dist");

function readManifest(): TokenManifestJson {
  return JSON.parse(readFileSync(join(DIST, "tokens.json"), "utf-8")) as TokenManifestJson;
}

describe("JSON token manifest", () => {
  describe("file output", () => {
    it("dist/tokens.json exists", () => {
      expect(existsSync(join(DIST, "tokens.json"))).toBe(true);
    });

    it("is valid JSON", () => {
      expect(() => readManifest()).not.toThrow();
    });
  });

  describe("schema completeness", () => {
    it("includes $schema URL", () => {
      const m = readManifest();
      expect(m.$schema).toContain("token-manifest");
    });

    it("includes version matching MANIFEST_SCHEMA_VERSION", () => {
      const m = readManifest();
      expect(m.version).toBe(MANIFEST_SCHEMA_VERSION);
    });

    it("includes generatedAt timestamp", () => {
      const m = readManifest();
      expect(m.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it("lists themes", () => {
      const m = readManifest();
      expect(m.themes).toContain("light");
      expect(m.themes).toContain("dark");
    });

    it("lists densities", () => {
      const m = readManifest();
      expect(m.densities).toContain("comfortable");
      expect(m.densities).toContain("standard");
      expect(m.densities).toContain("compact");
    });

    it("tokenCount matches tokens array length", () => {
      const m = readManifest();
      expect(m.tokenCount).toBe(m.tokens.length);
    });
  });

  describe("token entries", () => {
    it("every token has path, cssVariable, layer, category, value", () => {
      const m = readManifest();
      for (const token of m.tokens) {
        expect(token.path).toBeTruthy();
        expect(token.cssVariable).toMatch(/^--kui-/);
        expect(["primitive", "semantic", "density"]).toContain(token.layer);
        expect(token.category).toBeTruthy();
        expect(token.value).toBeDefined();
      }
    });

    it("no token path contains filesystem paths", () => {
      const m = readManifest();
      for (const token of m.tokens) {
        expect(token.path).not.toMatch(/[/\\]/);
        expect(token.value).not.toMatch(/[A-Z]:[/\\]/);
      }
    });
  });

  describe("deterministic ordering", () => {
    it("tokens are sorted by path", () => {
      const m = readManifest();
      const paths = m.tokens.map((t) => t.path);
      const sorted = [...paths].sort((a, b) => a.localeCompare(b));
      expect(paths).toEqual(sorted);
    });
  });

  describe("no private token leakage", () => {
    it("no token path starts with underscore", () => {
      const m = readManifest();
      for (const token of m.tokens) {
        expect(token.path).not.toMatch(/\._/);
        expect(token.path.startsWith("_")).toBe(false);
      }
    });
  });

  describe("flattenToManifest utility", () => {
    it("flattens nested objects with correct paths", () => {
      const tokens = { color: { text: { primary: "#000" } } };
      const result = flattenToManifest(tokens, { layer: "semantic" });
      expect(result).toHaveLength(1);
      expect(result[0]?.path).toBe("color.text.primary");
      expect(result[0]?.cssVariable).toBe("--kui-color-text-primary");
      expect(result[0]?.value).toBe("#000");
    });

    it("attaches theme metadata when provided", () => {
      const tokens = { a: "1" };
      const result = flattenToManifest(tokens, { layer: "semantic", themes: ["light", "dark"] });
      expect(result[0]?.themes).toEqual(["light", "dark"]);
    });

    it("attaches density flag when applicable", () => {
      const tokens = { spacing: { sm: "0.5rem" } };
      const result = flattenToManifest(tokens, { layer: "density", densityApplicable: true });
      expect(result[0]?.densityApplicable).toBe(true);
    });
  });

  describe("buildManifest utility", () => {
    it("merges multiple token sets", () => {
      const m = buildManifest([
        { tokens: { a: "1" }, options: { layer: "semantic" } },
        { tokens: { b: "2" }, options: { layer: "density", densityApplicable: true } },
      ]);
      expect(m.tokenCount).toBe(2);
      expect(m.tokens[0]?.path).toBe("a");
      expect(m.tokens[1]?.path).toBe("b");
    });
  });

  describe("public import", () => {
    it("manifest utilities are importable from the package entry point", async () => {
      const tokens = await import("../index");
      expect(tokens.flattenToManifest).toBeDefined();
      expect(tokens.buildManifest).toBeDefined();
      expect(tokens.MANIFEST_SCHEMA_VERSION).toBe("1.0.0");
    });
  });
});
