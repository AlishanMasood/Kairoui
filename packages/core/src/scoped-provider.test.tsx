import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, act, renderHook } from "@testing-library/react";
import { useContext } from "react";
import { KairoProvider } from "./kairo-provider";
import { KairoScopeProvider } from "./kairo-scope-provider";
import { KairoThemeContext } from "./theme-context";

function useThemeCtx() {
  return useContext(KairoThemeContext);
}

describe("KairoScopeProvider", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-kui-theme");
    document.documentElement.removeAttribute("data-kui-density");
  });

  afterEach(() => {
    document.documentElement.removeAttribute("data-kui-theme");
    document.documentElement.removeAttribute("data-kui-density");
  });

  describe("nested inheritance", () => {
    it("inherits mode from parent", () => {
      const { result } = renderHook(useThemeCtx, {
        wrapper: ({ children }) => (
          <KairoProvider defaultMode="dark">
            <KairoScopeProvider>{children}</KairoScopeProvider>
          </KairoProvider>
        ),
      });
      expect(result.current.mode).toBe("dark");
      expect(result.current.resolvedMode).toBe("dark");
    });

    it("inherits density from parent", () => {
      const { result } = renderHook(useThemeCtx, {
        wrapper: ({ children }) => (
          <KairoProvider defaultDensity="compact">
            <KairoScopeProvider>{children}</KairoScopeProvider>
          </KairoProvider>
        ),
      });
      expect(result.current.density).toBe("compact");
    });

    it("inherits theme name from parent", async () => {
      const { createTheme } = await import("@kairoui/theme");
      const theme = createTheme({ name: "acme", base: "light" });
      const { result } = renderHook(useThemeCtx, {
        wrapper: ({ children }) => (
          <KairoProvider theme={theme}>
            <KairoScopeProvider>{children}</KairoScopeProvider>
          </KairoProvider>
        ),
      });
      expect(result.current.themeName).toBe("acme");
    });

    it("isNested is true for scoped providers", () => {
      const { result } = renderHook(useThemeCtx, {
        wrapper: ({ children }) => (
          <KairoProvider>
            <KairoScopeProvider>{children}</KairoScopeProvider>
          </KairoProvider>
        ),
      });
      expect(result.current.isNested).toBe(true);
    });
  });

  describe("local dark scope", () => {
    it("overrides mode to dark", () => {
      const { result } = renderHook(useThemeCtx, {
        wrapper: ({ children }) => (
          <KairoProvider defaultMode="light">
            <KairoScopeProvider mode="dark">{children}</KairoScopeProvider>
          </KairoProvider>
        ),
      });
      expect(result.current.mode).toBe("dark");
      expect(result.current.resolvedMode).toBe("dark");
    });

    it("renders a div with dark data attribute", () => {
      const { container } = render(
        <KairoProvider defaultMode="light">
          <KairoScopeProvider mode="dark">
            <span>content</span>
          </KairoScopeProvider>
        </KairoProvider>,
      );
      const scope = container.querySelector("[data-kui-scope]");
      expect(scope).not.toBeNull();
      expect(scope?.getAttribute("data-kui-theme")).toBe("dark");
    });

    it("does not change document.documentElement", () => {
      render(
        <KairoProvider defaultMode="light">
          <KairoScopeProvider mode="dark">
            <span>content</span>
          </KairoScopeProvider>
        </KairoProvider>,
      );
      expect(document.documentElement.getAttribute("data-kui-theme")).toBe("light");
    });
  });

  describe("local compact scope", () => {
    it("overrides density to compact", () => {
      const { result } = renderHook(useThemeCtx, {
        wrapper: ({ children }) => (
          <KairoProvider defaultDensity="comfortable">
            <KairoScopeProvider density="compact">{children}</KairoScopeProvider>
          </KairoProvider>
        ),
      });
      expect(result.current.density).toBe("compact");
    });

    it("renders scope div with compact density attribute", () => {
      const { container } = render(
        <KairoProvider defaultDensity="comfortable">
          <KairoScopeProvider density="compact">
            <span>content</span>
          </KairoScopeProvider>
        </KairoProvider>,
      );
      const scope = container.querySelector("[data-kui-scope]");
      expect(scope?.getAttribute("data-kui-density")).toBe("compact");
    });
  });

  describe("multiple siblings", () => {
    it("sibling scopes are independent", () => {
      function Reader({ testId }: { testId: string }) {
        const ctx = useContext(KairoThemeContext);
        return (
          <span data-testid={testId}>
            {ctx.resolvedMode},{ctx.density}
          </span>
        );
      }

      const { getByTestId } = render(
        <KairoProvider defaultMode="light" defaultDensity="comfortable">
          <KairoScopeProvider mode="dark">
            <Reader testId="a" />
          </KairoScopeProvider>
          <KairoScopeProvider density="compact">
            <Reader testId="b" />
          </KairoScopeProvider>
        </KairoProvider>,
      );

      // Scope A: dark mode, inherits comfortable density
      expect(getByTestId("a").textContent).toBe("dark,comfortable");
      // Scope B: inherits light mode, compact density
      expect(getByTestId("b").textContent).toBe("light,compact");
    });
  });

  describe("unmount cleanup", () => {
    it("removing scope does not affect parent", () => {
      function ToggleScope({ show }: { show: boolean }) {
        const ctx = useContext(KairoThemeContext);
        return (
          <>
            <span data-testid="parent-mode">{ctx.mode}</span>
            {show && (
              <KairoScopeProvider mode="dark">
                <span>scoped</span>
              </KairoScopeProvider>
            )}
          </>
        );
      }

      const { getByTestId, rerender } = render(
        <KairoProvider defaultMode="light">
          <ToggleScope show={true} />
        </KairoProvider>,
      );

      expect(getByTestId("parent-mode").textContent).toBe("light");

      rerender(
        <KairoProvider defaultMode="light">
          <ToggleScope show={false} />
        </KairoProvider>,
      );

      expect(getByTestId("parent-mode").textContent).toBe("light");
      expect(document.documentElement.getAttribute("data-kui-theme")).toBe("light");
    });
  });

  describe("local controlled mode", () => {
    it("calls onModeChange when setMode is called in scope", () => {
      const onModeChange = vi.fn();
      const { result } = renderHook(useThemeCtx, {
        wrapper: ({ children }) => (
          <KairoProvider defaultMode="light">
            <KairoScopeProvider mode="dark" onModeChange={onModeChange}>
              {children}
            </KairoScopeProvider>
          </KairoProvider>
        ),
      });

      act(() => {
        result.current.setMode("light");
      });

      expect(onModeChange).toHaveBeenCalledWith("light");
    });

    it("does not persist scoped mode changes", () => {
      const { result } = renderHook(useThemeCtx, {
        wrapper: ({ children }) => (
          <KairoProvider defaultMode="light">
            <KairoScopeProvider defaultMode="dark">{children}</KairoScopeProvider>
          </KairoProvider>
        ),
      });

      act(() => {
        result.current.setMode("light");
      });

      // Scoped providers don't persist
      const stored = localStorage.getItem("kui-theme-preference");
      expect(stored).toBeNull();
    });
  });

  describe("deep nesting", () => {
    it("supports three levels of nesting", () => {
      function Reader({ testId }: { testId: string }) {
        const ctx = useContext(KairoThemeContext);
        return (
          <span data-testid={testId}>
            {ctx.resolvedMode},{ctx.density},{String(ctx.isNested)}
          </span>
        );
      }

      const { getByTestId } = render(
        <KairoProvider defaultMode="light" defaultDensity="comfortable">
          <Reader testId="level-0" />
          <KairoScopeProvider mode="dark">
            <Reader testId="level-1" />
            <KairoScopeProvider density="compact">
              <Reader testId="level-2" />
            </KairoScopeProvider>
          </KairoScopeProvider>
        </KairoProvider>,
      );

      expect(getByTestId("level-0").textContent).toBe("light,comfortable,false");
      expect(getByTestId("level-1").textContent).toBe("dark,comfortable,true");
      expect(getByTestId("level-2").textContent).toBe("dark,compact,true");
    });
  });

  describe("scope element attributes", () => {
    it("uses display: contents to avoid layout impact", () => {
      const { container } = render(
        <KairoProvider>
          <KairoScopeProvider mode="dark">
            <span>content</span>
          </KairoScopeProvider>
        </KairoProvider>,
      );
      const scope = container.querySelector("[data-kui-scope]") as HTMLElement;
      expect(scope.style.display).toBe("contents");
    });

    it("has a unique data-kui-scope attribute", () => {
      const { container } = render(
        <KairoProvider>
          <KairoScopeProvider mode="dark">
            <span>a</span>
          </KairoScopeProvider>
          <KairoScopeProvider mode="light">
            <span>b</span>
          </KairoScopeProvider>
        </KairoProvider>,
      );
      const scopes = container.querySelectorAll("[data-kui-scope]");
      expect(scopes.length).toBe(2);
      expect(scopes[0]?.getAttribute("data-kui-scope")).not.toBe(
        scopes[1]?.getAttribute("data-kui-scope"),
      );
    });
  });
});
