import { describe, it, expect, vi, afterEach, expectTypeOf } from "vitest";
import { createRef, forwardRef, StrictMode } from "react";
import { render, screen, cleanup } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { Button, buttonStyleContract } from "./index";
import type { ButtonOwnProps, ButtonAppearance, ButtonSize } from "./index";
import type { PolymorphicProps } from "../../composition/polymorphic-types";
import { componentClass, slotClass } from "../../composition/class-generation";
import { generateComponentCss } from "../../composition/generate-css";

afterEach(cleanup);

// ─── Fixtures ───────────────────────────────────────────────────────

interface RouterLinkProps {
  to: string;
  children?: React.ReactNode;
  className?: string;
  "data-testid"?: string;
  onClick?: React.MouseEventHandler;
}

const RouterLink = forwardRef<HTMLAnchorElement, RouterLinkProps>((props, ref) => {
  const { to, children, ...rest } = props;
  return (
    <a {...rest} href={to} ref={ref} data-router-link="true">
      {children}
    </a>
  );
});
RouterLink.displayName = "RouterLink";

// ─── Default rendering ──────────────────────────────────────────────

describe("Button: default rendering", () => {
  it("renders as button element by default", () => {
    render(<Button data-testid="btn">Save</Button>);
    expect(screen.getByTestId("btn").tagName).toBe("BUTTON");
  });

  it("renders children in content slot", () => {
    render(<Button data-testid="btn">Save</Button>);
    expect(screen.getByTestId("btn").textContent).toContain("Save");
  });

  it("applies data-kui-component metadata", () => {
    render(<Button data-testid="btn">Click</Button>);
    expect(screen.getByTestId("btn").getAttribute("data-kui-component")).toBe("Button");
  });

  it("applies type=button by default", () => {
    render(<Button data-testid="btn">Click</Button>);
    expect(screen.getByTestId("btn").getAttribute("type")).toBe("button");
  });

  it("applies type=submit", () => {
    render(
      <Button data-testid="btn" type="submit">
        Submit
      </Button>,
    );
    expect(screen.getByTestId("btn").getAttribute("type")).toBe("submit");
  });

  it("applies type=reset", () => {
    render(
      <Button data-testid="btn" type="reset">
        Reset
      </Button>,
    );
    expect(screen.getByTestId("btn").getAttribute("type")).toBe("reset");
  });

  it("applies className", () => {
    render(
      <Button data-testid="btn" className="custom">
        Click
      </Button>,
    );
    expect(screen.getByTestId("btn").className).toContain("custom");
  });

  it("applies style", () => {
    render(
      <Button data-testid="btn" style={{ color: "red" }}>
        Click
      </Button>,
    );
    expect(screen.getByTestId("btn").style.color).toBe("red");
  });

  it("has data-state=default when idle", () => {
    render(<Button data-testid="btn">Click</Button>);
    expect(screen.getByTestId("btn").getAttribute("data-state")).toBe("default");
  });
});

// ─── Slot rendering ─────────────────────────────────────────────────

describe("Button: slots", () => {
  it("renders startIcon slot when provided", () => {
    render(
      <Button data-testid="btn" startIcon={<span data-testid="icon">★</span>}>
        Save
      </Button>,
    );
    expect(screen.getByTestId("icon").textContent).toBe("★");
  });

  it("renders endIcon slot when provided", () => {
    render(
      <Button data-testid="btn" endIcon={<span data-testid="end">→</span>}>
        Next
      </Button>,
    );
    expect(screen.getByTestId("end").textContent).toBe("→");
  });

  it("does not render startIcon slot when not provided", () => {
    render(<Button data-testid="btn">Save</Button>);
    expect(screen.getByTestId("btn").querySelector("[data-kui-slot='startIcon']")).toBeNull();
  });

  it("does not render endIcon slot when not provided", () => {
    render(<Button data-testid="btn">Save</Button>);
    expect(screen.getByTestId("btn").querySelector("[data-kui-slot='endIcon']")).toBeNull();
  });

  it("renders loadingIndicator slot when loading", () => {
    render(
      <Button data-testid="btn" loading>
        Save
      </Button>,
    );
    expect(screen.getByTestId("btn").textContent).toContain("Loading…");
  });

  it("does not render loadingIndicator when not loading", () => {
    render(<Button data-testid="btn">Save</Button>);
    expect(screen.getByTestId("btn").textContent).not.toContain("Loading…");
  });

  it("applies aria-hidden to icon slots", () => {
    render(
      <Button startIcon={<span>★</span>} endIcon={<span>→</span>} data-testid="btn">
        Save
      </Button>,
    );
    const btn = screen.getByTestId("btn");
    expect(btn.querySelector("[data-kui-slot='startIcon']")?.getAttribute("aria-hidden")).toBe(
      "true",
    );
    expect(btn.querySelector("[data-kui-slot='endIcon']")?.getAttribute("aria-hidden")).toBe(
      "true",
    );
  });

  it("consumer slotProps are merged", () => {
    render(
      <Button data-testid="btn" slotProps={{ content: { className: "custom-content" } }}>
        Save
      </Button>,
    );
    const content = screen.getByTestId("btn").querySelector("[data-kui-slot='content']");
    expect(content?.className).toContain("custom-content");
  });
});

