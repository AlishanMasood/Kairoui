import { describe, it, expect } from "vitest";
import { createTheme } from "./create-theme";
import {
  validateThemeDefinition,
  validateOverrides,
  validateResolvedTheme,
  validateThemeName,
  validateBaseMode,
  validateDensityValue,
  THEME_CONSTANTS,
} from "./validate";
import type { ThemeDefinition } from "./types";

describe("validateThemeDefinition", () => {
  it("passes for a valid definition", () => {
    const def = createTheme({ name: "acme", base: "light" });
    const report = validateThemeDefinition(def);
    expect(report.valid).toBe(true);
    expect(report.errorCount).toBe(0);
  });

  it("reports missing name", () => {
    const def = {
      name: "",
      base: "light",
      description: "",
      defaultDensity: "comfortable",
      overrides: {},
      metadata: {},
    } as ThemeDefinition;
    const report = validateThemeDefinition(def);
    expect(report.valid).toBe(false);
    expect(
      report.diagnostics.some((d) => d.category === "missing_required" && d.path === "name"),
    ).toBe(true);
  });

  it("warns on non-kebab-case name", () => {
    const def = createTheme({ name: "AcmeTheme", base: "light" });
    const report = validateThemeDefinition(def);
    // This is a format warning, not a blocking error
    expect(
      report.diagnostics.some((d) => d.category === "invalid_format" && d.path === "name"),
    ).toBe(true);
    expect(report.diagnostics[0]?.suggestion).toBeDefined();
  });

  it("reports invalid base", () => {
    const def = {
      name: "test",
      base: "sunset" as "light",
      description: "",
      defaultDensity: "comfortable",
      overrides: {},
      metadata: {},
    } as ThemeDefinition;
    const report = validateThemeDefinition(def);
    expect(report.valid).toBe(false);
    expect(
      report.diagnostics.some((d) => d.path === "base" && d.category === "invalid_value"),
    ).toBe(true);
  });

  it("reports invalid density", () => {
    const def = {
      name: "test",
      base: "light",
      description: "",
      defaultDensity: "tiny" as "compact",
      overrides: {},
      metadata: {},
    } as ThemeDefinition;
    const report = validateThemeDefinition(def);
    expect(report.valid).toBe(false);
    expect(report.diagnostics.some((d) => d.path === "defaultDensity")).toBe(true);
  });

  it("reports unknown override groups", () => {
    const def = createTheme({ name: "test", base: "light" });
    // Force an unknown group by casting
    const modified = { ...def, overrides: { animation: {} } } as unknown as ThemeDefinition;
    const report = validateThemeDefinition(modified);
    expect(
      report.diagnostics.some((d) => d.category === "unknown_key" && d.path.includes("animation")),
    ).toBe(true);
  });

  it("includes theme name in diagnostics", () => {
    const def = createTheme({ name: "my-theme", base: "light" });
    const report = validateThemeDefinition(def);
    for (const d of report.diagnostics) {
      expect(d.themeName).toBe("my-theme");
    }
  });

  it("passes valid definition with all fields", () => {
    const def = createTheme({
      name: "full-theme",
      base: "dark",
      description: "Full test",
      defaultDensity: "compact",
      overrides: { color: { interactive: { default: "#0066cc" } } },
      metadata: { version: "1.0" },
    });
    const report = validateThemeDefinition(def);
    expect(report.valid).toBe(true);
  });
});

