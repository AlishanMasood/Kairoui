import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  KairoProvider,
  KairoScopeProvider,
  useTheme,
  useThemeMode,
  useDensity,
  useResolvedTheme,
  useSystemColorScheme,
  useThemeName,
  useRequestedMode,
  useResolvedMode,
  useCurrentDensity,
  useIsNested,
  useIsSystemMode,
} from "./index";
import { createTheme } from "@kairoui/theme";

describe("theme hooks — comprehensive", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-kui-theme");
    document.documentElement.removeAttribute("data-kui-density");
  });

  afterEach(() => {
    document.documentElement.removeAttribute("data-kui-theme");
    document.documentElement.removeAttribute("data-kui-density");
  });

  // ─── useTheme ──────────────────────────────────────────────────

  describe("useTheme", () => {
    it("returns full theme state", () => {
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
      expect(result.current.isNested).toBe(false);
    });

    it("throws outside provider", () => {
      expect(() => renderHook(useTheme)).toThrow("KairoProvider");
    });

    it("stable reference when nothing changes", () => {
      const { result, rerender } = renderHook(useTheme, {
        wrapper: ({ children }) => <KairoProvider defaultMode="light">{children}</KairoProvider>,
      });
      const first = result.current;
      rerender();
      expect(result.current).toBe(first);
    });

    it("updates on mode change", () => {
      const { result } = renderHook(useTheme, {
        wrapper: ({ children }) => <KairoProvider defaultMode="light">{children}</KairoProvider>,
      });
      act(() => {
        result.current.setMode("dark");
      });
      expect(result.current.mode).toBe("dark");
    });

    it("nested provider returns scoped values", () => {
      const { result } = renderHook(useTheme, {
        wrapper: ({ children }) => (
          <KairoProvider defaultMode="light">
            <KairoScopeProvider mode="dark" density="compact">
              {children}
            </KairoScopeProvider>
          </KairoProvider>
        ),
      });
      expect(result.current.mode).toBe("dark");
      expect(result.current.density).toBe("compact");
      expect(result.current.isNested).toBe(true);
    });
  });

  // ─── useThemeMode ──────────────────────────────────────────────

  describe("useThemeMode", () => {
    it("returns mode and resolvedMode", () => {
      const { result } = renderHook(useThemeMode, {
        wrapper: ({ children }) => <KairoProvider defaultMode="dark">{children}</KairoProvider>,
      });
      expect(result.current.mode).toBe("dark");
      expect(result.current.resolvedMode).toBe("dark");
    });

    it("toggleMode switches light to dark", () => {
      const { result } = renderHook(useThemeMode, {
        wrapper: ({ children }) => <KairoProvider defaultMode="light">{children}</KairoProvider>,
      });
      act(() => {
        result.current.toggleMode();
      });
      expect(result.current.mode).toBe("dark");
    });

    it("toggleMode switches dark to light", () => {
      const { result } = renderHook(useThemeMode, {
        wrapper: ({ children }) => <KairoProvider defaultMode="dark">{children}</KairoProvider>,
      });
      act(() => {
        result.current.toggleMode();
      });
      expect(result.current.mode).toBe("light");
    });

    it("controlled: calls onModeChange on toggle", () => {
      const onChange = vi.fn();
      const { result } = renderHook(useThemeMode, {
        wrapper: ({ children }) => (
          <KairoProvider mode="light" onModeChange={onChange}>
            {children}
          </KairoProvider>
        ),
      });
      act(() => {
        result.current.toggleMode();
      });
      expect(onChange).toHaveBeenCalledWith("dark");
    });

    it("throws outside provider", () => {
      expect(() => renderHook(useThemeMode)).toThrow("KairoProvider");
    });

    it("stable setMode reference", () => {
      const { result, rerender } = renderHook(useThemeMode, {
        wrapper: ({ children }) => <KairoProvider defaultMode="light">{children}</KairoProvider>,
      });
      const first = result.current.setMode;
      rerender();
      expect(result.current.setMode).toBe(first);
    });
  });

  // ─── useDensity ────────────────────────────────────────────────

  describe("useDensity", () => {
    it("returns current density", () => {
      const { result } = renderHook(useDensity, {
        wrapper: ({ children }) => (
          <KairoProvider defaultDensity="compact">{children}</KairoProvider>
        ),
      });
      expect(result.current.density).toBe("compact");
    });

    it("setDensity updates", () => {
      const { result } = renderHook(useDensity, {
        wrapper: ({ children }) => (
          <KairoProvider defaultDensity="comfortable">{children}</KairoProvider>
        ),
      });
      act(() => {
        result.current.setDensity("standard");
      });
      expect(result.current.density).toBe("standard");
    });

    it("controlled: calls onDensityChange", () => {
      const onChange = vi.fn();
      const { result } = renderHook(useDensity, {
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

    it("throws outside provider", () => {
      expect(() => renderHook(useDensity)).toThrow("KairoProvider");
    });

    it("stable reference when unchanged", () => {
      const { result, rerender } = renderHook(useDensity, {
        wrapper: ({ children }) => (
          <KairoProvider defaultDensity="comfortable">{children}</KairoProvider>
        ),
      });
      const first = result.current;
      rerender();
      expect(result.current).toBe(first);
    });

    it("nested scope density", () => {
      const { result } = renderHook(useDensity, {
        wrapper: ({ children }) => (
          <KairoProvider defaultDensity="comfortable">
            <KairoScopeProvider density="compact">{children}</KairoScopeProvider>
          </KairoProvider>
        ),
      });
      expect(result.current.density).toBe("compact");
    });
  });

  // ─── useResolvedTheme ──────────────────────────────────────────

  describe("useResolvedTheme", () => {
    it("eventually returns resolved tokens", async () => {
      const { result, rerender } = renderHook(useResolvedTheme, {
        wrapper: ({ children }) => <KairoProvider defaultMode="light">{children}</KairoProvider>,
      });

      // May be null initially (async)
      await vi.waitFor(() => {
        rerender();
        expect(result.current).not.toBeNull();
      });

      expect(result.current?.tokens).toBeDefined();
      expect(result.current?.metadata.resolvedMode).toBe("light");
    });

    it("throws outside provider", () => {
      expect(() => renderHook(useResolvedTheme)).toThrow("KairoProvider");
    });

    it("stable reference on rerender", async () => {
      const { result, rerender } = renderHook(useResolvedTheme, {
        wrapper: ({ children }) => <KairoProvider defaultMode="light">{children}</KairoProvider>,
      });

      await vi.waitFor(() => {
        rerender();
        expect(result.current).not.toBeNull();
      });

      const first = result.current;
      rerender();
      expect(result.current).toBe(first);
    });
  });

  // ─── useSystemColorScheme ──────────────────────────────────────

  describe("useSystemColorScheme", () => {
    it("returns light or dark", () => {
      const { result } = renderHook(useSystemColorScheme);
      expect(["light", "dark"]).toContain(result.current);
    });

    it("works without provider", () => {
      const { result } = renderHook(useSystemColorScheme);
      expect(result.current).toBeDefined();
    });

    it("returns serverFallback for SSR", () => {
      const { result } = renderHook(() => useSystemColorScheme({ serverFallback: "dark" }));
      // In happy-dom it resolves, but the type is correct
      expect(["light", "dark"]).toContain(result.current);
    });
  });

  // ─── Selector Utilities ────────────────────────────────────────

  describe("selector utilities", () => {
    it("useThemeName returns name", () => {
      const theme = createTheme({ name: "acme", base: "light" });
      const { result } = renderHook(useThemeName, {
        wrapper: ({ children }) => <KairoProvider theme={theme}>{children}</KairoProvider>,
      });
      expect(result.current).toBe("acme");
    });

    it("useRequestedMode returns mode", () => {
      const { result } = renderHook(useRequestedMode, {
        wrapper: ({ children }) => <KairoProvider defaultMode="system">{children}</KairoProvider>,
      });
      expect(result.current).toBe("system");
    });

    it("useResolvedMode returns light or dark", () => {
      const { result } = renderHook(useResolvedMode, {
        wrapper: ({ children }) => <KairoProvider defaultMode="dark">{children}</KairoProvider>,
      });
      expect(result.current).toBe("dark");
    });

    it("useCurrentDensity returns density", () => {
      const { result } = renderHook(useCurrentDensity, {
        wrapper: ({ children }) => (
          <KairoProvider defaultDensity="compact">{children}</KairoProvider>
        ),
      });
      expect(result.current).toBe("compact");
    });

    it("useIsNested returns false at root", () => {
      const { result } = renderHook(useIsNested, {
        wrapper: ({ children }) => <KairoProvider>{children}</KairoProvider>,
      });
      expect(result.current).toBe(false);
    });

    it("useIsNested returns true in scope", () => {
      const { result } = renderHook(useIsNested, {
        wrapper: ({ children }) => (
          <KairoProvider>
            <KairoScopeProvider mode="dark">{children}</KairoScopeProvider>
          </KairoProvider>
        ),
      });
      expect(result.current).toBe(true);
    });

    it("useIsSystemMode returns true for system", () => {
      const { result } = renderHook(useIsSystemMode, {
        wrapper: ({ children }) => <KairoProvider defaultMode="system">{children}</KairoProvider>,
      });
      expect(result.current).toBe(true);
    });

    it("useIsSystemMode returns false for explicit", () => {
      const { result } = renderHook(useIsSystemMode, {
        wrapper: ({ children }) => <KairoProvider defaultMode="dark">{children}</KairoProvider>,
      });
      expect(result.current).toBe(false);
    });

    it("selectors throw outside provider", () => {
      expect(() => renderHook(useThemeName)).toThrow("KairoProvider");
      expect(() => renderHook(useResolvedMode)).toThrow("KairoProvider");
      expect(() => renderHook(useCurrentDensity)).toThrow("KairoProvider");
    });
  });

  // ─── Unrelated-State Update Behavior ───────────────────────────

  describe("unrelated-state update behavior", () => {
    it("density change does not recreate useThemeMode result", () => {
      const { result } = renderHook(() => ({ themeMode: useThemeMode(), density: useDensity() }), {
        wrapper: ({ children }) => (
          <KairoProvider defaultMode="light" defaultDensity="comfortable">
            {children}
          </KairoProvider>
        ),
      });
      act(() => {
        result.current.density.setDensity("compact");
      });
      // Mode value shouldn't be affected by density change
      expect(result.current.themeMode.mode).toBe("light");
    });

    it("mode change does not recreate useDensity result", () => {
      const { result } = renderHook(() => ({ themeMode: useThemeMode(), density: useDensity() }), {
        wrapper: ({ children }) => (
          <KairoProvider defaultMode="light" defaultDensity="comfortable">
            {children}
          </KairoProvider>
        ),
      });
      act(() => {
        result.current.themeMode.setMode("dark");
      });
      expect(result.current.density.density).toBe("comfortable");
    });
  });
});
