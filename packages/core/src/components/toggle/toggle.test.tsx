import { describe, it, expect, vi, afterEach, expectTypeOf } from "vitest";
import { createRef, useState } from "react";
import { render, screen, cleanup } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { Toggle } from "./toggle";
import type { ToggleProps, ToggleSize, ToggleAppearance } from "./toggle";

afterEach(cleanup);

// ─── Rendering ──────────────────────────────────────────────────────

describe("Toggle: rendering", () => {
  it("renders a button", () => {
    render(<Toggle data-testid="t">Bold</Toggle>);
    expect(screen.getByTestId("t").tagName).toBe("BUTTON");
  });

  it("has data-kui-component", () => {
    render(<Toggle data-testid="t">B</Toggle>);
    expect(screen.getByTestId("t").getAttribute("data-kui-component")).toBe("Toggle");
  });

  it("type is button", () => {
    render(<Toggle data-testid="t">B</Toggle>);
    expect(screen.getByTestId("t").getAttribute("type")).toBe("button");
  });

  it("renders children", () => {
    render(<Toggle data-testid="t">Bold</Toggle>);
    expect(screen.getByTestId("t").textContent).toBe("Bold");
  });

  it("has aria-pressed=false by default", () => {
    render(<Toggle data-testid="t">B</Toggle>);
    expect(screen.getByTestId("t").getAttribute("aria-pressed")).toBe("false");
  });

  it("has data-state=off by default", () => {
    render(<Toggle data-testid="t">B</Toggle>);
    expect(screen.getByTestId("t").getAttribute("data-state")).toBe("off");
  });
});

// ─── Pressed state ──────────────────────────────────────────────────

describe("Toggle: pressed", () => {
  it("uncontrolled: toggles on click", async () => {
    const user = userEvent.setup();
    render(<Toggle data-testid="t">B</Toggle>);
    await user.click(screen.getByTestId("t"));
    expect(screen.getByTestId("t").getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByTestId("t").getAttribute("data-state")).toBe("on");
    await user.click(screen.getByTestId("t"));
    expect(screen.getByTestId("t").getAttribute("aria-pressed")).toBe("false");
  });

  it("uncontrolled: starts pressed with defaultPressed", () => {
    render(
      <Toggle data-testid="t" defaultPressed>
        B
      </Toggle>,
    );
    expect(screen.getByTestId("t").getAttribute("aria-pressed")).toBe("true");
  });

  it("controlled: reflects pressed prop", () => {
    render(
      <Toggle data-testid="t" pressed onPressedChange={() => {}}>
        B
      </Toggle>,
    );
    expect(screen.getByTestId("t").getAttribute("aria-pressed")).toBe("true");
  });

  it("controlled: calls onPressedChange", async () => {
    const handler = vi.fn();
    function Ctrl() {
      const [p, setP] = useState(false);
      return (
        <Toggle
          data-testid="t"
          pressed={p}
          onPressedChange={(v) => {
            setP(v);
            handler(v);
          }}
        >
          B
        </Toggle>
      );
    }
    Ctrl.displayName = "Ctrl";
    const user = userEvent.setup();
    render(<Ctrl />);
    await user.click(screen.getByTestId("t"));
    expect(handler).toHaveBeenCalledWith(true);
    await user.click(screen.getByTestId("t"));
    expect(handler).toHaveBeenCalledWith(false);
  });
});

// ─── Variants ───────────────────────────────────────────────────────

