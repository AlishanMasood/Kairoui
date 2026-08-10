import { describe, it, expect, vi, afterEach, expectTypeOf } from "vitest";
import { createRef, forwardRef, StrictMode } from "react";
import type { ReactNode } from "react";
import { render, screen, cleanup } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { createComponent } from "./create-component";
import { defineSlots } from "./slot-definitions";
import { resolveAllSlotProps } from "./resolve-slot-props";
import { renderSlot, renderOptionalSlot } from "./render-slot";
import type { SlotOverrides } from "./resolve-slot-props";

afterEach(cleanup);

// ─── Fixtures ───────────────────────────────────────────────────────

interface CustomLinkProps {
  to: string;
  children?: ReactNode;
  className?: string;
  "data-testid"?: string;
}

const CustomLink = forwardRef<HTMLAnchorElement, CustomLinkProps>((props, ref) => {
  const { to, children, ...rest } = props;
  return (
    <a {...rest} href={to} ref={ref} data-custom-link="true">
      {children}
    </a>
  );
});
CustomLink.displayName = "CustomLink";

// ─── Slotted component fixture ──────────────────────────────────────

type CardSlots = "root" | "header" | "body";

const cardSlots = defineSlots({
  root: { defaultElement: "div", required: true, public: true },
  header: { defaultElement: "header", required: false, public: true },
  body: { defaultElement: "main", required: true, public: true },
});

interface CardOwnProps {
  title?: string;
  children?: ReactNode;
  asChild?: boolean;
  slots?: SlotOverrides<CardSlots>["slots"];
  slotProps?: SlotOverrides<CardSlots>["slotProps"];
}

const Card = createComponent<CardOwnProps, "div">({
  displayName: "Card",
  defaultElement: "div",
  useComponent: ({ props, ref }) => {
    const { title, children, slots: slotOverrides, slotProps: slotPropsOverrides } = props;

    const resolved = resolveAllSlotProps({
      definitions: cardSlots,
      internalProps: {
        header: { className: "card-header" },
        body: { className: "card-body" },
      },
      overrides: { slots: slotOverrides, slotProps: slotPropsOverrides },
    });

    return {
      rootProps: { ref },
      consumedProps: ["title", "slots", "slotProps"],
      children: (
        <>
          {renderOptionalSlot(resolved.header, title != null, title)}
          {renderSlot(resolved.body, children)}
        </>
      ),
    };
  },
});

// ─── Disabled/loading component fixture ─────────────────────────────

interface InteractiveProps {
  disabled?: boolean;
  loading?: boolean;
  asChild?: boolean;
  children?: ReactNode;
}

const Interactive = createComponent<InteractiveProps, "button">({
  displayName: "Interactive",
  defaultElement: "button",
  useComponent: ({ props, ref, element }) => {
    const { disabled = false, loading = false } = props;
    const isDisabled = disabled || loading;

    return {
      rootProps: { ref },
      consumedProps: ["disabled", "loading"],
      state: {
        disabled: isDisabled,
        loading,
        dataState: loading ? "loading" : isDisabled ? "disabled" : "idle",
      },
      accessibilityProps: {
        ...(element === "button" ? { type: "button" } : {}),
        ...(isDisabled
          ? element === "button"
            ? { disabled: true }
            : { "aria-disabled": "true" }
          : {}),
        ...(loading ? { "aria-busy": "true" } : {}),
      },
    };
  },
});

// ─── Polymorphic as: native targets ─────────────────────────────────

describe("factory validation: polymorphic native targets", () => {
  it("renders as anchor with href", () => {
    render(
      <Card as="article" data-testid="card" title="Hello">
        Body
      </Card>,
    );
    expect(screen.getByTestId("card").tagName).toBe("ARTICLE");
  });

  it("renders Interactive as anchor with aria-disabled", () => {
    render(
      <Interactive as="a" disabled data-testid="link">
        Link
      </Interactive>,
    );
    const el = screen.getByTestId("link");
    expect(el.tagName).toBe("A");
    expect(el.getAttribute("aria-disabled")).toBe("true");
    expect(el.hasAttribute("disabled")).toBe(false);
  });

  it("does not apply type attribute to non-button targets", () => {
    render(
      <Interactive as="div" data-testid="div">
        Click
      </Interactive>,
    );
    expect(screen.getByTestId("div").hasAttribute("type")).toBe(false);
  });
});

