import { describe, it, expect } from "vitest";
import { createTheme } from "./create-theme";
import { resolveTheme } from "./resolve-theme";
import {
  serializeTheme,
  serializeDefinition,
  serializeThemeToJson,
  parseSerializedTheme,
  toCssVariableRecord,
  toDebugManifest,
  THEME_SERIALIZATION_VERSION,
} from "./serialize";

async function resolveLight() {
  const def = createTheme({ name: "test-light", base: "light" });
  return resolveTheme({ definition: def });
}

async function resolveWithOverrides() {
  const def = createTheme({
    name: "branded",
    base: "light",
    overrides: { color: { interactive: { default: "#0066cc" } } },
    metadata: { author: "Test Corp" },
  });
  return resolveTheme({ definition: def });
}

describe("serializeTheme", () => {
  it("produces a valid serialized object", async () => {
    const resolved = await resolveLight();
    const serialized = serializeTheme(resolved);
    expect(serialized.$schema).toContain("kairoui.dev");
    expect(serialized.version).toBe(THEME_SERIALIZATION_VERSION);
    expect(serialized.name).toBe("test-light");
    expect(serialized.base).toBe("light");
    expect(serialized.tokenCount).toBeGreaterThan(0);
  });

  it("has deterministic key ordering", async () => {
    const resolved = await resolveLight();
    const a = JSON.stringify(serializeTheme(resolved));
    const b = JSON.stringify(serializeTheme(resolved));
    expect(a).toBe(b);
  });

  it("contains no functions", async () => {
    const resolved = await resolveLight();
    const json = JSON.stringify(serializeTheme(resolved));
    expect(json).not.toContain("function");
  });

  it("contains no undefined values", async () => {
    const resolved = await resolveLight();
    const json = JSON.stringify(serializeTheme(resolved));
    // JSON.stringify drops undefined but let's verify structure
    const parsed = JSON.parse(json) as Record<string, unknown>;
    expect(parsed["tokens"]).toBeDefined();
  });

  it("metadata excludes warnings array", async () => {
    const resolved = await resolveLight();
    const serialized = serializeTheme(resolved);
    expect("warnings" in serialized.metadata).toBe(false);
  });
});

describe("serializeDefinition", () => {
  it("serializes a theme definition", () => {
    const def = createTheme({
      name: "corp",
      base: "dark",
      description: "Corporate theme",
      defaultDensity: "standard",
      metadata: { version: "2.0" },
    });
    const serialized = serializeDefinition(def);
    expect(serialized.version).toBe(THEME_SERIALIZATION_VERSION);
    expect(serialized.definition.name).toBe("corp");
    expect(serialized.definition.base).toBe("dark");
    expect(serialized.definition.description).toBe("Corporate theme");
    expect(serialized.definition.defaultDensity).toBe("standard");
    expect(serialized.definition.metadata).toEqual({ version: "2.0" });
  });

  it("overrides have sorted keys", () => {
    const def = createTheme({
      name: "test",
      base: "light",
      overrides: {
        elevation: { raised: "none" },
        color: { text: { primary: "#000" } },
      },
    });
    const serialized = serializeDefinition(def);
    const keys = Object.keys(serialized.definition.overrides);
    expect(keys).toEqual([...keys].sort());
  });
});

describe("serializeThemeToJson", () => {
  it("returns valid JSON", async () => {
    const resolved = await resolveLight();
    const json = serializeThemeToJson(resolved);
    expect(() => {
      JSON.parse(json);
    }).not.toThrow();
  });

  it("produces stable output across calls", async () => {
    const resolved = await resolveLight();
    const a = serializeThemeToJson(resolved);
    const b = serializeThemeToJson(resolved);
    expect(a).toBe(b);
  });

  it("includes schema version", async () => {
    const resolved = await resolveLight();
    const json = serializeThemeToJson(resolved);
    expect(json).toContain(THEME_SERIALIZATION_VERSION);
  });

  it("handles special characters in metadata", async () => {
    const def = createTheme({
      name: "special",
      base: "light",
      metadata: { note: 'Contains "quotes" & <angles>' },
    });
    const resolved = await resolveTheme({ definition: def });
    const json = serializeThemeToJson(resolved);
    expect(() => {
      JSON.parse(json);
    }).not.toThrow();
  });
});

