import { describe, it, expect } from "vitest";
import {
  activeRail,
  tabsTokens,
  breadcrumbsTokens,
  paginationTokens,
  menuItemTokens,
  badgeTokens,
  statusBadgeTokens,
  alertTokens,
  navigationTokens,
} from "./navigation";
import type { NavigationContracts } from "./navigation";

const STATUS_VARIANTS = ["success", "warning", "error", "info"] as const;

describe("navigation and status token contracts", () => {
  describe("contract shape", () => {
    it("satisfies NavigationContracts", () => {
      const _check: NavigationContracts = navigationTokens;
      expect(_check).toBeDefined();
    });

    it("has all 8 contract groups", () => {
      expect(navigationTokens.activeRail).toBeDefined();
      expect(navigationTokens.tabs).toBeDefined();
      expect(navigationTokens.breadcrumbs).toBeDefined();
      expect(navigationTokens.pagination).toBeDefined();
      expect(navigationTokens.menuItem).toBeDefined();
      expect(navigationTokens.badge).toBeDefined();
      expect(navigationTokens.statusBadge).toBeDefined();
      expect(navigationTokens.alert).toBeDefined();
    });
  });

  describe("Kairo Active Rail", () => {
    it("has thickness, color, radius, offset, transition", () => {
      expect(activeRail.thickness).toBe("2px");
      expect(activeRail.color).toMatch(/^#/);
      expect(activeRail.radius).toBeDefined();
      expect(activeRail.offset).toBeDefined();
      expect(activeRail.transition.duration).toBeDefined();
      expect(activeRail.transition.easing).toBeDefined();
    });
  });

  describe("tabs", () => {
    it("has text states", () => {
      expect(tabsTokens.text).toBeDefined();
      expect(tabsTokens.textHover).toBeDefined();
      expect(tabsTokens.textActive).toBeDefined();
      expect(tabsTokens.textDisabled).toBeDefined();
    });

    it("includes the active rail", () => {
      expect(tabsTokens.rail).toBeDefined();
      expect(tabsTokens.rail.thickness).toBe("2px");
    });

    it("has focus ring", () => {
      expect(tabsTokens.focusRing.width).toBe("2px");
    });
  });

  describe("breadcrumbs", () => {
    it("has text, current, hover, and separator", () => {
      expect(breadcrumbsTokens.text).toBeDefined();
      expect(breadcrumbsTokens.textCurrent).toBeDefined();
      expect(breadcrumbsTokens.textHover).toBeDefined();
      expect(breadcrumbsTokens.separator.color).toBeDefined();
      expect(breadcrumbsTokens.separator.gap).toBeDefined();
    });
  });

  describe("pagination", () => {
    it("has active and hover states", () => {
      expect(paginationTokens.backgroundHover).toBeDefined();
      expect(paginationTokens.backgroundActive).toBeDefined();
      expect(paginationTokens.textActive).toBeDefined();
    });

    it("has disabled opacity", () => {
      expect(parseFloat(paginationTokens.disabledOpacity)).toBeLessThan(1);
    });
  });

  describe("menu item", () => {
    it("has standard and destructive colors", () => {
      expect(menuItemTokens.text).toBeDefined();
      expect(menuItemTokens.destructiveText).toBeDefined();
      expect(menuItemTokens.destructiveIcon).toBeDefined();
    });

    it("has shortcut color", () => {
      expect(menuItemTokens.shortcutColor).toBeDefined();
    });
  });

  describe("badge", () => {
    it("has default and outline variants", () => {
      expect(badgeTokens.default).toBeDefined();
      expect(badgeTokens.outline).toBeDefined();
    });

    it("uses pill radius", () => {
      expect(badgeTokens.default.radius).toContain("9999");
    });
  });

  describe("status badge", () => {
    it("has a dot indicator (shape, not just color)", () => {
      expect(statusBadgeTokens.dot.size).toBeDefined();
      expect(statusBadgeTokens.dot.radius).toBeDefined();
    });

    it("has all 5 status variants", () => {
      expect(statusBadgeTokens.variants.success).toBeDefined();
      expect(statusBadgeTokens.variants.warning).toBeDefined();
      expect(statusBadgeTokens.variants.error).toBeDefined();
      expect(statusBadgeTokens.variants.info).toBeDefined();
      expect(statusBadgeTokens.variants.neutral).toBeDefined();
    });

    it.each([...STATUS_VARIANTS, "neutral" as const])(
      "variant %s has dotColor, textColor, background, border",
      (variant) => {
        const v = statusBadgeTokens.variants[variant];
        expect(v.dotColor).toBeDefined();
        expect(v.textColor).toBeDefined();
        expect(v.background).toBeDefined();
        expect(v.border).toBeDefined();
      },
    );
  });

  describe("alert", () => {
    it.each(STATUS_VARIANTS)("variant %s has background, text, border, icon", (variant) => {
      const v = alertTokens.variants[variant];
      expect(v.background).toBeDefined();
      expect(v.text).toBeDefined();
      expect(v.border).toBeDefined();
      expect(v.icon).toBeDefined();
    });

    it("has icon size for non-color indicator", () => {
      expect(alertTokens.iconSize).toBeDefined();
    });
  });

  describe("public import", () => {
    it("navigation tokens are importable from the package entry point", async () => {
      const tokens = await import("../index");
      expect(tokens.navigationTokens).toBeDefined();
      expect(tokens.activeRail).toBeDefined();
    });
  });
});
