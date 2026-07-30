import { describe, it, expect } from "vitest";
import { checkContrast, checkAllContrasts, formatFailure } from "./contrast";
import type { ContrastPairing } from "./contrast";
import { lightTheme } from "../themes/light";
import { darkTheme } from "../themes/dark";

// ─── Pairing builders ────────────────────────────────────────────────

function light(
  fg: string,
  bg: string,
  fgLabel: string,
  bgLabel: string,
  required = 4.5,
): ContrastPairing {
  return { fg, bg, fgLabel, bgLabel, required, theme: "light" };
}

function dark(
  fg: string,
  bg: string,
  fgLabel: string,
  bgLabel: string,
  required = 4.5,
): ContrastPairing {
  return { fg, bg, fgLabel, bgLabel, required, theme: "dark" };
}

// ─── Critical Pairings ──────────────────────────────────────────────

const LIGHT_PAIRINGS: ContrastPairing[] = [
  // Text on backgrounds (AA normal text: 4.5:1)
  light(lightTheme.color.text.primary, lightTheme.color.background.page, "text.primary", "bg.page"),
  light(
    lightTheme.color.text.primary,
    lightTheme.color.background.surface,
    "text.primary",
    "bg.surface",
  ),
  light(
    lightTheme.color.text.secondary,
    lightTheme.color.background.page,
    "text.secondary",
    "bg.page",
  ),
  light(
    lightTheme.color.text.secondary,
    lightTheme.color.background.surface,
    "text.secondary",
    "bg.surface",
  ),
  light(lightTheme.color.text.link, lightTheme.color.background.page, "text.link", "bg.page"),
  light(lightTheme.color.text.link, lightTheme.color.background.surface, "text.link", "bg.surface"),

  // Primary action (white text on brand blue)
  light(
    lightTheme.color.destructive.text,
    lightTheme.color.interactive.default,
    "interactive.text(white)",
    "interactive.default",
  ),

  // Destructive action (white text on red)
  light(
    lightTheme.color.destructive.text,
    lightTheme.color.destructive.default,
    "destructive.text",
    "destructive.default",
  ),

  // Status text on subtle backgrounds (AA normal text: 4.5:1)
  light(
    lightTheme.color.status.success.text,
    lightTheme.color.status.success.subtle,
    "success.text",
    "success.subtle",
  ),
  light(
    lightTheme.color.status.warning.text,
    lightTheme.color.status.warning.subtle,
    "warning.text",
    "warning.subtle",
  ),
  light(
    lightTheme.color.status.error.text,
    lightTheme.color.status.error.subtle,
    "error.text",
    "error.subtle",
  ),
  light(
    lightTheme.color.status.info.text,
    lightTheme.color.status.info.subtle,
    "info.text",
    "info.subtle",
  ),

  // Focus ring: non-text contrast (3:1)
  light(
    lightTheme.color.focus.ring,
    lightTheme.color.background.surface,
    "focus.ring",
    "bg.surface",
    3,
  ),

  // Inverse text on inverse background
  light(
    lightTheme.color.text.inverse,
    lightTheme.color.background.inverse,
    "text.inverse",
    "bg.inverse",
  ),
];

const DARK_PAIRINGS: ContrastPairing[] = [
  // Text on backgrounds (AA normal text: 4.5:1)
  dark(darkTheme.color.text.primary, darkTheme.color.background.page, "text.primary", "bg.page"),
  dark(
    darkTheme.color.text.primary,
    darkTheme.color.background.surface,
    "text.primary",
    "bg.surface",
  ),
  dark(
    darkTheme.color.text.secondary,
    darkTheme.color.background.page,
    "text.secondary",
    "bg.page",
  ),
  dark(
    darkTheme.color.text.secondary,
    darkTheme.color.background.surface,
    "text.secondary",
    "bg.surface",
  ),
  dark(darkTheme.color.text.link, darkTheme.color.background.page, "text.link", "bg.page"),
  dark(darkTheme.color.text.link, darkTheme.color.background.surface, "text.link", "bg.surface"),

  // Destructive (white text on red)
  dark(
    darkTheme.color.destructive.text,
    darkTheme.color.destructive.default,
    "destructive.text",
    "destructive.default",
  ),

  // Focus ring: non-text (3:1)
  dark(
    darkTheme.color.focus.ring,
    darkTheme.color.background.surface,
    "focus.ring",
    "bg.surface",
    3,
  ),

  // Inverse text on inverse background
  dark(
    darkTheme.color.text.inverse,
    darkTheme.color.background.inverse,
    "text.inverse",
    "bg.inverse",
  ),
];

