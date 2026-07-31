import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, renderHook } from "@testing-library/react";
import { useContext, useRef } from "react";
import { KairoProvider } from "./kairo-provider";
import { KairoThemeContext } from "./theme-context";

function useThemeCtx() {
  return useContext(KairoThemeContext);
}

describe("KairoProvider target", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-kui-theme");
    document.documentElement.removeAttribute("data-kui-density");
  });

  afterEach(() => {
    document.documentElement.removeAttribute("data-kui-theme");
    document.documentElement.removeAttribute("data-kui-density");
  });

  describe("default root target", () => {
    it("applies to document.documentElement by default", () => {
      render(
        <KairoProvider defaultMode="dark">
          <div />
        </KairoProvider>,
      );
      expect(document.documentElement.getAttribute("data-kui-theme")).toBe("dark");
    });

    it("cleans up document.documentElement on unmount", () => {
      const { unmount } = render(
        <KairoProvider defaultMode="dark">
          <div />
        </KairoProvider>,
      );
      unmount();
      expect(document.documentElement.getAttribute("data-kui-theme")).toBeNull();
    });
  });

  describe("explicit element target", () => {
    it("applies to the provided element", () => {
      const target = document.createElement("div");
      document.body.appendChild(target);

      render(
        <KairoProvider defaultMode="dark" defaultDensity="compact" target={target}>
          <div />
        </KairoProvider>,
      );

      expect(target.getAttribute("data-kui-theme")).toBe("dark");
      expect(target.getAttribute("data-kui-density")).toBe("compact");
      // Should NOT apply to document.documentElement
      expect(document.documentElement.getAttribute("data-kui-theme")).toBeNull();

      document.body.removeChild(target);
    });

    it("cleans up the target on unmount", () => {
      const target = document.createElement("div");
      document.body.appendChild(target);

      const { unmount } = render(
        <KairoProvider defaultMode="dark" target={target}>
          <div />
        </KairoProvider>,
      );

      unmount();
      expect(target.getAttribute("data-kui-theme")).toBeNull();
      expect(target.getAttribute("data-kui-density")).toBeNull();

      document.body.removeChild(target);
    });
  });

  describe("ref target", () => {
    it("applies to element via ref", () => {
      const targetEl = document.createElement("div");
      document.body.appendChild(targetEl);

      function TestApp() {
        const ref = useRef<HTMLElement>(targetEl);
        return (
          <KairoProvider defaultMode="dark" target={ref}>
            <div />
          </KairoProvider>
        );
      }

      render(<TestApp />);
      expect(targetEl.getAttribute("data-kui-theme")).toBe("dark");

      document.body.removeChild(targetEl);
    });
  });

  describe("null target", () => {
    it("applies to document.documentElement when target is null", () => {
      render(
        <KairoProvider defaultMode="dark" target={null}>
          <div />
        </KairoProvider>,
      );
      expect(document.documentElement.getAttribute("data-kui-theme")).toBe("dark");
    });
  });

  describe("target does not affect theme state", () => {
    it("changing target does not recreate theme state", () => {
      const el1 = document.createElement("div");
      const el2 = document.createElement("div");
      document.body.appendChild(el1);
      document.body.appendChild(el2);

      const { rerender } = render(
        <KairoProvider defaultMode="dark" target={el1}>
          <div />
        </KairoProvider>,
      );

      expect(el1.getAttribute("data-kui-theme")).toBe("dark");

      rerender(
        <KairoProvider defaultMode="dark" target={el2}>
          <div />
        </KairoProvider>,
      );

      // Old target cleaned up, new target has attributes
      expect(el1.getAttribute("data-kui-theme")).toBeNull();
      expect(el2.getAttribute("data-kui-theme")).toBe("dark");

      document.body.removeChild(el1);
      document.body.removeChild(el2);
    });
  });

  describe("nested providers with separate targets", () => {
    it("parent and child use different targets", () => {
      const childTarget = document.createElement("div");
      document.body.appendChild(childTarget);

      function ChildReader() {
        const ctx = useContext(KairoThemeContext);
        return <span data-testid="child">{ctx.resolvedMode}</span>;
      }

      const { getByTestId } = render(
        <KairoProvider defaultMode="light">
          <KairoProvider defaultMode="dark" target={childTarget}>
            <ChildReader />
          </KairoProvider>
        </KairoProvider>,
      );

      // Parent applies to documentElement
      expect(document.documentElement.getAttribute("data-kui-theme")).toBe("light");
      // Child applies to its target
      expect(childTarget.getAttribute("data-kui-theme")).toBe("dark");
      expect(getByTestId("child").textContent).toBe("dark");

      document.body.removeChild(childTarget);
    });
  });

  describe("context still works with custom target", () => {
    it("hooks return correct values regardless of target", () => {
      const target = document.createElement("div");
      document.body.appendChild(target);

      const { result } = renderHook(useThemeCtx, {
        wrapper: ({ children }) => (
          <KairoProvider defaultMode="dark" defaultDensity="compact" target={target}>
            {children}
          </KairoProvider>
        ),
      });

      expect(result.current.mode).toBe("dark");
      expect(result.current.density).toBe("compact");

      document.body.removeChild(target);
    });
  });
});