// ─── Disabled state ─────────────────────────────────────────────────

describe("Button: disabled state", () => {
  it("sets disabled attribute on native button", () => {
    render(
      <Button data-testid="btn" disabled>
        Click
      </Button>,
    );
    expect(screen.getByTestId("btn").hasAttribute("disabled")).toBe(true);
  });

  it("sets data-state=disabled", () => {
    render(
      <Button data-testid="btn" disabled>
        Click
      </Button>,
    );
    expect(screen.getByTestId("btn").getAttribute("data-state")).toBe("disabled");
  });

  it("sets data-disabled attribute", () => {
    render(
      <Button data-testid="btn" disabled>
        Click
      </Button>,
    );
    expect(screen.getByTestId("btn").hasAttribute("data-disabled")).toBe(true);
  });

  it("does not fire onClick when disabled", async () => {
    const user = userEvent.setup();
    const handler = vi.fn();
    render(
      <Button data-testid="btn" disabled onClick={handler}>
        Click
      </Button>,
    );
    await user.click(screen.getByTestId("btn"));
    expect(handler).not.toHaveBeenCalled();
  });

  it("uses aria-disabled for non-button targets", () => {
    render(
      <Button as="a" href="#" data-testid="btn" disabled>
        Link
      </Button>,
    );
    expect(screen.getByTestId("btn").getAttribute("aria-disabled")).toBe("true");
    expect(screen.getByTestId("btn").hasAttribute("disabled")).toBe(false);
  });
});

// ─── Loading state ──────────────────────────────────────────────────

describe("Button: loading state", () => {
  it("sets aria-busy when loading", () => {
    render(
      <Button data-testid="btn" loading>
        Save
      </Button>,
    );
    expect(screen.getByTestId("btn").getAttribute("aria-busy")).toBe("true");
  });

  it("sets data-state=loading", () => {
    render(
      <Button data-testid="btn" loading>
        Save
      </Button>,
    );
    expect(screen.getByTestId("btn").getAttribute("data-state")).toBe("loading");
  });

  it("sets data-loading attribute", () => {
    render(
      <Button data-testid="btn" loading>
        Save
      </Button>,
    );
    expect(screen.getByTestId("btn").hasAttribute("data-loading")).toBe(true);
  });

  it("disables button when loading", () => {
    render(
      <Button data-testid="btn" loading>
        Save
      </Button>,
    );
    expect(screen.getByTestId("btn").hasAttribute("disabled")).toBe(true);
  });

  it("does not fire onClick when loading", async () => {
    const user = userEvent.setup();
    const handler = vi.fn();
    render(
      <Button data-testid="btn" loading onClick={handler}>
        Save
      </Button>,
    );
    await user.click(screen.getByTestId("btn"));
    expect(handler).not.toHaveBeenCalled();
  });
});

// ─── Event composition ──────────────────────────────────────────────

