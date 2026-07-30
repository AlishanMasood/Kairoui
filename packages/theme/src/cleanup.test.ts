/**
 * @vitest-environment happy-dom
 */

import { describe, it, expect } from "vitest";
import {
  trackAttribute,
  trackCssProperty,
  untrackCssProperty,
  cleanupTheme,
  hasThemeState,
  getManagedProperties,
  getManagedAttributes,
} from "./cleanup";

function createElement(): HTMLElement {
  const el = document.createElement("div");
  document.body.appendChild(el);
  return el;
}

describe("cleanupTheme", () => {
  describe("full cleanup", () => {
    it("removes managed attributes", () => {
      const el = createElement();
      trackAttribute(el, "data-kui-theme", "dark");
      trackAttribute(el, "data-kui-density", "compact");

      cleanupTheme(el);

      expect(el.getAttribute("data-kui-theme")).toBeNull();
      expect(el.getAttribute("data-kui-density")).toBeNull();
    });

    it("removes managed CSS properties", () => {
      const el = createElement();
      trackCssProperty(el, "--kui-color-bg-page", "#131822");
      trackCssProperty(el, "--kui-color-text-primary", "#fff");

      cleanupTheme(el);

      expect(el.style.getPropertyValue("--kui-color-bg-page")).toBe("");
      expect(el.style.getPropertyValue("--kui-color-text-primary")).toBe("");
    });

    it("returns cleanup result with counts", () => {
      const el = createElement();
      trackAttribute(el, "data-kui-theme", "dark");
      trackCssProperty(el, "--kui-color-bg-page", "#131822");

      const result = cleanupTheme(el);

      expect(result.attributesRemoved).toBe(1);
      expect(result.propertiesRemoved).toBe(1);
      expect(result.alreadyClean).toBe(false);
    });
  });

  describe("original-value restoration", () => {
    it("restores pre-existing attribute value", () => {
      const el = createElement();
      el.setAttribute("data-kui-theme", "consumer-value");

      trackAttribute(el, "data-kui-theme", "dark");
      expect(el.getAttribute("data-kui-theme")).toBe("dark");

      cleanupTheme(el);
      expect(el.getAttribute("data-kui-theme")).toBe("consumer-value");
    });

    it("restores pre-existing CSS property value", () => {
      const el = createElement();
      el.style.setProperty("--kui-color-bg-page", "original-color");

      trackCssProperty(el, "--kui-color-bg-page", "#131822");
      expect(el.style.getPropertyValue("--kui-color-bg-page")).toBe("#131822");

      cleanupTheme(el);
      expect(el.style.getPropertyValue("--kui-color-bg-page")).toBe("original-color");
    });

    it("reports restored values in result", () => {
      const el = createElement();
      el.setAttribute("data-kui-theme", "original");
      el.style.setProperty("--kui-var", "original");

      trackAttribute(el, "data-kui-theme", "dark");
      trackCssProperty(el, "--kui-var", "new");

      const result = cleanupTheme(el);
      expect(result.valuesRestored).toBe(2);
    });

    it("removes attribute if no original value existed", () => {
      const el = createElement();
      trackAttribute(el, "data-kui-theme", "dark");

      cleanupTheme(el);
      expect(el.getAttribute("data-kui-theme")).toBeNull();
    });
  });

  describe("consumer-owned variable preservation", () => {
    it("preserves consumer CSS properties", () => {
      const el = createElement();
      el.style.setProperty("--my-app-color", "blue");
      el.style.setProperty("color", "red");

      trackCssProperty(el, "--kui-color-bg-page", "#131822");
      cleanupTheme(el);

      expect(el.style.getPropertyValue("--my-app-color")).toBe("blue");
      expect(el.style.getPropertyValue("color")).toBe("red");
    });

    it("preserves consumer attributes", () => {
      const el = createElement();
      el.setAttribute("data-testid", "root");
      el.setAttribute("class", "app");

      trackAttribute(el, "data-kui-theme", "dark");
      cleanupTheme(el);

      expect(el.getAttribute("data-testid")).toBe("root");
      expect(el.getAttribute("class")).toBe("app");
    });
  });

  describe("repeated cleanup", () => {
    it("is safe to call multiple times", () => {
      const el = createElement();
      trackAttribute(el, "data-kui-theme", "dark");
      trackCssProperty(el, "--kui-var", "val");

      cleanupTheme(el);
      const second = cleanupTheme(el);

      expect(second.alreadyClean).toBe(true);
      expect(second.attributesRemoved).toBe(0);
      expect(second.propertiesRemoved).toBe(0);
    });

    it("does not restore values on second call", () => {
      const el = createElement();
      el.setAttribute("data-kui-theme", "original");
      trackAttribute(el, "data-kui-theme", "dark");

      cleanupTheme(el);
      expect(el.getAttribute("data-kui-theme")).toBe("original");

      // Calling again doesn't break anything
      cleanupTheme(el);
      expect(el.getAttribute("data-kui-theme")).toBe("original");
    });
  });

  describe("partial cleanup via untrackCssProperty", () => {
    it("removes a single managed property", () => {
      const el = createElement();
      trackCssProperty(el, "--kui-a", "1");
      trackCssProperty(el, "--kui-b", "2");

      untrackCssProperty(el, "--kui-a");

      expect(el.style.getPropertyValue("--kui-a")).toBe("");
      expect(el.style.getPropertyValue("--kui-b")).toBe("2");
    });

    it("restores original value for a single property", () => {
      const el = createElement();
      el.style.setProperty("--kui-a", "original");
      trackCssProperty(el, "--kui-a", "managed");

      const restored = untrackCssProperty(el, "--kui-a");

      expect(el.style.getPropertyValue("--kui-a")).toBe("original");
      expect(restored).toBe(true);
    });

    it("returns false when no original value existed", () => {
      const el = createElement();
      trackCssProperty(el, "--kui-new", "value");

      const restored = untrackCssProperty(el, "--kui-new");
      expect(restored).toBe(false);
    });
  });

  describe("nested scopes", () => {
    it("cleanup of parent does not affect child", () => {
      const parent = createElement();
      const child = createElement();
      parent.appendChild(child);

      trackAttribute(parent, "data-kui-theme", "light");
      trackAttribute(child, "data-kui-theme", "dark");
      trackCssProperty(child, "--kui-color-bg-page", "#131822");

      cleanupTheme(parent);

      expect(parent.getAttribute("data-kui-theme")).toBeNull();
      expect(child.getAttribute("data-kui-theme")).toBe("dark");
      expect(child.style.getPropertyValue("--kui-color-bg-page")).toBe("#131822");
    });

    it("cleanup of child does not affect parent", () => {
      const parent = createElement();
      const child = createElement();
      parent.appendChild(child);

      trackAttribute(parent, "data-kui-theme", "light");
      trackCssProperty(parent, "--kui-color-bg-page", "#f8f9fb");
      trackAttribute(child, "data-kui-theme", "dark");

      cleanupTheme(child);

      expect(parent.getAttribute("data-kui-theme")).toBe("light");
      expect(parent.style.getPropertyValue("--kui-color-bg-page")).toBe("#f8f9fb");
      expect(child.getAttribute("data-kui-theme")).toBeNull();
    });
  });

  describe("invalid targets", () => {
    it("returns alreadyClean for null", () => {
      const result = cleanupTheme(null);
      expect(result.alreadyClean).toBe(true);
    });

    it("returns alreadyClean for plain object", () => {
      const result = cleanupTheme({});
      expect(result.alreadyClean).toBe(true);
    });

    it("returns alreadyClean for undefined", () => {
      const result = cleanupTheme(undefined);
      expect(result.alreadyClean).toBe(true);
    });
  });

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

    it("returns false for invalid target", () => {
      expect(hasThemeState(null)).toBe(false);
      expect(hasThemeState("string")).toBe(false);
    });
  });

  describe("getManagedProperties", () => {
    it("returns empty set for unmanaged element", () => {
      const el = createElement();
      expect(getManagedProperties(el).size).toBe(0);
    });

    it("returns managed property names", () => {
      const el = createElement();
      trackCssProperty(el, "--kui-a", "1");
      trackCssProperty(el, "--kui-b", "2");

      const managed = getManagedProperties(el);
      expect(managed.has("--kui-a")).toBe(true);
      expect(managed.has("--kui-b")).toBe(true);
      expect(managed.size).toBe(2);
    });
  });

  describe("getManagedAttributes", () => {
    it("returns empty set for unmanaged element", () => {
      const el = createElement();
      expect(getManagedAttributes(el).size).toBe(0);
    });

    it("returns managed attribute names", () => {
      const el = createElement();
      trackAttribute(el, "data-kui-theme", "dark");
      trackAttribute(el, "data-kui-density", "compact");

      const managed = getManagedAttributes(el);
      expect(managed.has("data-kui-theme")).toBe(true);
      expect(managed.has("data-kui-density")).toBe(true);
    });
  });

  describe("target replacement scenario", () => {
    it("supports moving theme from one element to another", () => {
      const old = createElement();
      const next = createElement();

      trackAttribute(old, "data-kui-theme", "dark");
      trackCssProperty(old, "--kui-color-bg-page", "#131822");

      // Clean up old target
      cleanupTheme(old);

      // Apply to new target
      trackAttribute(next, "data-kui-theme", "dark");
      trackCssProperty(next, "--kui-color-bg-page", "#131822");

      expect(old.getAttribute("data-kui-theme")).toBeNull();
      expect(next.getAttribute("data-kui-theme")).toBe("dark");
      expect(next.style.getPropertyValue("--kui-color-bg-page")).toBe("#131822");
    });
  });
});
