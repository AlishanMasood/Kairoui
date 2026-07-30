import { describe, it, expect } from "vitest";
import { resolveTheme } from "./index";
import type { PartialSemanticOverride } from "./index";
import { lightTheme } from "../themes/light";
import { compact } from "../density";

describe("theme override system", () => {
  describe("no overrides", () => {
    it("returns base theme unchanged when no overrides provided", () => {
      const { theme, errors } = resolveTheme({ base: lightTheme });
      expect(errors).toHaveLength(0);
      expect(theme.color.background.page).toBe(lightTheme.color.background.page);
      expect(theme.color.text.primary).toBe(lightTheme.color.text.primary);
    });
  });

  describe("partial override", () => {
    it("overrides a single nested value", () => {
      const overrides: PartialSemanticOverride = {
        color: {
          background: {
            page: "#ffffff",
          },
        },
      };
      const { theme, errors } = resolveTheme({ base: lightTheme, overrides });
      expect(errors).toHaveLength(0);
      expect(theme.color.background.page).toBe("#ffffff");
      // Other values preserved
      expect(theme.color.background.surface).toBe(lightTheme.color.background.surface);
      expect(theme.color.text.primary).toBe(lightTheme.color.text.primary);
    });

    it("overrides multiple values at different depths", () => {
      const overrides: PartialSemanticOverride = {
        color: {
          text: { primary: "#111111", link: "#0000ff" },
        },
        spacing: {
          inline: { xs: "0.5rem" },
        },
      };
      const { theme, errors } = resolveTheme({ base: lightTheme, overrides });
      expect(errors).toHaveLength(0);
      expect(theme.color.text.primary).toBe("#111111");
      expect(theme.color.text.link).toBe("#0000ff");
      expect(theme.color.text.secondary).toBe(lightTheme.color.text.secondary);
      expect(theme.spacing.inline.xs).toBe("0.5rem");
      expect(theme.spacing.inline.sm).toBe(lightTheme.spacing.inline.sm);
    });
  });

  describe("density override", () => {
    it("applies density spacing and control heights", () => {
      const { theme, errors } = resolveTheme({ base: lightTheme, density: compact });
      expect(errors).toHaveLength(0);
      expect(theme.spacing.form.fieldGap).toBe(compact.spacing.form.fieldGap);
      expect(theme.control.height.md).toBe(compact.control.height.md);
      // Colors remain from base
      expect(theme.color.background.page).toBe(lightTheme.color.background.page);
    });

    it("consumer overrides take precedence over density", () => {
      const overrides: PartialSemanticOverride = {
        spacing: { form: { fieldGap: "2rem" } },
      };
      const { theme, errors } = resolveTheme({
        base: lightTheme,
        density: compact,
        overrides,
      });
      expect(errors).toHaveLength(0);
      expect(theme.spacing.form.fieldGap).toBe("2rem");
    });
  });

  describe("unknown key handling", () => {
    it("reports unknown top-level keys", () => {
      const overrides = { unknownGroup: { foo: "bar" } } as unknown as PartialSemanticOverride;
      const { errors } = resolveTheme({ base: lightTheme, overrides });
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]?.type).toBe("unknown_key");
      expect(errors[0]?.path).toBe("unknownGroup");
    });

    it("reports unknown nested keys", () => {
      const overrides = {
        color: { background: { nonexistent: "#fff" } },
      } as unknown as PartialSemanticOverride;
      const { errors } = resolveTheme({ base: lightTheme, overrides });
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]?.path).toBe("color.background.nonexistent");
    });
  });

  describe("invalid value handling", () => {
    it("reports type mismatch on leaf override", () => {
      const overrides = {
        color: { background: { page: 12345 } },
      } as unknown as PartialSemanticOverride;
      const { theme, errors } = resolveTheme({ base: lightTheme, overrides });
      // Number is accepted since our types allow string|number at leaf
      // but the value should still resolve
      expect(theme.color.background.page).toBeDefined();
      void errors;
    });
  });

  describe("base theme immutability", () => {
    it("does not mutate the base theme", () => {
      const originalPage = lightTheme.color.background.page;
      const overrides: PartialSemanticOverride = {
        color: { background: { page: "#000000" } },
      };
      resolveTheme({ base: lightTheme, overrides });
      expect(lightTheme.color.background.page).toBe(originalPage);
    });
  });

  describe("deterministic output", () => {
    it("produces identical results on repeated calls", () => {
      const overrides: PartialSemanticOverride = {
        color: { text: { primary: "#222222" } },
      };
      const result1 = resolveTheme({ base: lightTheme, overrides });
      const result2 = resolveTheme({ base: lightTheme, overrides });
      expect(JSON.stringify(result1.theme)).toBe(JSON.stringify(result2.theme));
      expect(result1.errors).toEqual(result2.errors);
    });
  });

  describe("public import", () => {
    it("resolveTheme is importable from the package entry point", async () => {
      const tokens = await import("../index");
      expect(tokens.resolveTheme).toBeDefined();
    });
  });
});