describe("validateOverrides", () => {
  it("passes for valid overrides", () => {
    const report = validateOverrides({ color: { interactive: { default: "#0066cc" } } }, "test");
    expect(report.valid).toBe(true);
  });

  it("reports unknown override group", () => {
    const report = validateOverrides({ animation: { duration: "200ms" } } as never, "test");
    expect(report.diagnostics.some((d) => d.category === "unknown_key")).toBe(true);
  });

  it("reports unknown color subcategory", () => {
    const report = validateOverrides(
      { color: { accent: { primary: "#ff0000" } } } as never,
      "test",
    );
    expect(
      report.diagnostics.some((d) => d.category === "unknown_key" && d.path.includes("accent")),
    ).toBe(true);
  });

  it("warns on invalid color format", () => {
    const report = validateOverrides({ color: { text: { primary: "not-a-color" } } }, "test");
    expect(report.diagnostics.some((d) => d.category === "invalid_format")).toBe(true);
  });

  it("accepts hex colors", () => {
    const report = validateOverrides({ color: { text: { primary: "#ff0000" } } }, "test");
    expect(report.diagnostics.filter((d) => d.category === "invalid_format")).toEqual([]);
  });

  it("accepts rgba colors", () => {
    const report = validateOverrides({ color: { text: { primary: "rgba(0,0,0,0.5)" } } }, "test");
    expect(report.diagnostics.filter((d) => d.category === "invalid_format")).toEqual([]);
  });

  it("accepts transparent", () => {
    const report = validateOverrides({ color: { background: { surface: "transparent" } } }, "test");
    expect(report.diagnostics.filter((d) => d.category === "invalid_format")).toEqual([]);
  });

  it("accepts css variables in color overrides", () => {
    const report = validateOverrides(
      { color: { text: { primary: "var(--custom-color)" } } },
      "test",
    );
    expect(report.diagnostics.filter((d) => d.category === "invalid_format")).toEqual([]);
  });

  it("reports non-string color values", () => {
    const report = validateOverrides(
      { color: { text: { primary: 42 as unknown as string } } },
      "test",
    );
    expect(report.diagnostics.some((d) => d.category === "invalid_type")).toBe(true);
  });

  it("reports non-object override group", () => {
    const report = validateOverrides({ color: "red" } as never, "test");
    expect(report.diagnostics.some((d) => d.category === "invalid_type")).toBe(true);
  });

  it("rejects dangerous keys (__proto__)", () => {
    const obj = Object.create(null) as Record<string, unknown>;
    obj["__proto__"] = { admin: true };
    const report = validateOverrides(obj, "test");
    expect(report.diagnostics.some((d) => d.path.includes("__proto__"))).toBe(true);
  });

  it("rejects dangerous keys (constructor)", () => {
    const report = validateOverrides({ constructor: {} } as never, "test");
    expect(report.diagnostics.some((d) => d.path.includes("constructor"))).toBe(true);
  });

  it("reports invalid type for non-string/number leaf in spacing", () => {
    const report = validateOverrides(
      { spacing: { inline: { sm: true as unknown as string } } },
      "test",
    );
    expect(report.diagnostics.some((d) => d.category === "invalid_type")).toBe(true);
  });
});

describe("validateResolvedTheme", () => {
  it("passes for a complete resolved theme", async () => {
    const { resolveTheme } = await import("./resolve-theme");
    const def = createTheme({ name: "test", base: "light" });
    const resolved = await resolveTheme({ definition: def });
    const report = validateResolvedTheme(resolved.tokens);
    expect(report.valid).toBe(true);
    expect(report.errorCount).toBe(0);
  });

  it("reports missing required keys", () => {
    const report = validateResolvedTheme({ color: {} }, "incomplete");
    expect(report.valid).toBe(false);
    expect(report.diagnostics.some((d) => d.category === "missing_required")).toBe(true);
  });

  it("reports unknown top-level keys", () => {
    const tokens = {
      color: {},
      typography: {},
      spacing: {},
      control: {},
      elevation: {},
      interaction: {},
      custom: {},
    };
    const report = validateResolvedTheme(tokens, "test");
    expect(
      report.diagnostics.some((d) => d.category === "unknown_key" && d.path === "custom"),
    ).toBe(true);
  });

  it("reports null leaf values", () => {
    const tokens = {
      color: { text: { primary: null } },
      typography: {},
      spacing: {},
      control: {},
      elevation: {},
      interaction: {},
    };
    const report = validateResolvedTheme(tokens, "test");
    expect(
      report.diagnostics.some((d) => d.category === "invalid_value" && d.path.includes("primary")),
    ).toBe(true);
  });

  it("includes theme name in all diagnostics", () => {
    const report = validateResolvedTheme({}, "my-theme");
    for (const d of report.diagnostics) {
      expect(d.themeName).toBe("my-theme");
    }
  });
});