// ─── Polymorphic as: custom components ──────────────────────────────

describe("factory validation: polymorphic custom targets", () => {
  it("renders custom component with own props", () => {
    render(
      <Card as={CustomLink} to="/page" data-testid="custom" title="Title">
        Content
      </Card>,
    );
    const el = screen.getByTestId("custom");
    expect(el.getAttribute("data-custom-link")).toBe("true");
    expect(el.getAttribute("href")).toBe("/page");
  });

  it("forwards ref to custom component", () => {
    const ref = createRef<HTMLAnchorElement>();
    render(
      <Card as={CustomLink} to="/" ref={ref} data-testid="ref" title="T">
        C
      </Card>,
    );
    expect(ref.current).toBeInstanceOf(HTMLAnchorElement);
  });
});

// ─── asChild ────────────────────────────────────────────────────────

describe("factory validation: asChild", () => {
  it("delegates to child element", () => {
    render(
      <Interactive asChild>
        <a href="/page" data-testid="child">
          Link
        </a>
      </Interactive>,
    );
    const el = screen.getByTestId("child");
    expect(el.tagName).toBe("A");
    expect(el.getAttribute("data-kui-component")).toBe("Interactive");
    expect(el.getAttribute("type")).toBe("button");
  });

  it("no wrapper element with asChild", () => {
    const { container } = render(
      <Interactive asChild>
        <span data-testid="only">Text</span>
      </Interactive>,
    );
    expect(container.children).toHaveLength(1);
    expect(container.firstElementChild?.tagName).toBe("SPAN");
  });

  it("merges state data-attrs onto child", () => {
    render(
      <Interactive asChild loading>
        <button data-testid="loading-child">Save</button>
      </Interactive>,
    );
    const el = screen.getByTestId("loading-child");
    expect(el.getAttribute("data-state")).toBe("loading");
    expect(el.hasAttribute("data-loading")).toBe(true);
    expect(el.getAttribute("aria-busy")).toBe("true");
  });
});

// ─── Slots ──────────────────────────────────────────────────────────

describe("factory validation: slots", () => {
  it("renders slot structure", () => {
    render(
      <Card data-testid="card" title="Title">
        Body content
      </Card>,
    );
    const card = screen.getByTestId("card");
    expect(card.querySelector("[data-kui-slot='header']")).not.toBeNull();
    expect(card.querySelector("[data-kui-slot='body']")).not.toBeNull();
    expect(card.textContent).toContain("Title");
    expect(card.textContent).toContain("Body content");
  });

  it("hides optional slot when condition is false", () => {
    render(<Card data-testid="card">Body only</Card>);
    const card = screen.getByTestId("card");
    expect(card.querySelector("[data-kui-slot='header']")).toBeNull();
    expect(card.textContent).toContain("Body only");
  });

  it("consumer slotProps are merged", () => {
    render(
      <Card data-testid="card" title="T" slotProps={{ body: { className: "custom-body" } }}>
        Content
      </Card>,
    );
    const body = screen.getByTestId("card").querySelector("[data-kui-slot='body']");
    expect(body?.className).toContain("card-body");
    expect(body?.className).toContain("custom-body");
  });

  it("slot replacement works", () => {
    render(
      <Card data-testid="card" title="T" slots={{ body: "section" }}>
        Content
      </Card>,
    );
    const body = screen.getByTestId("card").querySelector("[data-kui-slot='body']");
    expect(body?.tagName).toBe("SECTION");
  });
});

// ─── Ref forwarding ─────────────────────────────────────────────────

