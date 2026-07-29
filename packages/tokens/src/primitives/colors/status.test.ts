import { describe, it, expect } from "vitest";
import { green } from "./green";
import { red } from "./red";
import { orange } from "./orange";
import { teal } from "./teal";
import { assertValidColorScale, contrastRatio } from "./color-test-utils";

const WHITE = "#ffffff";
const DARK_BG = "#1e2433"; // neutral.900

describe("status color scales", () => {
  describe("green (success)", () => {
    it("is a valid color scale", () => {
      assertValidColorScale(green, "green");
    });

    it("step 700 on white meets WCAG AA (≥ 4.5:1)", () => {
      expect(contrastRatio(green["700"], WHITE)).toBeGreaterThanOrEqual(4.5);
    });

    it("step 400 on dark background meets WCAG AA for large text (≥ 3:1)", () => {
      expect(contrastRatio(green["400"], DARK_BG)).toBeGreaterThanOrEqual(3);
    });
  });

  describe("red (danger)", () => {
    it("is a valid color scale", () => {
      assertValidColorScale(red, "red");
    });

    it("step 600 on white meets WCAG AA (≥ 4.5:1)", () => {
      expect(contrastRatio(red["600"], WHITE)).toBeGreaterThanOrEqual(4.5);
    });

    it("step 700 on white meets WCAG AA (≥ 4.5:1)", () => {
      expect(contrastRatio(red["700"], WHITE)).toBeGreaterThanOrEqual(4.5);
    });

    it("step 400 on dark background meets WCAG AA for large text (≥ 3:1)", () => {
      expect(contrastRatio(red["400"], DARK_BG)).toBeGreaterThanOrEqual(3);
    });
  });

  describe("orange (warning)", () => {
    it("is a valid color scale", () => {
      assertValidColorScale(orange, "orange");
    });

    it("step 700 on white meets WCAG AA (≥ 4.5:1)", () => {
      expect(contrastRatio(orange["700"], WHITE)).toBeGreaterThanOrEqual(4.5);
    });

    it("step 400 on dark background meets WCAG AA for large text (≥ 3:1)", () => {
      expect(contrastRatio(orange["400"], DARK_BG)).toBeGreaterThanOrEqual(3);
    });
  });

  describe("teal (information)", () => {
    it("is a valid color scale", () => {
      assertValidColorScale(teal, "teal");
    });

    it("step 700 on white meets WCAG AA (≥ 4.5:1)", () => {
      expect(contrastRatio(teal["700"], WHITE)).toBeGreaterThanOrEqual(4.5);
    });

    it("step 400 on dark background meets WCAG AA for large text (≥ 3:1)", () => {
      expect(contrastRatio(teal["400"], DARK_BG)).toBeGreaterThanOrEqual(3);
    });
  });

  describe("public imports", () => {
    it("all status colors are importable from the package entry point", async () => {
      const tokens = await import("../../index");
      expect(tokens.green).toBeDefined();
      expect(tokens.red).toBeDefined();
      expect(tokens.orange).toBeDefined();
      expect(tokens.teal).toBeDefined();
    });
  });
});
