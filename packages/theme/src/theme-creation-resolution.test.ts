import { describe, it, expect } from "vitest";
import {
  createTheme,
  validateTheme,
  resolveTheme,
  resolveThemeSync,
  composeThemes,
  mergeThemeOverrides,
  serializeTheme,
  serializeThemeToJson,
  parseSerializedTheme,
  generateCssVariables,
  inspectTheme,
  inspectResolvedTheme,
  validateThemeDefinition,
  THEME_SERIALIZATION_VERSION,
} from "./index";

describe("theme creation and resolution — comprehensive", () => {
  // ─── Creation ──────────────────────────────────────────────────

  describe("creation", () => {
    it("creates minimal light theme", () => {
      const theme = createTheme({ name: "minimal", base: "light" });
      expect(theme.name).toBe("minimal");
      expect(theme.base).toBe("light");
      expect(theme.defaultDensity).toBe("comfortable");
      expect(theme.description).toBe("");
      expect(theme.overrides).toEqual({});
      expect(theme.metadata).toEqual({});
    });

    it("creates minimal dark theme", () => {
      const theme = createTheme({ name: "dark-min", base: "dark" });
      expect(theme.base).toBe("dark");
    });

    it("creates complete custom theme", () => {
      const theme = createTheme({
        name: "full",
        base: "light",
        description: "Fully configured theme",
        defaultDensity: "standard",
        overrides: {
          color: { interactive: { default: "#0066cc", hover: "#0052a3" } },
          typography: { body: { fontFamily: "Helvetica" } },
          spacing: { inline: { sm: "0.375rem" } },
          elevation: { raised: "0 2px 4px rgba(0,0,0,0.1)" },
        },
        metadata: { author: "Test", version: "2.0", org: "Acme" },
      });
      expect(theme.name).toBe("full");
      expect(theme.description).toBe("Fully configured theme");
      expect(theme.defaultDensity).toBe("standard");
      expect(theme.overrides.color?.interactive?.["default"]).toBe("#0066cc");
      expect(theme.overrides.typography?.["body"]?.["fontFamily"]).toBe("Helvetica");
      expect(theme.metadata).toEqual({ author: "Test", version: "2.0", org: "Acme" });
    });

    it("rejects empty name", () => {
      expect(() => createTheme({ name: "", base: "light" })).toThrow("name");
    });

    it("rejects invalid base", () => {
      expect(() => createTheme({ name: "t", base: "sunset" as "light" })).toThrow("base");
    });

    it("rejects invalid density", () => {
      expect(() =>
        createTheme({ name: "t", base: "light", defaultDensity: "tiny" as "compact" }),
      ).toThrow("density");
    });

    it("rejects unknown override groups", () => {
      expect(() =>
        createTheme({ name: "t", base: "light", overrides: { animation: {} } as never }),
      ).toThrow("animation");
    });

    it("rejects non-string metadata values", () => {
      expect(() =>
        createTheme({ name: "t", base: "light", metadata: { n: 1 as unknown as string } }),
      ).toThrow("metadata");
    });

    it("validateTheme returns errors without throwing", () => {
      const result = validateTheme({ name: "", base: "bad" as "light" });
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ─── Immutability ──────────────────────────────────────────────

  describe("immutability", () => {
    it("created theme is frozen", () => {
      const theme = createTheme({ name: "frozen", base: "light" });
      expect(Object.isFrozen(theme)).toBe(true);
    });

    it("overrides are deeply frozen", () => {
      const theme = createTheme({
        name: "deep",
        base: "light",
        overrides: { color: { interactive: { default: "#0066cc" } } },
      });
      expect(Object.isFrozen(theme.overrides)).toBe(true);
    });

    it("input is not mutated", () => {
      const overrides = { color: { interactive: { default: "#0066cc" } } };
      const input = { name: "safe", base: "light" as const, overrides };
      const copy = JSON.stringify(input);
      createTheme(input);
      expect(JSON.stringify(input)).toBe(copy);
    });

    it("resolved theme tokens are frozen", async () => {
      const def = createTheme({ name: "r", base: "light" });
      const result = await resolveTheme({ definition: def });
      expect(Object.isFrozen(result.tokens)).toBe(true);
    });
  });

  // ─── Resolution ────────────────────────────────────────────────

  describe("resolution", () => {
    it("resolves light theme with all token groups", async () => {
      const def = createTheme({ name: "light", base: "light" });
      const result = await resolveTheme({ definition: def });
      expect(result.metadata.base).toBe("light");
      expect(result.metadata.resolvedMode).toBe("light");
      const keys = Object.keys(result.tokens);
      expect(keys).toContain("color");
      expect(keys).toContain("typography");
      expect(keys).toContain("spacing");
      expect(keys).toContain("control");
      expect(keys).toContain("elevation");
      expect(keys).toContain("interaction");
    });

    it("resolves dark theme", async () => {
      const def = createTheme({ name: "dark", base: "dark" });
      const result = await resolveTheme({ definition: def });
      expect(result.metadata.resolvedMode).toBe("dark");
    });

    it("light and dark produce different color values", async () => {
      const light = await resolveTheme({ definition: createTheme({ name: "l", base: "light" }) });
      const dark = await resolveTheme({ definition: createTheme({ name: "d", base: "dark" }) });
      const lightBg = (light.tokens["color"] as Record<string, Record<string, string>>)[
        "background"
      ]?.["page"];
      const darkBg = (dark.tokens["color"] as Record<string, Record<string, string>>)[
        "background"
      ]?.["page"];
      expect(lightBg).not.toBe(darkBg);
    });

    it("applies semantic override", async () => {
      const def = createTheme({
        name: "custom",
        base: "light",
        overrides: { color: { interactive: { default: "#0066cc" } } },
      });
      const result = await resolveTheme({ definition: def });
      const interactive = (result.tokens["color"] as Record<string, Record<string, string>>)[
        "interactive"
      ];
      expect(interactive?.["default"]).toBe("#0066cc");
    });

    it("preserves non-overridden values", async () => {
      const def = createTheme({
        name: "partial",
        base: "light",
        overrides: { color: { interactive: { default: "#0066cc" } } },
      });
      const result = await resolveTheme({ definition: def });
      const text = (result.tokens["color"] as Record<string, Record<string, string>>)["text"];
      expect(text?.["primary"]).toBeDefined();
    });

    it("reports unknown override keys as warnings", async () => {
      const def = createTheme({
        name: "warn",
        base: "light",
        overrides: { color: { interactive: { nonexistent: "#ff0000" } } },
      });
      const result = await resolveTheme({ definition: def });
      expect(result.metadata.warnings.length).toBeGreaterThan(0);
      expect(result.metadata.warnings[0]?.path).toContain("nonexistent");
    });

    it("applies density override", async () => {
      const def = createTheme({ name: "d", base: "light", defaultDensity: "compact" });
      const result = await resolveTheme({ definition: def });
      expect(result.metadata.density).toBe("compact");
    });

    it("density option overrides definition default", async () => {
      const def = createTheme({ name: "d", base: "light", defaultDensity: "comfortable" });
      const result = await resolveTheme({ definition: def, density: "compact" });
      expect(result.metadata.density).toBe("compact");
    });

    it("different densities produce different spacing", async () => {
      const def = createTheme({ name: "d", base: "light" });
      const comfortable = await resolveTheme({ definition: def, density: "comfortable" });
      const compact = await resolveTheme({ definition: def, density: "compact" });
      expect(JSON.stringify(comfortable.tokens["spacing"])).not.toBe(
        JSON.stringify(compact.tokens["spacing"]),
      );
    });
  });

  // ─── Deterministic Output ──────────────────────────────────────

  describe("deterministic output", () => {
    it("same input produces same resolution", async () => {
      const def = createTheme({
        name: "det",
        base: "light",
        overrides: { color: { interactive: { default: "#0066cc" } } },
      });
      const a = await resolveTheme({ definition: def });
      const b = await resolveTheme({ definition: def });
      expect(JSON.stringify(a.tokens)).toBe(JSON.stringify(b.tokens));
    });

    it("same input produces same CSS variables", async () => {
      const def = createTheme({ name: "det", base: "light" });
      const resolved = await resolveTheme({ definition: def });
      const a = generateCssVariables(resolved);
      const b = generateCssVariables(resolved);
      expect(JSON.stringify(a.variables)).toBe(JSON.stringify(b.variables));
    });
  });

  // ─── Composition ───────────────────────────────────────────────

  describe("composition", () => {
    it("composes multiple layers", () => {
      const result = composeThemes([
        { name: "base", base: "light" },
        { name: "org", overrides: { color: { text: { primary: "#111" } } } },
        { name: "product", overrides: { color: { text: { secondary: "#333" } } } },
      ]);
      expect(result.definition.name).toBe("product");
      expect(result.metadata.chain).toEqual(["base", "org", "product"]);
      expect(result.definition.overrides.color?.text?.["primary"]).toBe("#111");
      expect(result.definition.overrides.color?.text?.["secondary"]).toBe("#333");
    });

    it("later layers override earlier", () => {
      const result = composeThemes([
        { name: "a", base: "light", overrides: { color: { text: { primary: "#aaa" } } } },
        { name: "b", overrides: { color: { text: { primary: "#bbb" } } } },
      ]);
      expect(result.definition.overrides.color?.text?.["primary"]).toBe("#bbb");
    });

    it("conflicting bases produce errors", () => {
      const result = composeThemes([
        { name: "a", base: "light" },
        { name: "b", base: "dark" },
      ]);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("composed definition resolves correctly", async () => {
      const composed = composeThemes([
        { name: "base", base: "light" },
        { name: "brand", overrides: { color: { interactive: { default: "#009900" } } } },
      ]);
      const resolved = await resolveTheme({ definition: composed.definition });
      const interactive = (resolved.tokens["color"] as Record<string, Record<string, string>>)[
        "interactive"
      ];
      expect(interactive?.["default"]).toBe("#009900");
    });
  });

  // ─── Merge Precedence ──────────────────────────────────────────

  describe("merge precedence", () => {
    it("later values override earlier in mergeThemeOverrides", () => {
      const { merged } = mergeThemeOverrides(
        { color: { text: { primary: "#old" } } },
        { color: { text: { primary: "#new" } } },
      );
      expect(merged.color?.text?.["primary"]).toBe("#new");
    });

    it("non-conflicting values are preserved", () => {
      const { merged } = mergeThemeOverrides(
        { color: { text: { primary: "#111" } } },
        { elevation: { raised: "none" } },
      );
      expect(merged.color?.text?.["primary"]).toBe("#111");
      expect(merged.elevation?.["raised"]).toBe("none");
    });
  });

  // ─── Serialization ─────────────────────────────────────────────

  describe("serialization", () => {
    it("serializes resolved theme to JSON", async () => {
      const def = createTheme({ name: "ser", base: "light" });
      const resolved = await resolveTheme({ definition: def });
      const serialized = serializeTheme(resolved);
      expect(serialized.version).toBe(THEME_SERIALIZATION_VERSION);
      expect(serialized.name).toBe("ser");
    });

    it("round-trips via serializeThemeToJson + parseSerializedTheme", async () => {
      const def = createTheme({ name: "rt", base: "dark" });
      const resolved = await resolveTheme({ definition: def });
      const json = serializeThemeToJson(resolved);
      const parsed = parseSerializedTheme(json);
      expect(parsed.name).toBe("rt");
      expect(parsed.base).toBe("dark");
    });

    it("generates CSS variables with Phase 2 naming", async () => {
      const def = createTheme({ name: "css", base: "light" });
      const resolved = await resolveTheme({ definition: def });
      const vars = generateCssVariables(resolved);
      expect(vars.count).toBeGreaterThan(100);
      expect(vars.variables["--kui-color-bg-page"]).toBeDefined();
      expect(vars.duplicates).toEqual([]);
      expect(vars.invalid).toEqual([]);
    });
  });

  // ─── Inspection ────────────────────────────────────────────────

  describe("inspection", () => {
    it("inspects a theme definition", () => {
      const def = createTheme({
        name: "inspect-me",
        base: "light",
        description: "Inspectable",
        overrides: { color: { interactive: { default: "#0066cc" } } },
        metadata: { version: "1.0" },
      });
      const report = inspectTheme(def);
      expect(report.name).toBe("inspect-me");
      expect(report.overrideGroups).toContain("color");
      expect(report.metadataKeys).toContain("version");
      expect(report.warnings).toEqual([]);
    });

    it("inspects a resolved theme", async () => {
      const def = createTheme({ name: "resolved-inspect", base: "dark" });
      const resolved = await resolveTheme({ definition: def });
      const report = inspectResolvedTheme(resolved);
      expect(report.resolvedMode).toBe("dark");
      expect(report.tokenCount).toBeGreaterThan(100);
      expect(report.tokenGroups).toContain("color");
    });
  });

  // ─── Validation ────────────────────────────────────────────────

  describe("validation", () => {
    it("validates a correct definition", () => {
      const def = createTheme({ name: "valid", base: "light" });
      const report = validateThemeDefinition(def);
      expect(report.valid).toBe(true);
    });

    it("reports errors for invalid definition", () => {
      const report = validateThemeDefinition({
        name: "",
        base: "invalid" as "light",
        description: "",
        defaultDensity: "huge" as "compact",
        overrides: {},
        metadata: {},
      });
      expect(report.valid).toBe(false);
      expect(report.diagnostics.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ─── Sync Resolution ──────────────────────────────────────────

  describe("sync resolution", () => {
    it("resolveThemeSync works after async resolution", async () => {
      const def = createTheme({ name: "sync", base: "light" });
      await resolveTheme({ definition: def }); // loads tokens
      const sync = resolveThemeSync({ definition: def });
      expect(sync.metadata.name).toBe("sync");
      expect(sync.tokens["color"]).toBeDefined();
    });
  });

  // ─── Public Imports ────────────────────────────────────────────

  describe("public imports", () => {
    it("all creation/resolution APIs are importable from index", async () => {
      const mod = await import("./index");
      expect(mod.createTheme).toBeDefined();
      expect(mod.validateTheme).toBeDefined();
      expect(mod.resolveTheme).toBeDefined();
      expect(mod.resolveThemeSync).toBeDefined();
      expect(mod.composeThemes).toBeDefined();
      expect(mod.mergeThemeOverrides).toBeDefined();
      expect(mod.serializeTheme).toBeDefined();
      expect(mod.generateCssVariables).toBeDefined();
      expect(mod.inspectTheme).toBeDefined();
      expect(mod.validateThemeDefinition).toBeDefined();
    });
  });
});
