import { describe, it, expect } from "vitest";
import {
  tableTokens,
  treeViewTokens,
  timelineTokens,
  calendarTokens,
  emptyStateTokens,
  descriptionListTokens,
  dataTokens,
} from "./data";
import type { DataContracts } from "./data";

describe("data presentation token contracts", () => {
  describe("contract shape", () => {
    it("satisfies DataContracts", () => {
      const _check: DataContracts = dataTokens;
      expect(_check).toBeDefined();
    });

    it("has all 6 contract groups", () => {
      expect(dataTokens.table).toBeDefined();
      expect(dataTokens.treeView).toBeDefined();
      expect(dataTokens.timeline).toBeDefined();
      expect(dataTokens.calendar).toBeDefined();
      expect(dataTokens.emptyState).toBeDefined();
      expect(dataTokens.descriptionList).toBeDefined();
    });
  });

  describe("table", () => {
    it("has header styling", () => {
      expect(tableTokens.headerBackground).toBeDefined();
      expect(tableTokens.headerText).toBeDefined();
      expect(tableTokens.headerFontWeight).toBeDefined();
    });

    it("has cell styling", () => {
      expect(tableTokens.cellText).toBeDefined();
      expect(tableTokens.cellPaddingX).toBeDefined();
      expect(tableTokens.cellPaddingY).toBeDefined();
    });

    it("has row states", () => {
      expect(tableTokens.stripedBackground).toBeDefined();
      expect(tableTokens.hoverBackground).toBeDefined();
      expect(tableTokens.selectedBackground).toBeDefined();
      expect(tableTokens.selectedBorder).toBeDefined();
    });
  });

  describe("treeView", () => {
    it("has text states", () => {
      expect(treeViewTokens.text).toBeDefined();
      expect(treeViewTokens.textHover).toBeDefined();
      expect(treeViewTokens.textSelected).toBeDefined();
      expect(treeViewTokens.textDisabled).toBeDefined();
    });

    it("has indentation and item sizing", () => {
      expect(treeViewTokens.indentSize).toBeDefined();
      expect(treeViewTokens.itemPaddingY).toBeDefined();
      expect(treeViewTokens.itemRadius).toBeDefined();
    });

    it("has expand transition", () => {
      expect(treeViewTokens.expandTransition.duration).toBeDefined();
      expect(treeViewTokens.expandTransition.easing).toBeDefined();
    });
  });

  describe("timeline", () => {
    it("has connector styling", () => {
      expect(timelineTokens.connectorColor).toBeDefined();
      expect(timelineTokens.connectorWidth).toBe("2px");
    });

    it("has indicator styling", () => {
      expect(timelineTokens.indicatorSize).toBeDefined();
      expect(timelineTokens.indicatorBackground).toBeDefined();
      expect(timelineTokens.indicatorRadius).toContain("9999");
    });
  });

  describe("calendar", () => {
    it("has day styling", () => {
      expect(calendarTokens.daySize).toBeDefined();
      expect(calendarTokens.dayText).toBeDefined();
      expect(calendarTokens.dayRadius).toContain("9999");
    });

    it("has today indicator", () => {
      expect(calendarTokens.todayText).toBeDefined();
      expect(calendarTokens.todayBorder).toBeDefined();
    });

    it("has selected state", () => {
      expect(calendarTokens.selectedText).toBeDefined();
      expect(calendarTokens.selectedBackground).toBeDefined();
    });

    it("has outside-month and disabled states", () => {
      expect(calendarTokens.outsideMonthText).toBeDefined();
      expect(calendarTokens.disabledText).toBeDefined();
    });
  });

  describe("emptyState", () => {
    it("has icon, title, and description styling", () => {
      expect(emptyStateTokens.iconSize).toBeDefined();
      expect(emptyStateTokens.iconColor).toBeDefined();
      expect(emptyStateTokens.titleFontSize).toBeDefined();
      expect(emptyStateTokens.descriptionColor).toBeDefined();
    });

    it("has layout spacing", () => {
      expect(emptyStateTokens.gap).toBeDefined();
      expect(emptyStateTokens.padding).toBeDefined();
    });
  });

  describe("descriptionList", () => {
    it("has term and details styling", () => {
      expect(descriptionListTokens.termFontSize).toBeDefined();
      expect(descriptionListTokens.termFontWeight).toBeDefined();
      expect(descriptionListTokens.termColor).toBeDefined();
      expect(descriptionListTokens.detailsColor).toBeDefined();
    });

    it("has spacing", () => {
      expect(descriptionListTokens.gap).toBeDefined();
      expect(descriptionListTokens.itemGap).toBeDefined();
    });
  });

  describe("public import", () => {
    it("data tokens are importable from the package entry point", async () => {
      const tokens = await import("../index");
      expect(tokens.dataTokens).toBeDefined();
    });
  });
});
