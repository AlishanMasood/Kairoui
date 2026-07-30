/**
 * @vitest-environment happy-dom
 */

import { describe, it, expect, beforeEach } from "vitest";
import { applyTheme, removeTheme, readThemeMode, readDensity } from "./apply-theme";

function createElement(): HTMLElement {
  const el = document.createElement("div");
  document.body.appendChild(el);
  return el;
}

describe("applyTheme", () => {
  let target: HTMLElement;

  beforeEach(() => {
    target = createElement();
  });

  describe("initial application", () => {
    it("sets data-kui-theme attribute", () => {
      applyTheme(target, { mode: "light", density: "comfortable" });
      expect(target.getAttribute("data-kui-theme")).toBe("light");
    });

    it("sets data-kui-density attribute", () => {
      applyTheme(target, { mode: "light", density: "comfortable" });
      expect(target.getAttribute("data-kui-density")).toBe("comfortable");
    });

    it("applies CSS custom properties", () => {
      applyTheme(target, {
        mode: "light",
        density: "comfortable",
        cssVariables: { "--kui-color-bg-page": "#f8f9fb", "--kui-color-text-primary": "#1e2433" },
      });
      expect(target.style.getPropertyValue("--kui-color-bg-page")).toBe("#f8f9fb");
      expect(target.style.getPropertyValue("--kui-color-text-primary")).toBe("#1e2433");
    });

    it("returns application metadata", () => {
      const result = applyTheme(target, {
        mode: "dark",
        density: "compact",
        cssVariables: { "--kui-color-bg-page": "#131822" },
      });
      expect(result.mode).toBe("dark");
      expect(result.density).toBe("compact");
      expect(result.variablesApplied).toBe(1);
      expect(result.target).toBe(target);
      expect(typeof result.cleanup).toBe("function");
    });

    it("returns 0 variablesApplied when no cssVariables provided", () => {
      const result = applyTheme(target, { mode: "light", density: "comfortable" });
      expect(result.variablesApplied).toBe(0);
    });
  });

  describe("reapplication", () => {
    it("updates mode attribute", () => {
      applyTheme(target, { mode: "light", density: "comfortable" });
      applyTheme(target, { mode: "dark", density: "comfortable" });
      expect(target.getAttribute("data-kui-theme")).toBe("dark");
    });

    it("updates density attribute", () => {
      applyTheme(target, { mode: "light", density: "comfortable" });
      applyTheme(target, { mode: "light", density: "compact" });
      expect(target.getAttribute("data-kui-density")).toBe("compact");
    });

    it("removes obsolete CSS properties on reapplication", () => {
      applyTheme(target, {
        mode: "light",
        density: "comfortable",
        cssVariables: { "--kui-color-bg-page": "#fff", "--kui-old-var": "old" },
      });
      expect(target.style.getPropertyValue("--kui-old-var")).toBe("old");

      applyTheme(target, {
        mode: "light",
        density: "comfortable",
        cssVariables: { "--kui-color-bg-page": "#fff" },
      });
      expect(target.style.getPropertyValue("--kui-old-var")).toBe("");
    });

    it("updates changed CSS property values", () => {
      applyTheme(target, {
        mode: "light",
        density: "comfortable",
        cssVariables: { "--kui-color-bg-page": "#fff" },
      });
      applyTheme(target, {
        mode: "dark",
        density: "comfortable",
        cssVariables: { "--kui-color-bg-page": "#131822" },
      });
      expect(target.style.getPropertyValue("--kui-color-bg-page")).toBe("#131822");
    });
  });

  describe("preservation of unrelated styles", () => {
    it("preserves consumer inline styles", () => {
      target.style.setProperty("color", "red");
      target.style.setProperty("--my-custom-var", "blue");

      applyTheme(target, {
        mode: "light",
        density: "comfortable",
        cssVariables: { "--kui-color-bg-page": "#fff" },
      });

      expect(target.style.getPropertyValue("color")).toBe("red");
      expect(target.style.getPropertyValue("--my-custom-var")).toBe("blue");
    });

    it("does not remove consumer variables on reapplication", () => {
      target.style.setProperty("--my-app-color", "green");

      applyTheme(target, {
        mode: "light",
        density: "comfortable",
        cssVariables: { "--kui-color-bg-page": "#fff" },
      });
      applyTheme(target, {
        mode: "dark",
        density: "comfortable",
        cssVariables: { "--kui-color-bg-page": "#131822" },
      });

      expect(target.style.getPropertyValue("--my-app-color")).toBe("green");
    });

    it("preserves unrelated attributes", () => {
      target.setAttribute("data-testid", "root");
      target.setAttribute("class", "my-class");

      applyTheme(target, { mode: "light", density: "comfortable" });

      expect(target.getAttribute("data-testid")).toBe("root");
      expect(target.getAttribute("class")).toBe("my-class");
    });
  });

  describe("cleanup", () => {
    it("cleanup function removes theme attributes", () => {
      const result = applyTheme(target, {
        mode: "dark",
        density: "compact",
        cssVariables: { "--kui-color-bg-page": "#131822" },
      });

      result.cleanup();

      expect(target.getAttribute("data-kui-theme")).toBeNull();
      expect(target.getAttribute("data-kui-density")).toBeNull();
    });

    it("cleanup function removes managed CSS properties", () => {
      const result = applyTheme(target, {
        mode: "dark",
        density: "compact",
        cssVariables: { "--kui-color-bg-page": "#131822", "--kui-color-text-primary": "#fff" },
      });

      result.cleanup();

      expect(target.style.getPropertyValue("--kui-color-bg-page")).toBe("");
      expect(target.style.getPropertyValue("--kui-color-text-primary")).toBe("");
    });

    it("cleanup preserves consumer styles", () => {
      target.style.setProperty("--my-var", "value");

      const result = applyTheme(target, {
        mode: "light",
        density: "comfortable",
        cssVariables: { "--kui-color-bg-page": "#fff" },
      });

      result.cleanup();

      expect(target.style.getPropertyValue("--my-var")).toBe("value");
    });
  });

  describe("invalid targets", () => {
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
  });
});

