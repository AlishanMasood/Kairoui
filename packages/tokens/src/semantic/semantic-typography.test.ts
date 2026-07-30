import { describe, it, expect } from "vitest";
import type { TypographyRole, NumericTypographyRole, SemanticTypography } from "../types/semantic";

describe("semantic typography contracts", () => {
  describe("TypographyRole", () => {
    it("requires all typography properties", () => {
      type RequiredKeys = keyof TypographyRole;
      const keys: RequiredKeys[] = [
        "fontFamily",
        "fontSize",
        "lineHeight",
        "fontWeight",
        "letterSpacing",
      ];
      expect(keys).toHaveLength(5);
    });
  });

  describe("NumericTypographyRole", () => {
    it("extends TypographyRole with fontVariantNumeric", () => {
      type RequiredKeys = keyof NumericTypographyRole;
      const keys: RequiredKeys[] = [
        "fontFamily",
        "fontSize",
        "lineHeight",
        "fontWeight",
        "letterSpacing",
        "fontVariantNumeric",
      ];
      expect(keys).toHaveLength(6);
    });
  });

  describe("SemanticTypography", () => {
    it("requires all 12 typography roles", () => {
      type RequiredKeys = keyof SemanticTypography;
      const keys: RequiredKeys[] = [
        "display",
        "pageTitle",
        "sectionTitle",
        "componentTitle",
        "body",
        "bodyStrong",
        "label",
        "metadata",
        "caption",
        "code",
        "numeric",
        "numericEmphasized",
      ];
      expect(keys).toHaveLength(12);
    });
  });
});
