import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { createElement } from "react";
import { createPolymorphicComponent } from "./polymorphic-render";

describe("Polymorphic system validation", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("native prop filtering", () => {
    it("passes valid native props to button", () => {
      const Button = createPolymorphicComponent({
        displayName: "Button",
        defaultElement: "button",
        useProps: (_p, ref) => ({ ref }),
      });

      render(createElement(Button, { disabled: true, type: "submit", "data-testid": "np" }, "Go"));
      const el = screen.getByTestId("np");
      expect(el.disabled).toBe(true);
      expect(el.type).toBe("submit");
    });

    it("passes valid native props when as=a", () => {
      const Button = createPolymorphicComponent({
        displayName: "Button",
        defaultElement: "button",
        useProps: (_p, ref) => ({ ref }),
      });

      render(
        createElement(
          Button,
          { as: "a", href: "/page", target: "_blank", "data-testid": "link" },
          "Link",
        ),
      );
      const el = screen.getByTestId("link");
      expect(el.tagName).toBe("A");
      expect(el.href).toContain("/page");
      expect(el.target).toBe("_blank");
    });
  });

  describe("accessibility preservation", () => {
    it("preserves consumer aria-label", () => {
      const Button = createPolymorphicComponent({
        displayName: "Button",
        defaultElement: "button",
        useProps: (_p, ref) => ({ ref, "aria-label": "internal" }),
      });

      render(createElement(Button, { "aria-label": "consumer", "data-testid": "a11y" }));
      // Consumer scalar ARIA overrides internal per mergeProps
      expect(screen.getByTestId("a11y").getAttribute("aria-label")).toBe("consumer");
    });

    it("reconciles aria-labelledby (both preserved)", () => {
      const Button = createPolymorphicComponent({
        displayName: "Button",
        defaultElement: "button",
        useProps: (_p, ref) => ({ ref, "aria-labelledby": "internal-id" }),
      });

      render(createElement(Button, { "aria-labelledby": "consumer-id", "data-testid": "lb" }));
      const val = screen.getByTestId("lb").getAttribute("aria-labelledby");
      expect(val).toContain("internal-id");
      expect(val).toContain("consumer-id");
    });

    it("preserves role from internal props", () => {
      const Button = createPolymorphicComponent({
        displayName: "Button",
        defaultElement: "div",
        useProps: (_p, ref) => ({ ref, role: "button" }),
      });

      render(createElement(Button, { "data-testid": "role" }));
      expect(screen.getByTestId("role").getAttribute("role")).toBe("button");
    });

    it("consumer aria-disabled overrides state", () => {
      const Button = createPolymorphicComponent({
        displayName: "Button",
        defaultElement: "button",
        useProps: (_p, ref) => ({ ref, "aria-disabled": "true" }),
      });

      render(createElement(Button, { "aria-disabled": "false", "data-testid": "dis" }));
      expect(screen.getByTestId("dis").getAttribute("aria-disabled")).toBe("false");
    });
  });

  describe("ref validation", () => {
    it("callback ref receives the element", () => {
      const callback = vi.fn();
      const Button = createPolymorphicComponent({
        displayName: "Button",
        defaultElement: "button",
        useProps: (_p, ref) => ({ ref }),
      });

      render(createElement(Button, { ref: callback, "data-testid": "cbref" }));
      expect(callback).toHaveBeenCalledWith(expect.any(HTMLButtonElement));
    });

    it("object ref receives null on unmount", () => {
      const ref = { current: null as HTMLButtonElement | null };
      const Button = createPolymorphicComponent({
        displayName: "Button",
        defaultElement: "button",
        useProps: (_p, r) => ({ ref: r }),
      });

      const { unmount } = render(createElement(Button, { ref }));
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
      unmount();
      expect(ref.current).toBeNull();
    });

    it("object ref receives the correct element type when as changes", () => {
      const ref = { current: null as HTMLElement | null };
      const Button = createPolymorphicComponent({
        displayName: "Button",
        defaultElement: "button",
        useProps: (_p, r) => ({ ref: r }),
      });

      render(createElement(Button, { as: "a", ref, "data-testid": "refas" }));
      expect(ref.current).toBeInstanceOf(HTMLAnchorElement);
    });
  });

  describe("event type preservation", () => {
    it("click event fires on button", () => {
      const onClick = vi.fn();
      const Button = createPolymorphicComponent({
        displayName: "Button",
        defaultElement: "button",
        useProps: (_p, ref) => ({ ref }),
      });

      render(createElement(Button, { onClick, "data-testid": "evtbtn" }));
      screen.getByTestId("evtbtn").click();
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it("click event fires on custom element target", () => {
      const onClick = vi.fn();
      const Button = createPolymorphicComponent({
        displayName: "Button",
        defaultElement: "button",
        useProps: (_p, ref) => ({ ref }),
      });

      render(createElement(Button, { as: "div", onClick, "data-testid": "evtdiv" }));
      screen.getByTestId("evtdiv").click();
      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });

  describe("custom component as target", () => {
    it("renders custom component via as prop", () => {
      function CustomLink(props: Record<string, unknown>) {
        return createElement("a", { ...props, "data-custom": "true" });
      }

      const Button = createPolymorphicComponent({
        displayName: "Button",
        defaultElement: "button",
        useProps: (_p, ref) => ({ ref }),
      });

      render(createElement(Button, { as: CustomLink, "data-testid": "custom" }));
      const el = screen.getByTestId("custom");
      expect(el.tagName).toBe("A");
      expect(el.getAttribute("data-custom")).toBe("true");
    });
  });

  describe("children handling", () => {
    it("renders children content", () => {
      const Button = createPolymorphicComponent({
        displayName: "Button",
        defaultElement: "button",
        useProps: (_p, ref) => ({ ref }),
      });

      render(createElement(Button, { "data-testid": "child" }, "Hello World"));
      expect(screen.getByTestId("child").textContent).toBe("Hello World");
    });

    it("renders complex children", () => {
      const Button = createPolymorphicComponent({
        displayName: "Button",
        defaultElement: "button",
        useProps: (_p, ref) => ({ ref }),
      });

      render(
        createElement(
          Button,
          { "data-testid": "complex" },
          createElement("span", null, "Icon"),
          " Text",
        ),
      );
      expect(screen.getByTestId("complex").textContent).toBe("Icon Text");
    });
  });

  describe("data attribute preservation", () => {
    it("consumer data attributes are preserved", () => {
      const Button = createPolymorphicComponent({
        displayName: "Button",
        defaultElement: "button",
        useProps: (_p, ref) => ({ ref, "data-internal": "yes" }),
      });

      render(createElement(Button, { "data-consumer": "custom", "data-testid": "dattr" }));
      const el = screen.getByTestId("dattr");
      expect(el.getAttribute("data-internal")).toBe("yes");
      expect(el.getAttribute("data-consumer")).toBe("custom");
    });
  });
});
