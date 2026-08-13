import { describe, it, expect, vi, afterEach, expectTypeOf } from "vitest";
import { createRef, forwardRef, StrictMode } from "react";
import { render, screen, cleanup } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { IconButton, iconButtonStyleContract } from "./index";
import type { IconButtonOwnProps, IconButtonAppearance, IconButtonSize } from "./index";
import type { PolymorphicProps } from "../../composition/polymorphic-types";
import { componentClass, slotClass } from "../../composition/class-generation";
import { generateComponentCss } from "../../composition/generate-css";

afterEach(cleanup);

// ─── Fixtures ───────────────────────────────────────────────────────

const CloseIcon = () => (
  <svg data-testid="close-svg" viewBox="0 0 24 24">
    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
  </svg>
);

interface RouterLinkProps {
  to: string;
  children?: React.ReactNode;
  className?: string;
  "data-testid"?: string;
}

const RouterLink = forwardRef<HTMLAnchorElement, RouterLinkProps>((props, ref) => {
  const { to, children, ...rest } = props;
  return (
    <a {...rest} href={to} ref={ref}>
      {children}
    </a>
  );
});
RouterLink.displayName = "RouterLink";

// ─── Default rendering ──────────────────────────────────────────────

describe("IconButton: default rendering", () => {
  it("renders as button element by default", () => {
    render(
      <IconButton aria-label="Close" data-testid="btn">
        <CloseIcon />
      </IconButton>,
    );
    expect(screen.getByTestId("btn").tagName).toBe("BUTTON");
  });

  it("renders icon children", () => {
    render(
      <IconButton aria-label="Close" data-testid="btn">
        <CloseIcon />
      </IconButton>,
    );
    expect(screen.getByTestId("close-svg")).toBeDefined();
  });

  it("applies data-kui-component metadata", () => {
    render(
      <IconButton aria-label="Close" data-testid="btn">
        <CloseIcon />
      </IconButton>,
    );
    expect(screen.getByTestId("btn").getAttribute("data-kui-component")).toBe("IconButton");
  });

  it("applies type=button by default", () => {
    render(
      <IconButton aria-label="Close" data-testid="btn">
        <CloseIcon />
      </IconButton>,
    );
    expect(screen.getByTestId("btn").getAttribute("type")).toBe("button");
  });

  it("applies type=submit", () => {
    render(
      <IconButton aria-label="Submit" data-testid="btn" type="submit">
        <CloseIcon />
      </IconButton>,
    );
    expect(screen.getByTestId("btn").getAttribute("type")).toBe("submit");
  });

  it("has data-state=default when idle", () => {
    render(
      <IconButton aria-label="Close" data-testid="btn">
        <CloseIcon />
      </IconButton>,
    );
    expect(screen.getByTestId("btn").getAttribute("data-state")).toBe("default");
  });

  it("applies className", () => {
    render(
      <IconButton aria-label="Close" data-testid="btn" className="custom">
        <CloseIcon />
      </IconButton>,
    );
    expect(screen.getByTestId("btn").className).toContain("custom");
  });

  it("applies style", () => {
    render(
      <IconButton aria-label="Close" data-testid="btn" style={{ color: "red" }}>
        <CloseIcon />
      </IconButton>,
    );
    expect(screen.getByTestId("btn").style.color).toBe("red");
  });
});

// ─── Accessibility ──────────────────────────────────────────────────

describe("IconButton: accessibility", () => {
  it("passes aria-label to the element", () => {
    render(
      <IconButton aria-label="Close dialog" data-testid="btn">
        <CloseIcon />
      </IconButton>,
    );
    expect(screen.getByTestId("btn").getAttribute("aria-label")).toBe("Close dialog");
  });

  it("passes aria-labelledby", () => {
    render(
      <>
        <span id="my-label">Close</span>
        <IconButton aria-labelledby="my-label" data-testid="btn">
          <CloseIcon />
        </IconButton>
      </>,
    );
    expect(screen.getByTestId("btn").getAttribute("aria-labelledby")).toBe("my-label");
  });

  it("icon slot has aria-hidden", () => {
    render(
      <IconButton aria-label="Close" data-testid="btn">
        <CloseIcon />
      </IconButton>,
    );
    const iconSlot = screen.getByTestId("btn").querySelector("[data-kui-slot='icon']");
    expect(iconSlot?.getAttribute("aria-hidden")).toBe("true");
  });

  it("warns when neither aria-label nor aria-labelledby is provided", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(
      <IconButton data-testid="btn">
        <CloseIcon />
      </IconButton>,
    );
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining("IconButton requires an accessible name"),
    );
    spy.mockRestore();
  });

  it("does not warn when aria-label is provided", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(
      <IconButton aria-label="Close" data-testid="btn">
        <CloseIcon />
      </IconButton>,
    );
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("does not warn when aria-labelledby is provided", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(
      <IconButton aria-labelledby="ext-label" data-testid="btn">
        <CloseIcon />
      </IconButton>,
    );
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("passes aria-expanded", () => {
    render(
      <IconButton aria-label="Menu" aria-expanded="true" aria-controls="nav" data-testid="btn">
        <CloseIcon />
      </IconButton>,
    );
    const el = screen.getByTestId("btn");
    expect(el.getAttribute("aria-expanded")).toBe("true");
    expect(el.getAttribute("aria-controls")).toBe("nav");
  });
});

