/**
 * @vitest-environment happy-dom
 */

import { describe, it, expect, beforeEach } from "vitest";
import { applyTheme } from "./apply-theme";
import { applyScopedTheme, removeScopedTheme } from "./scoped-theme";

function createElement(parent?: HTMLElement): HTMLElement {
  const el = document.createElement("div");
  (parent ?? document.body).appendChild(el);
  return el;
}

describe("applyScopedTheme", () => {
  let root: HTMLElement;

  beforeEach(() => {
    root = createElement();
    applyTheme(root, { mode: "light", density: "comfortable" });
  });

  describe("local theme scope", () => {
    it("applies mode to a child element", () => {
      const child = createElement(root);
      applyScopedTheme(child, { mode: "dark" });
      expect(child.getAttribute("data-kui-theme")).toBe("dark");
    });

    it("applies density to a child element", () => {
      const child = createElement(root);
      applyScopedTheme(child, { density: "compact" });
      expect(child.getAttribute("data-kui-density")).toBe("compact");
    });

    it("applies both mode and density", () => {
      const child = createElement(root);
      applyScopedTheme(child, { mode: "dark", density: "compact" });
      expect(child.getAttribute("data-kui-theme")).toBe("dark");
      expect(child.getAttribute("data-kui-density")).toBe("compact");
    });

    it("applies CSS variables to the scoped element", () => {
      const child = createElement(root);
      applyScopedTheme(child, {
        mode: "dark",
        cssVariables: { "--kui-color-bg-page": "#131822" },
      });
      expect(child.style.getPropertyValue("--kui-color-bg-page")).toBe("#131822");
    });

    it("returns cleanup function", () => {
      const child = createElement(root);
      const result = applyScopedTheme(child, { mode: "dark", density: "compact" });
      expect(typeof result.cleanup).toBe("function");
    });
  });

  describe("mode-only scope", () => {
    it("only sets theme attribute when density is omitted", () => {
      const child = createElement(root);
      applyScopedTheme(child, { mode: "dark" });
      expect(child.getAttribute("data-kui-theme")).toBe("dark");
      expect(child.getAttribute("data-kui-density")).toBeNull();
    });

    it("inherits density from parent via CSS cascade (no attribute needed)", () => {
      const child = createElement(root);
      applyScopedTheme(child, { mode: "dark" });
      // No density attribute on child — inherits from root
      expect(child.getAttribute("data-kui-density")).toBeNull();
      // Parent still has its density
      expect(root.getAttribute("data-kui-density")).toBe("comfortable");
    });
  });

  describe("density-only scope", () => {
    it("only sets density attribute when mode is omitted", () => {
      const child = createElement(root);
      applyScopedTheme(child, { density: "compact" });
      expect(child.getAttribute("data-kui-density")).toBe("compact");
      expect(child.getAttribute("data-kui-theme")).toBeNull();
    });

    it("inherits theme from parent via CSS cascade", () => {
      const child = createElement(root);
      applyScopedTheme(child, { density: "compact" });
      expect(child.getAttribute("data-kui-theme")).toBeNull();
      expect(root.getAttribute("data-kui-theme")).toBe("light");
    });
  });

  describe("nested scopes", () => {
    it("supports dark region inside light application", () => {
      const sidebar = createElement(root);
      const widget = createElement(sidebar);

      applyScopedTheme(sidebar, { mode: "dark" });
      applyScopedTheme(widget, { density: "compact" });

      expect(root.getAttribute("data-kui-theme")).toBe("light");
      expect(sidebar.getAttribute("data-kui-theme")).toBe("dark");
      expect(widget.getAttribute("data-kui-density")).toBe("compact");
      // Widget inherits dark from sidebar (no theme attribute)
      expect(widget.getAttribute("data-kui-theme")).toBeNull();
    });

    it("inner scope can override outer scope", () => {
      const outer = createElement(root);
      const inner = createElement(outer);

      applyScopedTheme(outer, { mode: "dark", density: "standard" });
      applyScopedTheme(inner, { mode: "light", density: "compact" });

      expect(outer.getAttribute("data-kui-theme")).toBe("dark");
      expect(inner.getAttribute("data-kui-theme")).toBe("light");
      expect(inner.getAttribute("data-kui-density")).toBe("compact");
    });

    it("removing outer scope does not affect inner scope", () => {
      const outer = createElement(root);
      const inner = createElement(outer);

      const outerResult = applyScopedTheme(outer, { mode: "dark" });
      applyScopedTheme(inner, { mode: "light" });

      outerResult.cleanup();

      expect(outer.getAttribute("data-kui-theme")).toBeNull();
      expect(inner.getAttribute("data-kui-theme")).toBe("light");
    });

    it("removing inner scope does not affect outer scope", () => {
      const outer = createElement(root);
      const inner = createElement(outer);

      applyScopedTheme(outer, { mode: "dark" });
      const innerResult = applyScopedTheme(inner, { density: "compact" });

      innerResult.cleanup();

      expect(outer.getAttribute("data-kui-theme")).toBe("dark");
      expect(inner.getAttribute("data-kui-density")).toBeNull();
    });
  });

  describe("independent cleanup", () => {
    it("cleanup removes only scoped attributes", () => {
      const child = createElement(root);
      child.setAttribute("data-testid", "widget");
      child.style.setProperty("--my-var", "blue");

      const result = applyScopedTheme(child, {
        mode: "dark",
        cssVariables: { "--kui-color-bg-page": "#131822" },
      });

      result.cleanup();

      expect(child.getAttribute("data-testid")).toBe("widget");
      expect(child.style.getPropertyValue("--my-var")).toBe("blue");
      expect(child.getAttribute("data-kui-theme")).toBeNull();
      expect(child.style.getPropertyValue("--kui-color-bg-page")).toBe("");
    });

    it("cleanup removes only its own CSS variables", () => {
      const child = createElement(root);

      // Simulate a consumer setting a --kui prefixed variable directly
      child.style.setProperty("--kui-custom-consumer", "red");

      const result = applyScopedTheme(child, {
        mode: "dark",
        cssVariables: { "--kui-color-bg-page": "#131822" },
      });

      result.cleanup();

      // Only removes what applyScopedTheme set
      expect(child.style.getPropertyValue("--kui-color-bg-page")).toBe("");
      expect(child.style.getPropertyValue("--kui-custom-consumer")).toBe("red");
    });
  });

  describe("reapplication", () => {
    it("updates scope attributes on reapplication", () => {
      const child = createElement(root);
      applyScopedTheme(child, { mode: "dark", density: "compact" });
      applyScopedTheme(child, { mode: "light", density: "standard" });

      expect(child.getAttribute("data-kui-theme")).toBe("light");
      expect(child.getAttribute("data-kui-density")).toBe("standard");
    });

    it("removes obsolete CSS variables on reapplication", () => {
      const child = createElement(root);
      applyScopedTheme(child, {
        mode: "dark",
        cssVariables: { "--kui-old": "val", "--kui-keep": "val2" },
      });
      applyScopedTheme(child, {
        mode: "dark",
        cssVariables: { "--kui-keep": "updated" },
      });

      expect(child.style.getPropertyValue("--kui-old")).toBe("");
      expect(child.style.getPropertyValue("--kui-keep")).toBe("updated");
    });
  });

  describe("removeScopedTheme", () => {
    it("removes scoped attributes and managed variables", () => {
      const child = createElement(root);
      applyScopedTheme(child, {
        mode: "dark",
        density: "compact",
        cssVariables: { "--kui-color-bg-page": "#131822" },
      });

      removeScopedTheme(child);

      expect(child.getAttribute("data-kui-theme")).toBeNull();
      expect(child.getAttribute("data-kui-density")).toBeNull();
      expect(child.style.getPropertyValue("--kui-color-bg-page")).toBe("");
    });

    it("is safe to call on unthemed element", () => {
      const child = createElement(root);
      expect(() => {
        removeScopedTheme(child);
      }).not.toThrow();
    });

    it("does not affect parent theme", () => {
      const child = createElement(root);
      applyScopedTheme(child, { mode: "dark" });
      removeScopedTheme(child);

      expect(root.getAttribute("data-kui-theme")).toBe("light");
      expect(root.getAttribute("data-kui-density")).toBe("comfortable");
    });
  });

  describe("invalid targets", () => {
    it("throws TypeError for null", () => {
      expect(() => applyScopedTheme(null as unknown as HTMLElement, { mode: "dark" })).toThrow(
        TypeError,
      );
    });

    it("throws TypeError for plain object", () => {
      expect(() => applyScopedTheme({} as HTMLElement, { mode: "dark" })).toThrow(TypeError);
    });
  });
});
