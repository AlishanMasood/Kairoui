/**
 * @vitest-environment happy-dom
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { applyTheme, removeTheme, readThemeMode, readDensity } from "./apply-theme";
import { applyScopedTheme, removeScopedTheme } from "./scoped-theme";
import { trackAttribute, trackCssProperty, cleanupTheme, hasThemeState } from "./cleanup";

function createElement(parent?: HTMLElement): HTMLElement {
  const el = document.createElement("div");
  (parent ?? document.body).appendChild(el);
  return el;
}

describe("DOM theme application — comprehensive", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  // ─── Root Target Application ─────────────────────────────────

  describe("root target application", () => {
    it("applies theme to a target element", () => {
      const target = createElement();
      applyTheme(target, { mode: "dark", density: "compact" });
      expect(target.getAttribute("data-kui-theme")).toBe("dark");
      expect(target.getAttribute("data-kui-density")).toBe("compact");
    });

    it("returns metadata", () => {
      const target = createElement();
      const result = applyTheme(target, { mode: "light", density: "comfortable" });
      expect(result.target).toBe(target);
      expect(result.mode).toBe("light");
      expect(result.density).toBe("comfortable");
    });
  });

  // ─── Explicit Target ─────────────────────────────────────────

  describe("explicit target", () => {
    it("applies to any DOM element", () => {
      const el = document.createElement("section");
      document.body.appendChild(el);
      applyTheme(el, { mode: "dark", density: "standard" });
      expect(el.getAttribute("data-kui-theme")).toBe("dark");
    });
  });

  // ─── Theme Attributes ─────────────────────────────────────────

  describe("theme attributes", () => {
    it("sets data-kui-theme to light", () => {
      const el = createElement();
      applyTheme(el, { mode: "light", density: "comfortable" });
      expect(el.getAttribute("data-kui-theme")).toBe("light");
    });

    it("sets data-kui-theme to dark", () => {
      const el = createElement();
      applyTheme(el, { mode: "dark", density: "comfortable" });
      expect(el.getAttribute("data-kui-theme")).toBe("dark");
    });

    it("readThemeMode returns the current mode", () => {
      const el = createElement();
      applyTheme(el, { mode: "dark", density: "comfortable" });
      expect(readThemeMode(el)).toBe("dark");
    });

    it("readThemeMode returns null when not set", () => {
      const el = createElement();
      expect(readThemeMode(el)).toBeNull();
    });
  });

  // ─── Density Attributes ────────────────────────────────────────

  describe("density attributes", () => {
    it("sets data-kui-density to comfortable", () => {
      const el = createElement();
      applyTheme(el, { mode: "light", density: "comfortable" });
      expect(el.getAttribute("data-kui-density")).toBe("comfortable");
    });

    it("sets data-kui-density to standard", () => {
      const el = createElement();
      applyTheme(el, { mode: "light", density: "standard" });
      expect(el.getAttribute("data-kui-density")).toBe("standard");
    });

    it("sets data-kui-density to compact", () => {
      const el = createElement();
      applyTheme(el, { mode: "light", density: "compact" });
      expect(el.getAttribute("data-kui-density")).toBe("compact");
    });

    it("readDensity returns the current density", () => {
      const el = createElement();
      applyTheme(el, { mode: "light", density: "compact" });
      expect(readDensity(el)).toBe("compact");
    });

    it("readDensity returns null when not set", () => {
      const el = createElement();
      expect(readDensity(el)).toBeNull();
    });
  });

  // ─── CSS Variables ─────────────────────────────────────────────

  describe("CSS variables", () => {
    it("applies CSS custom properties", () => {
      const el = createElement();
      applyTheme(el, {
        mode: "light",
        density: "comfortable",
        cssVariables: { "--kui-color-bg-page": "#f8f9fb", "--kui-color-text-primary": "#1e2433" },
      });
      expect(el.style.getPropertyValue("--kui-color-bg-page")).toBe("#f8f9fb");
      expect(el.style.getPropertyValue("--kui-color-text-primary")).toBe("#1e2433");
    });

    it("reports variablesApplied count", () => {
      const el = createElement();
      const result = applyTheme(el, {
        mode: "light",
        density: "comfortable",
        cssVariables: { "--kui-a": "1", "--kui-b": "2", "--kui-c": "3" },
      });
      expect(result.variablesApplied).toBe(3);
    });
  });

  // ─── Theme Replacement ─────────────────────────────────────────

  describe("theme replacement", () => {
    it("updates mode on reapplication", () => {
      const el = createElement();
      applyTheme(el, { mode: "light", density: "comfortable" });
      applyTheme(el, { mode: "dark", density: "comfortable" });
      expect(el.getAttribute("data-kui-theme")).toBe("dark");
    });
  });

  // ─── Density Replacement ───────────────────────────────────────

  describe("density replacement", () => {
    it("updates density on reapplication", () => {
      const el = createElement();
      applyTheme(el, { mode: "light", density: "comfortable" });
      applyTheme(el, { mode: "light", density: "compact" });
      expect(el.getAttribute("data-kui-density")).toBe("compact");
    });
  });

  // ─── Partial Override Update ───────────────────────────────────

  describe("partial override update", () => {
    it("removes obsolete CSS variables on reapplication", () => {
      const el = createElement();
      applyTheme(el, {
        mode: "light",
        density: "comfortable",
        cssVariables: { "--kui-a": "1", "--kui-old": "x" },
      });
      applyTheme(el, { mode: "light", density: "comfortable", cssVariables: { "--kui-a": "2" } });
      expect(el.style.getPropertyValue("--kui-old")).toBe("");
      expect(el.style.getPropertyValue("--kui-a")).toBe("2");
    });
  });

  // ─── Scoped Application ────────────────────────────────────────

  describe("scoped application", () => {
    it("applies mode only to scoped element", () => {
      const el = createElement();
      applyScopedTheme(el, { mode: "dark" });
      expect(el.getAttribute("data-kui-theme")).toBe("dark");
      expect(el.getAttribute("data-kui-density")).toBeNull();
    });

    it("applies density only to scoped element", () => {
      const el = createElement();
      applyScopedTheme(el, { density: "compact" });
      expect(el.getAttribute("data-kui-density")).toBe("compact");
      expect(el.getAttribute("data-kui-theme")).toBeNull();
    });

    it("applies CSS variables to scope", () => {
      const el = createElement();
      applyScopedTheme(el, { mode: "dark", cssVariables: { "--kui-test": "val" } });
      expect(el.style.getPropertyValue("--kui-test")).toBe("val");
    });
  });

  // ─── Nested Scopes ─────────────────────────────────────────────

  describe("nested scopes", () => {
    it("parent and child have independent attributes", () => {
      const parent = createElement();
      const child = createElement(parent);
      applyTheme(parent, { mode: "light", density: "comfortable" });
      applyScopedTheme(child, { mode: "dark", density: "compact" });
      expect(parent.getAttribute("data-kui-theme")).toBe("light");
      expect(child.getAttribute("data-kui-theme")).toBe("dark");
    });

    it("removing child does not affect parent", () => {
      const parent = createElement();
      const child = createElement(parent);
      applyTheme(parent, { mode: "light", density: "comfortable" });
      applyScopedTheme(child, { mode: "dark" });
      removeScopedTheme(child);
      expect(parent.getAttribute("data-kui-theme")).toBe("light");
      expect(child.getAttribute("data-kui-theme")).toBeNull();
    });
  });

  // ─── Cleanup ───────────────────────────────────────────────────

  describe("cleanup", () => {
    it("cleanup function removes theme", () => {
      const el = createElement();
      const result = applyTheme(el, {
        mode: "dark",
        density: "compact",
        cssVariables: { "--kui-a": "1" },
      });
      result.cleanup();
      expect(el.getAttribute("data-kui-theme")).toBeNull();
      expect(el.getAttribute("data-kui-density")).toBeNull();
      expect(el.style.getPropertyValue("--kui-a")).toBe("");
    });

    it("removeTheme removes all managed state", () => {
      const el = createElement();
      applyTheme(el, { mode: "dark", density: "compact", cssVariables: { "--kui-b": "2" } });
      removeTheme(el);
      expect(el.getAttribute("data-kui-theme")).toBeNull();
      expect(el.style.getPropertyValue("--kui-b")).toBe("");
    });

    it("removeTheme is safe on unthemed elements", () => {
      const el = createElement();
      expect(() => {
        removeTheme(el);
      }).not.toThrow();
    });

    it("removeScopedTheme removes scoped attributes", () => {
      const el = createElement();
      applyScopedTheme(el, { mode: "dark", density: "compact" });
      removeScopedTheme(el);
      expect(el.getAttribute("data-kui-theme")).toBeNull();
      expect(el.getAttribute("data-kui-density")).toBeNull();
    });
  });

  // ─── Restoration ───────────────────────────────────────────────

  describe("restoration", () => {
    it("cleanupTheme restores original attribute value", () => {
      const el = createElement();
      el.setAttribute("data-kui-theme", "original");
      trackAttribute(el, "data-kui-theme", "dark");
      cleanupTheme(el);
      expect(el.getAttribute("data-kui-theme")).toBe("original");
    });

    it("cleanupTheme restores original CSS property", () => {
      const el = createElement();
      el.style.setProperty("--kui-color", "original");
      trackCssProperty(el, "--kui-color", "managed");
      cleanupTheme(el);
      expect(el.style.getPropertyValue("--kui-color")).toBe("original");
    });
  });

  // ─── Preservation of Unrelated Styles ──────────────────────────

  describe("preservation of unrelated styles", () => {
    it("preserves consumer inline styles", () => {
      const el = createElement();
      el.style.setProperty("color", "red");
      el.style.setProperty("--my-var", "blue");
      applyTheme(el, { mode: "light", density: "comfortable", cssVariables: { "--kui-a": "1" } });
      expect(el.style.getPropertyValue("color")).toBe("red");
      expect(el.style.getPropertyValue("--my-var")).toBe("blue");
    });

    it("preserves consumer styles after reapplication", () => {
      const el = createElement();
      el.style.setProperty("--app-color", "green");
      applyTheme(el, { mode: "light", density: "comfortable", cssVariables: { "--kui-a": "1" } });
      applyTheme(el, { mode: "dark", density: "compact", cssVariables: { "--kui-a": "2" } });
      expect(el.style.getPropertyValue("--app-color")).toBe("green");
    });

    it("preserves consumer styles after cleanup", () => {
      const el = createElement();
      el.style.setProperty("--my-var", "kept");
      const result = applyTheme(el, {
        mode: "dark",
        density: "compact",
        cssVariables: { "--kui-a": "1" },
      });
      result.cleanup();
      expect(el.style.getPropertyValue("--my-var")).toBe("kept");
    });
  });

  // ─── Preservation of Unrelated Attributes ──────────────────────

  describe("preservation of unrelated attributes", () => {
    it("preserves data-testid", () => {
      const el = createElement();
      el.setAttribute("data-testid", "root");
      applyTheme(el, { mode: "light", density: "comfortable" });
      expect(el.getAttribute("data-testid")).toBe("root");
    });

    it("preserves class attribute", () => {
      const el = createElement();
      el.setAttribute("class", "my-class");
      applyTheme(el, { mode: "dark", density: "compact" });
      expect(el.getAttribute("class")).toBe("my-class");
    });

    it("preserves aria attributes", () => {
      const el = createElement();
      el.setAttribute("aria-label", "main");
      applyTheme(el, { mode: "light", density: "comfortable" });
      expect(el.getAttribute("aria-label")).toBe("main");
    });
  });

  // ─── Invalid Target ────────────────────────────────────────────

  describe("invalid target", () => {
    it("throws TypeError for null", () => {
      expect(() =>
        applyTheme(null as unknown as HTMLElement, { mode: "light", density: "comfortable" }),
      ).toThrow(TypeError);
    });

    it("throws TypeError for plain object", () => {
      expect(() =>
        applyTheme({} as HTMLElement, { mode: "light", density: "comfortable" }),
      ).toThrow(TypeError);
    });

    it("throws TypeError for string", () => {
      expect(() =>
        applyTheme("div" as unknown as HTMLElement, { mode: "light", density: "comfortable" }),
      ).toThrow(TypeError);
    });

    it("removeTheme is safe for null", () => {
      expect(() => {
        removeTheme(null);
      }).not.toThrow();
    });

    it("removeScopedTheme is safe for null", () => {
      expect(() => {
        removeScopedTheme(null);
      }).not.toThrow();
    });

    it("applyScopedTheme throws for invalid target", () => {
      expect(() => applyScopedTheme(null as unknown as HTMLElement, { mode: "dark" })).toThrow(
        TypeError,
      );
    });
  });

  // ─── Target Replacement ────────────────────────────────────────

  describe("target replacement", () => {
    it("applying to a new target does not affect the old one", () => {
      const old = createElement();
      const next = createElement();
      applyTheme(old, { mode: "dark", density: "compact" });
      removeTheme(old);
      applyTheme(next, { mode: "light", density: "comfortable" });
      expect(old.getAttribute("data-kui-theme")).toBeNull();
      expect(next.getAttribute("data-kui-theme")).toBe("light");
    });
  });

  // ─── Repeated Application ──────────────────────────────────────

  describe("repeated application", () => {
    it("idempotent when same values applied", () => {
      const el = createElement();
      applyTheme(el, { mode: "dark", density: "compact", cssVariables: { "--kui-a": "1" } });
      applyTheme(el, { mode: "dark", density: "compact", cssVariables: { "--kui-a": "1" } });
      expect(el.getAttribute("data-kui-theme")).toBe("dark");
      expect(el.style.getPropertyValue("--kui-a")).toBe("1");
    });
  });

  // ─── Diffed Updates ────────────────────────────────────────────

  describe("diffed updates", () => {
    it("skips unchanged attribute writes", () => {
      const el = createElement();
      applyTheme(el, { mode: "dark", density: "compact" });
      const spy = vi.spyOn(el, "setAttribute");
      applyTheme(el, { mode: "dark", density: "compact" });
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });

    it("skips unchanged CSS property writes", () => {
      const el = createElement();
      const vars = { "--kui-a": "1", "--kui-b": "2" };
      applyTheme(el, { mode: "light", density: "comfortable", cssVariables: vars });
      const spy = vi.spyOn(el.style, "setProperty");
      applyTheme(el, { mode: "light", density: "comfortable", cssVariables: vars });
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });

    it("only writes changed properties", () => {
      const el = createElement();
      applyTheme(el, {
        mode: "light",
        density: "comfortable",
        cssVariables: { "--kui-a": "1", "--kui-b": "2" },
      });
      const spy = vi.spyOn(el.style, "setProperty");
      applyTheme(el, {
        mode: "light",
        density: "comfortable",
        cssVariables: { "--kui-a": "1", "--kui-b": "changed" },
      });
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith("--kui-b", "changed");
      spy.mockRestore();
    });
  });

  // ─── hasThemeState ─────────────────────────────────────────────

  describe("hasThemeState", () => {
    it("returns false for unmanaged element", () => {
      const el = createElement();
      expect(hasThemeState(el)).toBe(false);
    });

    it("returns true after tracking", () => {
      const el = createElement();
      trackAttribute(el, "data-kui-theme", "dark");
      expect(hasThemeState(el)).toBe(true);
    });

    it("returns false after cleanup", () => {
      const el = createElement();
      trackAttribute(el, "data-kui-theme", "dark");
      cleanupTheme(el);
      expect(hasThemeState(el)).toBe(false);
    });
  });
});
