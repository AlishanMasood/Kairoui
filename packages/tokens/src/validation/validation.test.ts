import { describe, it, expect } from "vitest";
import {
  validateTokenSchema,
  validateThemeStructure,
  validateDensityStructure,
  validateNoDuplicateCssVars,
  validateNoPrivateLeakage,
  validateOverrideKeys,
  validateStateNames,
  validateSizeNames,
  validateLeafValues,
} from "./index";

const REFERENCE = {
  color: { background: { page: "#fff", surface: "#fff" }, text: { primary: "#000" } },
  spacing: { sm: "0.5rem" },
};

describe("token schema validation", () => {
  describe("missing required tokens", () => {
    it("reports missing top-level key", () => {
      const tokens = {
        color: { background: { page: "#fff", surface: "#fff" }, text: { primary: "#000" } },
      };
      const result = validateTokenSchema(tokens, REFERENCE);
      expect(
        result.errors.some((e) => e.code === "MISSING_REQUIRED_TOKEN" && e.path === "spacing"),
      ).toBe(true);
    });

    it("reports missing nested key", () => {
      const tokens = {
        color: { background: { page: "#fff" }, text: { primary: "#000" } },
        spacing: { sm: "0.5rem" },
      };
      const result = validateTokenSchema(tokens, REFERENCE);
      expect(
        result.errors.some(
          (e) => e.code === "MISSING_REQUIRED_TOKEN" && e.path === "color.background.surface",
        ),
      ).toBe(true);
    });

    it("passes when all keys present", () => {
      const result = validateTokenSchema(REFERENCE, REFERENCE);
      expect(result.valid).toBe(true);
    });
  });

  describe("unknown keys", () => {
    it("reports unknown top-level key", () => {
      const tokens = { ...REFERENCE, unknownGroup: { a: "1" } };
      const result = validateTokenSchema(tokens, REFERENCE);
      expect(
        result.errors.some((e) => e.code === "INVALID_CATEGORY" && e.path === "unknownGroup"),
      ).toBe(true);
    });

    it("reports unknown nested key", () => {
      const tokens = {
        color: {
          background: { page: "#fff", surface: "#fff", extra: "#000" },
          text: { primary: "#000" },
        },
        spacing: { sm: "0.5rem" },
      };
      const result = validateTokenSchema(tokens, REFERENCE);
      expect(result.errors.some((e) => e.path === "color.background.extra")).toBe(true);
    });
  });

  describe("invalid value formats", () => {
    it("reports null leaf value", () => {
      const result = validateLeafValues({ a: null });
      expect(result.errors.some((e) => e.code === "INVALID_TOKEN_VALUE")).toBe(true);
    });

    it("reports undefined leaf value", () => {
      const result = validateLeafValues({ a: undefined });
      expect(result.errors.some((e) => e.code === "INVALID_TOKEN_VALUE")).toBe(true);
    });

    it("reports empty string", () => {
      const result = validateLeafValues({ a: "" });
      expect(result.errors.some((e) => e.code === "INVALID_TOKEN_VALUE")).toBe(true);
    });

    it("passes valid values", () => {
      const result = validateLeafValues({ a: "#fff", b: 400, c: "1rem" });
      expect(result.valid).toBe(true);
    });
  });

  describe("duplicate CSS variables", () => {
    it("detects tokens that produce the same CSS variable", () => {
      // "bg" abbreviation for "background" causes collision
      const tokens = { color: { bg: { page: "#fff" }, background: { page: "#fff" } } };
      const result = validateNoDuplicateCssVars(tokens);
      expect(result.errors.some((e) => e.code === "DUPLICATE_CSS_VARIABLE")).toBe(true);
    });

    it("passes when no duplicates", () => {
      const result = validateNoDuplicateCssVars({ a: "1", b: "2" });
      expect(result.valid).toBe(true);
    });
  });

  describe("invalid theme names", () => {
    it("rejects unknown theme name", () => {
      const result = validateThemeStructure({}, {}, "neon");
      expect(result.errors.some((e) => e.code === "INVALID_THEME_NAME")).toBe(true);
    });

    it("accepts light", () => {
      const result = validateThemeStructure(REFERENCE, REFERENCE, "light");
      expect(result.errors.filter((e) => e.code === "INVALID_THEME_NAME")).toHaveLength(0);
    });

    it("accepts dark", () => {
      const result = validateThemeStructure(REFERENCE, REFERENCE, "dark");
      expect(result.errors.filter((e) => e.code === "INVALID_THEME_NAME")).toHaveLength(0);
    });
  });

  describe("invalid density names", () => {
    it("rejects unknown density name", () => {
      const result = validateDensityStructure({}, {}, "ultra-compact");
      expect(result.errors.some((e) => e.code === "INVALID_DENSITY_NAME")).toBe(true);
    });

    it("accepts comfortable", () => {
      const result = validateDensityStructure(REFERENCE, REFERENCE, "comfortable");
      expect(result.errors.filter((e) => e.code === "INVALID_DENSITY_NAME")).toHaveLength(0);
    });
  });

  describe("unsupported state names", () => {
    it("rejects unknown state", () => {
      const result = validateStateNames({ default: {}, hover: {}, pressed: {} });
      expect(
        result.errors.some((e) => e.code === "INVALID_CATEGORY" && e.path === "states.pressed"),
      ).toBe(true);
    });

    it("accepts all approved states", () => {
      const approved = {
        default: {},
        hover: {},
        active: {},
        focus: {},
        focused: {},
        selected: {},
        disabled: {},
        readOnly: {},
        loading: {},
        dragging: {},
        invalid: {},
        valid: {},
        filled: {},
      };
      const result = validateStateNames(approved);
      expect(result.valid).toBe(true);
    });
  });

  describe("unsupported size names", () => {
    it("rejects unknown size", () => {
      const result = validateSizeNames({ sm: {}, md: {}, huge: {} });
      expect(result.errors.some((e) => e.path === "sizes.huge")).toBe(true);
    });

    it("accepts approved sizes", () => {
      const result = validateSizeNames({ xs: {}, sm: {}, md: {}, lg: {}, xl: {} });
      expect(result.valid).toBe(true);
    });
  });

  describe("private token leakage", () => {
    it("detects underscore-prefixed keys", () => {
      const result = validateNoPrivateLeakage({ color: { _internal: "#000" } });
      expect(result.errors.some((e) => e.code === "NAMING_VIOLATION")).toBe(true);
    });

    it("detects nested private keys", () => {
      const result = validateNoPrivateLeakage({ a: { b: { _secret: "x" } } });
      expect(result.errors.some((e) => e.path === "a.b._secret")).toBe(true);
    });

    it("passes clean tokens", () => {
      const result = validateNoPrivateLeakage({ color: { text: "#000" } });
      expect(result.valid).toBe(true);
    });
  });

  describe("override key validation", () => {
    it("rejects unknown keys in override", () => {
      const base = { color: { text: "#000" } };
      const override = { color: { text: "#111" }, typo: "bad" };
      const result = validateOverrideKeys(override, base);
      expect(result.errors.some((e) => e.path === "typo")).toBe(true);
    });

    it("rejects unknown nested keys", () => {
      const base = { color: { text: "#000" } };
      const override = { color: { text: "#111", bg: "#fff" } };
      const result = validateOverrideKeys(override, base);
      expect(result.errors.some((e) => e.path === "color.bg")).toBe(true);
    });

    it("passes valid override", () => {
      const base = { color: { text: "#000" } };
      const override = { color: { text: "#111" } };
      const result = validateOverrideKeys(override, base);
      expect(result.valid).toBe(true);
    });
  });

  describe("invalid theme structure", () => {
    it("reports missing keys compared to reference", () => {
      const result = validateThemeStructure({ color: {} }, REFERENCE, "light");
      expect(result.errors.some((e) => e.code === "MISSING_REQUIRED_TOKEN")).toBe(true);
    });
  });

  describe("error message quality", () => {
    it("errors include exact path", () => {
      const tokens = {
        color: { background: { page: "#fff" }, text: { primary: "#000" } },
        spacing: { sm: "0.5rem" },
      };
      const result = validateTokenSchema(tokens, REFERENCE);
      const missing = result.errors.find((e) => e.code === "MISSING_REQUIRED_TOKEN");
      expect(missing?.path).toBe("color.background.surface");
    });

    it("errors include actionable message", () => {
      const result = validateStateNames({ invalid_state: {} });
      const e = result.errors[0];
      expect(e?.message).toContain("Approved states");
    });

    it("errors include expected/received where applicable", () => {
      const result = validateDensityStructure({}, {}, "invalid");
      const e = result.errors.find((e) => e.code === "INVALID_DENSITY_NAME");
      expect(e?.expected).toBeDefined();
      expect(e?.received).toBe("invalid");
    });
  });

  describe("real theme validation", () => {
    it("light theme passes schema validation against itself", async () => {
      const { lightTheme } = await import("../themes/light");
      const themeRecord = lightTheme as unknown as Record<string, unknown>;
      const result = validateTokenSchema(themeRecord, themeRecord);
      expect(result.valid).toBe(true);
    });

    it("light theme has no private token leakage", async () => {
      const { lightTheme } = await import("../themes/light");
      const result = validateNoPrivateLeakage(lightTheme as unknown as Record<string, unknown>);
      expect(result.valid).toBe(true);
    });
  });

  describe("public import", () => {
    it("validation functions are importable from the package entry point", async () => {
      const tokens = await import("../index");
      expect(tokens.validateTokenSchema).toBeDefined();
      expect(tokens.validateThemeStructure).toBeDefined();
      expect(tokens.validateNoDuplicateCssVars).toBeDefined();
      expect(tokens.validateNoPrivateLeakage).toBeDefined();
    });
  });
});