// ─── Disabled state ─────────────────────────────────────────────────

describe("IconButton: disabled state", () => {
  it("sets disabled attribute on native button", () => {
    render(
      <IconButton aria-label="Close" data-testid="btn" disabled>
        <CloseIcon />
      </IconButton>,
    );
    expect(screen.getByTestId("btn").hasAttribute("disabled")).toBe(true);
  });

  it("sets data-state=disabled", () => {
    render(
      <IconButton aria-label="Close" data-testid="btn" disabled>
        <CloseIcon />
      </IconButton>,
    );
    expect(screen.getByTestId("btn").getAttribute("data-state")).toBe("disabled");
  });

  it("sets data-disabled attribute", () => {
    render(
      <IconButton aria-label="Close" data-testid="btn" disabled>
        <CloseIcon />
      </IconButton>,
    );
    expect(screen.getByTestId("btn").hasAttribute("data-disabled")).toBe(true);
  });

  it("does not fire onClick when disabled", async () => {
    const user = userEvent.setup();
    const handler = vi.fn();
    render(
      <IconButton aria-label="Close" data-testid="btn" disabled onClick={handler}>
        <CloseIcon />
      </IconButton>,
    );
    await user.click(screen.getByTestId("btn"));
    expect(handler).not.toHaveBeenCalled();
  });

  it("uses aria-disabled for non-button targets", () => {
    render(
      <IconButton as="a" href="#" aria-label="Close" data-testid="btn" disabled>
        <CloseIcon />
      </IconButton>,
    );
    expect(screen.getByTestId("btn").getAttribute("aria-disabled")).toBe("true");
    expect(screen.getByTestId("btn").hasAttribute("disabled")).toBe(false);
  });
});

// ─── Loading state ──────────────────────────────────────────────────

describe("IconButton: loading state", () => {
  it("sets aria-busy when loading", () => {
    render(
      <IconButton aria-label="Close" data-testid="btn" loading>
        <CloseIcon />
      </IconButton>,
    );
    expect(screen.getByTestId("btn").getAttribute("aria-busy")).toBe("true");
  });

  it("sets data-state=loading", () => {
    render(
      <IconButton aria-label="Close" data-testid="btn" loading>
        <CloseIcon />
      </IconButton>,
    );
    expect(screen.getByTestId("btn").getAttribute("data-state")).toBe("loading");
  });

  it("disables button when loading", () => {
    render(
      <IconButton aria-label="Close" data-testid="btn" loading>
        <CloseIcon />
      </IconButton>,
    );
    expect(screen.getByTestId("btn").hasAttribute("disabled")).toBe(true);
  });

  it("renders loading indicator slot", () => {
    render(
      <IconButton aria-label="Close" data-testid="btn" loading>
        <CloseIcon />
      </IconButton>,
    );
    const indicator = screen.getByTestId("btn").querySelector("[data-kui-slot='loadingIndicator']");
    expect(indicator).not.toBeNull();
    expect(indicator?.getAttribute("aria-hidden")).toBe("true");
  });

  it("does not fire onClick when loading", async () => {
    const user = userEvent.setup();
    const handler = vi.fn();
    render(
      <IconButton aria-label="Close" data-testid="btn" loading onClick={handler}>
        <CloseIcon />
      </IconButton>,
    );
    await user.click(screen.getByTestId("btn"));
    expect(handler).not.toHaveBeenCalled();
  });
});

// ─── Events ─────────────────────────────────────────────────────────

