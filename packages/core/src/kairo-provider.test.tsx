import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, act, renderHook } from "@testing-library/react";
import { useContext } from "react";
import { KairoProvider } from "./kairo-provider";
import { KairoThemeContext } from "./theme-context";
import { createTheme } from "@kairoui/theme";

function ThemeReader() {
  const ctx = useContext(KairoThemeContext);
  return (
    <div data-testid="reader">
      <span data-testid="mode">{ctx.mode}</span>
      <span data-testid="resolved">{ctx.resolvedMode}</span>
      <span data-testid="density">{ctx.density}</span>
      <span data-testid="name">{ctx.themeName}</span>
      <span data-testid="nested">{String(ctx.isNested)}</span>
    </div>
  );
}

describe("KairoProvider", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-kui-theme");
    document.documentElement.removeAttribute("data-kui-density");
  });

  afterEach(() => {
    document.documentElement.removeAttribute("data-kui-theme");
    document.documentElement.removeAttribute("data-kui-density");
  });

  describe("default render", () => {
    it("renders children", () => {
      const { getByText } = render(
        <KairoProvider>
          <div>Hello</div>
        </KairoProvider>,
      );
      expect(getByText("Hello")).toBeDefined();
    });

    it("provides default mode as system", () => {
      const { getByTestId } = render(
        <KairoProvider>
          <ThemeReader />
        </KairoProvider>,
      );
      expect(getByTestId("mode").textContent).toBe("system");
    });

    it("provides default density as comfortable", () => {
      const { getByTestId } = render(
        <KairoProvider>
          <ThemeReader />
        </KairoProvider>,
      );
      expect(getByTestId("density").textContent).toBe("comfortable");
    });

    it("resolves mode to light or dark", () => {
      const { getByTestId } = render(
        <KairoProvider>
          <ThemeReader />
        </KairoProvider>,
      );
      const resolved = getByTestId("resolved").textContent;
      expect(resolved === "light" || resolved === "dark").toBe(true);
    });
  });

  describe("custom theme", () => {
    it("exposes theme name from definition", () => {
      const theme = createTheme({ name: "acme", base: "light" });
      const { getByTestId } = render(
        <KairoProvider theme={theme}>
          <ThemeReader />
        </KairoProvider>,
      );
      expect(getByTestId("name").textContent).toBe("acme");
    });

    it("has empty name when no theme provided", () => {
      const { getByTestId } = render(
        <KairoProvider>
          <ThemeReader />
        </KairoProvider>,
      );
      expect(getByTestId("name").textContent).toBe("");
    });
  });

  describe("default mode", () => {
    it("uses defaultMode when provided", () => {
      const { getByTestId } = render(
        <KairoProvider defaultMode="dark">
          <ThemeReader />
        </KairoProvider>,
      );
      expect(getByTestId("mode").textContent).toBe("dark");
      expect(getByTestId("resolved").textContent).toBe("dark");
    });

    it("uses defaultMode light", () => {
      const { getByTestId } = render(
        <KairoProvider defaultMode="light">
          <ThemeReader />
        </KairoProvider>,
      );
      expect(getByTestId("mode").textContent).toBe("light");
      expect(getByTestId("resolved").textContent).toBe("light");
    });
  });

  describe("default density", () => {
    it("uses defaultDensity when provided", () => {
      const { getByTestId } = render(
        <KairoProvider defaultDensity="compact">
          <ThemeReader />
        </KairoProvider>,
      );
      expect(getByTestId("density").textContent).toBe("compact");
    });
  });

  describe("DOM application", () => {
    it("sets data-kui-theme on html element", () => {
      render(
        <KairoProvider defaultMode="dark">
          <div />
        </KairoProvider>,
      );
      expect(document.documentElement.getAttribute("data-kui-theme")).toBe("dark");
    });

    it("sets data-kui-density on html element", () => {
      render(
        <KairoProvider defaultDensity="compact">
          <div />
        </KairoProvider>,
      );
      expect(document.documentElement.getAttribute("data-kui-density")).toBe("compact");
    });
  });

  describe("cleanup", () => {
    it("removes attributes on unmount", () => {
      const { unmount } = render(
        <KairoProvider defaultMode="dark">
          <div />
        </KairoProvider>,
      );
      expect(document.documentElement.getAttribute("data-kui-theme")).toBe("dark");

      unmount();

      expect(document.documentElement.getAttribute("data-kui-theme")).toBeNull();
      expect(document.documentElement.getAttribute("data-kui-density")).toBeNull();
    });
  });

  describe("context value", () => {
    it("provides setMode that updates mode", () => {
      const { result } = renderHook(() => useContext(KairoThemeContext), {
        wrapper: ({ children }) => <KairoProvider defaultMode="light">{children}</KairoProvider>,
      });

      expect(result.current.mode).toBe("light");

      act(() => {
        result.current.setMode("dark");
      });

      expect(result.current.mode).toBe("dark");
      expect(result.current.resolvedMode).toBe("dark");
    });

    it("provides setDensity that updates density", () => {
      const { result } = renderHook(() => useContext(KairoThemeContext), {
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

    it("isNested is false for root provider", () => {
      const { getByTestId } = render(
        <KairoProvider>
          <ThemeReader />
        </KairoProvider>,
      );
      expect(getByTestId("nested").textContent).toBe("false");
    });
  });

  describe("storage", () => {
    it("persists mode changes to localStorage", () => {
      const { result } = renderHook(() => useContext(KairoThemeContext), {
        wrapper: ({ children }) => <KairoProvider defaultMode="light">{children}</KairoProvider>,
      });

      act(() => {
        result.current.setMode("dark");
      });

      const stored = localStorage.getItem("kui-theme-preference");
      expect(stored).not.toBeNull();
      const parsed = JSON.parse(stored!) as Record<string, unknown>;
      expect(parsed["mode"]).toBe("dark");
    });

    it("reads persisted mode on mount when no defaultMode", () => {
      localStorage.setItem(
        "kui-theme-preference",
        JSON.stringify({ version: 1, mode: "dark", density: "compact" }),
      );

      const { getByTestId } = render(
        <KairoProvider>
          <ThemeReader />
        </KairoProvider>,
      );

      expect(getByTestId("mode").textContent).toBe("dark");
      expect(getByTestId("density").textContent).toBe("compact");
    });

    it("defaultMode overrides persisted value", () => {
      localStorage.setItem(
        "kui-theme-preference",
        JSON.stringify({ version: 1, mode: "dark", density: "compact" }),
      );

      const { getByTestId } = render(
        <KairoProvider defaultMode="light">
          <ThemeReader />
        </KairoProvider>,
      );

      expect(getByTestId("mode").textContent).toBe("light");
    });

    it("handles storage failure gracefully", () => {
      const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new Error("QuotaExceeded");
      });

      const { result } = renderHook(() => useContext(KairoThemeContext), {
        wrapper: ({ children }) => <KairoProvider defaultMode="light">{children}</KairoProvider>,
      });

      // Should not throw even when storage fails
      act(() => {
        result.current.setMode("dark");
      });

      expect(result.current.mode).toBe("dark");
      spy.mockRestore();
    });
  });
});