describe("removeTheme", () => {
  it("removes all KairoUI attributes and properties", () => {
    const target = createElement();
    applyTheme(target, {
      mode: "dark",
      density: "compact",
      cssVariables: { "--kui-color-bg-page": "#131822" },
    });

    removeTheme(target);

    expect(target.getAttribute("data-kui-theme")).toBeNull();
    expect(target.getAttribute("data-kui-density")).toBeNull();
    expect(target.style.getPropertyValue("--kui-color-bg-page")).toBe("");
  });

  it("is safe to call on element without theme", () => {
    const target = createElement();
    expect(() => {
      removeTheme(target);
    }).not.toThrow();
  });

  it("is safe to call with invalid target", () => {
    expect(() => {
      removeTheme(null);
    }).not.toThrow();
  });
});

describe("readThemeMode", () => {
  it("reads light mode", () => {
    const target = createElement();
    applyTheme(target, { mode: "light", density: "comfortable" });
    expect(readThemeMode(target)).toBe("light");
  });

  it("reads dark mode", () => {
    const target = createElement();
    applyTheme(target, { mode: "dark", density: "comfortable" });
    expect(readThemeMode(target)).toBe("dark");
  });

  it("returns null when no theme applied", () => {
    const target = createElement();
    expect(readThemeMode(target)).toBeNull();
  });
});

describe("readDensity", () => {
  it("reads comfortable density", () => {
    const target = createElement();
    applyTheme(target, { mode: "light", density: "comfortable" });
    expect(readDensity(target)).toBe("comfortable");
  });

  it("reads compact density", () => {
    const target = createElement();
    applyTheme(target, { mode: "light", density: "compact" });
    expect(readDensity(target)).toBe("compact");
  });

  it("returns null when no density applied", () => {
    const target = createElement();
    expect(readDensity(target)).toBeNull();
  });
});
