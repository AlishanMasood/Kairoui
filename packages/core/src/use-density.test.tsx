import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { KairoProvider } from "./kairo-provider";
import { KairoScopeProvider } from "./kairo-scope-provider";
import { useDensity } from "./use-density";

describe("useDensity", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-kui-theme");
    document.documentElement.removeAttribute("data-kui-density");
  });

  afterEach(() => {
    document.documentElement.removeAttribute("data-kui-theme");
    document.documentElement.removeAttribute("data-kui-density");
  });

  describe("every density mode", () => {
    it("returns comfortable", () => {
      const { result } = renderHook(useDensity, {
        wrapper: ({ children }) => (
          <KairoProvider defaultDensity="comfortable">{children}</KairoProvider>
        ),
      });
      expect(result.current.density).toBe("comfortable");
    });

    it("returns standard", () => {
      const { result } = renderHook(useDensity, {
        wrapper: ({ children }) => (
          <KairoProvider defaultDensity="standard">{children}</KairoProvider>
        ),
      });
      expect(result.current.density).toBe("standard");
    });

    it("returns compact", () => {
      const { result } = renderHook(useDensity, {
        wrapper: ({ children }) => (
          <KairoProvider defaultDensity="compact">{children}</KairoProvider>
        ),
      });
      expect(result.current.density).toBe("compact");
    });
  });

  describe("uncontrolled provider", () => {
    it("setDensity updates the density", () => {
      const { result } = renderHook(useDensity, {
        wrapper: ({ children }) => (
          <KairoProvider defaultDensity="comfortable">{children}</KairoProvider>
        ),
      });

      act(() => {
        result.current.setDensity("compact");
      });

      expect(result.current.density).toBe("compact");
    });

    it("can cycle through all densities", () => {
      const { result } = renderHook(useDensity, {
        wrapper: ({ children }) => (
          <KairoProvider defaultDensity="comfortable">{children}</KairoProvider>
        ),
      });

      act(() => {
        result.current.setDensity("standard");
      });
      expect(result.current.density).toBe("standard");

      act(() => {
        result.current.setDensity("compact");
      });
      expect(result.current.density).toBe("compact");

      act(() => {
        result.current.setDensity("comfortable");
      });
      expect(result.current.density).toBe("comfortable");
    });
  });

  describe("controlled provider", () => {
    it("calls onDensityChange when setDensity is called", () => {
      const onDensityChange = vi.fn();
      const { result } = renderHook(useDensity, {
        wrapper: ({ children }) => (
          <KairoProvider density="comfortable" onDensityChange={onDensityChange}>
            {children}
          </KairoProvider>
        ),
      });

      act(() => {
        result.current.setDensity("compact");
      });

      expect(onDensityChange).toHaveBeenCalledWith("compact");
    });

    it("does not overwrite controlled density", () => {
      const { result } = renderHook(useDensity, {
        wrapper: ({ children }) => <KairoProvider density="comfortable">{children}</KairoProvider>,
      });

      act(() => {
        result.current.setDensity("compact");
      });

      expect(result.current.density).toBe("comfortable");
    });
  });

  describe("nested density override", () => {
    it("returns scoped density", () => {
      const { result } = renderHook(useDensity, {
        wrapper: ({ children }) => (
          <KairoProvider defaultDensity="comfortable">
            <KairoScopeProvider density="compact">{children}</KairoScopeProvider>
          </KairoProvider>
        ),
      });

      expect(result.current.density).toBe("compact");
    });

    it("setDensity in scope calls scope handler", () => {
      const onDensityChange = vi.fn();
      const { result } = renderHook(useDensity, {
        wrapper: ({ children }) => (
          <KairoProvider defaultDensity="comfortable">
            <KairoScopeProvider density="compact" onDensityChange={onDensityChange}>
              {children}
            </KairoScopeProvider>
          </KairoProvider>
        ),
      });

      act(() => {
        result.current.setDensity("standard");
      });

      expect(onDensityChange).toHaveBeenCalledWith("standard");
    });
  });

  describe("stable setter", () => {
    it("setDensity reference is stable across renders", () => {
      const { result, rerender } = renderHook(useDensity, {
        wrapper: ({ children }) => (
          <KairoProvider defaultDensity="comfortable">{children}</KairoProvider>
        ),
      });

      const firstSetter = result.current.setDensity;
      rerender();
      expect(result.current.setDensity).toBe(firstSetter);
    });

    it("result object is stable when density unchanged", () => {
      const { result, rerender } = renderHook(useDensity, {
        wrapper: ({ children }) => (
          <KairoProvider defaultDensity="comfortable">{children}</KairoProvider>
        ),
      });

      const first = result.current;
      rerender();
      expect(result.current).toBe(first);
    });
  });

  describe("outside provider", () => {
    it("throws with actionable error", () => {
      expect(() => renderHook(useDensity)).toThrow("useDensity()");
      expect(() => renderHook(useDensity)).toThrow("KairoProvider");
    });
  });
});
