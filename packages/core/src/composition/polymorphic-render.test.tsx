import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { createElement } from "react";
import type { Ref } from "react";
import { createPolymorphicComponent, renderPolymorphic } from "./polymorphic-render";

describe("createPolymorphicComponent", () => {
  it("renders as the default element", () => {
    const Button = createPolymorphicComponent({
      displayName: "Button",
      defaultElement: "button",
      useProps: (_props, ref) => ({ ref, type: "button" }),
    });

    render(createElement(Button, { "data-testid": "btn" }, "Click"));
    const el = screen.getByTestId("btn");
    expect(el.tagName).toBe("BUTTON");
    expect(el.getAttribute("type")).toBe("button");
  });

  it("renders as a different element via `as`", () => {
    const Button = createPolymorphicComponent({
      displayName: "Button",
      defaultElement: "button",
      useProps: (_props, ref) => ({ ref }),
    });

    render(createElement(Button, { as: "a", href: "/", "data-testid": "link" }, "Go"));
    const el = screen.getByTestId("link");
    expect(el.tagName).toBe("A");
    expect(el.getAttribute("href")).toBe("/");
  });

  it("forwards ref to the rendered element", () => {
    const ref = { current: null as HTMLButtonElement | null };
    const Button = createPolymorphicComponent({
      displayName: "Button",
      defaultElement: "button",
      useProps: (_props, r) => ({ ref: r }),
    });

    render(createElement(Button, { ref, "data-testid": "ref-btn" }, "Ref"));
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it("merges internal props with consumer props", () => {
    const Button = createPolymorphicComponent({
      displayName: "Button",
      defaultElement: "button",
      useProps: () => ({ className: "internal", "aria-label": "internal-label" }),
    });

    render(createElement(Button, { className: "consumer", "data-testid": "merged" }, "Merge"));
    const el = screen.getByTestId("merged");
    expect(el.className).toContain("internal");
    expect(el.className).toContain("consumer");
  });

  it("composes event handlers (consumer can cancel internal)", () => {
    const internal = vi.fn();
    const Button = createPolymorphicComponent({
      displayName: "Button",
      defaultElement: "button",
      useProps: () => ({ onClick: internal }),
    });

    const consumer = vi.fn((e: { preventDefault: () => void }) => {
      e.preventDefault();
    });
    render(createElement(Button, { onClick: consumer, "data-testid": "evt" }, "Event"));
    screen.getByTestId("evt").click();
    expect(consumer).toHaveBeenCalled();
    expect(internal).not.toHaveBeenCalled();
  });

  it("sets displayName", () => {
    const Comp = createPolymorphicComponent({
      displayName: "MyComponent",
      defaultElement: "div",
      useProps: () => ({}),
    });
    expect(Comp.displayName).toBe("MyComponent");
  });

  it("passes own props to useProps", () => {
    interface OwnProps {
      variant: string;
    }
    const useProps = vi.fn((_props: OwnProps, ref: Ref<unknown>) => ({
      ref,
      "data-variant": _props.variant,
    }));

    const Button = createPolymorphicComponent<OwnProps, "button">({
      displayName: "Button",
      defaultElement: "button",
      useProps: useProps,
    });

    render(
      createElement(Button, { variant: "primary", "data-testid": "own" } as Record<
        string,
        unknown
      >),
    );
    expect(useProps).toHaveBeenCalled();
  });
});

describe("renderPolymorphic", () => {
  it("renders an element with merged props", () => {
    const element = renderPolymorphic(
      "button",
      { className: "internal", type: "button" },
      { className: "consumer", "data-testid": "rp" },
    );
    render(element);
    const el = screen.getByTestId("rp");
    expect(el.tagName).toBe("BUTTON");
    expect(el.className).toContain("internal");
    expect(el.className).toContain("consumer");
  });

  it("renders a custom component", () => {
    function Custom(props: Record<string, unknown>) {
      return createElement("span", props);
    }
    const element = renderPolymorphic(
      Custom,
      { "data-internal": "yes" },
      { "data-testid": "custom" },
    );
    render(element);
    expect(screen.getByTestId("custom").tagName).toBe("SPAN");
  });
});