describe("Button: events", () => {
  it("fires onClick", async () => {
    const user = userEvent.setup();
    const handler = vi.fn();
    render(
      <Button data-testid="btn" onClick={handler}>
        Click
      </Button>,
    );
    await user.click(screen.getByTestId("btn"));
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("fires onFocus", async () => {
    const user = userEvent.setup();
    const handler = vi.fn();
    render(
      <Button data-testid="btn" onFocus={handler}>
        Click
      </Button>,
    );
    await user.tab();
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("fires onBlur", async () => {
    const user = userEvent.setup();
    const handler = vi.fn();
    render(
      <>
        <Button data-testid="btn" onBlur={handler}>
          Click
        </Button>
        <button>other</button>
      </>,
    );
    await user.tab();
    await user.tab();
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("fires onKeyDown", async () => {
    const user = userEvent.setup();
    const handler = vi.fn();
    render(
      <Button data-testid="btn" onKeyDown={handler}>
        Click
      </Button>,
    );
    screen.getByTestId("btn").focus();
    await user.keyboard("{Enter}");
    expect(handler).toHaveBeenCalled();
  });

  it("consumer can cancel via preventDefault", async () => {
    const user = userEvent.setup();
    const submitted = vi.fn();
    render(
      <form onSubmit={submitted} data-testid="form">
        <Button
          type="submit"
          data-testid="btn"
          onClick={(e: React.MouseEvent) => {
            e.preventDefault();
          }}
        >
          Submit
        </Button>
      </form>,
    );
    await user.click(screen.getByTestId("btn"));
    expect(submitted).not.toHaveBeenCalled();
  });
});

// ─── Keyboard activation ────────────────────────────────────────────

describe("Button: keyboard", () => {
  it("activates on Enter key", async () => {
    const user = userEvent.setup();
    const handler = vi.fn();
    render(
      <Button data-testid="btn" onClick={handler}>
        Click
      </Button>,
    );
    screen.getByTestId("btn").focus();
    await user.keyboard("{Enter}");
    expect(handler).toHaveBeenCalled();
  });

  it("activates on Space key", async () => {
    const user = userEvent.setup();
    const handler = vi.fn();
    render(
      <Button data-testid="btn" onClick={handler}>
        Click
      </Button>,
    );
    screen.getByTestId("btn").focus();
    await user.keyboard(" ");
    expect(handler).toHaveBeenCalled();
  });

  it("does not activate when disabled", async () => {
    const user = userEvent.setup();
    const handler = vi.fn();
    render(
      <Button data-testid="btn" disabled onClick={handler}>
        Click
      </Button>,
    );
    screen.getByTestId("btn").focus();
    await user.keyboard("{Enter}");
    await user.keyboard(" ");
    expect(handler).not.toHaveBeenCalled();
  });
});

// ─── Polymorphic rendering ──────────────────────────────────────────

describe("Button: polymorphic as", () => {
  it("renders as anchor with href", () => {
    render(
      <Button as="a" href="/reports" data-testid="btn">
        Reports
      </Button>,
    );
    const el = screen.getByTestId("btn");
    expect(el.tagName).toBe("A");
    expect(el.getAttribute("href")).toBe("/reports");
  });

  it("renders as custom component", () => {
    render(
      <Button as={RouterLink} to="/page" data-testid="btn">
        Go
      </Button>,
    );
    const el = screen.getByTestId("btn");
    expect(el.tagName).toBe("A");
    expect(el.getAttribute("href")).toBe("/page");
    expect(el.getAttribute("data-router-link")).toBe("true");
  });

  it("does not apply type attribute on non-button targets", () => {
    render(
      <Button as="a" href="#" data-testid="btn">
        Link
      </Button>,
    );
    expect(screen.getByTestId("btn").hasAttribute("type")).toBe(false);
  });

  it("anchor retains base class and variants", () => {
    render(
      <Button as="a" href="#" data-testid="btn" appearance="outline" size="lg">
        Link
      </Button>,
    );
    const cls = screen.getByTestId("btn").className;
    expect(cls).toContain("kui-button");
    expect(cls).toContain("kui-button--outline");
    expect(cls).toContain("kui-button--lg");
  });
});

// ─── Ref forwarding ─────────────────────────────────────────────────

describe("Button: ref forwarding", () => {
  it("forwards ref to native button", () => {
    const ref = createRef<HTMLButtonElement>();
    render(
      <Button ref={ref} data-testid="btn">
        Click
      </Button>,
    );
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it("forwards ref to anchor", () => {
    const ref = createRef<HTMLAnchorElement>();
    render(
      <Button as="a" href="#" ref={ref} data-testid="btn">
        Link
      </Button>,
    );
    expect(ref.current).toBeInstanceOf(HTMLAnchorElement);
  });

  it("forwards ref to custom component", () => {
    const ref = createRef<HTMLAnchorElement>();
    render(
      <Button as={RouterLink} to="/" ref={ref} data-testid="btn">
        Go
      </Button>,
    );
    expect(ref.current).toBeInstanceOf(HTMLAnchorElement);
  });

  it("callback ref receives element", () => {
    let captured: HTMLElement | null = null;
    render(
      <Button
        ref={(el: HTMLElement | null) => {
          captured = el;
        }}
        data-testid="btn"
      >
        Click
      </Button>,
    );
    expect(captured).toBeInstanceOf(HTMLButtonElement);
  });
});

// ─── Accessibility ──────────────────────────────────────────────────

describe("Button: accessibility", () => {
  it("passes aria-label", () => {
    render(
      <Button data-testid="btn" aria-label="Close dialog">
        ×
      </Button>,
    );
    expect(screen.getByTestId("btn").getAttribute("aria-label")).toBe("Close dialog");
  });

  it("passes aria-describedby", () => {
    render(
      <Button data-testid="btn" aria-describedby="hint">
        Save
      </Button>,
    );
    expect(screen.getByTestId("btn").getAttribute("aria-describedby")).toBe("hint");
  });

  it("passes aria-expanded and aria-controls", () => {
    render(
      <Button data-testid="btn" aria-expanded="true" aria-controls="menu">
        Menu
      </Button>,
    );
    const el = screen.getByTestId("btn");
    expect(el.getAttribute("aria-expanded")).toBe("true");
    expect(el.getAttribute("aria-controls")).toBe("menu");
  });

  it("has implicit button role on native button", () => {
    render(<Button data-testid="btn">Click</Button>);
    expect(screen.getByTestId("btn").tagName).toBe("BUTTON");
  });

  it("loading indicator has aria-hidden", () => {
    render(
      <Button data-testid="btn" loading>
        Save
      </Button>,
    );
    const indicator = screen.getByTestId("btn").querySelector("[data-kui-slot='loadingIndicator']");
    expect(indicator?.getAttribute("aria-hidden")).toBe("true");
  });
});

// ─── Variant classes ────────────────────────────────────────────────

describe("Button: variants", () => {
  it("default has kui-button class only", () => {
    render(<Button data-testid="btn">Click</Button>);
    const cls = screen.getByTestId("btn").className;
    expect(cls).toContain("kui-button");
    expect(cls).not.toContain("kui-button--solid");
    expect(cls).not.toContain("kui-button--md");
  });

  it("outline adds modifier class", () => {
    render(
      <Button data-testid="btn" appearance="outline">
        Click
      </Button>,
    );
    expect(screen.getByTestId("btn").className).toContain("kui-button--outline");
  });

  it("subtle adds modifier class", () => {
    render(
      <Button data-testid="btn" appearance="subtle">
        Click
      </Button>,
    );
    expect(screen.getByTestId("btn").className).toContain("kui-button--subtle");
  });

  it("ghost adds modifier class", () => {
    render(
      <Button data-testid="btn" appearance="ghost">
        Click
      </Button>,
    );
    expect(screen.getByTestId("btn").className).toContain("kui-button--ghost");
  });

  it("sm size adds modifier class", () => {
    render(
      <Button data-testid="btn" size="sm">
        Click
      </Button>,
    );
    expect(screen.getByTestId("btn").className).toContain("kui-button--sm");
  });

  it("lg size adds modifier class", () => {
    render(
      <Button data-testid="btn" size="lg">
        Click
      </Button>,
    );
    expect(screen.getByTestId("btn").className).toContain("kui-button--lg");
  });

  it("combines appearance and size modifiers", () => {
    render(
      <Button data-testid="btn" appearance="ghost" size="lg">
        Click
      </Button>,
    );
    const cls = screen.getByTestId("btn").className;
    expect(cls).toContain("kui-button--ghost");
    expect(cls).toContain("kui-button--lg");
  });

  it("variant props do not leak to DOM", () => {
    render(
      <Button data-testid="btn" appearance="subtle" size="sm">
        Click
      </Button>,
    );
    const el = screen.getByTestId("btn");
    expect(el.getAttribute("appearance")).toBeNull();
    expect(el.getAttribute("size")).toBeNull();
  });
});

// ─── Slot classes ───────────────────────────────────────────────────

describe("Button: slot classes", () => {
  it("content slot has kui-button__content class", () => {
    render(<Button data-testid="btn">Click</Button>);
    const content = screen.getByTestId("btn").querySelector("[data-kui-slot='content']");
    expect(content?.className).toContain("kui-button__content");
  });

  it("startIcon slot has correct class", () => {
    render(
      <Button data-testid="btn" startIcon={<span>★</span>}>
        Click
      </Button>,
    );
    const icon = screen.getByTestId("btn").querySelector("[data-kui-slot='startIcon']");
    expect(icon?.className).toContain("kui-button__start-icon");
  });

  it("endIcon slot has correct class", () => {
    render(
      <Button data-testid="btn" endIcon={<span>→</span>}>
        Click
      </Button>,
    );
    const icon = screen.getByTestId("btn").querySelector("[data-kui-slot='endIcon']");
    expect(icon?.className).toContain("kui-button__end-icon");
  });

  it("slot classes match slotClass utility", () => {
    expect(slotClass("button", "startIcon")).toBe("kui-button__start-icon");
    expect(slotClass("button", "content")).toBe("kui-button__content");
    expect(slotClass("button", "endIcon")).toBe("kui-button__end-icon");
    expect(slotClass("button", "loadingIndicator")).toBe("kui-button__loading-indicator");
  });
});

// ─── Consumer overrides ─────────────────────────────────────────────

describe("Button: consumer overrides", () => {
  it("consumer className is merged with variant classes", () => {
    render(
      <Button data-testid="btn" className="custom" appearance="outline">
        Click
      </Button>,
    );
    const cls = screen.getByTestId("btn").className;
    expect(cls).toContain("kui-button");
    expect(cls).toContain("kui-button--outline");
    expect(cls).toContain("custom");
  });

  it("consumer style is applied", () => {
    render(
      <Button data-testid="btn" style={{ margin: "8px" }}>
        Click
      </Button>,
    );
    expect(screen.getByTestId("btn").style.margin).toBe("8px");
  });

  it("slot consumer overrides are merged", () => {
    render(
      <Button data-testid="btn" slotProps={{ content: { className: "extra" } }}>
        Click
      </Button>,
    );
    const content = screen.getByTestId("btn").querySelector("[data-kui-slot='content']");
    expect(content?.className).toContain("kui-button__content");
    expect(content?.className).toContain("extra");
  });

  it("consumer data-* attributes pass through", () => {
    render(
      <Button data-testid="btn" data-variant="primary">
        Click
      </Button>,
    );
    expect(screen.getByTestId("btn").getAttribute("data-variant")).toBe("primary");
  });
});

// ─── Style contract ─────────────────────────────────────────────────

describe("Button: style contract", () => {
  it("contract name is button", () => {
    expect(buttonStyleContract.name).toBe("button");
  });

  it("defines 5 slots", () => {
    const slots = Object.keys(buttonStyleContract.slots);
    expect(slots).toEqual(
      expect.arrayContaining(["root", "startIcon", "content", "endIcon", "loadingIndicator"]),
    );
  });

  it("has appearance variants: solid, outline, subtle, ghost", () => {
    const appearance = buttonStyleContract.variants!.appearance;
    expect(appearance.solid).toBeDefined();
    expect(appearance.outline).toBeDefined();
    expect(appearance.subtle).toBeDefined();
    expect(appearance.ghost).toBeDefined();
  });

  it("has size variants: sm, md, lg", () => {
    const size = buttonStyleContract.variants!.size;
    expect(size.sm).toBeDefined();
    expect(size.md).toBeDefined();
    expect(size.lg).toBeDefined();
  });

  it("has compound variants", () => {
    expect(buttonStyleContract.compoundVariants!.length).toBeGreaterThan(0);
  });

  it("default variants are solid/md", () => {
    expect(buttonStyleContract.defaultVariants).toEqual({ appearance: "solid", size: "md" });
  });

  it("root has focus-visible state", () => {
    const states = buttonStyleContract.slots.root.states!;
    expect(states["focusVisible"]).toBeDefined();
    expect(states["focusVisible"]).toHaveProperty("outline");
    expect(states["focusVisible"]).toHaveProperty("outlineOffset");
  });

  it("generates valid CSS", () => {
    const css = generateComponentCss({ contract: buttonStyleContract });
    expect(css).toContain(".kui-button");
    expect(css).toContain("--kui-button-bg:");
    expect(css).toContain(".kui-button--ghost");
    expect(css).toContain(":focus-visible");
  });

  it("base class matches utility", () => {
    expect(componentClass(buttonStyleContract.name)).toBe("kui-button");
  });
});

// ─── SSR rendering ──────────────────────────────────────────────────

describe("Button: SSR", () => {
  it("renders to string without errors", () => {
    const html = renderToString(<Button>Save</Button>);
    expect(html).toContain("<button");
    expect(html).toContain("Save");
    expect(html).toContain('data-kui-component="Button"');
    expect(html).toContain('type="button"');
  });

  it("renders anchor variant to string", () => {
    const html = renderToString(
      <Button as="a" href="/page">
        Link
      </Button>,
    );
    expect(html).toContain("<a");
    expect(html).toContain('href="/page"');
  });

  it("renders disabled state in SSR", () => {
    const html = renderToString(<Button disabled>Save</Button>);
    expect(html).toContain("disabled");
    expect(html).toContain('data-state="disabled"');
  });

  it("renders loading state in SSR", () => {
    const html = renderToString(<Button loading>Save</Button>);
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('data-state="loading"');
    expect(html).toContain("Loading…");
  });

  it("renders with icons in SSR", () => {
    const html = renderToString(
      <Button startIcon={<span>★</span>} endIcon={<span>→</span>}>
        Save
      </Button>,
    );
    expect(html).toContain("★");
    expect(html).toContain("→");
    expect(html).toContain("Save");
  });

  it("renders all appearances in SSR", () => {
    for (const appearance of ["solid", "outline", "subtle", "ghost"] as const) {
      expect(() => renderToString(<Button appearance={appearance}>X</Button>)).not.toThrow();
    }
  });
});

// ─── React Strict Mode ──────────────────────────────────────────────

describe("Button: Strict Mode", () => {
  it("renders without warnings", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <StrictMode>
        <Button data-testid="btn">OK</Button>
      </StrictMode>,
    );
    expect(screen.getByTestId("btn").textContent).toContain("OK");
    const warnings = spy.mock.calls.filter(
      (call) => typeof call[0] === "string" && call[0].includes("Warning:"),
    );
    expect(warnings).toHaveLength(0);
    spy.mockRestore();
  });

  it("events fire once in Strict Mode", async () => {
    const user = userEvent.setup();
    const handler = vi.fn();
    render(
      <StrictMode>
        <Button data-testid="btn" onClick={handler}>
          Click
        </Button>
      </StrictMode>,
    );
    await user.click(screen.getByTestId("btn"));
    expect(handler).toHaveBeenCalledTimes(1);
  });
});

// ─── Type-level tests ───────────────────────────────────────────────

describe("Button: type inference", () => {
  it("button props valid by default", () => {
    const props: PolymorphicProps<ButtonOwnProps, "button"> = {
      type: "submit",
      disabled: true,
      children: "Save",
    };
    expect(props["type"]).toBe("submit");
  });

  it("anchor props valid with as=a", () => {
    const props: PolymorphicProps<ButtonOwnProps, "a"> = {
      as: "a",
      href: "/page",
      target: "_blank",
      children: "Link",
    };
    expect(props["href"]).toBe("/page");
  });

  it("custom component props valid", () => {
    const props: PolymorphicProps<ButtonOwnProps, typeof RouterLink> = {
      as: RouterLink,
      to: "/dash",
      children: "Go",
    };
    expect(props["to"]).toBe("/dash");
  });

  it("ButtonOwnProps includes all expected properties", () => {
    expectTypeOf<ButtonOwnProps>().toHaveProperty("startIcon");
    expectTypeOf<ButtonOwnProps>().toHaveProperty("endIcon");
    expectTypeOf<ButtonOwnProps>().toHaveProperty("loading");
    expectTypeOf<ButtonOwnProps>().toHaveProperty("disabled");
    expectTypeOf<ButtonOwnProps>().toHaveProperty("appearance");
    expectTypeOf<ButtonOwnProps>().toHaveProperty("size");
    expectTypeOf<ButtonOwnProps>().toHaveProperty("slots");
    expectTypeOf<ButtonOwnProps>().toHaveProperty("slotProps");
  });

  it("ButtonAppearance is a union of valid values", () => {
    expectTypeOf<ButtonAppearance>().toEqualTypeOf<"solid" | "outline" | "subtle" | "ghost">();
  });

  it("ButtonSize is a union of valid values", () => {
    expectTypeOf<ButtonSize>().toEqualTypeOf<"sm" | "md" | "lg">();
  });
});
