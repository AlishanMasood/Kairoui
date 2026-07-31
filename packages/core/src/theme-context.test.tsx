import { describe, it, expect } from "vitest";
import { useContext } from "react";
import { renderHook } from "@testing-library/react";
import { KairoThemeContext, isOutsideProvider, getSentinelValue } from "./theme-context";
import type { KairoThemeContextValue, InternalThemeContextValue } from "./theme-context";

describe("KairoThemeContext", () => {
  describe("sentinel value (outside provider)", () => {
    it("provides default mode as system", () => {
      const { result } = renderHook(() => useContext(KairoThemeContext));
      expect(result.current.mode).toBe("system");
    });

    it("provides default resolvedMode as light", () => {
      const { result } = renderHook(() => useContext(KairoThemeContext));
      expect(result.current.resolvedMode).toBe("light");
    });

    it("provides default density as comfortable", () => {
      const { result } = renderHook(() => useContext(KairoThemeContext));
      expect(result.current.density).toBe("comfortable");
    });

    it("provides empty themeName", () => {
      const { result } = renderHook(() => useContext(KairoThemeContext));
      expect(result.current.themeName).toBe("");
    });

    it("isNested is false", () => {
      const { result } = renderHook(() => useContext(KairoThemeContext));
      expect(result.current.isNested).toBe(false);
    });

    it("setMode throws with helpful message", () => {
      const { result } = renderHook(() => useContext(KairoThemeContext));
      expect(() => {
        result.current.setMode("dark");
      }).toThrow("outside of KairoProvider");
    });

    it("setDensity throws with helpful message", () => {
      const { result } = renderHook(() => useContext(KairoThemeContext));
      expect(() => {
        result.current.setDensity("compact");
      }).toThrow("outside of KairoProvider");
    });

    it("definition is null outside provider", () => {
      const { result } = renderHook(() => useContext(KairoThemeContext));
      expect(result.current.definition).toBeNull();
    });

    it("scopeId is empty outside provider", () => {
      const { result } = renderHook(() => useContext(KairoThemeContext));
      expect(result.current.scopeId).toBe("");
    });
  });

  describe("isOutsideProvider", () => {
    it("returns true for sentinel value", () => {
      const sentinel = getSentinelValue();
      expect(isOutsideProvider(sentinel)).toBe(true);
    });

    it("returns false for a custom value", () => {
      const custom: InternalThemeContextValue = {
        mode: "dark",
        resolvedMode: "dark",
        density: "compact",
        themeName: "test",
        isNested: false,
        definition: null,
        scopeId: "scope-1",
        setMode: () => {},
        setDensity: () => {},
      };
      expect(isOutsideProvider(custom)).toBe(false);
    });
  });

  describe("context displayName", () => {
    it("has KairoThemeContext displayName", () => {
      expect(KairoThemeContext.displayName).toBe("KairoThemeContext");
    });
  });

  describe("type contracts", () => {
    it("public type has required fields", () => {
      // Type-level check: KairoThemeContextValue has the public interface
      const value: KairoThemeContextValue = {
        mode: "light",
        resolvedMode: "light",
        density: "comfortable",
        themeName: "test",
        isNested: false,
        setMode: () => {},
        setDensity: () => {},
      };
      expect(value.mode).toBe("light");
    });

    it("internal type extends public type", () => {
      const internal: InternalThemeContextValue = {
        mode: "dark",
        resolvedMode: "dark",
        density: "compact",
        themeName: "internal",
        isNested: true,
        definition: null,
        scopeId: "s1",
        setMode: () => {},
        setDensity: () => {},
      };
      // Internal satisfies public
      const pub: KairoThemeContextValue = internal;
      expect(pub.mode).toBe("dark");
    });
  });

  describe("sentinel stability", () => {
    it("getSentinelValue returns the same reference", () => {
      const a = getSentinelValue();
      const b = getSentinelValue();
      expect(a).toBe(b);
    });
  });
});
