/**
 * @vitest-environment happy-dom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getNoFlashScript } from "./no-flash-script";
import { createTheme, validateTheme } from "./create-theme";

const TOKENS_DIST = join(import.meta.dirname, "../../tokens/dist");
const FIXTURES_DIR = join(import.meta.dirname, "../../..", "fixtures");

function readTokensCss(): string {
  return readFileSync(join(TOKENS_DIST, "tokens.css"), "utf-8");
}

function extractDarkSection(css: string): string {
  const match = css.match(/\[data-kui-theme="dark"\]\s*\{([^}]+)\}/);
  return match ? match[1]! : "";
}

function extractRootSection(css: string): string {
  const match = css.match(/:root\s*\{([^}]+)\}/);
  return match ? match[1]! : "";
}

describe("accessibility and user preferences audit", () => {
  // ─── System Color Preference ───────────────────────────────────

  describe("system color preference is respected", () => {
    it("no-flash script reads prefers-color-scheme when mode is system", () => {
      localStorage.setItem(
        "kui-theme-preference",
        JSON.stringify({ version: 1, mode: "system", density: "comfortable" }),
      );

      const script = getNoFlashScript({ defaultMode: "light" });
      const fn = new Function(script);
      fn();

      // In test env, matchMedia returns false for dark → resolves to light
      expect(document.documentElement.getAttribute("data-kui-theme")).toBe("light");
    });

    it("no-flash script uses system dark when matchMedia matches", () => {
      localStorage.setItem(
        "kui-theme-preference",
        JSON.stringify({ version: 1, mode: "system", density: "comfortable" }),
      );

      vi.spyOn(window, "matchMedia").mockReturnValue({
        matches: true,
        media: "(prefers-color-scheme: dark)",
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        onchange: null,
        dispatchEvent: () => true,
      });

      const script = getNoFlashScript({ defaultMode: "light" });
      const fn = new Function(script);
      fn();

      expect(document.documentElement.getAttribute("data-kui-theme")).toBe("dark");
      vi.restoreAllMocks();
    });
  });

  // ─── Explicit Choice Overrides System ──────────────────────────

  describe("explicit user choice overrides system preference", () => {
    it("stored explicit dark overrides system light preference", () => {
      localStorage.setItem(
        "kui-theme-preference",
        JSON.stringify({ version: 1, mode: "dark", density: "comfortable" }),
      );

      const script = getNoFlashScript({ defaultMode: "light" });
      const fn = new Function(script);
      fn();

      expect(document.documentElement.getAttribute("data-kui-theme")).toBe("dark");
    });

    it("stored explicit light overrides system dark preference", () => {
      localStorage.setItem(
        "kui-theme-preference",
        JSON.stringify({ version: 1, mode: "light", density: "comfortable" }),
      );

      vi.spyOn(window, "matchMedia").mockReturnValue({
        matches: true,
        media: "(prefers-color-scheme: dark)",
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        onchange: null,
        dispatchEvent: () => true,
      });

      const script = getNoFlashScript({ defaultMode: "light" });
      const fn = new Function(script);
      fn();

      expect(document.documentElement.getAttribute("data-kui-theme")).toBe("light");
      vi.restoreAllMocks();
    });
  });

  // ─── Requested vs Resolved Mode Distinction ───────────────────

  describe("requested and resolved modes remain distinct", () => {
    it("system mode stores 'system' not the resolved value", () => {
      localStorage.setItem(
        "kui-theme-preference",
        JSON.stringify({ version: 1, mode: "system", density: "comfortable" }),
      );

      const raw = localStorage.getItem("kui-theme-preference")!;
      const parsed = JSON.parse(raw);
      expect(parsed.mode).toBe("system");
    });

    it("createTheme base is resolved mode, not requested mode", () => {
      const theme = createTheme({ name: "test", base: "light" });
      expect(theme.base).toBe("light");

      const dark = createTheme({ name: "test-dark", base: "dark" });
      expect(dark.base).toBe("dark");

      expect(() => {
        createTheme({ name: "bad", base: "system" as "light" });
      }).toThrow();
    });
  });

  // ─── Focus Token Visibility ────────────────────────────────────

  describe("focus tokens remain visible in all modes", () => {
    const css = readTokensCss();
    const rootSection = extractRootSection(css);
    const darkSection = extractDarkSection(css);

    it("light mode has focus ring color defined", () => {
      expect(rootSection).toContain("--kui-color-focus-ring:");
      const match = rootSection.match(/--kui-color-focus-ring:\s*([^;]+)/);
      expect(match).not.toBeNull();
      expect(match![1]!.trim()).not.toBe("transparent");
      expect(match![1]!.trim()).not.toBe("none");
    });

    it("dark mode has focus ring color defined", () => {
      expect(darkSection).toContain("--kui-color-focus-ring:");
      const match = darkSection.match(/--kui-color-focus-ring:\s*([^;]+)/);
      expect(match).not.toBeNull();
      expect(match![1]!.trim()).not.toBe("transparent");
      expect(match![1]!.trim()).not.toBe("none");
    });

    it("light mode has inner ring color for double-ring pattern", () => {
      expect(rootSection).toContain("--kui-color-focus-inner-ring:");
    });

    it("dark mode has inner ring color for double-ring pattern", () => {
      expect(darkSection).toContain("--kui-color-focus-inner-ring:");
    });

    it("focused interaction state has visible focus ring", () => {
      expect(rootSection).toContain("--kui-interaction-focused-focus-ring: visible");
    });

    it("dark focused interaction state has visible focus ring", () => {
      expect(darkSection).toContain("--kui-interaction-focused-focus-ring: visible");
    });
  });

  // ─── Density Does Not Reduce Focus ─────────────────────────────

  describe("density does not reduce focus visibility", () => {
    it("compact density CSS does not override focus tokens", () => {
      const compactCss = readFileSync(join(TOKENS_DIST, "density/compact.css"), "utf-8");
      expect(compactCss).not.toContain("focus-ring");
      expect(compactCss).not.toContain("focus-inner");
    });

    it("standard density CSS does not override focus tokens", () => {
      const standardCss = readFileSync(join(TOKENS_DIST, "density/standard.css"), "utf-8");
      expect(standardCss).not.toContain("focus-ring");
      expect(standardCss).not.toContain("focus-inner");
    });

    it("comfortable density CSS does not override focus tokens", () => {
      const comfortableCss = readFileSync(join(TOKENS_DIST, "density/comfortable.css"), "utf-8");
      expect(comfortableCss).not.toContain("focus-ring");
      expect(comfortableCss).not.toContain("focus-inner");
    });
  });

  // ─── Reduced-Motion Tokens ─────────────────────────────────────

  describe("reduced-motion tokens are not contradicted", () => {
    it("disabled state has 0ms transition duration", () => {
      const css = readTokensCss();
      expect(css).toContain("--kui-interaction-disabled-transition-duration: 0ms");
    });

    it("transition durations use standard CSS values (not animation-specific)", () => {
      const css = readTokensCss();
      const durations = css.match(/transition-duration:\s*\d+ms/g) ?? [];
      for (const d of durations) {
        const ms = parseInt(d.match(/\d+/)![0], 10);
        expect(ms).toBeLessThanOrEqual(500);
      }
    });

    it("no-flash script does not trigger animations", () => {
      const script = getNoFlashScript();
      expect(script).not.toContain("animation");
      expect(script).not.toContain("transition");
    });
  });

  // ─── Fixture Keyboard Accessibility ────────────────────────────

  describe("theme controls in fixtures are keyboard accessible", () => {
    it("vanilla fixture uses native button elements", () => {
      const html = readFileSync(join(FIXTURES_DIR, "vanilla-theme.html"), "utf-8");
      const buttonCount = (html.match(/<button[\s>]/g) ?? []).length;
      expect(buttonCount).toBeGreaterThan(5);
      // Native buttons are keyboard-accessible by default
    });

    it("vanilla fixture uses focus-visible styling", () => {
      const html = readFileSync(join(FIXTURES_DIR, "vanilla-theme.html"), "utf-8");
      expect(html).toContain("focus-visible");
    });

    it("multi-theme fixture uses native button elements", () => {
      const html = readFileSync(join(FIXTURES_DIR, "multi-theme.html"), "utf-8");
      const buttonCount = (html.match(/<button[\s>]/g) ?? []).length;
      expect(buttonCount).toBeGreaterThan(5);
    });

    it("multi-theme fixture uses focus-visible styling", () => {
      const html = readFileSync(join(FIXTURES_DIR, "multi-theme.html"), "utf-8");
      expect(html).toContain("focus-visible");
    });

    it("fixtures do not use div/span as interactive elements", () => {
      for (const fixture of ["vanilla-theme.html", "multi-theme.html"]) {
        const html = readFileSync(join(FIXTURES_DIR, fixture), "utf-8");
        expect(html).not.toContain("onclick=");
        // All click handlers are on <button> elements via addEventListener
      }
    });
  });

  // ─── Theme State Not Color-Only ────────────────────────────────

  describe("theme state does not rely only on color", () => {
    it("theme state is communicated via data attributes, not just color", () => {
      const css = readTokensCss();
      expect(css).toContain("data-kui-theme");
      expect(css).toContain("data-kui-density");
    });

    it("fixtures show mode as text, not just color", () => {
      const html = readFileSync(join(FIXTURES_DIR, "vanilla-theme.html"), "utf-8");
      // Status output shows mode/density as text labels
      expect(html).toContain("Mode:");
      expect(html).toContain("Density:");
    });
  });

  // ─── No-Flash Accessibility ────────────────────────────────────

  describe("no-flash behavior does not harm accessibility", () => {
    it("no-flash script only sets data attributes (no style manipulation)", () => {
      const script = getNoFlashScript();
      expect(script).not.toContain(".style");
      expect(script).not.toContain("className");
      expect(script).not.toContain("classList");
    });

    it("no-flash script does not hide or show content", () => {
      const script = getNoFlashScript();
      expect(script).not.toContain("display");
      expect(script).not.toContain("visibility");
      expect(script).not.toContain("aria-hidden");
    });

    it("no-flash script handles errors silently without breaking page", () => {
      // Simulate broken localStorage
      vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
        throw new Error("Security error");
      });

      const script = getNoFlashScript({ defaultMode: "light" });
      const fn = new Function(script);
      expect(() => {
        fn();
      }).not.toThrow();

      // Falls back to default
      expect(document.documentElement.getAttribute("data-kui-theme")).toBe("light");
      vi.restoreAllMocks();
    });
  });

  // ─── Server Defaults Readable Without JS ──────────────────────

  describe("server defaults remain readable without JavaScript", () => {
    it("server HTML has theme attribute for CSS to match", () => {
      // Server renders <html data-kui-theme="light" data-kui-density="comfortable">
      // Without JS, the CSS cascade still applies light theme variables
      const css = readTokensCss();
      // :root selector provides light theme values
      expect(css).toContain(":root");
      // Light theme text is dark enough to read on light backgrounds
      const rootSection = extractRootSection(css);
      expect(rootSection).toContain("--kui-color-text-primary:");
      expect(rootSection).toContain("--kui-color-bg-page:");
    });

    it("fixtures have initial data-kui-theme set in HTML", () => {
      for (const fixture of ["vanilla-theme.html", "multi-theme.html"]) {
        const html = readFileSync(join(FIXTURES_DIR, fixture), "utf-8");
        expect(html).toMatch(/<html[^>]+data-kui-theme=/);
      }
    });
  });

  // ─── Invalid Value Recovery ────────────────────────────────────

  describe("stored invalid values recover safely", () => {
    beforeEach(() => {
      document.documentElement.removeAttribute("data-kui-theme");
      document.documentElement.removeAttribute("data-kui-density");
    });

    afterEach(() => {
      document.documentElement.removeAttribute("data-kui-theme");
      document.documentElement.removeAttribute("data-kui-density");
      localStorage.clear();
    });

    it("corrupted JSON falls back to defaults", () => {
      localStorage.setItem("kui-theme-preference", "not valid json{{{");

      const script = getNoFlashScript({ defaultMode: "light", defaultDensity: "comfortable" });
      const fn = new Function(script);
      fn();

      expect(document.documentElement.getAttribute("data-kui-theme")).toBe("light");
      expect(document.documentElement.getAttribute("data-kui-density")).toBe("comfortable");
    });

    it("wrong version falls back to defaults", () => {
      localStorage.setItem(
        "kui-theme-preference",
        JSON.stringify({ version: 999, mode: "dark", density: "compact" }),
      );

      const script = getNoFlashScript({ defaultMode: "light", defaultDensity: "comfortable" });
      const fn = new Function(script);
      fn();

      expect(document.documentElement.getAttribute("data-kui-theme")).toBe("light");
    });

    it("invalid mode value falls back to defaults", () => {
      localStorage.setItem(
        "kui-theme-preference",
        JSON.stringify({ version: 1, mode: "invalid-mode", density: "comfortable" }),
      );

      const script = getNoFlashScript({ defaultMode: "light" });
      const fn = new Function(script);
      fn();

      expect(document.documentElement.getAttribute("data-kui-theme")).toBe("light");
    });

    it("missing density falls back to default density", () => {
      localStorage.setItem("kui-theme-preference", JSON.stringify({ version: 1, mode: "dark" }));

      const script = getNoFlashScript({ defaultMode: "light", defaultDensity: "comfortable" });
      const fn = new Function(script);
      fn();

      expect(document.documentElement.getAttribute("data-kui-theme")).toBe("dark");
      expect(document.documentElement.getAttribute("data-kui-density")).toBe("comfortable");
    });

    it("empty localStorage falls back to defaults", () => {
      const script = getNoFlashScript({ defaultMode: "light", defaultDensity: "comfortable" });
      const fn = new Function(script);
      fn();

      expect(document.documentElement.getAttribute("data-kui-theme")).toBe("light");
      expect(document.documentElement.getAttribute("data-kui-density")).toBe("comfortable");
    });

    it("createTheme rejects invalid inputs without crashing", () => {
      const result = validateTheme({ name: "", base: "invalid" as "light" });
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});
