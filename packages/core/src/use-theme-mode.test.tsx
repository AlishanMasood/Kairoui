import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { KairoProvider } from "./kairo-provider";
import { KairoScopeProvider } from "./kairo-scope-provider";
import { useThemeMode } from "./use-theme-mode";

describe("useThemeMode", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-kui-theme");
    document.documentElement.removeAttribute("data-kui-density");
  });

  afterEach(() => {
    document.documentElement.removeAttribute("data-kui-theme");
    document.documentElement.removeAttribute("data-kui-density");
  });

  describe("basic usage", () => {
    it("returns current mode and resolved mode", () => {
      const { result } = renderHook(useThemeMode, {
        wrapper: ({ children }) => <KairoProvider defaultMode="dark">{children}</KairoProvider>,
      });
      expect(result.current.mode).toBe("dark");
      expect(result.current.resolvedMode).toBe("dark");
    });

    it("setMode updates the mode", () => {
      const { result } = renderHook(useThemeMode, {
        wrapper: ({ children }) => <KairoProvider defaultMode="light">{children}</KairoProvider>,
      });

      act(() => {
        result.current.setMode("dark");
      });

      expect(result.current.mode).toBe("dark");
      expect(result.current.resolvedMode).toBe("dark");
    });
  });

  describe("light to dark", () => {
    it("toggleMode switches from light to dark", () => {
      const { result } = renderHook(useThemeMode, {
        wrapper: ({ children }) => <KairoProvider defaultMode="light">{children}</KairoProvider>,
      });

      act(() => {
        result.current.toggleMode();
      });

      expect(result.current.mode).toBe("dark");
    });
  });

  describe("dark to light", () => {
    it("toggleMode switches from dark to light", () => {
      const { result } = renderHook(useThemeMode, {
        wrapper: ({ children }) => <KairoProvider defaultMode="dark">{children}</KairoProvider>,
      });

      act(() => {
        result.current.toggleMode();
      });

      expect(result.current.mode).toBe("light");
    });
  });

  describe("system mode", () => {
    it("system mode resolves based on OS preference", () => {
      const { result } = renderHook(useThemeMode, {
        wrapper: ({ children }) => <KairoProvider defaultMode="system">{children}</KairoProvider>,
      });
      expect(result.current.mode).toBe("system");
      expect(["light", "dark"]).toContain(result.current.resolvedMode);
    });

    it("toggleMode from system switches to opposite of resolved", () => {
      const { result } = renderHook(useThemeMode, {
        wrapper: ({ children }) => <KairoProvider defaultMode="system">{children}</KairoProvider>,
      });

      const resolvedBefore = result.current.resolvedMode;

      act(() => {
        result.current.toggleMode();
      });

      // Should switch to explicit opposite of what system resolved to
      const expected = resolvedBefore === "light" ? "dark" : "light";
      expect(result.current.mode).toBe(expected);
    });

    it("setMode can set to system", () => {
      const { result } = renderHook(useThemeMode, {
        wrapper: ({ children }) => <KairoProvider defaultMode="light">{children}</KairoProvider>,
      });

      act(() => {
        result.current.setMode("system");
      });

      expect(result.current.mode).toBe("system");
    });
  });

  describe("controlled provider", () => {
    it("calls onModeChange when setMode is called", () => {
      const onModeChange = vi.fn();
      const { result } = renderHook(useThemeMode, {
        wrapper: ({ children }) => (
          <KairoProvider mode="light" onModeChange={onModeChange}>
            {children}
          </KairoProvider>
        ),
      });

      act(() => {
        result.current.setMode("dark");
      });

      expect(onModeChange).toHaveBeenCalledWith("dark");
    });

    it("calls onModeChange on toggle", () => {
      const onModeChange = vi.fn();
      const { result } = renderHook(useThemeMode, {
        wrapper: ({ children }) => (
          <KairoProvider mode="light" onModeChange={onModeChange}>
            {children}
          </KairoProvider>
        ),
      });

      act(() => {
        result.current.toggleMode();
      });

      expect(onModeChange).toHaveBeenCalledWith("dark");
    });

    it("does not overwrite controlled mode", () => {
      const { result } = renderHook(useThemeMode, {
        wrapper: ({ children }) => <KairoProvider mode="light">{children}</KairoProvider>,
      });

      act(() => {
        result.current.setMode("dark");
      });

      // Mode stays light because it's controlled without onModeChange
      expect(result.current.mode).toBe("light");
    });
  });

  describe("nested provider", () => {
    it("returns scoped mode", () => {
      const { result } = renderHook(useThemeMode, {
        wrapper: ({ children }) => (
          <KairoProvider defaultMode="light">
            <KairoScopeProvider mode="dark">{children}</KairoScopeProvider>
          </KairoProvider>
        ),
      });

      expect(result.current.mode).toBe("dark");
      expect(result.current.resolvedMode).toBe("dark");
    });
  });

  describe("stable actions", () => {
    it("setMode reference is stable", () => {
      const { result, rerender } = renderHook(useThemeMode, {
        wrapper: ({ children }) => <KairoProvider defaultMode="light">{children}</KairoProvider>,
      });

      const firstSetMode = result.current.setMode;
      rerender();
      expect(result.current.setMode).toBe(firstSetMode);
    });

    it("toggleMode reference is stable when deps unchanged", () => {
      const { result, rerender } = renderHook(useThemeMode, {
        wrapper: ({ children }) => <KairoProvider defaultMode="light">{children}</KairoProvider>,
      });

      const firstToggle = result.current.toggleMode;
      rerender();
      expect(result.current.toggleMode).toBe(firstToggle);
    });
  });

  describe("outside-provider error", () => {
    it("throws with helpful message", () => {
      expect(() => renderHook(useThemeMode)).toThrow("useThemeMode()");
      expect(() => renderHook(useThemeMode)).toThrow("KairoProvider");
    });
  });
});