describe("Toggle: variants", () => {
  it("default has no appearance modifier", () => {
    render(<Toggle data-testid="t">B</Toggle>);
    expect(screen.getByTestId("t").className).not.toContain("kui-toggle--outline");
  });

  it("subtle adds modifier", () => {
    render(
      <Toggle data-testid="t" appearance="subtle">
        B
      </Toggle>,
    );
    expect(screen.getByTestId("t").className).toContain("kui-toggle--subtle");
  });

  it("ghost adds modifier", () => {
    render(
      <Toggle data-testid="t" appearance="ghost">
        B
      </Toggle>,
    );
    expect(screen.getByTestId("t").className).toContain("kui-toggle--ghost");
  });

  it("sm size adds modifier", () => {
    render(
      <Toggle data-testid="t" size="sm">
        B
      </Toggle>,
    );
    expect(screen.getByTestId("t").className).toContain("kui-toggle--sm");
  });

  it("lg size adds modifier", () => {
    render(
      <Toggle data-testid="t" size="lg">
        B
      </Toggle>,
    );
    expect(screen.getByTestId("t").className).toContain("kui-toggle--lg");
  });

  it("consumer className merged", () => {
    render(
      <Toggle data-testid="t" className="custom">
        B
      </Toggle>,
    );
    const cls = screen.getByTestId("t").className;
    expect(cls).toContain("kui-toggle");
    expect(cls).toContain("custom");
  });
});

// ─── Disabled ───────────────────────────────────────────────────────

describe("Toggle: disabled", () => {
  it("sets disabled attribute", () => {
    render(
      <Toggle data-testid="t" disabled>
        B
      </Toggle>,
    );
    expect(screen.getByTestId("t")).toBeDisabled();
  });

  it("sets data-disabled", () => {
    render(
      <Toggle data-testid="t" disabled>
        B
      </Toggle>,
    );
    expect(screen.getByTestId("t").hasAttribute("data-disabled")).toBe(true);
  });

  it("does not toggle when disabled", async () => {
    const handler = vi.fn();
    const user = userEvent.setup();
    render(
      <Toggle data-testid="t" disabled onPressedChange={handler}>
        B
      </Toggle>,
    );
    await user.click(screen.getByTestId("t"));
    expect(handler).not.toHaveBeenCalled();
  });
});

// ─── Keyboard ───────────────────────────────────────────────────────

describe("Toggle: keyboard", () => {
  it("Enter toggles (native button)", async () => {
    const user = userEvent.setup();
    render(<Toggle data-testid="t">B</Toggle>);
    screen.getByTestId("t").focus();
    await user.keyboard("{Enter}");
    expect(screen.getByTestId("t").getAttribute("aria-pressed")).toBe("true");
  });

  it("Space toggles (native button)", async () => {
    const user = userEvent.setup();
    render(<Toggle data-testid="t">B</Toggle>);
    screen.getByTestId("t").focus();
    await user.keyboard(" ");
    expect(screen.getByTestId("t").getAttribute("aria-pressed")).toBe("true");
  });
});

// ─── Ref ────────────────────────────────────────────────────────────

describe("Toggle: ref", () => {
  it("forwards ref to button", () => {
    const ref = createRef<HTMLButtonElement>();
    render(<Toggle ref={ref}>B</Toggle>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });
});

// ─── SSR ────────────────────────────────────────────────────────────

describe("Toggle: SSR", () => {
  it("renders to string", () => {
    const html = renderToString(<Toggle defaultPressed>Bold</Toggle>);
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain('data-state="on"');
    expect(html).toContain('data-kui-component="Toggle"');
    expect(html).toContain("Bold");
  });
});

// ─── Types ──────────────────────────────────────────────────────────

describe("Toggle: types", () => {
  it("ToggleSize is correct union", () => {
    expectTypeOf<ToggleSize>().toEqualTypeOf<"sm" | "md" | "lg">();
  });

  it("ToggleAppearance is correct union", () => {
    expectTypeOf<ToggleAppearance>().toEqualTypeOf<"outline" | "subtle" | "ghost">();
  });

  it("ToggleProps has expected properties", () => {
    expectTypeOf<ToggleProps>().toHaveProperty("pressed");
    expectTypeOf<ToggleProps>().toHaveProperty("defaultPressed");
    expectTypeOf<ToggleProps>().toHaveProperty("onPressedChange");
    expectTypeOf<ToggleProps>().toHaveProperty("size");
    expectTypeOf<ToggleProps>().toHaveProperty("appearance");
  });
});
