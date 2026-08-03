/**
 * @vitest-environment happy-dom
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { getNoFlashScript, getNoFlashScriptReadable } from "./no-flash-script";

// Execute the no-flash script in the test DOM

const ScriptRunner = Function;
function runScript(script: string) {
  new ScriptRunner(script)();
}

describe("getNoFlashScript", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    document.documentElement.removeAttribute("data-kui-theme");
    document.documentElement.removeAttribute("data-kui-density");
  });

  describe("explicit light", () => {
    it("applies light when stored mode is light", () => {
      localStorage.setItem(
        "kui-theme-preference",
        JSON.stringify({ version: 1, mode: "light", density: "comfortable" }),
      );
      runScript(getNoFlashScript());
      expect(document.documentElement.getAttribute("data-kui-theme")).toBe("light");
    });
  });

  describe("explicit dark", () => {
    it("applies dark when stored mode is dark", () => {
      localStorage.setItem(
        "kui-theme-preference",
        JSON.stringify({ version: 1, mode: "dark", density: "comfortable" }),
      );
      runScript(getNoFlashScript());
      expect(document.documentElement.getAttribute("data-kui-theme")).toBe("dark");
    });
  });

  describe("system mode - light", () => {
    it("resolves to light when system prefers light", () => {
      localStorage.setItem(
        "kui-theme-preference",
        JSON.stringify({ version: 1, mode: "system", density: "comfortable" }),
      );
      vi.spyOn(window, "matchMedia").mockReturnValue({
        matches: false,
      } as MediaQueryList);

      runScript(getNoFlashScript());
      expect(document.documentElement.getAttribute("data-kui-theme")).toBe("light");
    });
  });

  describe("system mode - dark", () => {
    it("resolves to dark when system prefers dark", () => {
      localStorage.setItem(
        "kui-theme-preference",
        JSON.stringify({ version: 1, mode: "system", density: "comfortable" }),
      );
      vi.spyOn(window, "matchMedia").mockReturnValue({
        matches: true,
      } as MediaQueryList);

      runScript(getNoFlashScript());
      expect(document.documentElement.getAttribute("data-kui-theme")).toBe("dark");
    });
  });

  describe("missing storage", () => {
    it("falls back to default mode when nothing stored", () => {
      runScript(getNoFlashScript());
      expect(document.documentElement.getAttribute("data-kui-theme")).toBe("light");
    });

    it("uses custom default mode", () => {
      runScript(getNoFlashScript({ defaultMode: "dark" }));
      expect(document.documentElement.getAttribute("data-kui-theme")).toBe("dark");
    });
  });

  describe("invalid storage", () => {
    it("falls back when JSON is invalid", () => {
      localStorage.setItem("kui-theme-preference", "not-json{{{");
      runScript(getNoFlashScript());
      expect(document.documentElement.getAttribute("data-kui-theme")).toBe("light");
    });

    it("falls back when version is wrong", () => {
      localStorage.setItem(
        "kui-theme-preference",
        JSON.stringify({ version: 99, mode: "dark", density: "compact" }),
      );
      runScript(getNoFlashScript());
      expect(document.documentElement.getAttribute("data-kui-theme")).toBe("light");
    });

    it("falls back when mode is invalid string", () => {
      localStorage.setItem(
        "kui-theme-preference",
        JSON.stringify({ version: 1, mode: "purple", density: "comfortable" }),
      );
      runScript(getNoFlashScript());
      expect(document.documentElement.getAttribute("data-kui-theme")).toBe("light");
    });
  });

  describe("storage exceptions", () => {
    it("does not throw when localStorage throws", () => {
      vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
        throw new Error("SecurityError");
      });
      expect(() => {
        runScript(getNoFlashScript());
      }).not.toThrow();
    });
  });

  describe("missing matchMedia", () => {
    it("falls back to default when matchMedia throws", () => {
      localStorage.setItem(
        "kui-theme-preference",
        JSON.stringify({ version: 1, mode: "system", density: "comfortable" }),
      );
      vi.spyOn(window, "matchMedia").mockImplementation(() => {
        throw new Error("Not supported");
      });

      runScript(getNoFlashScript());
      expect(document.documentElement.getAttribute("data-kui-theme")).toBe("light");
    });
  });

  describe("density", () => {
    it("applies stored density", () => {
      localStorage.setItem(
        "kui-theme-preference",
        JSON.stringify({ version: 1, mode: "light", density: "compact" }),
      );
      runScript(getNoFlashScript());
      expect(document.documentElement.getAttribute("data-kui-density")).toBe("compact");
    });

    it("applies standard density", () => {
      localStorage.setItem(
        "kui-theme-preference",
        JSON.stringify({ version: 1, mode: "light", density: "standard" }),
      );
      runScript(getNoFlashScript());
      expect(document.documentElement.getAttribute("data-kui-density")).toBe("standard");
    });

    it("falls back for invalid density", () => {
      localStorage.setItem(
        "kui-theme-preference",
        JSON.stringify({ version: 1, mode: "light", density: "huge" }),
      );
      runScript(getNoFlashScript());
      expect(document.documentElement.getAttribute("data-kui-density")).toBe("comfortable");
    });

    it("uses custom default density", () => {
      runScript(getNoFlashScript({ defaultDensity: "standard" }));
      expect(document.documentElement.getAttribute("data-kui-density")).toBe("standard");
    });
  });

  describe("custom keys", () => {
    it("reads from custom storage key", () => {
      localStorage.setItem(
        "my-app-theme",
        JSON.stringify({ version: 1, mode: "dark", density: "compact" }),
      );
      runScript(getNoFlashScript({ storageKey: "my-app-theme" }));
      expect(document.documentElement.getAttribute("data-kui-theme")).toBe("dark");
      expect(document.documentElement.getAttribute("data-kui-density")).toBe("compact");
    });

    it("uses custom attribute names", () => {
      localStorage.setItem(
        "kui-theme-preference",
        JSON.stringify({ version: 1, mode: "dark", density: "compact" }),
      );
      runScript(
        getNoFlashScript({
          themeAttribute: "data-theme",
          densityAttribute: "data-density",
        }),
      );
      expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
      expect(document.documentElement.getAttribute("data-density")).toBe("compact");
    });
  });

  describe("generated script safety", () => {
    it("is a valid self-executing function", () => {
      const script = getNoFlashScript();
      expect(script).toMatch(/^\(function\(\)\{/);
      expect(script).toMatch(/\}\)\(\)$/);
    });

    it("does not contain eval", () => {
      expect(getNoFlashScript()).not.toContain("eval");
    });

    it("does not contain fetch or XMLHttpRequest", () => {
      const script = getNoFlashScript();
      expect(script).not.toContain("fetch");
      expect(script).not.toContain("XMLHttpRequest");
    });

    it("does not import or require", () => {
      const script = getNoFlashScript();
      expect(script).not.toContain("import");
      expect(script).not.toContain("require");
    });

    it("is reasonably small", () => {
      const script = getNoFlashScript();
      expect(script.length).toBeLessThan(800);
    });

    it("readable version is equivalent in behavior", () => {
      localStorage.setItem(
        "kui-theme-preference",
        JSON.stringify({ version: 1, mode: "dark", density: "compact" }),
      );
      runScript(getNoFlashScriptReadable());
      expect(document.documentElement.getAttribute("data-kui-theme")).toBe("dark");
      expect(document.documentElement.getAttribute("data-kui-density")).toBe("compact");
    });
  });
});