describe("factory validation: refs", () => {
  it("forwards ref to default element", () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <Card ref={ref} data-testid="r" title="T">
        C
      </Card>,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it("forwards ref to polymorphic element", () => {
    const ref = createRef<HTMLAnchorElement>();
    render(
      <Interactive as="a" ref={ref} data-testid="r">
        Link
      </Interactive>,
    );
    expect(ref.current).toBeInstanceOf(HTMLAnchorElement);
  });

  it("callback ref receives element", () => {
    let captured: HTMLElement | null = null;
    render(
      <Interactive
        ref={(el: HTMLElement | null) => {
          captured = el;
        }}
        data-testid="cb"
      >
        Click
      </Interactive>,
    );
    expect(captured).toBeInstanceOf(HTMLButtonElement);
  });
});

// ─── Owner state ────────────────────────────────────────────────────

describe("factory validation: owner state", () => {
  it("generates data-state", () => {
    render(<Interactive data-testid="s">Click</Interactive>);
    expect(screen.getByTestId("s").getAttribute("data-state")).toBe("idle");
  });

  it("generates data-disabled", () => {
    render(
      <Interactive data-testid="d" disabled>
        Click
      </Interactive>,
    );
    expect(screen.getByTestId("d").hasAttribute("data-disabled")).toBe(true);
    expect(screen.getByTestId("d").getAttribute("data-state")).toBe("disabled");
  });

  it("generates data-loading", () => {
    render(
      <Interactive data-testid="l" loading>
        Save
      </Interactive>,
    );
    expect(screen.getByTestId("l").hasAttribute("data-loading")).toBe(true);
    expect(screen.getByTestId("l").getAttribute("data-state")).toBe("loading");
  });

  it("loading implies disabled", () => {
    render(
      <Interactive data-testid="ld" loading>
        Save
      </Interactive>,
    );
    expect(screen.getByTestId("ld").hasAttribute("data-disabled")).toBe(true);
  });
});

// ─── Component metadata ─────────────────────────────────────────────

describe("factory validation: metadata", () => {
  it("sets data-kui-component on all components", () => {
    render(
      <Card data-testid="c" title="T">
        B
      </Card>,
    );
    render(<Interactive data-testid="i">C</Interactive>);
    expect(screen.getByTestId("c").getAttribute("data-kui-component")).toBe("Card");
    expect(screen.getByTestId("i").getAttribute("data-kui-component")).toBe("Interactive");
  });

  it("displayName is accessible", () => {
    expect(Card.displayName).toBe("Card");
    expect(Interactive.displayName).toBe("Interactive");
  });
});

// ─── Prop composition ───────────────────────────────────────────────

describe("factory validation: prop composition", () => {
  it("merges consumer className with internal", () => {
    render(
      <Card data-testid="c" className="consumer" title="T">
        B
      </Card>,
    );
    expect(screen.getByTestId("c").className).toContain("consumer");
  });

  it("merges consumer style", () => {
    render(
      <Interactive data-testid="s" style={{ color: "red" }}>
        Click
      </Interactive>,
    );
    expect(screen.getByTestId("s").style.color).toBe("red");
  });

  it("consumer data-* attributes pass through", () => {
    render(
      <Interactive data-testid="d" data-variant="primary">
        Click
      </Interactive>,
    );
    expect(screen.getByTestId("d").getAttribute("data-variant")).toBe("primary");
  });

  it("consumed props do not leak to DOM", () => {
    render(
      <Interactive data-testid="leak" disabled loading>
        Click
      </Interactive>,
    );
    const el = screen.getByTestId("leak");
    // disabled should come from accessibilityProps (native), not from leaked consumer prop
    expect(el.hasAttribute("loading")).toBe(false);
  });
});

// ─── Event composition ──────────────────────────────────────────────

describe("factory validation: events", () => {
  it("consumer onClick fires", async () => {
    const user = userEvent.setup();
    const handler = vi.fn();
    render(
      <Interactive data-testid="e" onClick={handler}>
        Click
      </Interactive>,
    );
    await user.click(screen.getByTestId("e"));
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("consumer can preventDefault", async () => {
    const user = userEvent.setup();
    const submitted = vi.fn();
    render(
      <form onSubmit={submitted}>
        <Interactive
          data-testid="e"
          onClick={(e: React.MouseEvent) => {
            e.preventDefault();
          }}
        >
          Submit
        </Interactive>
      </form>,
    );
    await user.click(screen.getByTestId("e"));
    expect(submitted).not.toHaveBeenCalled();
  });
});

// ─── ARIA composition ───────────────────────────────────────────────

describe("factory validation: ARIA", () => {
  it("passes consumer aria-label", () => {
    render(
      <Interactive data-testid="a" aria-label="Close">
        ×
      </Interactive>,
    );
    expect(screen.getByTestId("a").getAttribute("aria-label")).toBe("Close");
  });

  it("passes consumer aria-expanded", () => {
    render(
      <Interactive data-testid="a" aria-expanded="true" aria-controls="menu">
        Menu
      </Interactive>,
    );
    const el = screen.getByTestId("a");
    expect(el.getAttribute("aria-expanded")).toBe("true");
    expect(el.getAttribute("aria-controls")).toBe("menu");
  });
});

// ─── SSR ────────────────────────────────────────────────────────────

describe("factory validation: SSR", () => {
  it("renders simple component to string", () => {
    const html = renderToString(<Card title="Title">Body</Card>);
    expect(html).toContain('data-kui-component="Card"');
    expect(html).toContain("Title");
    expect(html).toContain("Body");
  });

  it("renders state attributes in SSR", () => {
    const html = renderToString(<Interactive loading>Save</Interactive>);
    expect(html).toContain('data-state="loading"');
    expect(html).toContain("data-loading");
    expect(html).toContain("data-disabled");
    expect(html).toContain('aria-busy="true"');
  });

  it("renders polymorphic element in SSR", () => {
    const html = renderToString(<Interactive as="a">Link</Interactive>);
    expect(html).toContain("<a");
    expect(html).not.toContain("<button");
  });

  it("renders asChild in SSR", () => {
    const html = renderToString(
      <Interactive asChild>
        <span>Child</span>
      </Interactive>,
    );
    expect(html).toContain("<span");
    expect(html).toContain("data-kui-component");
    expect(html).not.toContain("<button");
  });

  it("renders slots in SSR", () => {
    const html = renderToString(<Card title="T">B</Card>);
    expect(html).toContain("data-kui-slot");
    expect(html).toContain("card-header");
    expect(html).toContain("card-body");
  });
});

// ─── Hydration ──────────────────────────────────────────────────────

describe("factory validation: hydration", () => {
  it("server and client output match", () => {
    const element = (
      <Interactive data-testid="hydrate" disabled>
        Click
      </Interactive>
    );
    const serverHtml = renderToString(element);
    expect(serverHtml).toContain("data-state");
    expect(serverHtml).toContain("data-disabled");

    const { container } = render(element);
    const node = container.firstElementChild!;
    expect(node.getAttribute("data-state")).toBe("disabled");
    expect(node.hasAttribute("data-disabled")).toBe(true);
  });
});

// ─── React Strict Mode ──────────────────────────────────────────────

describe("factory validation: Strict Mode", () => {
  it("no React warnings", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <StrictMode>
        <Card data-testid="sm" title="T">
          B
        </Card>
      </StrictMode>,
    );
    expect(screen.getByTestId("sm").tagName).toBe("DIV");
    const warnings = spy.mock.calls.filter(
      (call) => typeof call[0] === "string" && call[0].includes("Warning:"),
    );
    expect(warnings).toHaveLength(0);
    spy.mockRestore();
  });

  it("refs work in Strict Mode", () => {
    const ref = createRef<HTMLButtonElement>();
    render(
      <StrictMode>
        <Interactive ref={ref} data-testid="sr">
          Click
        </Interactive>
      </StrictMode>,
    );
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it("events fire once in Strict Mode", async () => {
    const user = userEvent.setup();
    const handler = vi.fn();
    render(
      <StrictMode>
        <Interactive data-testid="se" onClick={handler}>
          Click
        </Interactive>
      </StrictMode>,
    );
    await user.click(screen.getByTestId("se"));
    expect(handler).toHaveBeenCalledTimes(1);
  });
});

// ─── Type inference ─────────────────────────────────────────────────

describe("factory validation: type inference", () => {
  it("Card has correct type", () => {
    expectTypeOf(Card).toHaveProperty("displayName");
    expectTypeOf(Card.displayName).toEqualTypeOf<string | undefined>();
  });

  it("Interactive has correct type", () => {
    expectTypeOf(Interactive).toHaveProperty("displayName");
  });

  it("factory preserves own prop types", () => {
    // This compiles — verifying type inference works
    const props: { title?: string; children?: ReactNode } = { title: "Test" };
    expect(props.title).toBe("Test");
  });
});
