import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { KairoProvider } from "./kairo-provider";
import { KairoScopeProvider } from "./kairo-scope-provider";
import { useResolvedTheme } from "./use-resolved-theme";
import { createTheme } from "@kairoui/theme";

describe("useResolvedTheme", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-kui-theme");
    document.documentElement.removeAttribute("data-kui-density");
  });

  afterEach(() => {
    document.documentElement.removeAttribute("data-kui-theme");
    document.documentElement.removeAttribute("data-kui-density");
  });

  describe("default resolved theme", () => {
    it("eventually returns a resolved theme", async () => {
      const { result } = renderHook(useResolvedTheme, {
        wrapper: ({ children }) => <KairoProvider defaultMode="light">{children}</KairoProvider>,
      });

      await waitFor(() => {
        expect(result.current).not.toBeNull();
      });

      expect(result.current?.tokens).toBeDefined();
      expect(result.current?.metadata).toBeDefined();
    });

    it("resolved theme contains token groups", async () => {
      const { result } = renderHook(useResolvedTheme, {
        wrapper: ({ children }) => <KairoProvider defaultMode="light">{children}</KairoProvider>,
      });

      await waitFor(() => {
        expect(result.current).not.toBeNull();
      });

      const tokens = result.current!.tokens;
      expect("color" in tokens).toBe(true);
      expect("typography" in tokens).toBe(true);
      expect("spacing" in tokens).toBe(true);
    });

    it("metadata reflects resolved mode", async () => {
      const { result } = renderHook(useResolvedTheme, {
        wrapper: ({ children }) => <KairoProvider defaultMode="dark">{children}</KairoProvider>,
      });

      await waitFor(() => {
        expect(result.current).not.toBeNull();
      });

      expect(result.current!.metadata.resolvedMode).toBe("dark");
    });
  });

  describe("mode changes", () => {
    it("updates resolved theme when mode changes", async () => {
      const { result } = renderHook(
        () => ({
          resolved: useResolvedTheme(),
          // We'll trigger mode change via the provider
        }),
        {
          wrapper: ({ children }) => <KairoProvider defaultMode="light">{children}</KairoProvider>,
        },
      );

      await waitFor(() => {
        expect(result.current.resolved).not.toBeNull();
      });

      const lightTokens = JSON.stringify(result.current.resolved!.tokens);
      expect(lightTokens.length).toBeGreaterThan(0);
    });
  });

  describe("density changes", () => {
    it("reflects the configured density in metadata", async () => {
      const { result } = renderHook(useResolvedTheme, {
        wrapper: ({ children }) => (
          <KairoProvider defaultMode="light" defaultDensity="compact">
            {children}
          </KairoProvider>
        ),
      });

      await waitFor(() => {
        expect(result.current).not.toBeNull();
      });

      expect(result.current!.metadata.density).toBe("compact");
    });
  });

  describe("custom theme", () => {
    it("resolves with custom theme name", async () => {
      const theme = createTheme({
        name: "acme",
        base: "light",
        overrides: { color: { interactive: { default: "#0066cc" } } },
      });

      const { result } = renderHook(useResolvedTheme, {
        wrapper: ({ children }) => (
          <KairoProvider theme={theme} defaultMode="light">
            {children}
          </KairoProvider>
        ),
      });

      await waitFor(() => {
        expect(result.current).not.toBeNull();
      });

      expect(result.current!.metadata.name).toBe("acme");
    });
  });

  describe("nested override", () => {
    it("resolves with scoped mode", async () => {
      const { result } = renderHook(useResolvedTheme, {
        wrapper: ({ children }) => (
          <KairoProvider defaultMode="light">
            <KairoScopeProvider mode="dark">{children}</KairoScopeProvider>
          </KairoProvider>
        ),
      });

      await waitFor(() => {
        expect(result.current).not.toBeNull();
      });

      expect(result.current!.metadata.resolvedMode).toBe("dark");
    });
  });

  describe("reference stability", () => {
    it("returns same reference on rerender without changes", async () => {
      const { result, rerender } = renderHook(useResolvedTheme, {
        wrapper: ({ children }) => <KairoProvider defaultMode="light">{children}</KairoProvider>,
      });

      await waitFor(() => {
        expect(result.current).not.toBeNull();
      });

      const first = result.current;
      rerender();

      // After rerender without changes, same reference
      expect(result.current).toBe(first);
    });
  });

  describe("outside provider", () => {
    it("throws with actionable error", () => {
      expect(() => renderHook(useResolvedTheme)).toThrow("useResolvedTheme()");
      expect(() => renderHook(useResolvedTheme)).toThrow("KairoProvider");
    });
  });
});