// ─── Tests ───────────────────────────────────────────────────────────

describe("color contrast validation", () => {
  describe("light theme — AA compliance", () => {
    for (const pairing of LIGHT_PAIRINGS) {
      it(`${pairing.fgLabel} on ${pairing.bgLabel} ≥ ${pairing.required}:1`, () => {
        const result = checkContrast(pairing);
        if (!result.pass) {
          throw new Error(formatFailure(result));
        }
        expect(result.pass).toBe(true);
      });
    }
  });

  describe("dark theme — AA compliance", () => {
    for (const pairing of DARK_PAIRINGS) {
      it(`${pairing.fgLabel} on ${pairing.bgLabel} ≥ ${pairing.required}:1`, () => {
        const result = checkContrast(pairing);
        if (!result.pass) {
          throw new Error(formatFailure(result));
        }
        expect(result.pass).toBe(true);
      });
    }
  });

  describe("disabled controls (informational — 2:1 readability floor)", () => {
    it("light disabled text on page is perceptible (≥ 2:1)", () => {
      const result = checkContrast(
        light(
          lightTheme.color.text.disabled,
          lightTheme.color.background.page,
          "text.disabled",
          "bg.page",
          2,
        ),
      );
      expect(result.pass).toBe(true);
    });

    it("dark disabled text on surface is perceptible (≥ 2:1)", () => {
      const result = checkContrast(
        dark(
          darkTheme.color.text.disabled,
          darkTheme.color.background.surface,
          "text.disabled",
          "bg.surface",
          2,
        ),
      );
      expect(result.pass).toBe(true);
    });
  });

  describe("batch validation", () => {
    it("all light theme pairings pass", () => {
      const { allPass, failures } = checkAllContrasts(LIGHT_PAIRINGS);
      if (!allPass) {
        const msgs = failures.map(formatFailure).join("\n");
        throw new Error(`Light theme contrast failures:\n${msgs}`);
      }
      expect(allPass).toBe(true);
    });

    it("all dark theme pairings pass", () => {
      const { allPass, failures } = checkAllContrasts(DARK_PAIRINGS);
      if (!allPass) {
        const msgs = failures.map(formatFailure).join("\n");
        throw new Error(`Dark theme contrast failures:\n${msgs}`);
      }
      expect(allPass).toBe(true);
    });
  });

  describe("utility functions", () => {
    it("checkContrast returns structured result", () => {
      const result = checkContrast(light("#000000", "#ffffff", "black", "white"));
      expect(result.ratio).toBeGreaterThan(20);
      expect(result.pass).toBe(true);
      expect(result.theme).toBe("light");
    });

    it("formatFailure produces readable message", () => {
      const result = checkContrast(light("#cccccc", "#ffffff", "gray", "white", 4.5));
      const msg = formatFailure(result);
      expect(msg).toContain("FAIL");
      expect(msg).toContain("gray on white");
      expect(msg).toContain("requires 4.5:1");
    });
  });

  describe("public import", () => {
    it("contrast utilities are importable from the package entry point", async () => {
      const tokens = await import("../index");
      expect(tokens.checkContrast).toBeDefined();
      expect(tokens.checkAllContrasts).toBeDefined();
      expect(tokens.contrastRatio).toBeDefined();
    });
  });
});
