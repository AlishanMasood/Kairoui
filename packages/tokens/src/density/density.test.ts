import { describe, it, expect } from "vitest";
import { comfortable, standard, compact, densities } from "./index";
import type { DensityTokens } from "./index";
import type { DensityName } from "../types/theme";

function getLeafKeys(obj: object, prefix = ""): string[] {
  const keys: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (typeof v === "object" && v !== null) {
      keys.push(...getLeafKeys(v as object, path));
    } else {
      keys.push(path);
    }
  }
  return keys.sort();
}

describe("density token system", () => {
  describe("all modes satisfy DensityTokens", () => {
    it("comfortable satisfies contract", () => {
      const _check: DensityTokens = comfortable;
      expect(_check).toBeDefined();
    });

    it("standard satisfies contract", () => {
      const _check: DensityTokens = standard;
      expect(_check).toBeDefined();
    });

    it("compact satisfies contract", () => {
      const _check: DensityTokens = compact;
      expect(_check).toBeDefined();
    });
  });

  describe("key symmetry", () => {
    it("all modes have identical key structure", () => {
      const comfortableKeys = getLeafKeys(comfortable);
      const standardKeys = getLeafKeys(standard);
      const compactKeys = getLeafKeys(compact);
      expect(standardKeys).toEqual(comfortableKeys);
      expect(compactKeys).toEqual(comfortableKeys);
    });
  });

  describe("densities map", () => {
    it("contains all three modes", () => {
      const names: DensityName[] = ["comfortable", "standard", "compact"];
      for (const name of names) {
        expect(densities[name]).toBeDefined();
      }
    });
  });

  describe("relative sizing (compact < standard < comfortable)", () => {
    it("control.height.md decreases across densities", () => {
      const comfHeight = parseFloat(comfortable.control.height.md);
      const stdHeight = parseFloat(standard.control.height.md);
      const compactHeight = parseFloat(compact.control.height.md);
      expect(stdHeight).toBeLessThanOrEqual(comfHeight);
      expect(compactHeight).toBeLessThanOrEqual(stdHeight);
    });

    it("form.fieldGap decreases across densities", () => {
      const comfGap = parseFloat(comfortable.spacing.form.fieldGap);
      const stdGap = parseFloat(standard.spacing.form.fieldGap);
      const compactGap = parseFloat(compact.spacing.form.fieldGap);
      expect(stdGap).toBeLessThanOrEqual(comfGap);
      expect(compactGap).toBeLessThanOrEqual(stdGap);
    });

    it("content.cardPadding decreases across densities", () => {
      const comfPad = parseFloat(comfortable.spacing.content.cardPadding);
      const stdPad = parseFloat(standard.spacing.content.cardPadding);
      const compactPad = parseFloat(compact.spacing.content.cardPadding);
      expect(stdPad).toBeLessThanOrEqual(comfPad);
      expect(compactPad).toBeLessThanOrEqual(stdPad);
    });
  });

  describe("accessibility", () => {
    it("compact control heights meet WCAG minimum touch target (24px = 1.5rem)", () => {
      const minRem = 1.5;
      expect(parseFloat(compact.control.height.xs)).toBeGreaterThanOrEqual(minRem);
      expect(parseFloat(compact.control.height.sm)).toBeGreaterThanOrEqual(minRem);
      expect(parseFloat(compact.control.height.md)).toBeGreaterThanOrEqual(minRem);
    });
  });

  describe("page/section spacing unchanged across densities", () => {
    it("section.gap is the same in all modes", () => {
      expect(standard.spacing.section.gap).toBe(comfortable.spacing.section.gap);
      expect(compact.spacing.section.gap).toBe(comfortable.spacing.section.gap);
    });

    it("page.gutter is the same in all modes", () => {
      expect(standard.spacing.page.gutter).toBe(comfortable.spacing.page.gutter);
      expect(compact.spacing.page.gutter).toBe(comfortable.spacing.page.gutter);
    });
  });

  describe("public import", () => {
    it("density exports are importable from the package entry point", async () => {
      const tokens = await import("../index");
      expect(tokens.comfortable).toBeDefined();
      expect(tokens.standard).toBeDefined();
      expect(tokens.compact).toBeDefined();
      expect(tokens.densities).toBeDefined();
    });
  });
});
