import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { createElement } from "react";
import { renderAsChild } from "./as-child";

function noop() {}

describe("renderAsChild", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("asChild=false (default rendering)", () => {
    it("renders the default element", () => {
      const element = renderAsChild({
        asChild: false,
        defaultElement: "button",
        internalProps: { type: "button" },
        consumerProps: { "data-testid": "btn" },
        children: "Click",
        componentName: "Test",
      });
      render(element);
      const el = screen.getByTestId("btn");
      expect(el.tagName).toBe("BUTTON");
      expect(el.textContent).toBe("Click");
    });

    it("merges internal and consumer props", () => {
      const element = renderAsChild({
        asChild: false,
        defaultElement: "button",
        internalProps: { className: "internal" },
        consumerProps: { className: "consumer", "data-testid": "m" },
        children: "Text",
        componentName: "Test",
      });
      render(element);
      expect(screen.getByTestId("m").className).toContain("internal");
      expect(screen.getByTestId("m").className).toContain("consumer");
    });

    it("attaches internal ref", () => {
      const ref = { current: null as HTMLButtonElement | null };
      const element = renderAsChild({
        asChild: false,
        defaultElement: "button",
        internalProps: {},
        consumerProps: { "data-testid": "ref" },
        children: "Ref",
        componentName: "Test",
        internalRef: ref,
      });
      render(element);
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });
  });

  describe("asChild=true", () => {
    it("renders the child element instead of default", () => {
      const element = renderAsChild({
        asChild: true,
        defaultElement: "button",
        internalProps: { "aria-expanded": "true" },
        consumerProps: {},
        children: createElement("div", { "data-testid": "child" }, "Content"),
        componentName: "Test",
      });
      render(element);
      const el = screen.getByTestId("child");
      expect(el.tagName).toBe("DIV");
      expect(el.getAttribute("aria-expanded")).toBe("true");
    });

    it("merges internal props onto child", () => {
      const element = renderAsChild({
        asChild: true,
        defaultElement: "button",
        internalProps: { className: "internal", "data-state": "open" },
        consumerProps: {},
        children: createElement("span", { className: "child", "data-testid": "mc" }),
        componentName: "Test",
      });
      render(element);
      const el = screen.getByTestId("mc");
      expect(el.className).toContain("internal");
      expect(el.className).toContain("child");
      expect(el.getAttribute("data-state")).toBe("open");
    });

    it("composes event handlers (child first)", () => {
      const childHandler = vi.fn();
      const internalHandler = vi.fn();
      const element = renderAsChild({
        asChild: true,
        defaultElement: "button",
        internalProps: { onClick: internalHandler },
        consumerProps: {},
        children: createElement("button", { onClick: childHandler, "data-testid": "evt" }),
        componentName: "Test",
      });
      render(element);
      screen.getByTestId("evt").click();
      expect(childHandler).toHaveBeenCalled();
      expect(internalHandler).toHaveBeenCalled();
    });

    it("child can cancel internal via preventDefault", () => {
      const internalHandler = vi.fn();
      const childHandler = (e: { preventDefault: () => void }) => {
        e.preventDefault();
      };
      const element = renderAsChild({
        asChild: true,
        defaultElement: "button",
        internalProps: { onClick: internalHandler },
        consumerProps: {},
        children: createElement("button", { onClick: childHandler, "data-testid": "cancel" }),
        componentName: "Test",
      });
      render(element);
      screen.getByTestId("cancel").click();
      expect(internalHandler).not.toHaveBeenCalled();
    });

    it("composes refs (internal + child)", () => {
      const internalRef = { current: null as HTMLElement | null };
      const childRef = { current: null as HTMLElement | null };
      const element = renderAsChild({
        asChild: true,
        defaultElement: "button",
        internalProps: {},
        consumerProps: {},
        children: createElement("div", { ref: childRef, "data-testid": "refs" }),
        componentName: "Test",
        internalRef,
      });
      render(element);
      expect(internalRef.current).toBeInstanceOf(HTMLDivElement);
      expect(childRef.current).toBeInstanceOf(HTMLDivElement);
    });

    it("preserves child content", () => {
      const element = renderAsChild({
        asChild: true,
        defaultElement: "button",
        internalProps: {},
        consumerProps: {},
        children: createElement("span", { "data-testid": "content" }, "Keep me"),
        componentName: "Test",
      });
      render(element);
      expect(screen.getByTestId("content").textContent).toBe("Keep me");
    });
  });

  describe("validation", () => {
    it("warns when asChild has multiple children", () => {
      const spy = vi.spyOn(console, "warn").mockImplementation(noop);
      const element = renderAsChild({
        asChild: true,
        defaultElement: "button",
        internalProps: {},
        consumerProps: {},
        children: [createElement("span", { key: "1" }), createElement("span", { key: "2" })],
        componentName: "MyComp",
      });
      render(element);
      expect(spy).toHaveBeenCalledWith(expect.stringContaining("exactly one React element child"));
    });

    it("warns when asChild has non-element child", () => {
      const spy = vi.spyOn(console, "warn").mockImplementation(noop);
      const element = renderAsChild({
        asChild: true,
        defaultElement: "button",
        internalProps: {},
        consumerProps: { "data-testid": "fallback" },
        children: "just a string",
        componentName: "MyComp",
      });
      render(element);
      expect(spy).toHaveBeenCalledWith(expect.stringContaining("requires a React element child"));
      // Falls back to default rendering
      expect(screen.getByTestId("fallback").tagName).toBe("BUTTON");
    });
  });
});
