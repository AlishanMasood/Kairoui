import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { Button, buttonStyleContract } from "./button";
import { generateComponentCss } from "../composition/generate-css";
import { componentClass, slotClass } from "../composition/class-generation";

afterEach(cleanup);

// ─── Style contract ─────────────────────────────────────────────────

describe("Button: style contract", () => {
  it("contract name is 'button'", () => {
    expect(buttonStyleContract.name).toBe("button");
  });

  it("defines all 5 slots", () => {
    const slots = Object.keys(buttonStyleContract.slots);
    expect(slots).toContain("root");
    expect(slots).toContain("startIcon");
    expect(slots).toContain("content");
    expect(slots).toContain("endIcon");
    expect(slots).toContain("loadingIndicator");
  });

  it("has custom properties referencing tokens", () => {
    const props = buttonStyleContract.customProperties!;
    expect(props["--kui-button-bg"]).toEqual({
      token: "color.interactive.default",
      fallback: "#0078d4",
    });
    expect(props["--kui-button-fg"]).toEqual({
      token: "color.foreground.onInteractive",
      fallback: "#fff",
    });
    expect(props["--kui-button-height"]).toEqual({
      token: "control.height.md",
      fallback: "36px",
    });
    expect(props["--kui-button-radius"]).toEqual({
      token: "border.radius.md",
      fallback: "6px",
    });
  });

  it("defines appearance and size variant axes", () => {
    const variants = buttonStyleContract.variants!;
    expect(variants.appearance).toBeDefined();
    expect(variants.size).toBeDefined();
  });

  it("appearance has solid, outline, subtle values", () => {
    const appearance = buttonStyleContract.variants!.appearance;
    expect(appearance.solid).toBeDefined();
    expect(appearance.outline).toBeDefined();
    expect(appearance.subtle).toBeDefined();
  });

  it("size has sm, md, lg values", () => {
    const size = buttonStyleContract.variants!.size;
    expect(size.sm).toBeDefined();
    expect(size.md).toBeDefined();
    expect(size.lg).toBeDefined();
  });

  it("has compound variants", () => {
    expect(buttonStyleContract.compoundVariants).toBeDefined();
    expect(buttonStyleContract.compoundVariants!.length).toBeGreaterThan(0);
  });

  it("has default variants", () => {
    expect(buttonStyleContract.defaultVariants).toEqual({ appearance: "solid", size: "md" });
  });

  it("has state styles on root", () => {
    const states = buttonStyleContract.slots.root.states!;
    expect(states["disabled"]).toBeDefined();
    expect(states["hovered"]).toBeDefined();
    expect(states["pressed"]).toBeDefined();
    expect(states["focusVisible"]).toBeDefined();
    expect(states["loading"]).toBeDefined();
  });
});

// ─── Base class ─────────────────────────────────────────────────────

describe("Button: base class", () => {
  it("applies kui-button class to root", () => {
    render(<Button data-testid="btn">Click</Button>);
    expect(screen.getByTestId("btn").className).toContain("kui-button");
  });

  it("base class matches componentClass utility", () => {
    expect(componentClass(buttonStyleContract.name)).toBe("kui-button");
  });
});

// ─── Slot classes ───────────────────────────────────────────────────

describe("Button: slot classes", () => {
  it("content slot has kui-button__content class", () => {
    render(<Button data-testid="btn">Click</Button>);
    const content = screen.getByTestId("btn").querySelector("[data-kui-slot='content']");
    expect(content?.className).toContain("kui-button__content");
  });

  it("startIcon slot has kui-button__start-icon class", () => {
    render(
      <Button data-testid="btn" startIcon={<span>★</span>}>
        Click
      </Button>,
    );
    const icon = screen.getByTestId("btn").querySelector("[data-kui-slot='startIcon']");
    expect(icon?.className).toContain("kui-button__start-icon");
  });

  it("endIcon slot has kui-button__end-icon class", () => {
    render(
      <Button data-testid="btn" endIcon={<span>→</span>}>
        Click
      </Button>,
    );
    const icon = screen.getByTestId("btn").querySelector("[data-kui-slot='endIcon']");
    expect(icon?.className).toContain("kui-button__end-icon");
  });

  it("loadingIndicator slot has class", () => {
    render(
      <Button data-testid="btn" loading>
        Click
      </Button>,
    );
    const indicator = screen.getByTestId("btn").querySelector("[data-kui-slot='loadingIndicator']");
    expect(indicator?.className).toContain("kui-button__loading-indicator");
  });

  it("slot classes match slotClass utility", () => {
    expect(slotClass("button", "startIcon")).toBe("kui-button__start-icon");
    expect(slotClass("button", "content")).toBe("kui-button__content");
    expect(slotClass("button", "endIcon")).toBe("kui-button__end-icon");
    expect(slotClass("button", "loadingIndicator")).toBe("kui-button__loading-indicator");
  });
});

// ─── Variant classes ────────────────────────────────────────────────

