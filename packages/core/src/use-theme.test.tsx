import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { KairoProvider } from "./kairo-provider";
import { KairoScopeProvider } from "./kairo-scope-provider";
import { useTheme } from "./use-theme";

describe("useTheme", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-kui-theme");
    document.documentElement.removeAttribute("data-kui-density");
  });

  afterEach(() => {
    document.documentElement.removeAttribute("data-kui-theme");
    document.documentElement.removeAttribute("data-kui-density");
  });

  describe("provider usage", () => {
    it("returns theme state", () => {
      const { result } = renderHook(useTheme, {
        wrapper: ({ children }) => (
          <KairoProvider defaultMode="dark" defaultDensity="compact">
            {children}
          </KairoProvider>
        ),
      });

      expect(result.current.mode).toBe("dark");
      expect(result.current.resolvedMode).toBe("dark");
      expect(result.current.density).toBe("compact");
    });

    it("returns theme name", async () => {
      const { createTheme } = await import("@kairoui/theme");
      const theme = createTheme({ name: "acme", base: "light" });

      const { result } = renderHook(useTheme, {
        wrapper: ({ children }) => (
          <KairoProvider theme={theme} defaultMode="light">
            {children}
          </KairoProvider>
        ),
      });

      expect(result.current.themeName).toBe("acme");
    });

    it("isNested is false at root", () => {
      const { result } = renderHook(useTheme, {
        wrapper: ({ children }) => <KairoProvider>{children}</KairoProvider>,
      });
      expect(result.current.isNested).toBe(false);
    });
  });

  describe("outside-provider usage", () => {
    it("throws with actionable error", () => {
      expect(() => renderHook(useTheme)).toThrow("useTheme()");
      expect(() => renderHook(useTheme)).toThrow("KairoProvider");
    });
  });

  describe("nested provider", () => {
    it("returns scoped values", () => {
      const { result } = renderHook(useTheme, {
        wrapper: ({ children }) => (
          <KairoProvider defaultMode="light" defaultDensity="comfortable">
            <KairoScopeProvider mode="dark" density="compact">
              {children}
            </KairoScopeProvider>
          </KairoProvider>
        ),
      });

      expect(result.current.mode).toBe("dark");
      expect(result.current.resolvedMode).toBe("dark");
      expect(result.current.density).toBe("compact");
      expect(result.current.isNested).toBe(true);
    });
  });

  describe("mode updates", () => {
    it("setMode updates the mode", () => {
      const { result } = renderHook(useTheme, {
        wrapper: ({ children }) => <KairoProvider defaultMode="light">{children}</KairoProvider>,
      });

      expect(result.current.mode).toBe("light");

      act(() => {
        result.current.setMode("dark");
      });

      expect(result.current.mode).toBe("dark");
      expect(result.current.resolvedMode).toBe("dark");
    });
  });

  describe("density updates", () => {
    it("setDensity updates the density", () => {
      const { result } = renderHook(useTheme, {
        wrapper: ({ children }) => (
          <KairoProvider defaultDensity="comfortable">{children}</KairoProvider>
        ),
      });

      expect(result.current.density).toBe("comfortable");

      act(() => {
        result.current.setDensity("compact");
      });

      expect(result.current.density).toBe("compact");
    });
  });

  describe("stable action references", () => {
    it("setMode reference is stable across renders", () => {
      const { result, rerender } = renderHook(useTheme, {
        wrapper: ({ children }) => <KairoProvider defaultMode="light">{children}</KairoProvider>,
      });

      const firstSetMode = result.current.setMode;
      rerender();
      expect(result.current.setMode).toBe(firstSetMode);
    });

    it("setDensity reference is stable across renders", () => {
      const { result, rerender } = renderHook(useTheme, {
        wrapper: ({ children }) => (
          <KairoProvider defaultDensity="comfortable">{children}</KairoProvider>
        ),
      });

      const firstSetDensity = result.current.setDensity;
      rerender();
      expect(result.current.setDensity).toBe(firstSetDensity);
    });
  });

  describe("context stability", () => {
    it("returns same object reference when nothing changes", () => {
      const { result, rerender } = renderHook(useTheme, {
        wrapper: ({ children }) => (
          <KairoProvider defaultMode="light" defaultDensity="comfortable">
            {children}
          </KairoProvider>
        ),
      });

      const first = result.current;
      rerender();
      expect(result.current).toBe(first);
    });

    it("returns new reference when mode changes", () => {
      const { result } = renderHook(useTheme, {
        wrapper: ({ children }) => <KairoProvider defaultMode="light">{children}</KairoProvider>,
      });

      const first = result.current;

      act(() => {
        result.current.setMode("dark");
      });

      expect(result.current).not.toBe(first);
      expect(result.current.mode).toBe("dark");
    });
  });
});
