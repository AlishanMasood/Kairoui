import { describe, it, expect } from "vitest";
import { createTheme, validateTheme } from "./create-theme";
import type { CreateThemeInput, ThemeDefinition } from "./types";

describe("createTheme", () => {
  // ─── Minimal Theme ─────────────────────────────────────────────

  describe("minimal theme", () => {
    it("creates a theme with only name and base", () => {
      const theme = createTheme({ name: "test", base: "light" });
      expect(theme.name).toBe("test");
      expect(theme.base).toBe("light");
      expect(theme.description).toBe("");
      expect(theme.defaultDensity).toBe("comfortable");
      expect(theme.overrides).toEqual({});
      expect(theme.metadata).toEqual({});
    });

    it("creates a dark-based theme", () => {
      const theme = createTheme({ name: "night", base: "dark" });
      expect(theme.base).toBe("dark");
    });

    it("trims whitespace from name", () => {
      const theme = createTheme({ name: "  spaced  ", base: "light" });
      expect(theme.name).toBe("spaced");
    });
  });

  // ─── Fully Configured Theme ────────────────────────────────────

  describe("fully configured theme", () => {
    const fullInput: CreateThemeInput = {
      name: "acme",
      base: "light",
      description: "Acme enterprise theme",
      defaultDensity: "standard",
      overrides: {
        color: {
          interactive: { default: "#0066cc", hover: "#0052a3" },
        },
        typography: {
          body: { fontFamily: "Helvetica, sans-serif" },
        },
        spacing: {
          inline: { sm: "0.375rem" },
        },
        elevation: {
          raised: "0 2px 4px rgba(0,0,0,0.15)",
        },
      },
      metadata: {
        author: "Acme Corp",
        version: "1.0.0",
      },
    };

    it("preserves all configured properties", () => {
      const theme = createTheme(fullInput);
      expect(theme.name).toBe("acme");
      expect(theme.base).toBe("light");
      expect(theme.description).toBe("Acme enterprise theme");
      expect(theme.defaultDensity).toBe("standard");
      expect(theme.metadata).toEqual({
        author: "Acme Corp",
        version: "1.0.0",
      });
    });

    it("preserves override structure", () => {
      const theme = createTheme(fullInput);
      expect(theme.overrides.color?.interactive?.["default"]).toBe("#0066cc");
      expect(theme.overrides.typography?.["body"]?.["fontFamily"]).toBe("Helvetica, sans-serif");
    });

    it("accepts compact density", () => {
      const theme = createTheme({
        name: "dense",
        base: "dark",
        defaultDensity: "compact",
      });
      expect(theme.defaultDensity).toBe("compact");
    });

    it("accepts comfortable density", () => {
      const theme = createTheme({
        name: "comfy",
        base: "light",
        defaultDensity: "comfortable",
      });
      expect(theme.defaultDensity).toBe("comfortable");
    });
  });

  // ─── Invalid Input ─────────────────────────────────────────────

  describe("invalid input", () => {
    it("throws for empty name", () => {
      expect(() => createTheme({ name: "", base: "light" })).toThrow("Theme name is required");
    });

    it("throws for whitespace-only name", () => {
      expect(() => createTheme({ name: "   ", base: "light" })).toThrow("Theme name is required");
    });

    it("throws for invalid base", () => {
      expect(() => createTheme({ name: "test", base: "sunset" as "light" })).toThrow(
        'Invalid base theme "sunset"',
      );
    });

    it("throws for invalid density", () => {
      expect(() =>
        createTheme({
          name: "test",
          base: "light",
          defaultDensity: "tiny" as "compact",
        }),
      ).toThrow('Invalid density "tiny"');
    });

    it("throws for unknown override group", () => {
      expect(() =>
        createTheme({
          name: "test",
          base: "light",
          overrides: { animation: {} } as never,
        }),
      ).toThrow('Unknown override group "animation"');
    });

    it("throws for non-string metadata values", () => {
      expect(() =>
        createTheme({
          name: "test",
          base: "light",
          metadata: { count: 42 as unknown as string },
        }),
      ).toThrow('Metadata value for "count" must be a string');
    });

    it("includes all errors in the message", () => {
      try {
        createTheme({
          name: "",
          base: "invalid" as "light",
          defaultDensity: "huge" as "compact",
        });
        expect.unreachable("Should have thrown");
      } catch (err) {
        const msg = (err as Error).message;
        expect(msg).toContain("name");
        expect(msg).toContain("base");
        expect(msg).toContain("defaultDensity");
      }
    });
  });

  // ─── Input Immutability ────────────────────────────────────────

  describe("input immutability", () => {
    it("does not mutate the input object", () => {
      const input: CreateThemeInput = {
        name: "test",
        base: "light",
        overrides: {
          color: { interactive: { default: "#0066cc" } },
        },
        metadata: { version: "1.0.0" },
      };

      const inputCopy = structuredClone(input);
      createTheme(input);
      expect(input).toEqual(inputCopy);
    });

    it("returns a frozen definition", () => {
      const theme = createTheme({ name: "test", base: "light" });
      expect(Object.isFrozen(theme)).toBe(true);
    });

    it("deeply freezes overrides", () => {
      const theme = createTheme({
        name: "test",
        base: "light",
        overrides: {
          color: { interactive: { default: "#0066cc" } },
        },
      });
      expect(Object.isFrozen(theme.overrides)).toBe(true);
      expect(Object.isFrozen(theme.overrides.color)).toBe(true);
    });

    it("deeply freezes metadata", () => {
      const theme = createTheme({
        name: "test",
        base: "light",
        metadata: { version: "1.0.0" },
      });
      expect(Object.isFrozen(theme.metadata)).toBe(true);
    });

    it("does not share references with input", () => {
      const overrides = { color: { interactive: { default: "#0066cc" } } };
      const theme = createTheme({
        name: "test",
        base: "light",
        overrides,
      });
      // Mutating the input after creation should not affect the definition
      overrides.color.interactive.default = "#ff0000";
      expect(theme.overrides.color?.interactive?.["default"]).toBe("#0066cc");
    });
  });

  // ─── Stable Output ─────────────────────────────────────────────

  describe("stable output", () => {
    it("returns identical structure for the same input", () => {
      const input: CreateThemeInput = {
        name: "test",
        base: "light",
        defaultDensity: "standard",
        overrides: { color: { interactive: { default: "#0066cc" } } },
      };

      const a = createTheme(input);
      const b = createTheme(input);
      expect(a).toEqual(b);
    });

    it("returns different references for separate calls", () => {
      const input: CreateThemeInput = { name: "test", base: "light" };
      const a = createTheme(input);
      const b = createTheme(input);
      expect(a).not.toBe(b);
    });
  });

  // ─── Type Inference ────────────────────────────────────────────

  describe("type inference", () => {
    it("return type satisfies ThemeDefinition", () => {
      const theme: ThemeDefinition = createTheme({
        name: "typed",
        base: "dark",
      });
      expect(theme.name).toBe("typed");
    });
  });
});

// ─── validateTheme ─────────────────────────────────────────────────

describe("validateTheme", () => {
  it("returns valid for correct input", () => {
    const result = validateTheme({ name: "ok", base: "light" });
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("returns errors without throwing", () => {
    const result = validateTheme({ name: "", base: "bad" as "light" });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(2);
  });

  it("reports path for each error", () => {
    const result = validateTheme({
      name: "",
      base: "light",
      defaultDensity: "huge" as "compact",
    });
    const paths = result.errors.map((e) => e.path);
    expect(paths).toContain("name");
    expect(paths).toContain("defaultDensity");
  });
});
