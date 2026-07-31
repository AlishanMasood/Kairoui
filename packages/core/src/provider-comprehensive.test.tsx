import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, render, act } from "@testing-library/react";
import { useContext } from "react";
import { KairoProvider, KairoScopeProvider, KairoThemeContext, useTheme } from "./index";
import { createTheme } from "@kairoui/theme";

function useCtx() {
  return useContext(KairoThemeContext);
}

describe("KairoProvider — comprehensive", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-kui-theme");
    document.documentElement.removeAttribute("data-kui-density");
  });

  afterEach(() => {
    document.documentElement.removeAttribute("data-kui-theme");
    document.documentElement.removeAttribute("data-kui-density");
  });

  // ─── Default Rendering ─────────────────────────────────────────

  describe("default rendering", () => {
    it("renders children", () => {
      const { getByText } = render(
        <KairoProvider>
          <span>child</span>
        </KairoProvider>,
      );
      expect(getByText("child")).toBeDefined();
    });

    it("provides default context values", () => {
      const { result } = renderHook(useCtx, {
        wrapper: ({ children }) => <KairoProvider>{children}</KairoProvider>,
      });
      expect(result.current.mode).toBe("system");
      expect(result.current.density).toBe("comfortable");
    });
  });

  // ─── Default Theme ─────────────────────────────────────────────

  describe("default theme", () => {
    it("has empty theme name when no theme provided", () => {
      const { result } = renderHook(useCtx, {
        wrapper: ({ children }) => <KairoProvider>{children}</KairoProvider>,
      });
      expect(result.current.themeName).toBe("");
    });
  });

  // ─── Custom Theme ──────────────────────────────────────────────

  describe("custom theme", () => {
    it("exposes custom theme name", () => {
      const theme = createTheme({ name: "acme", base: "light" });
      const { result } = renderHook(useCtx, {
        wrapper: ({ children }) => <KairoProvider theme={theme}>{children}</KairoProvider>,
      });
      expect(result.current.themeName).toBe("acme");
    });

    it("definition is accessible in context", () => {
      const theme = createTheme({ name: "brand", base: "dark" });
      const { result } = renderHook(useCtx, {
        wrapper: ({ children }) => <KairoProvider theme={theme}>{children}</KairoProvider>,
      });
      expect(result.current.definition?.name).toBe("brand");
    });
  });

  // ─── Default Mode ──────────────────────────────────────────────

  describe("default mode", () => {
    it("uses defaultMode prop", () => {
      const { result } = renderHook(useCtx, {
        wrapper: ({ children }) => <KairoProvider defaultMode="dark">{children}</KairoProvider>,
      });
      expect(result.current.mode).toBe("dark");
      expect(result.current.resolvedMode).toBe("dark");
    });
  });

  // ─── Controlled Mode ───────────────────────────────────────────

  describe("controlled mode", () => {
    it("uses mode prop directly", () => {
      const { result } = renderHook(useCtx, {
        wrapper: ({ children }) => <KairoProvider mode="dark">{children}</KairoProvider>,
      });
      expect(result.current.mode).toBe("dark");
    });

    it("calls onModeChange", () => {
      const onChange = vi.fn();
      const { result } = renderHook(useCtx, {
        wrapper: ({ children }) => (
          <KairoProvider mode="light" onModeChange={onChange}>
            {children}
          </KairoProvider>
        ),
      });
      act(() => {
        result.current.setMode("dark");
      });
      expect(onChange).toHaveBeenCalledWith("dark");
    });

    it("does not mutate internal state", () => {
      const { result } = renderHook(useCtx, {
        wrapper: ({ children }) => <KairoProvider mode="light">{children}</KairoProvider>,
      });
      act(() => {
        result.current.setMode("dark");
      });
      expect(result.current.mode).toBe("light");
    });
  });

  // ─── Uncontrolled Mode ─────────────────────────────────────────

  describe("uncontrolled mode", () => {
    it("setMode updates internal state", () => {
      const { result } = renderHook(useCtx, {
        wrapper: ({ children }) => <KairoProvider defaultMode="light">{children}</KairoProvider>,
      });
      act(() => {
        result.current.setMode("dark");
      });
      expect(result.current.mode).toBe("dark");
    });
  });

  // ─── Default Density ───────────────────────────────────────────

  describe("default density", () => {
    it("uses defaultDensity prop", () => {
      const { result } = renderHook(useCtx, {
        wrapper: ({ children }) => (
          <KairoProvider defaultDensity="compact">{children}</KairoProvider>
        ),
      });
      expect(result.current.density).toBe("compact");
    });
  });

  // ─── Controlled Density ────────────────────────────────────────

  describe("controlled density", () => {
    it("uses density prop", () => {
      const { result } = renderHook(useCtx, {
        wrapper: ({ children }) => <KairoProvider density="standard">{children}</KairoProvider>,
      });
      expect(result.current.density).toBe("standard");
    });

    it("calls onDensityChange", () => {
      const onChange = vi.fn();
      const { result } = renderHook(useCtx, {
        wrapper: ({ children }) => (
          <KairoProvider density="comfortable" onDensityChange={onChange}>
            {children}
          </KairoProvider>
        ),
      });
      act(() => {
        result.current.setDensity("compact");
      });
      expect(onChange).toHaveBeenCalledWith("compact");
    });

    it("does not overwrite controlled density", () => {
      const { result } = renderHook(useCtx, {
        wrapper: ({ children }) => <KairoProvider density="comfortable">{children}</KairoProvider>,
      });
      act(() => {
        result.current.setDensity("compact");
      });
      expect(result.current.density).toBe("comfortable");
    });
  });

  // ─── Uncontrolled Density ──────────────────────────────────────

  describe("uncontrolled density", () => {
    it("setDensity updates internal state", () => {
      const { result } = renderHook(useCtx, {
        wrapper: ({ children }) => (
          <KairoProvider defaultDensity="comfortable">{children}</KairoProvider>
        ),
      });
      act(() => {
        result.current.setDensity("compact");
      });
      expect(result.current.density).toBe("compact");
    });
  });

  // ─── System Mode ───────────────────────────────────────────────

  describe("system mode", () => {
    it("resolves system mode", () => {
      const { result } = renderHook(useCtx, {
        wrapper: ({ children }) => <KairoProvider defaultMode="system">{children}</KairoProvider>,
      });
      expect(result.current.mode).toBe("system");
      expect(["light", "dark"]).toContain(result.current.resolvedMode);
    });
  });

  // ─── Persistence ───────────────────────────────────────────────

  describe("persistence", () => {
    it("persists uncontrolled mode changes", () => {
      const { result } = renderHook(useCtx, {
        wrapper: ({ children }) => <KairoProvider defaultMode="light">{children}</KairoProvider>,
      });
      act(() => {
        result.current.setMode("dark");
      });
      const stored = JSON.parse(localStorage.getItem("kui-theme-preference")!) as Record<
        string,
        unknown
      >;
      expect(stored["mode"]).toBe("dark");
    });

    it("does not persist controlled mode", () => {
      const { result } = renderHook(useCtx, {
        wrapper: ({ children }) => (
          <KairoProvider mode="light" onModeChange={() => {}}>
            {children}
          </KairoProvider>
        ),
      });
      act(() => {
        result.current.setMode("dark");
      });
      expect(localStorage.getItem("kui-theme-preference")).toBeNull();
    });

    it("reads persisted preference on mount", () => {
      localStorage.setItem(
        "kui-theme-preference",
        JSON.stringify({ version: 1, mode: "dark", density: "compact" }),
      );
      const { result } = renderHook(useCtx, {
        wrapper: ({ children }) => <KairoProvider>{children}</KairoProvider>,
      });
      expect(result.current.mode).toBe("dark");
      expect(result.current.density).toBe("compact");
    });
  });

  // ─── Storage Failures ──────────────────────────────────────────

  describe("storage failures", () => {
    it("handles localStorage throw gracefully", () => {
      const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new Error("Quota");
      });
      const { result } = renderHook(useCtx, {
        wrapper: ({ children }) => <KairoProvider defaultMode="light">{children}</KairoProvider>,
      });
      act(() => {
        result.current.setMode("dark");
      });
      expect(result.current.mode).toBe("dark");
      spy.mockRestore();
    });
  });

  // ─── DOM Application ───────────────────────────────────────────

  describe("DOM application", () => {
    it("sets data-kui-theme on documentElement", () => {
      render(
        <KairoProvider defaultMode="dark">
          <div />
        </KairoProvider>,
      );
      expect(document.documentElement.getAttribute("data-kui-theme")).toBe("dark");
    });

    it("sets data-kui-density on documentElement", () => {
      render(
        <KairoProvider defaultDensity="compact">
          <div />
        </KairoProvider>,
      );
      expect(document.documentElement.getAttribute("data-kui-density")).toBe("compact");
    });

    it("cleans up on unmount", () => {
      const { unmount } = render(
        <KairoProvider defaultMode="dark">
          <div />
        </KairoProvider>,
      );
      unmount();
      expect(document.documentElement.getAttribute("data-kui-theme")).toBeNull();
    });
  });

  // ─── Custom Targets ────────────────────────────────────────────

  describe("custom targets", () => {
    it("applies to explicit target element", () => {
      const target = document.createElement("div");
      document.body.appendChild(target);
      render(
        <KairoProvider defaultMode="dark" target={target}>
          <div />
        </KairoProvider>,
      );
      expect(target.getAttribute("data-kui-theme")).toBe("dark");
      expect(document.documentElement.getAttribute("data-kui-theme")).toBeNull();
      document.body.removeChild(target);
    });
  });

  // ─── Nested Providers ──────────────────────────────────────────

  describe("nested providers", () => {
    it("inner provider overrides outer context", () => {
      const { result } = renderHook(useCtx, {
        wrapper: ({ children }) => (
          <KairoProvider defaultMode="light">
            <KairoProvider defaultMode="dark">{children}</KairoProvider>
          </KairoProvider>
        ),
      });
      expect(result.current.mode).toBe("dark");
    });
  });

  // ─── Scoped Providers ──────────────────────────────────────────

  describe("scoped providers", () => {
    it("scope provides local mode", () => {
      const { result } = renderHook(useCtx, {
        wrapper: ({ children }) => (
          <KairoProvider defaultMode="light">
            <KairoScopeProvider mode="dark">{children}</KairoScopeProvider>
          </KairoProvider>
        ),
      });
      expect(result.current.mode).toBe("dark");
      expect(result.current.isNested).toBe(true);
    });

    it("scope provides local density", () => {
      const { result } = renderHook(useCtx, {
        wrapper: ({ children }) => (
          <KairoProvider defaultDensity="comfortable">
            <KairoScopeProvider density="compact">{children}</KairoScopeProvider>
          </KairoProvider>
        ),
      });
      expect(result.current.density).toBe("compact");
    });

    it("scope does not affect documentElement", () => {
      render(
        <KairoProvider defaultMode="light">
          <KairoScopeProvider mode="dark">
            <span>scoped</span>
          </KairoScopeProvider>
        </KairoProvider>,
      );
      expect(document.documentElement.getAttribute("data-kui-theme")).toBe("light");
    });
  });

  // ─── Context Stability ─────────────────────────────────────────

  describe("context stability", () => {
    it("context value is stable on rerender without changes", () => {
      const { result, rerender } = renderHook(useTheme, {
        wrapper: ({ children }) => <KairoProvider defaultMode="light">{children}</KairoProvider>,
      });
      const first = result.current;
      rerender();
      expect(result.current).toBe(first);
    });
  });

  // ─── Action Stability ──────────────────────────────────────────

  describe("action stability", () => {
    it("setMode is stable across rerenders", () => {
      const { result, rerender } = renderHook(useCtx, {
        wrapper: ({ children }) => <KairoProvider defaultMode="light">{children}</KairoProvider>,
      });
      const first = result.current.setMode;
      rerender();
      expect(result.current.setMode).toBe(first);
    });

    it("setDensity is stable across rerenders", () => {
      const { result, rerender } = renderHook(useCtx, {
        wrapper: ({ children }) => (
          <KairoProvider defaultDensity="comfortable">{children}</KairoProvider>
        ),
      });
      const first = result.current.setDensity;
      rerender();
      expect(result.current.setDensity).toBe(first);
    });
  });

  // ─── Server Rendering ──────────────────────────────────────────

  describe("server rendering (serverState)", () => {
    it("uses serverState for initial values", () => {
      const { result } = renderHook(useCtx, {
        wrapper: ({ children }) => (
          <KairoProvider serverState={{ mode: "dark", resolvedMode: "dark", density: "compact" }}>
            {children}
          </KairoProvider>
        ),
      });
      expect(result.current.mode).toBe("dark");
      expect(result.current.density).toBe("compact");
    });

    it("persisted overrides serverState", () => {
      localStorage.setItem(
        "kui-theme-preference",
        JSON.stringify({ version: 1, mode: "light", density: "standard" }),
      );
      const { result } = renderHook(useCtx, {
        wrapper: ({ children }) => (
          <KairoProvider serverState={{ mode: "dark", resolvedMode: "dark", density: "compact" }}>
            {children}
          </KairoProvider>
        ),
      });
      expect(result.current.mode).toBe("light");
    });
  });

  // ─── Development Warnings ──────────────────────────────────────

  describe("development warnings", () => {
    it("warns when mode and defaultMode both provided", () => {
      const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
      render(
        <KairoProvider mode="dark" defaultMode="light">
          <div />
        </KairoProvider>,
      );
      expect(spy).toHaveBeenCalledWith(expect.stringContaining("mode"));
      spy.mockRestore();
    });

    it("warns when density and defaultDensity both provided", () => {
      const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
      render(
        <KairoProvider density="compact" defaultDensity="comfortable">
          <div />
        </KairoProvider>,
      );
      expect(spy).toHaveBeenCalledWith(expect.stringContaining("density"));
      spy.mockRestore();
    });
  });
});