describe("Button: variant classes", () => {
  it("default appearance (solid) does not add modifier class", () => {
    render(<Button data-testid="btn">Click</Button>);
    const cls = screen.getByTestId("btn").className;
    expect(cls).toContain("kui-button");
    expect(cls).not.toContain("kui-button--solid");
  });

  it("outline appearance adds modifier class", () => {
    render(
      <Button data-testid="btn" appearance="outline">
        Click
      </Button>,
    );
    expect(screen.getByTestId("btn").className).toContain("kui-button--outline");
  });

  it("subtle appearance adds modifier class", () => {
    render(
      <Button data-testid="btn" appearance="subtle">
        Click
      </Button>,
    );
    expect(screen.getByTestId("btn").className).toContain("kui-button--subtle");
  });

  it("default size (md) does not add modifier class", () => {
    render(<Button data-testid="btn">Click</Button>);
    expect(screen.getByTestId("btn").className).not.toContain("kui-button--md");
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
      <Button data-testid="btn" appearance="outline" size="lg">
        Click
      </Button>,
    );
    const cls = screen.getByTestId("btn").className;
    expect(cls).toContain("kui-button");
    expect(cls).toContain("kui-button--outline");
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

  it("slot consumer overrides are merged with slot classes", () => {
    render(
      <Button data-testid="btn" slotProps={{ content: { className: "extra" } }}>
        Click
      </Button>,
    );
    const content = screen.getByTestId("btn").querySelector("[data-kui-slot='content']");
    expect(content?.className).toContain("kui-button__content");
    expect(content?.className).toContain("extra");
  });
});

// ─── Generated CSS ──────────────────────────────────────────────────

describe("Button: CSS generation", () => {
  it("generates valid CSS from contract", () => {
    const css = generateComponentCss({ contract: buttonStyleContract });
    expect(css).toContain(".kui-button");
  });

  it("generates custom properties block", () => {
    const css = generateComponentCss({ contract: buttonStyleContract });
    expect(css).toContain("--kui-button-bg:");
    expect(css).toContain("--kui-button-fg:");
    expect(css).toContain("--kui-button-height:");
    expect(css).toContain("--kui-button-radius:");
  });

  it("generates base root styles", () => {
    const css = generateComponentCss({ contract: buttonStyleContract });
    expect(css).toContain("display: inline-flex;");
    expect(css).toContain("align-items: center;");
    expect(css).toContain("cursor: pointer;");
    expect(css).toContain("border-radius: var(--kui-button-radius);");
  });

  it("generates slot styles", () => {
    const css = generateComponentCss({ contract: buttonStyleContract });
    expect(css).toContain(".kui-button__start-icon");
    expect(css).toContain(".kui-button__content");
    expect(css).toContain(".kui-button__end-icon");
    expect(css).toContain(".kui-button__loading-indicator");
  });

  it("generates variant modifier rules", () => {
    const css = generateComponentCss({ contract: buttonStyleContract });
    expect(css).toContain(".kui-button--solid");
    expect(css).toContain(".kui-button--outline");
    expect(css).toContain(".kui-button--subtle");
    expect(css).toContain(".kui-button--sm");
    expect(css).toContain(".kui-button--md");
    expect(css).toContain(".kui-button--lg");
  });

  it("generates compound variant rules", () => {
    const css = generateComponentCss({ contract: buttonStyleContract });
    expect(css).toContain("padding-left: 8px;");
    expect(css).toContain("padding-right: 8px;");
  });

  it("generates state selector rules", () => {
    const css = generateComponentCss({ contract: buttonStyleContract });
    expect(css).toContain("[data-disabled]");
    expect(css).toContain(":hover");
    expect(css).toContain(":focus-visible");
    expect(css).toContain("opacity: 0.5;");
    expect(css).toContain("cursor: not-allowed;");
  });

  it("generates density-responsive token references in size variants", () => {
    const css = generateComponentCss({ contract: buttonStyleContract });
    expect(css).toContain("var(--kui-control-height-sm");
    expect(css).toContain("var(--kui-control-height-lg");
  });

  it("CSS output is deterministic", () => {
    const a = generateComponentCss({ contract: buttonStyleContract });
    const b = generateComponentCss({ contract: buttonStyleContract });
    expect(a).toBe(b);
  });

  it("ordering: custom props → base → variants → compounds → states", () => {
    const css = generateComponentCss({ contract: buttonStyleContract });
    const propIdx = css.indexOf("--kui-button-bg:");
    const baseIdx = css.indexOf("display: inline-flex;");
    const variantIdx = css.indexOf(".kui-button--solid");
    const stateIdx = css.indexOf("[data-disabled]");
    expect(propIdx).toBeLessThan(baseIdx);
    expect(baseIdx).toBeLessThan(variantIdx);
    expect(variantIdx).toBeLessThan(stateIdx);
  });
});

// ─── Polymorphic + styling ──────────────────────────────────────────

describe("Button: polymorphic with styling", () => {
  it("anchor retains base class", () => {
    render(
      <Button as="a" href="#" data-testid="btn">
        Link
      </Button>,
    );
    expect(screen.getByTestId("btn").className).toContain("kui-button");
    expect(screen.getByTestId("btn").tagName).toBe("A");
  });

  it("anchor with variants", () => {
    render(
      <Button as="a" href="#" data-testid="btn" appearance="outline" size="lg">
        Link
      </Button>,
    );
    const cls = screen.getByTestId("btn").className;
    expect(cls).toContain("kui-button--outline");
    expect(cls).toContain("kui-button--lg");
  });
});
