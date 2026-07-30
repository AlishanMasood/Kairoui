/**
 * @vitest-environment happy-dom
 */

import { describe, it, expect, vi } from "vitest";
import { applyTheme } from "./apply-theme";
import { applyScopedTheme } from "./scoped-theme";

function createElement(): HTMLElement {
  const el = document.createElement("div");
  document.body.appendChild(el);
  return el;
}

function generateVariables(count: number, prefix = "light"): Record<string, string> {
  const vars: Record<string, string> = {};
  for (let i = 0; i < count; i++) {
    vars[`--kui-var-${i}`] = `${prefix}-value-${i}`;
  }
  return vars;
}

describe("runtime update optimization", () => {
  describe("skips unchanged attribute writes", () => {
    it("does not call setAttribute on same mode reapplication", () => {
      const el = createElement();
      applyTheme(el, { mode: "light", density: "comfortable" });

      const spy = vi.spyOn(el, "setAttribute");
      applyTheme(el, { mode: "light", density: "comfortable" });

      // Should not have called setAttribute since nothing changed
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });

    it("calls setAttribute only for changed attributes", () => {
      const el = createElement();
      applyTheme(el, { mode: "light", density: "comfortable" });

      const spy = vi.spyOn(el, "setAttribute");
      applyTheme(el, { mode: "dark", density: "comfortable" });

      // Only mode changed
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith("data-kui-theme", "dark");
      spy.mockRestore();
    });

    it("calls setAttribute only for density change", () => {
      const el = createElement();
      applyTheme(el, { mode: "light", density: "comfortable" });

      const spy = vi.spyOn(el, "setAttribute");
      applyTheme(el, { mode: "light", density: "compact" });

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith("data-kui-density", "compact");
      spy.mockRestore();
    });
  });

  describe("skips unchanged CSS property writes", () => {
    it("does not call setProperty for unchanged values", () => {
      const el = createElement();
      const vars = generateVariables(10);
      applyTheme(el, { mode: "light", density: "comfortable", cssVariables: vars });

      const spy = vi.spyOn(el.style, "setProperty");
      applyTheme(el, { mode: "light", density: "comfortable", cssVariables: vars });

      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });

    it("only writes changed properties on partial update", () => {
      const el = createElement();
      const vars = generateVariables(100);
      applyTheme(el, { mode: "light", density: "comfortable", cssVariables: vars });

      const updated = { ...vars, "--kui-var-50": "new-value" };
      const spy = vi.spyOn(el.style, "setProperty");
      applyTheme(el, { mode: "light", density: "comfortable", cssVariables: updated });

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith("--kui-var-50", "new-value");
      spy.mockRestore();
    });
  });

  describe("scoped theme optimization", () => {
    it("skips unchanged scoped mode writes", () => {
      const el = createElement();
      applyScopedTheme(el, { mode: "dark" });

      const spy = vi.spyOn(el, "setAttribute");
      applyScopedTheme(el, { mode: "dark" });

      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });

    it("skips unchanged scoped CSS writes", () => {
      const el = createElement();
      const vars = { "--kui-color-bg-page": "#131822" };
      applyScopedTheme(el, { mode: "dark", cssVariables: vars });

      const spy = vi.spyOn(el.style, "setProperty");
      applyScopedTheme(el, { mode: "dark", cssVariables: vars });

      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  describe("theme switch performance", () => {
    it("light-to-dark switch only writes changed variables", () => {
      const el = createElement();
      const lightVars = generateVariables(200, "light");
      const darkVars = generateVariables(200, "dark");

      applyTheme(el, { mode: "light", density: "comfortable", cssVariables: lightVars });

      const spy = vi.spyOn(el.style, "setProperty");
      applyTheme(el, { mode: "dark", density: "comfortable", cssVariables: darkVars });

      // All 200 vars change values (light-value-X → dark-value-X)
      expect(spy).toHaveBeenCalledTimes(200);
      spy.mockRestore();
    });

    it("density-only change writes 0 CSS properties when vars unchanged", () => {
      const el = createElement();
      const vars = generateVariables(100);
      applyTheme(el, { mode: "light", density: "comfortable", cssVariables: vars });

      const spy = vi.spyOn(el.style, "setProperty");
      applyTheme(el, { mode: "light", density: "compact", cssVariables: vars });

      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  describe("initial application baseline", () => {
    it("initial apply writes all variables", () => {
      const el = createElement();
      const vars = generateVariables(50);

      const spy = vi.spyOn(el.style, "setProperty");
      applyTheme(el, { mode: "light", density: "comfortable", cssVariables: vars });

      expect(spy).toHaveBeenCalledTimes(50);
      spy.mockRestore();
    });
  });

  describe("small override set update", () => {
    it("changing 3 of 200 variables only writes 3", () => {
      const el = createElement();
      const vars = generateVariables(200);
      applyTheme(el, { mode: "light", density: "comfortable", cssVariables: vars });

      const updated = { ...vars };
      updated["--kui-var-10"] = "changed-10";
      updated["--kui-var-99"] = "changed-99";
      updated["--kui-var-150"] = "changed-150";

      const spy = vi.spyOn(el.style, "setProperty");
      applyTheme(el, { mode: "light", density: "comfortable", cssVariables: updated });

      expect(spy).toHaveBeenCalledTimes(3);
      spy.mockRestore();
    });
  });

  describe("correctness preserved", () => {
    it("values are correct after optimized reapplication", () => {
      const el = createElement();
      applyTheme(el, {
        mode: "light",
        density: "comfortable",
        cssVariables: { "--kui-a": "1", "--kui-b": "2" },
      });
      applyTheme(el, {
        mode: "dark",
        density: "compact",
        cssVariables: { "--kui-a": "1", "--kui-b": "3" },
      });

      expect(el.getAttribute("data-kui-theme")).toBe("dark");
      expect(el.getAttribute("data-kui-density")).toBe("compact");
      expect(el.style.getPropertyValue("--kui-a")).toBe("1");
      expect(el.style.getPropertyValue("--kui-b")).toBe("3");
    });

    it("obsolete variables still removed after optimization", () => {
      const el = createElement();
      applyTheme(el, {
        mode: "light",
        density: "comfortable",
        cssVariables: { "--kui-a": "1", "--kui-old": "x" },
      });
      applyTheme(el, {
        mode: "light",
        density: "comfortable",
        cssVariables: { "--kui-a": "1" },
      });

      expect(el.style.getPropertyValue("--kui-old")).toBe("");
    });

    it("cleanup still works after optimized application", () => {
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
  });
});