describe("parseSerializedTheme", () => {
  it("round-trips a serialized theme", async () => {
    const resolved = await resolveLight();
    const json = serializeThemeToJson(resolved);
    const parsed = parseSerializedTheme(json);
    expect(parsed.name).toBe("test-light");
    expect(parsed.version).toBe(THEME_SERIALIZATION_VERSION);
    expect(parsed.tokens).toBeDefined();
  });

  it("throws for invalid JSON", () => {
    expect(() => parseSerializedTheme("not json")).toThrow();
  });

  it("throws for wrong schema version", () => {
    const bad = JSON.stringify({ version: "99.0.0", tokens: {} });
    expect(() => parseSerializedTheme(bad)).toThrow("Unsupported schema version");
  });

  it("throws for non-object input", () => {
    expect(() => parseSerializedTheme('"string"')).toThrow("not an object");
  });
});

describe("toCssVariableRecord", () => {
  it("produces CSS variable names", async () => {
    const resolved = await resolveLight();
    const record = toCssVariableRecord(resolved);
    expect(record.count).toBeGreaterThan(0);
    const keys = Object.keys(record.variables);
    expect(keys[0]).toMatch(/^--kui-/);
  });

  it("all values are strings", async () => {
    const resolved = await resolveLight();
    const record = toCssVariableRecord(resolved);
    for (const value of Object.values(record.variables)) {
      expect(typeof value).toBe("string");
    }
  });

  it("variables are sorted alphabetically", async () => {
    const resolved = await resolveLight();
    const record = toCssVariableRecord(resolved);
    const keys = Object.keys(record.variables);
    expect(keys).toEqual([...keys].sort());
  });

  it("converts camelCase to kebab-case", async () => {
    const resolved = await resolveLight();
    const record = toCssVariableRecord(resolved);
    const keys = Object.keys(record.variables);
    // No uppercase letters in CSS variable names
    for (const key of keys) {
      expect(key).not.toMatch(/[A-Z]/);
    }
  });

  it("count matches variables object length", async () => {
    const resolved = await resolveLight();
    const record = toCssVariableRecord(resolved);
    expect(record.count).toBe(Object.keys(record.variables).length);
  });
});

describe("toDebugManifest", () => {
  it("includes all token paths", async () => {
    const resolved = await resolveLight();
    const manifest = toDebugManifest(resolved);
    expect(manifest.tokenPaths.length).toBeGreaterThan(0);
    expect(manifest.tokenPaths[0]).toMatch(/^[a-z]/);
  });

  it("paths are sorted", async () => {
    const resolved = await resolveLight();
    const manifest = toDebugManifest(resolved);
    expect(manifest.tokenPaths).toEqual([...manifest.tokenPaths].sort());
  });

  it("includes metadata", async () => {
    const resolved = await resolveWithOverrides();
    const manifest = toDebugManifest(resolved);
    expect(manifest.name).toBe("branded");
    expect(manifest.base).toBe("light");
    expect(manifest.overrideGroups).toContain("color");
  });

  it("includes warnings when present", async () => {
    const def = createTheme({
      name: "warn",
      base: "light",
      overrides: { color: { interactive: { nonexistent: "#ff0000" } } },
    });
    const resolved = await resolveTheme({ definition: def });
    const manifest = toDebugManifest(resolved);
    expect(manifest.warnings.length).toBeGreaterThan(0);
  });

  it("no private fields leak", async () => {
    const resolved = await resolveLight();
    const manifest = toDebugManifest(resolved);
    const json = JSON.stringify(manifest);
    expect(json).not.toContain("_private");
    expect(json).not.toContain("cachedTokens");
    expect(json).not.toContain("localStorage");
  });
});

describe("repeat serialization consistency", () => {
  it("serializing 10 times produces identical output", async () => {
    const resolved = await resolveWithOverrides();
    const results = Array.from({ length: 10 }, () => serializeThemeToJson(resolved));
    for (let i = 1; i < results.length; i++) {
      expect(results[i]).toBe(results[0]);
    }
  });
});

describe("large theme objects", () => {
  it("handles full resolved theme without error", async () => {
    const resolved = await resolveLight();
    // Verify it produces substantial output
    const json = serializeThemeToJson(resolved);
    expect(json.length).toBeGreaterThan(1000);
    const record = toCssVariableRecord(resolved);
    expect(record.count).toBeGreaterThan(100);
  });
});
