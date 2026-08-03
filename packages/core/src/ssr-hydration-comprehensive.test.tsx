import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useContext } from "react";
import { KairoProvider, KairoThemeContext } from "./index";
import { getNoFlashScript } from "@kairoui/theme/server";
import { PREFERENCE_VERSION } from "@kairoui/theme";

function useCtx() {
  return useContext(KairoThemeContext);
}

const ScriptRunner = Function;

describe("hydration behavior — comprehensive", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-kui-theme");
    document.documentElement.removeAttribute("data-kui-density");
  });

  afterEach(() => {
    document.documentElement.removeAttribute("data-kui-theme");
    document.documentElement.removeAttribute("data-kui-density");
  });

  // ─── Matching Hydration ────────────────────────────────────────

  describe("matching hydration", () => {
    it("provider matches server-rendered light attributes", () => {
      document.documentElement.setAttribute("data-kui-theme", "light");
      document.documentElement.setAttribute("data-kui-density", "comfortable");

      const { result } = renderHook(useCtx, {
        wrapper: ({ children }) => (
          <KairoProvider serverState={{ resolvedMode: "light", density: "comfortable" }}>
            {children}
          </KairoProvider>
        ),
      });

      expect(result.current.resolvedMode).toBe("light");
      expect(result.current.density).toBe("comfortable");
    });

    it("provider matches server-rendered dark attributes", () => {
      document.documentElement.setAttribute("data-kui-theme", "dark");
      document.documentElement.setAttribute("data-kui-density", "compact");

      const { result } = renderHook(useCtx, {
        wrapper: ({ children }) => (
          <KairoProvider serverState={{ resolvedMode: "dark", density: "compact" }}>
            {children}
          </KairoProvider>
        ),
      });

      expect(result.current.resolvedMode).toBe("dark");
      expect(result.current.density).toBe("compact");
    });
  });

  // ─── No-Flash → Provider Handoff ───────────────────────────────

  describe("no-flash → provider handoff", () => {
    it("provider reads DOM set by no-flash script (dark pref)", () => {
      localStorage.setItem(
        "kui-theme-preference",
        JSON.stringify({ version: PREFERENCE_VERSION, mode: "dark", density: "compact" }),
      );

      new ScriptRunner(getNoFlashScript())();

      expect(document.documentElement.getAttribute("data-kui-theme")).toBe("dark");

      const { result } = renderHook(useCtx, {
        wrapper: ({ children }) => <KairoProvider>{children}</KairoProvider>,
      });

      expect(result.current.resolvedMode).toBe("dark");
      expect(result.current.mode).toBe("dark");
      expect(result.current.density).toBe("compact");
    });

    it("provider reads DOM set by no-flash script (light pref)", () => {
      localStorage.setItem(
        "kui-theme-preference",
        JSON.stringify({ version: PREFERENCE_VERSION, mode: "light", density: "standard" }),
      );

      new ScriptRunner(getNoFlashScript())();

      const { result } = renderHook(useCtx, {
        wrapper: ({ children }) => <KairoProvider>{children}</KairoProvider>,
      });

      expect(result.current.resolvedMode).toBe("light");
      expect(result.current.density).toBe("standard");
    });
  });

  // ─── Missing Serialized State ──────────────────────────────────

  describe("missing serialized state", () => {
    it("provider uses defaults when no serverState", () => {
      const { result } = renderHook(useCtx, {
        wrapper: ({ children }) => <KairoProvider>{children}</KairoProvider>,
      });
      expect(result.current.mode).toBe("system");
      expect(result.current.density).toBe("comfortable");
    });
  });

  // ─── Invalid Storage During Hydration ──────────────────────────

  describe("invalid storage during hydration", () => {
    it("ignores invalid JSON in localStorage", () => {
      localStorage.setItem("kui-theme-preference", "corrupt{{");

      const { result } = renderHook(useCtx, {
        wrapper: ({ children }) => <KairoProvider>{children}</KairoProvider>,
      });

      // Should fall back to defaults
      expect(result.current.mode).toBe("system");
    });

    it("ignores wrong version in localStorage", () => {
      localStorage.setItem(
        "kui-theme-preference",
        JSON.stringify({ version: 99, mode: "dark", density: "compact" }),
      );

      const { result } = renderHook(useCtx, {
        wrapper: ({ children }) => <KairoProvider>{children}</KairoProvider>,
      });

      expect(result.current.mode).toBe("system");
    });
  });

  // ─── Persisted Preference Reconciliation ───────────────────────

  describe("persisted preference reconciliation", () => {
    it("persisted preference overrides serverState", () => {
      localStorage.setItem(
        "kui-theme-preference",
        JSON.stringify({ version: PREFERENCE_VERSION, mode: "dark", density: "compact" }),
      );

      const { result } = renderHook(useCtx, {
        wrapper: ({ children }) => (
          <KairoProvider serverState={{ resolvedMode: "light", density: "comfortable" }}>
            {children}
          </KairoProvider>
        ),
      });

      expect(result.current.mode).toBe("dark");
      expect(result.current.density).toBe("compact");
    });

    it("defaultMode overrides both persisted and serverState", () => {
      localStorage.setItem(
        "kui-theme-preference",
        JSON.stringify({ version: PREFERENCE_VERSION, mode: "dark", density: "compact" }),
      );

      const { result } = renderHook(useCtx, {
        wrapper: ({ children }) => (
          <KairoProvider
            defaultMode="light"
            serverState={{ resolvedMode: "dark", density: "compact" }}
          >
            {children}
          </KairoProvider>
        ),
      });

      expect(result.current.mode).toBe("light");
    });
  });

  // ─── Controlled Provider Hydration ─────────────────────────────

  describe("controlled provider hydration", () => {
    it("controlled mode overrides everything", () => {
      localStorage.setItem(
        "kui-theme-preference",
        JSON.stringify({ version: PREFERENCE_VERSION, mode: "dark", density: "compact" }),
      );
      document.documentElement.setAttribute("data-kui-theme", "dark");

      const { result } = renderHook(useCtx, {
        wrapper: ({ children }) => (
          <KairoProvider mode="light" serverState={{ resolvedMode: "dark" }}>
            {children}
          </KairoProvider>
        ),
      });

      expect(result.current.mode).toBe("light");
      expect(result.current.resolvedMode).toBe("light");
    });

    it("controlled density overrides everything", () => {
      const { result } = renderHook(useCtx, {
        wrapper: ({ children }) => (
          <KairoProvider density="standard" serverState={{ density: "compact" }}>
            {children}
          </KairoProvider>
        ),
      });

      expect(result.current.density).toBe("standard");
    });
  });

  // ─── System Mode Edge Cases ────────────────────────────────────

  describe("system mode edge cases", () => {
    it("system mode with no-flash script resolves from DOM", () => {
      localStorage.setItem(
        "kui-theme-preference",
        JSON.stringify({ version: PREFERENCE_VERSION, mode: "system", density: "comfortable" }),
      );

      new ScriptRunner(getNoFlashScript())();

      const resolvedFromDom = document.documentElement.getAttribute("data-kui-theme");
      expect(["light", "dark"]).toContain(resolvedFromDom);

      const { result } = renderHook(useCtx, {
        wrapper: ({ children }) => <KairoProvider>{children}</KairoProvider>,
      });

      expect(result.current.mode).toBe("system");
      expect(["light", "dark"]).toContain(result.current.resolvedMode);
    });
  });

  // ─── No-Flash Script Edge Cases ────────────────────────────────

  describe("no-flash script edge cases", () => {
    it("handles missing localStorage gracefully", () => {
      const spy = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
        throw new Error("SecurityError");
      });

      // Script should not throw
      expect(() => {
        new ScriptRunner(getNoFlashScript())();
      }).not.toThrow();

      // Should still set defaults
      expect(document.documentElement.getAttribute("data-kui-theme")).toBe("light");
      spy.mockRestore();
    });

    it("applies density from storage", () => {
      localStorage.setItem(
        "kui-theme-preference",
        JSON.stringify({ version: PREFERENCE_VERSION, mode: "light", density: "compact" }),
      );

      new ScriptRunner(getNoFlashScript())();

      expect(document.documentElement.getAttribute("data-kui-density")).toBe("compact");
    });
  });
});