describe("IconButton: events", () => {
  it("fires onClick", async () => {
    const user = userEvent.setup();
    const handler = vi.fn();
    render(
      <IconButton aria-label="Close" data-testid="btn" onClick={handler}>
        <CloseIcon />
      </IconButton>,
    );
    await user.click(screen.getByTestId("btn"));
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("fires onFocus", async () => {
    const user = userEvent.setup();
    const handler = vi.fn();
    render(
      <IconButton aria-label="Close" data-testid="btn" onFocus={handler}>
        <CloseIcon />
      </IconButton>,
    );
    await user.tab();
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("fires onKeyDown", async () => {
    const user = userEvent.setup();
    const handler = vi.fn();
    render(
      <IconButton aria-label="Close" data-testid="btn" onKeyDown={handler}>
        <CloseIcon />
      </IconButton>,
    );
    screen.getByTestId("btn").focus();
    await user.keyboard("{Enter}");
    expect(handler).toHaveBeenCalled();
  });
});

// ─── Keyboard activation ────────────────────────────────────────────

describe("IconButton: keyboard", () => {
  it("activates on Enter key", async () => {
    const user = userEvent.setup();
    const handler = vi.fn();
    render(
      <IconButton aria-label="Close" data-testid="btn" onClick={handler}>
        <CloseIcon />
      </IconButton>,
    );
    screen.getByTestId("btn").focus();
    await user.keyboard("{Enter}");
    expect(handler).toHaveBeenCalled();
  });

  it("activates on Space key", async () => {
    const user = userEvent.setup();
    const handler = vi.fn();
    render(
      <IconButton aria-label="Close" data-testid="btn" onClick={handler}>
        <CloseIcon />
      </IconButton>,
    );
    screen.getByTestId("btn").focus();
    await user.keyboard(" ");
    expect(handler).toHaveBeenCalled();
  });

  it("does not activate when disabled", async () => {
    const user = userEvent.setup();
    const handler = vi.fn();
    render(
      <IconButton aria-label="Close" data-testid="btn" disabled onClick={handler}>
        <CloseIcon />
      </IconButton>,
    );
    screen.getByTestId("btn").focus();
    await user.keyboard("{Enter}");
    await user.keyboard(" ");
    expect(handler).not.toHaveBeenCalled();
  });
});

// ─── Variants ───────────────────────────────────────────────────────

describe("IconButton: variants", () => {
  it("default has kui-icon-button class only (subtle default)", () => {
    render(
      <IconButton aria-label="Close" data-testid="btn">
        <CloseIcon />
      </IconButton>,
    );
    const cls = screen.getByTestId("btn").className;
    expect(cls).toContain("kui-icon-button");
    expect(cls).not.toContain("kui-icon-button--subtle");
    expect(cls).not.toContain("kui-icon-button--md");
  });

  it("solid adds modifier class", () => {
    render(
      <IconButton aria-label="Close" data-testid="btn" appearance="solid">
        <CloseIcon />
      </IconButton>,
    );
    expect(screen.getByTestId("btn").className).toContain("kui-icon-button--solid");
  });

  it("outline adds modifier class", () => {
    render(
      <IconButton aria-label="Close" data-testid="btn" appearance="outline">
        <CloseIcon />
      </IconButton>,
    );
    expect(screen.getByTestId("btn").className).toContain("kui-icon-button--outline");
  });

  it("ghost adds modifier class", () => {
    render(
      <IconButton aria-label="Close" data-testid="btn" appearance="ghost">
        <CloseIcon />
      </IconButton>,
    );
    expect(screen.getByTestId("btn").className).toContain("kui-icon-button--ghost");
  });

  it("sm size adds modifier class", () => {
    render(
      <IconButton aria-label="Close" data-testid="btn" size="sm">
        <CloseIcon />
      </IconButton>,
    );
    expect(screen.getByTestId("btn").className).toContain("kui-icon-button--sm");
  });

  it("lg size adds modifier class", () => {
    render(
      <IconButton aria-label="Close" data-testid="btn" size="lg">
        <CloseIcon />
      </IconButton>,
    );
    expect(screen.getByTestId("btn").className).toContain("kui-icon-button--lg");
  });

  it("combines appearance and size modifiers", () => {
    render(
      <IconButton aria-label="Close" data-testid="btn" appearance="solid" size="lg">
        <CloseIcon />
      </IconButton>,
    );
    const cls = screen.getByTestId("btn").className;
    expect(cls).toContain("kui-icon-button--solid");
    expect(cls).toContain("kui-icon-button--lg");
  });

  it("variant props do not leak to DOM", () => {
    render(
      <IconButton aria-label="Close" data-testid="btn" appearance="solid" size="sm">
        <CloseIcon />
      </IconButton>,
    );
    const el = screen.getByTestId("btn");
    expect(el.getAttribute("appearance")).toBeNull();
    expect(el.getAttribute("size")).toBeNull();
  });
});

// ─── Slot classes ───────────────────────────────────────────────────

describe("IconButton: slot classes", () => {
  it("icon slot has correct class", () => {
    render(
      <IconButton aria-label="Close" data-testid="btn">
        <CloseIcon />
      </IconButton>,
    );
    const iconSlot = screen.getByTestId("btn").querySelector("[data-kui-slot='icon']");
    expect(iconSlot?.className).toContain("kui-icon-button__icon");
  });

  it("slot classes match slotClass utility", () => {
    expect(slotClass("icon-button", "icon")).toBe("kui-icon-button__icon");
    expect(slotClass("icon-button", "loadingIndicator")).toBe("kui-icon-button__loading-indicator");
  });
});

// ─── Polymorphic rendering ──────────────────────────────────────────

describe("IconButton: polymorphic as", () => {
  it("renders as anchor", () => {
    render(
      <IconButton as="a" href="/settings" aria-label="Settings" data-testid="btn">
        <CloseIcon />
      </IconButton>,
    );
    const el = screen.getByTestId("btn");
    expect(el.tagName).toBe("A");
    expect(el.getAttribute("href")).toBe("/settings");
  });

  it("renders as custom component", () => {
    render(
      <IconButton as={RouterLink} to="/page" aria-label="Navigate" data-testid="btn">
        <CloseIcon />
      </IconButton>,
    );
    expect(screen.getByTestId("btn").tagName).toBe("A");
    expect(screen.getByTestId("btn").getAttribute("href")).toBe("/page");
  });

  it("does not apply type on non-button targets", () => {
    render(
      <IconButton as="a" href="#" aria-label="Link" data-testid="btn">
        <CloseIcon />
      </IconButton>,
    );
    expect(screen.getByTestId("btn").hasAttribute("type")).toBe(false);
  });
});

// ─── Ref forwarding ─────────────────────────────────────────────────

describe("IconButton: ref forwarding", () => {
  it("forwards ref to native button", () => {
    const ref = createRef<HTMLButtonElement>();
    render(
      <IconButton aria-label="Close" ref={ref}>
        <CloseIcon />
      </IconButton>,
    );
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it("forwards ref to anchor", () => {
    const ref = createRef<HTMLAnchorElement>();
    render(
      <IconButton as="a" href="#" aria-label="Link" ref={ref}>
        <CloseIcon />
      </IconButton>,
    );
    expect(ref.current).toBeInstanceOf(HTMLAnchorElement);
  });

  it("callback ref receives element", () => {
    let captured: HTMLElement | null = null;
    render(
      <IconButton
        aria-label="Close"
        ref={(el: HTMLElement | null) => {
          captured = el;
        }}
      >
        <CloseIcon />
      </IconButton>,
    );
    expect(captured).toBeInstanceOf(HTMLButtonElement);
  });
});

// ─── Consumer overrides ─────────────────────────────────────────────

describe("IconButton: consumer overrides", () => {
  it("consumer className is merged", () => {
    render(
      <IconButton aria-label="Close" data-testid="btn" className="custom">
        <CloseIcon />
      </IconButton>,
    );
    const cls = screen.getByTestId("btn").className;
    expect(cls).toContain("kui-icon-button");
    expect(cls).toContain("custom");
  });

  it("consumer data-* attributes pass through", () => {
    render(
      <IconButton aria-label="Close" data-testid="btn" data-action="close">
        <CloseIcon />
      </IconButton>,
    );
    expect(screen.getByTestId("btn").getAttribute("data-action")).toBe("close");
  });
});

// ─── Style contract ─────────────────────────────────────────────────

describe("IconButton: style contract", () => {
  it("contract name is icon-button", () => {
    expect(iconButtonStyleContract.name).toBe("icon-button");
  });

  it("defines 3 slots", () => {
    const slots = Object.keys(iconButtonStyleContract.slots);
    expect(slots).toEqual(expect.arrayContaining(["root", "icon", "loadingIndicator"]));
  });

  it("has focus-visible state", () => {
    const states = iconButtonStyleContract.slots.root.states!;
    expect(states["focusVisible"]).toBeDefined();
  });

  it("default appearance is subtle", () => {
    expect(iconButtonStyleContract.defaultVariants).toEqual({ appearance: "subtle", size: "md" });
  });

  it("generates valid CSS", () => {
    const css = generateComponentCss({ contract: iconButtonStyleContract });
    expect(css).toContain(".kui-icon-button");
    expect(css).toContain("--kui-icon-button-bg:");
    expect(css).toContain(":focus-visible");
  });

  it("base class matches utility", () => {
    expect(componentClass(iconButtonStyleContract.name)).toBe("kui-icon-button");
  });
});

// ─── SSR rendering ──────────────────────────────────────────────────

describe("IconButton: SSR", () => {
  it("renders to string without errors", () => {
    const html = renderToString(
      <IconButton aria-label="Close">
        <CloseIcon />
      </IconButton>,
    );
    expect(html).toContain("<button");
    expect(html).toContain('data-kui-component="IconButton"');
    expect(html).toContain('aria-label="Close"');
  });

  it("renders disabled state in SSR", () => {
    const html = renderToString(
      <IconButton aria-label="Close" disabled>
        <CloseIcon />
      </IconButton>,
    );
    expect(html).toContain("disabled");
    expect(html).toContain('data-state="disabled"');
  });

  it("renders loading state in SSR", () => {
    const html = renderToString(
      <IconButton aria-label="Close" loading>
        <CloseIcon />
      </IconButton>,
    );
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('data-state="loading"');
  });

  it("renders all appearances", () => {
    for (const appearance of ["solid", "outline", "subtle", "ghost"] as const) {
      expect(() =>
        renderToString(
          <IconButton aria-label="X" appearance={appearance}>
            <CloseIcon />
          </IconButton>,
        ),
      ).not.toThrow();
    }
  });
});

// ─── React Strict Mode ──────────────────────────────────────────────

describe("IconButton: Strict Mode", () => {
  it("renders without warnings", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <StrictMode>
        <IconButton aria-label="Close" data-testid="btn">
          <CloseIcon />
        </IconButton>
      </StrictMode>,
    );
    expect(screen.getByTestId("btn").textContent).toBeDefined();
    const warnings = spy.mock.calls.filter(
      (call) => typeof call[0] === "string" && call[0].includes("Warning:"),
    );
    expect(warnings).toHaveLength(0);
    spy.mockRestore();
  });

  it("events fire once", async () => {
    const user = userEvent.setup();
    const handler = vi.fn();
    render(
      <StrictMode>
        <IconButton aria-label="Close" data-testid="btn" onClick={handler}>
          <CloseIcon />
        </IconButton>
      </StrictMode>,
    );
    await user.click(screen.getByTestId("btn"));
    expect(handler).toHaveBeenCalledTimes(1);
  });
});

// ─── Type-level tests ───────────────────────────────────────────────

describe("IconButton: type inference", () => {
  it("button props valid by default", () => {
    const props: PolymorphicProps<IconButtonOwnProps, "button"> = {
      "aria-label": "Close",
      type: "submit",
      disabled: true,
      children: "×",
    };
    expect(props["type"]).toBe("submit");
  });

  it("anchor props valid with as=a", () => {
    const props: PolymorphicProps<IconButtonOwnProps, "a"> = {
      as: "a",
      href: "/page",
      "aria-label": "Navigate",
      children: "→",
    };
    expect(props["href"]).toBe("/page");
  });

  it("IconButtonOwnProps includes expected properties", () => {
    expectTypeOf<IconButtonOwnProps>().toHaveProperty("loading");
    expectTypeOf<IconButtonOwnProps>().toHaveProperty("disabled");
    expectTypeOf<IconButtonOwnProps>().toHaveProperty("appearance");
    expectTypeOf<IconButtonOwnProps>().toHaveProperty("size");
    expectTypeOf<IconButtonOwnProps>().toHaveProperty("slots");
    expectTypeOf<IconButtonOwnProps>().toHaveProperty("slotProps");
  });

  it("IconButtonAppearance is correct union", () => {
    expectTypeOf<IconButtonAppearance>().toEqualTypeOf<"solid" | "outline" | "subtle" | "ghost">();
  });

  it("IconButtonSize is correct union", () => {
    expectTypeOf<IconButtonSize>().toEqualTypeOf<"sm" | "md" | "lg">();
  });
});
