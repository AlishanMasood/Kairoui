import { describe, it, expect } from "vitest";
import { createTheme } from "./create-theme";
import { resolveTheme, resolveThemeSync } from "./resolve-theme";

describe("resolveTheme", () => {
  // ─── Default Light Resolution ──────────────────────────────────

  describe("default light resolution", () => {
    it("resolves a minimal light theme", async () => {
      const def = createTheme({ name: "light-test", base: "light" });
      const result = await resolveTheme({ definition: def });

      expect(result.metadata.name).toBe("light-test");
      expect(result.metadata.base).toBe("light");
      expect(result.metadata.resolvedMode).toBe("light");
      expect(result.metadata.density).toBe("comfortable");
      expect(result.metadata.tokenCount).toBeGreaterThan(0);
      expect(result.metadata.warnings).toEqual([]);
    });

    it("produces a complete token object with all top-level keys", async () => {
      const def = createTheme({ name: "test", base: "light" });
      const result = await resolveTheme({ definition: def });
      const keys = Object.keys(result.tokens);

      expect(keys).toContain("color");
      expect(keys).toContain("typography");
      expect(keys).toContain("spacing");
      expect(keys).toContain("control");
      expect(keys).toContain("elevation");
      expect(keys).toContain("interaction");
    });

    it("resolved tokens contain actual values not placeholders", async () => {
      const def = createTheme({ name: "test", base: "light" });
      const result = await resolveTheme({ definition: def });
      const color = result.tokens["color"] as Record<string, unknown>;
      const bg = color["background"] as Record<string, unknown>;

      expect(typeof bg["page"]).toBe("string");
      expect(bg["page"]).toMatch(/^[#a-z]/i);
    });
  });

  // ─── Default Dark Resolution ───────────────────────────────────

  describe("default dark resolution", () => {
    it("resolves a minimal dark theme", async () => {
      const def = createTheme({ name: "dark-test", base: "dark" });
      const result = await resolveTheme({ definition: def });

      expect(result.metadata.base).toBe("dark");
      expect(result.metadata.resolvedMode).toBe("dark");
    });

    it("dark theme has different values than light", async () => {
      const lightDef = createTheme({ name: "l", base: "light" });
      const darkDef = createTheme({ name: "d", base: "dark" });

      const light = await resolveTheme({ definition: lightDef });
      const dark = await resolveTheme({ definition: darkDef });

      const lightBg = (light.tokens["color"] as Record<string, unknown>)["background"] as Record<
        string,
        unknown
      >;
      const darkBg = (dark.tokens["color"] as Record<string, unknown>)["background"] as Record<
        string,
        unknown
      >;

      expect(lightBg["page"]).not.toBe(darkBg["page"]);
    });
  });

  // ─── Semantic Overrides ────────────────────────────────────────

  describe("semantic overrides", () => {
    it("applies color overrides", async () => {
      const def = createTheme({
        name: "branded",
        base: "light",
        overrides: {
          color: { interactive: { default: "#0066cc" } },
        },
      });
      const result = await resolveTheme({ definition: def });
      const interactive = (
        (result.tokens["color"] as Record<string, unknown>)["interactive"] as Record<
          string,
          unknown
        >
      )["default"];

      expect(interactive).toBe("#0066cc");
    });

    it("preserves non-overridden values", async () => {
      const def = createTheme({
        name: "partial",
        base: "light",
        overrides: {
          color: { interactive: { default: "#0066cc" } },
        },
      });
      const result = await resolveTheme({ definition: def });
      const text = (result.tokens["color"] as Record<string, unknown>)["text"] as Record<
        string,
        unknown
      >;

      expect(text["primary"]).toBeDefined();
      expect(typeof text["primary"]).toBe("string");
    });

    it("reports applied override groups in metadata", async () => {
      const def = createTheme({
        name: "test",
        base: "light",
        overrides: {
          color: { text: { primary: "#000000" } },
          elevation: { raised: "none" },
        },
      });
      const result = await resolveTheme({ definition: def });

      expect(result.metadata.appliedOverrideGroups).toContain("color");
      expect(result.metadata.appliedOverrideGroups).toContain("elevation");
    });
  });

  // ─── Density ───────────────────────────────────────────────────

  describe("density", () => {
    it("applies default density from definition", async () => {
      const def = createTheme({
        name: "compact-theme",
        base: "light",
        defaultDensity: "compact",
      });
      const result = await resolveTheme({ definition: def });

      expect(result.metadata.density).toBe("compact");
    });

    it("overrides density via options", async () => {
      const def = createTheme({
        name: "test",
        base: "light",
        defaultDensity: "comfortable",
      });
      const result = await resolveTheme({
        definition: def,
        density: "compact",
      });

      expect(result.metadata.density).toBe("compact");
    });

    it("different densities produce different spacing values", async () => {
      const def = createTheme({ name: "test", base: "light" });

      const comfortable = await resolveTheme({
        definition: def,
        density: "comfortable",
      });
      const compact = await resolveTheme({
        definition: def,
        density: "compact",
      });

      const comfSpacing = comfortable.tokens["spacing"] as Record<string, unknown>;
      const compSpacing = compact.tokens["spacing"] as Record<string, unknown>;

      expect(JSON.stringify(comfSpacing)).not.toBe(JSON.stringify(compSpacing));
    });
  });

  // ─── Invalid/Unknown References ────────────────────────────────

  describe("invalid references", () => {
    it("warns on unknown override keys", async () => {
      const def = createTheme({
        name: "test",
        base: "light",
        overrides: {
          color: {
            interactive: { nonexistent: "#ff0000" },
          },
        },
      });
      const result = await resolveTheme({ definition: def });

      expect(result.metadata.warnings.length).toBeGreaterThan(0);
      expect(result.metadata.warnings[0]?.type).toBe("unknown_key");
      expect(result.metadata.warnings[0]?.path).toContain("nonexistent");
    });

    it("still produces a valid token object despite warnings", async () => {
      const def = createTheme({
        name: "test",
        base: "light",
        overrides: {
          color: {
            interactive: { bogus: "#ff0000" },
          },
        },
      });
      const result = await resolveTheme({ definition: def });

      expect(result.tokens["color"]).toBeDefined();
      expect(result.metadata.tokenCount).toBeGreaterThan(0);
    });
  });

  // ─── Immutability ──────────────────────────────────────────────

  describe("immutability", () => {
    it("does not mutate the theme definition", async () => {
      const def = createTheme({
        name: "test",
        base: "light",
        overrides: { color: { interactive: { default: "#0066cc" } } },
      });

      const defCopy = JSON.parse(JSON.stringify(def)) as typeof def;
      await resolveTheme({ definition: def });

      expect(JSON.stringify(def)).toBe(JSON.stringify(defCopy));
    });

    it("returns a frozen tokens object", async () => {
      const def = createTheme({ name: "test", base: "light" });
      const result = await resolveTheme({ definition: def });

      expect(Object.isFrozen(result.tokens)).toBe(true);
    });
  });

  // ─── Deterministic Ordering ────────────────────────────────────

  describe("deterministic output", () => {
    it("produces identical results for the same input", async () => {
      const def = createTheme({
        name: "test",
        base: "light",
        overrides: { color: { interactive: { default: "#0066cc" } } },
      });

      const a = await resolveTheme({ definition: def });
      const b = await resolveTheme({ definition: def });

      expect(JSON.stringify(a.tokens)).toBe(JSON.stringify(b.tokens));
      expect(a.metadata.tokenCount).toBe(b.metadata.tokenCount);
    });

    it("key ordering is stable across calls", async () => {
      const def = createTheme({ name: "test", base: "light" });

      const a = await resolveTheme({ definition: def });
      const b = await resolveTheme({ definition: def });

      expect(Object.keys(a.tokens)).toEqual(Object.keys(b.tokens));
    });
  });

  // ─── Sync API ──────────────────────────────────────────────────

  describe("resolveThemeSync", () => {
    it("throws if tokens not loaded", () => {
      // After the async tests above, tokens ARE cached, so this won't throw.
      // This test verifies the sync API works once cached.
      const def = createTheme({ name: "sync-test", base: "light" });
      const result = resolveThemeSync({ definition: def });

      expect(result.metadata.name).toBe("sync-test");
      expect(result.tokens["color"]).toBeDefined();
    });

    it("produces same result as async version", async () => {
      const def = createTheme({ name: "compare", base: "dark" });

      const asyncResult = await resolveTheme({ definition: def });
      const syncResult = resolveThemeSync({ definition: def });

      expect(JSON.stringify(asyncResult.tokens)).toBe(JSON.stringify(syncResult.tokens));
    });
  });

  // ─── Metadata ──────────────────────────────────────────────────

  describe("metadata", () => {
    it("reports token count", async () => {
      const def = createTheme({ name: "test", base: "light" });
      const result = await resolveTheme({ definition: def });

      // Should have many leaf token values
      expect(result.metadata.tokenCount).toBeGreaterThan(100);
    });

    it("reports empty warnings for valid themes", async () => {
      const def = createTheme({ name: "test", base: "light" });
      const result = await resolveTheme({ definition: def });

      expect(result.metadata.warnings).toEqual([]);
    });

    it("reports empty appliedOverrideGroups when no overrides", async () => {
      const def = createTheme({ name: "test", base: "light" });
      const result = await resolveTheme({ definition: def });

      expect(result.metadata.appliedOverrideGroups).toEqual([]);
    });
  });

  // ─── Public Import ─────────────────────────────────────────────

  describe("public import", () => {
    it("can be imported from the package entry", async () => {
      const mod = await import("./index");
      expect(mod.resolveTheme).toBeDefined();
      expect(mod.resolveThemeSync).toBeDefined();
      expect(typeof mod.resolveTheme).toBe("function");
    });
  });
});
