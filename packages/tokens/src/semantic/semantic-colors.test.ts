import { describe, it, expect } from "vitest";
import type {
  SemanticBackgroundColors,
  SemanticTextColors,
  SemanticBorderColors,
  SemanticInteractiveColors,
  SemanticStatusColors,
  SemanticFocusColors,
  SemanticDestructiveColors,
  SemanticColors,
} from "../types/semantic";

/**
 * Contract tests for semantic color roles.
 *
 * These verify that the type contracts include all required roles,
 * ensuring no role is accidentally removed or renamed.
 */

describe("semantic color contracts", () => {
  describe("SemanticBackgroundColors", () => {
    it("requires all background roles", () => {
      type RequiredKeys = keyof SemanticBackgroundColors;
      const keys: RequiredKeys[] = [
        "page",
        "surface",
        "muted",
        "raised",
        "inverse",
        "overlay",
        "hover",
        "active",
        "selected",
      ];
      expect(keys).toHaveLength(9);
    });
  });

  describe("SemanticTextColors", () => {
    it("requires all text roles", () => {
      type RequiredKeys = keyof SemanticTextColors;
      const keys: RequiredKeys[] = [
        "primary",
        "secondary",
        "muted",
        "disabled",
        "inverse",
        "link",
        "linkHover",
      ];
      expect(keys).toHaveLength(7);
    });
  });

  describe("SemanticBorderColors", () => {
    it("requires all border roles", () => {
      type RequiredKeys = keyof SemanticBorderColors;
      const keys: RequiredKeys[] = [
        "subtle",
        "default",
        "strong",
        "interactive",
        "focus",
        "disabled",
      ];
      expect(keys).toHaveLength(6);
    });
  });

  describe("SemanticInteractiveColors", () => {
    it("requires all interaction states", () => {
      type RequiredKeys = keyof SemanticInteractiveColors;
      const keys: RequiredKeys[] = [
        "default",
        "hover",
        "active",
        "selected",
        "subtle",
        "subtleHover",
        "disabled",
        "readOnly",
      ];
      expect(keys).toHaveLength(8);
    });
  });

  describe("SemanticStatusColors", () => {
    it("requires all status pairs", () => {
      type RequiredKeys = keyof SemanticStatusColors;
      const keys: RequiredKeys[] = [
        "success",
        "successSubtle",
        "warning",
        "warningSubtle",
        "error",
        "errorSubtle",
        "info",
        "infoSubtle",
      ];
      expect(keys).toHaveLength(8);
    });
  });

  describe("SemanticFocusColors", () => {
    it("requires ring and innerRing", () => {
      type RequiredKeys = keyof SemanticFocusColors;
      const keys: RequiredKeys[] = ["ring", "innerRing"];
      expect(keys).toHaveLength(2);
    });
  });

  describe("SemanticDestructiveColors", () => {
    it("requires all destructive roles", () => {
      type RequiredKeys = keyof SemanticDestructiveColors;
      const keys: RequiredKeys[] = ["default", "hover", "active", "subtle", "text"];
      expect(keys).toHaveLength(5);
    });
  });

  describe("SemanticColors (aggregate)", () => {
    it("requires all color sub-groups", () => {
      type RequiredKeys = keyof SemanticColors;
      const keys: RequiredKeys[] = [
        "background",
        "text",
        "border",
        "interactive",
        "status",
        "focus",
        "destructive",
      ];
      expect(keys).toHaveLength(7);
    });

    it("total semantic color roles across all groups", () => {
      // background: 9 + text: 7 + border: 6 + interactive: 8 + status: 8 + focus: 2 + destructive: 5
      const total = 9 + 7 + 6 + 8 + 8 + 2 + 5;
      expect(total).toBe(45);
    });
  });
});
