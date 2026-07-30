import { describe, it, expect } from "vitest";
import { surfaceTokens } from "./surfaces";
import type { SurfaceContracts } from "./surfaces";

const SURFACE_TYPES = ["card", "dialog", "drawer", "menu", "popover", "tooltip", "toast"] as const;

describe("surface and overlay token contracts", () => {
  describe("contract shape", () => {
    it("satisfies SurfaceContracts", () => {
      const _check: SurfaceContracts = surfaceTokens;
      expect(_check).toBeDefined();
    });

    it("has all 7 surface types", () => {
      for (const s of SURFACE_TYPES) {
        expect(surfaceTokens[s]).toBeDefined();
      }
    });
  });

  describe("card", () => {
    it("uses border (not shadow) by default", () => {
      expect(surfaceTokens.card.shadow).toBe("none");
      expect(surfaceTokens.card.border).toBeDefined();
      expect(surfaceTokens.card.border).not.toBe("transparent");
    });

    it("has header and footer borders", () => {
      expect(surfaceTokens.card.headerBorder).toBeDefined();
      expect(surfaceTokens.card.footerBorder).toBeDefined();
    });
  });

  describe("dialog", () => {
    it("has shadow and backdrop", () => {
      expect(surfaceTokens.dialog.shadow).not.toBe("none");
      expect(surfaceTokens.dialog.backdrop).toContain("rgba");
    });

    it("has max dimensions", () => {
      expect(surfaceTokens.dialog.maxWidth).toBeDefined();
      expect(surfaceTokens.dialog.maxHeight).toBeDefined();
    });

    it("uses modal z-index layer", () => {
      expect(surfaceTokens.dialog.zIndex).toBeGreaterThanOrEqual(400);
    });

    it("has transition", () => {
      expect(surfaceTokens.dialog.transition.duration).toBeDefined();
      expect(surfaceTokens.dialog.transition.easing).toBeDefined();
    });
  });

  describe("drawer", () => {
    it("uses overlay z-index (below modal)", () => {
      expect(surfaceTokens.drawer.zIndex).toBeLessThan(surfaceTokens.dialog.zIndex);
    });

    it("has backdrop", () => {
      expect(surfaceTokens.drawer.backdrop).toContain("rgba");
    });
  });

  describe("menu", () => {
    it("uses dropdown z-index", () => {
      expect(surfaceTokens.menu.zIndex).toBeLessThan(surfaceTokens.drawer.zIndex);
    });

    it("has item-level tokens", () => {
      expect(surfaceTokens.menu.itemGap).toBeDefined();
      expect(surfaceTokens.menu.itemPadding).toBeDefined();
      expect(surfaceTokens.menu.itemRadius).toBeDefined();
      expect(surfaceTokens.menu.itemHoverBackground).toBeDefined();
    });
  });

  describe("tooltip", () => {
    it("uses inverse colors (dark bg, light text)", () => {
      expect(surfaceTokens.tooltip.background).toMatch(/^#[0-9a-f]{6}$/);
      expect(surfaceTokens.tooltip.text).toBe("#ffffff");
    });

    it("has compact padding", () => {
      const padRem = parseFloat(surfaceTokens.tooltip.padding);
      expect(padRem).toBeLessThan(1);
    });
  });

  describe("toast", () => {
    it("uses highest z-index layer", () => {
      expect(surfaceTokens.toast.zIndex).toBeGreaterThan(surfaceTokens.dialog.zIndex);
    });

    it("has shadow for elevation", () => {
      expect(surfaceTokens.toast.shadow).not.toBe("none");
    });
  });

  describe("z-index layering order", () => {
    it("menu < drawer < dialog < toast", () => {
      expect(surfaceTokens.menu.zIndex).toBeLessThan(surfaceTokens.drawer.zIndex);
      expect(surfaceTokens.drawer.zIndex).toBeLessThan(surfaceTokens.dialog.zIndex);
      expect(surfaceTokens.dialog.zIndex).toBeLessThan(surfaceTokens.toast.zIndex);
    });
  });

  describe("public import", () => {
    it("surfaceTokens is importable from the package entry point", async () => {
      const tokens = await import("../index");
      expect(tokens.surfaceTokens).toBeDefined();
    });
  });
});