describe("validateThemeName", () => {
  it("passes for valid kebab-case name", () => {
    expect(validateThemeName("acme-brand").valid).toBe(true);
  });

  it("passes for single word", () => {
    expect(validateThemeName("dark").valid).toBe(true);
  });

  it("reports empty name", () => {
    const report = validateThemeName("");
    expect(report.valid).toBe(false);
    expect(report.diagnostics[0]?.category).toBe("missing_required");
  });

  it("warns on uppercase", () => {
    const report = validateThemeName("MyTheme");
    expect(report.diagnostics[0]?.category).toBe("invalid_format");
    expect(report.diagnostics[0]?.suggestion).toBeDefined();
  });

  it("warns on spaces", () => {
    const report = validateThemeName("my theme");
    expect(report.diagnostics[0]?.category).toBe("invalid_format");
  });
});

describe("validateBaseMode", () => {
  it("passes for light", () => {
    expect(validateBaseMode("light").valid).toBe(true);
  });

  it("passes for dark", () => {
    expect(validateBaseMode("dark").valid).toBe(true);
  });

  it("fails for invalid", () => {
    const report = validateBaseMode("sunset");
    expect(report.valid).toBe(false);
    expect(report.diagnostics[0]?.received).toBe("sunset");
  });
});

describe("validateDensityValue", () => {
  it("passes for all valid densities", () => {
    expect(validateDensityValue("comfortable").valid).toBe(true);
    expect(validateDensityValue("standard").valid).toBe(true);
    expect(validateDensityValue("compact").valid).toBe(true);
  });

  it("fails for invalid density", () => {
    const report = validateDensityValue("tiny");
    expect(report.valid).toBe(false);
    expect(report.diagnostics[0]?.received).toBe("tiny");
  });
});

describe("THEME_CONSTANTS", () => {
  it("exposes valid bases", () => {
    expect(THEME_CONSTANTS.validBases).toEqual(["light", "dark"]);
  });

  it("exposes valid densities", () => {
    expect(THEME_CONSTANTS.validDensities).toContain("comfortable");
    expect(THEME_CONSTANTS.validDensities).toContain("standard");
    expect(THEME_CONSTANTS.validDensities).toContain("compact");
  });

  it("exposes valid override groups", () => {
    expect(THEME_CONSTANTS.validOverrideGroups).toContain("color");
    expect(THEME_CONSTANTS.validOverrideGroups).toContain("typography");
  });

  it("exposes name pattern", () => {
    expect(THEME_CONSTANTS.namePattern.test("valid-name")).toBe(true);
    expect(THEME_CONSTANTS.namePattern.test("Invalid")).toBe(false);
  });
});

describe("validation report structure", () => {
  it("counts errors and warnings separately", () => {
    // Name format issue is a warning, base is an error
    const def = {
      name: "BadName",
      base: "invalid" as "light",
      description: "",
      defaultDensity: "comfortable",
      overrides: {},
      metadata: {},
    } as ThemeDefinition;
    const report = validateThemeDefinition(def);
    expect(report.errorCount).toBeGreaterThan(0);
    expect(report.warningCount).toBeGreaterThanOrEqual(0);
    expect(report.errorCount + report.warningCount).toBe(report.diagnostics.length);
  });

  it("every diagnostic has required fields", () => {
    const def = {
      name: "",
      base: "bad" as "light",
      description: "",
      defaultDensity: "bad" as "compact",
      overrides: {},
      metadata: {},
    } as ThemeDefinition;
    const report = validateThemeDefinition(def);
    for (const d of report.diagnostics) {
      expect(d.themeName).toBeDefined();
      expect(d.path).toBeDefined();
      expect(d.category).toBeDefined();
      expect(d.message).toBeDefined();
    }
  });
});
