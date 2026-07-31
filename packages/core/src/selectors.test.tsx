import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { KairoProvider } from "./kairo-provider";
import { KairoScopeProvider } from "./kairo-scope-provider";
import {
  useThemeName,
  useRequestedMode,
  useResolvedMode,
  useCurrentDensity,
  useIsNested,
  useIsSystemMode,
} from "./selectors";
import { createTheme } from "@kairoui/theme";

describe("theme selector utilities", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-kui-theme");
    document.documentElement.removeAttribute("data-kui-density");
  });

  afterEach(() => {
    document.documentElement.removeAttribute("data-kui-theme");
    document.documentElement.removeAttribute("data-kui-density");
  });

  describe("useThemeName", () => {
    it("returns empty string when no theme defined", () => {
      const { result } = renderHook(useThemeName, {
        wrapper: ({ children }) => <KairoProvider>{children}</KairoProvider>,
      });
      expect(result.current).toBe("");
    });

    it("returns theme name from definition", () => {
      const theme = createTheme({ name: "acme", base: "light" });
      const { result } = renderHook(useThemeName, {
        wrapper: ({ children }) => <KairoProvider theme={theme}>{children}</KairoProvider>,
      });
      expect(result.current).toBe("acme");
    });

    it("returns stable primitive value", () => {
      const theme = createTheme({ name: "brand", base: "dark" });
      const { result, rerender } = renderHook(useThemeName, {
        wrapper: ({ children }) => <KairoProvider theme={theme}>{children}</KairoProvider>,
      });
      const first = result.current;
      rerender();
      expect(result.current).toBe(first);
    });
  });

  describe("useRequestedMode", () => {
    it("returns light", () => {
      const { result } = renderHook(useRequestedMode, {
        wrapper: ({ children }) => <KairoProvider defaultMode="light">{children}</KairoProvider>,
      });
      expect(result.current).toBe("light");
    });

    it("returns system", () => {
      const { result } = renderHook(useRequestedMode, {
        wrapper: ({ children }) => <KairoProvider defaultMode="system">{children}</KairoProvider>,
      });
      expect(result.current).toBe("system");
    });
  });

  describe("useResolvedMode", () => {
    it("returns light or dark", () => {
      const { result } = renderHook(useResolvedMode, {
        wrapper: ({ children }) => <KairoProvider defaultMode="dark">{children}</KairoProvider>,
      });
      expect(result.current).toBe("dark");
    });

    it("never returns system", () => {
      const { result } = renderHook(useResolvedMode, {
        wrapper: ({ children }) => <KairoProvider defaultMode="system">{children}</KairoProvider>,
      });
      expect(result.current).not.toBe("system");
      expect(["light", "dark"]).toContain(result.current);
    });
  });

  describe("useCurrentDensity", () => {
    it("returns comfortable by default", () => {
      const { result } = renderHook(useCurrentDensity, {
        wrapper: ({ children }) => <KairoProvider>{children}</KairoProvider>,
      });
      expect(result.current).toBe("comfortable");
    });

    it("returns configured density", () => {
      const { result } = renderHook(useCurrentDensity, {
        wrapper: ({ children }) => (
          <KairoProvider defaultDensity="compact">{children}</KairoProvider>
        ),
      });
      expect(result.current).toBe("compact");
    });
  });

  describe("useIsNested", () => {
    it("returns false at root", () => {
      const { result } = renderHook(useIsNested, {
        wrapper: ({ children }) => <KairoProvider>{children}</KairoProvider>,
      });
      expect(result.current).toBe(false);
    });

    it("returns true in scoped provider", () => {
      const { result } = renderHook(useIsNested, {
        wrapper: ({ children }) => (
          <KairoProvider>
            <KairoScopeProvider mode="dark">{children}</KairoScopeProvider>
          </KairoProvider>
        ),
      });
      expect(result.current).toBe(true);
    });
  });

  describe("useIsSystemMode", () => {
    it("returns true when mode is system", () => {
      const { result } = renderHook(useIsSystemMode, {
        wrapper: ({ children }) => <KairoProvider defaultMode="system">{children}</KairoProvider>,
      });
      expect(result.current).toBe(true);
    });

    it("returns false when mode is explicit", () => {
      const { result } = renderHook(useIsSystemMode, {
        wrapper: ({ children }) => <KairoProvider defaultMode="dark">{children}</KairoProvider>,
      });
      expect(result.current).toBe(false);
    });
  });

  describe("nested providers", () => {
    it("selectors return scoped values", () => {
      const { result: mode } = renderHook(useResolvedMode, {
        wrapper: ({ children }) => (
          <KairoProvider defaultMode="light">
            <KairoScopeProvider mode="dark">{children}</KairoScopeProvider>
          </KairoProvider>
        ),
      });
      expect(mode.current).toBe("dark");

      const { result: density } = renderHook(useCurrentDensity, {
        wrapper: ({ children }) => (
          <KairoProvider defaultDensity="comfortable">
            <KairoScopeProvider density="compact">{children}</KairoScopeProvider>
          </KairoProvider>
        ),
      });
      expect(density.current).toBe("compact");
    });
  });

  describe("outside-provider behavior", () => {
    it("useThemeName throws", () => {
      expect(() => renderHook(useThemeName)).toThrow("KairoProvider");
    });

    it("useRequestedMode throws", () => {
      expect(() => renderHook(useRequestedMode)).toThrow("KairoProvider");
    });

    it("useResolvedMode throws", () => {
      expect(() => renderHook(useResolvedMode)).toThrow("KairoProvider");
    });

    it("useCurrentDensity throws", () => {
      expect(() => renderHook(useCurrentDensity)).toThrow("KairoProvider");
    });

    it("useIsNested throws", () => {
      expect(() => renderHook(useIsNested)).toThrow("KairoProvider");
    });

    it("useIsSystemMode throws", () => {
      expect(() => renderHook(useIsSystemMode)).toThrow("KairoProvider");
    });
  });
});
