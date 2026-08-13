import { describe, it, expect, vi, afterEach, expectTypeOf } from "vitest";
import { createRef, useState } from "react";
import { render, screen, cleanup } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { Switch, switchStyleContract } from "./index";
import type { SwitchProps, SwitchSize } from "./index";
import { Field } from "../field/field";
import { Label } from "../field/label";
import { FieldDescription } from "../field/field-description";
import { componentClass } from "../../composition/class-generation";

afterEach(cleanup);

// ─── Default rendering ──────────────────────────────────────────────

describe("Switch: rendering", () => {
  it("renders a label wrapper", () => {
    const { container } = render(<Switch>Notifications</Switch>);
    expect(container.querySelector("[data-kui-component='Switch']")?.tagName).toBe("LABEL");
  });

  it("has data-kui-component", () => {
    const { container } = render(<Switch>On</Switch>);
    expect(container.querySelector("[data-kui-component='Switch']")).not.toBeNull();
  });

  it("renders button with role=switch", () => {
    const { container } = render(<Switch>On</Switch>);
    const btn = container.querySelector('button[role="switch"]');
    expect(btn).not.toBeNull();
  });

  it("renders label text", () => {
    render(<Switch>Enable feature</Switch>);
    expect(screen.getByText("Enable feature")).toBeDefined();
  });

  it("renders thumb element", () => {
    const { container } = render(<Switch>On</Switch>);
    expect(container.querySelector(".kui-switch__thumb")).not.toBeNull();
  });

  it("applies base class", () => {
    const { container } = render(<Switch>On</Switch>);
    expect(container.querySelector(".kui-switch")).not.toBeNull();
  });

  it("data-state is unchecked by default", () => {
    const { container } = render(<Switch>On</Switch>);
    expect(container.querySelector("[data-state='unchecked']")).not.toBeNull();
  });

  it("button type is button by default", () => {
    const { container } = render(<Switch>On</Switch>);
    expect(container.querySelector("button")!.getAttribute("type")).toBe("button");
  });
});

// ─── Size variants ──────────────────────────────────────────────────

describe("Switch: sizes", () => {
  it("default md has no modifier", () => {
    const { container } = render(<Switch>X</Switch>);
    expect(container.querySelector(".kui-switch--md")).toBeNull();
  });

  it("sm adds modifier", () => {
    const { container } = render(<Switch size="sm">X</Switch>);
    expect(container.querySelector(".kui-switch--sm")).not.toBeNull();
  });

  it("lg adds modifier", () => {
    const { container } = render(<Switch size="lg">X</Switch>);
    expect(container.querySelector(".kui-switch--lg")).not.toBeNull();
  });
});

// ─── Checked state ──────────────────────────────────────────────────

describe("Switch: checked state", () => {
  it("uncontrolled: starts unchecked", () => {
    const { container } = render(<Switch>X</Switch>);
    expect(container.querySelector("button")!.getAttribute("aria-checked")).toBe("false");
  });

  it("uncontrolled: starts checked with defaultChecked", () => {
    const { container } = render(<Switch defaultChecked>X</Switch>);
    expect(container.querySelector("button")!.getAttribute("aria-checked")).toBe("true");
  });

  it("uncontrolled: toggles on click", async () => {
    const user = userEvent.setup();
    const { container } = render(<Switch>X</Switch>);
    const btn = container.querySelector("button")!;
    await user.click(btn);
    expect(btn.getAttribute("aria-checked")).toBe("true");
    await user.click(btn);
    expect(btn.getAttribute("aria-checked")).toBe("false");
  });

  it("controlled: reflects checked prop", () => {
    const { container } = render(
      <Switch checked onCheckedChange={() => {}}>
        X
      </Switch>,
    );
    expect(container.querySelector("button")!.getAttribute("aria-checked")).toBe("true");
  });

  it("controlled: calls onCheckedChange", async () => {
    const handler = vi.fn();
    function Controlled() {
      const [c, setC] = useState(false);
      return (
        <Switch
          checked={c}
          onCheckedChange={(v) => {
            setC(v);
            handler(v);
          }}
        >
          X
        </Switch>
      );
    }
    Controlled.displayName = "Controlled";
    const user = userEvent.setup();
    const { container } = render(<Controlled />);
    await user.click(container.querySelector("button")!);
    expect(handler).toHaveBeenCalledWith(true);
    await user.click(container.querySelector("button")!);
    expect(handler).toHaveBeenCalledWith(false);
  });

  it("data-state reflects checked", () => {
    const { container } = render(
      <Switch checked onCheckedChange={() => {}}>
        X
      </Switch>,
    );
    expect(container.querySelector("[data-state='checked']")).not.toBeNull();
  });
});

// ─── Disabled ───────────────────────────────────────────────────────

describe("Switch: disabled", () => {
  it("disables button", () => {
    const { container } = render(<Switch disabled>X</Switch>);
    expect(container.querySelector("button")!.disabled).toBe(true);
  });

  it("sets data-disabled", () => {
    const { container } = render(<Switch disabled>X</Switch>);
    expect(container.querySelector("[data-disabled]")).not.toBeNull();
  });

  it("does not toggle when disabled", async () => {
    const handler = vi.fn();
    const user = userEvent.setup();
    const { container } = render(
      <Switch disabled onCheckedChange={handler}>
        X
      </Switch>,
    );
    await user.click(container.querySelector("button")!);
    expect(handler).not.toHaveBeenCalled();
  });
});

// ─── Form participation ─────────────────────────────────────────────

describe("Switch: form", () => {
  it("renders hidden checkbox when name is provided", () => {
    const { container } = render(<Switch name="notify">X</Switch>);
    const hidden = container.querySelector('input[type="checkbox"]');
    expect(hidden).not.toBeNull();
    expect(hidden!.getAttribute("name")).toBe("notify");
    expect(hidden!.getAttribute("aria-hidden")).toBe("true");
  });

  it("does not render hidden checkbox when no name", () => {
    const { container } = render(<Switch>X</Switch>);
    expect(container.querySelector("input")).toBeNull();
  });

  it("submits value when checked", async () => {
    const user = userEvent.setup();
    let submitted: string | null = null;
    function Form() {
      return (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submitted = new FormData(e.currentTarget).get("notify") as string;
          }}
        >
          <Switch name="notify" value="yes" defaultChecked>
            Notify
          </Switch>
          <button type="submit">Go</button>
        </form>
      );
    }
    Form.displayName = "Form";
    render(<Form />);
    await user.click(screen.getByText("Go"));
    expect(submitted).toBe("yes");
  });

  it("does not submit when unchecked", async () => {
    const user = userEvent.setup();
    let submitted: string | null = "initial";
    function Form() {
      return (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submitted = new FormData(e.currentTarget).get("notify") as string | null;
          }}
        >
          <Switch name="notify" value="yes">
            Notify
          </Switch>
          <button type="submit">Go</button>
        </form>
      );
    }
    Form.displayName = "Form";
    render(<Form />);
    await user.click(screen.getByText("Go"));
    expect(submitted).toBeNull();
  });
});

// ─── Keyboard ───────────────────────────────────────────────────────

describe("Switch: keyboard", () => {
  it("toggles on Space", async () => {
    const user = userEvent.setup();
    const { container } = render(<Switch>X</Switch>);
    const btn = container.querySelector("button")!;
    btn.focus();
    await user.keyboard(" ");
    expect(btn.getAttribute("aria-checked")).toBe("true");
  });

  it("toggles on Enter", async () => {
    const user = userEvent.setup();
    const { container } = render(<Switch>X</Switch>);
    const btn = container.querySelector("button")!;
    btn.focus();
    await user.keyboard("{Enter}");
    expect(btn.getAttribute("aria-checked")).toBe("true");
  });

  it("does not toggle when disabled", async () => {
    const user = userEvent.setup();
    const { container } = render(<Switch disabled>X</Switch>);
    const btn = container.querySelector("button")!;
    btn.focus();
    await user.keyboard(" ");
    expect(btn.getAttribute("aria-checked")).toBe("false");
  });
});

// ─── Ref forwarding ─────────────────────────────────────────────────

describe("Switch: ref", () => {
  it("forwards ref to button element", () => {
    const ref = createRef<HTMLButtonElement>();
    render(<Switch ref={ref}>X</Switch>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    expect(ref.current!.getAttribute("role")).toBe("switch");
  });

  it("callback ref receives element", () => {
    let captured: HTMLButtonElement | null = null;
    render(
      <Switch
        ref={(el) => {
          captured = el;
        }}
      >
        X
      </Switch>,
    );
    expect(captured).toBeInstanceOf(HTMLButtonElement);
  });
});

// ─── Field integration ──────────────────────────────────────────────

describe("Switch: Field integration", () => {
  it("gets id from Field", () => {
    const { container } = render(
      <Field id="notify">
        <Switch>Notifications</Switch>
      </Field>,
    );
    expect(container.querySelector("button")!.getAttribute("id")).toBe("notify");
  });

  it("gets disabled from Field", () => {
    const { container } = render(
      <Field disabled>
        <Switch>X</Switch>
      </Field>,
    );
    expect(container.querySelector("button")!.disabled).toBe(true);
  });

  it("gets aria-labelledby from Label", () => {
    const { container } = render(
      <Field id="notify">
        <Label>Notifications</Label>
        <Switch>On</Switch>
      </Field>,
    );
    expect(container.querySelector("button")!.getAttribute("aria-labelledby")).toBe("notify-label");
  });

  it("gets aria-describedby from FieldDescription", () => {
    const { container } = render(
      <Field id="notify">
        <FieldDescription>Turn on email notifications</FieldDescription>
        <Switch>On</Switch>
      </Field>,
    );
    expect(container.querySelector("button")!.getAttribute("aria-describedby")).toBe("notify-desc");
  });

  it("gets aria-invalid from Field", () => {
    const { container } = render(
      <Field validationState="invalid">
        <Switch>X</Switch>
      </Field>,
    );
    expect(container.querySelector("button")!.getAttribute("aria-invalid")).toBe("true");
  });

  it("sets data-invalid from Field", () => {
    const { container } = render(
      <Field validationState="invalid">
        <Switch>X</Switch>
      </Field>,
    );
    expect(container.querySelector("[data-invalid]")).not.toBeNull();
  });
});

// ─── Style contract ─────────────────────────────────────────────────

describe("Switch: style contract", () => {
  it("contract name is switch", () => {
    expect(switchStyleContract.name).toBe("switch");
  });

  it("has size variants", () => {
    expect(switchStyleContract.variants!.size.sm).toBeDefined();
    expect(switchStyleContract.variants!.size.md).toBeDefined();
    expect(switchStyleContract.variants!.size.lg).toBeDefined();
  });

  it("has focus-visible state on track", () => {
    expect(switchStyleContract.slots.track.states!["focusVisible"]).toBeDefined();
  });

  it("base class matches utility", () => {
    expect(componentClass(switchStyleContract.name)).toBe("kui-switch");
  });
});

// ─── SSR ────────────────────────────────────────────────────────────

describe("Switch: SSR", () => {
  it("renders to string", () => {
    const html = renderToString(<Switch name="notify">Notifications</Switch>);
    expect(html).toContain('role="switch"');
    expect(html).toContain('aria-checked="false"');
    expect(html).toContain('data-kui-component="Switch"');
    expect(html).toContain("Notifications");
  });

  it("renders checked in SSR", () => {
    const html = renderToString(
      <Switch checked onCheckedChange={() => {}}>
        X
      </Switch>,
    );
    expect(html).toContain('aria-checked="true"');
    expect(html).toContain('data-state="checked"');
  });

  it("renders disabled in SSR", () => {
    const html = renderToString(<Switch disabled>X</Switch>);
    expect(html).toContain("disabled");
    expect(html).toContain("data-disabled");
  });

  it("renders all sizes", () => {
    for (const size of ["sm", "md", "lg"] as const) {
      expect(() => renderToString(<Switch size={size}>X</Switch>)).not.toThrow();
    }
  });
});

// ─── Type inference ─────────────────────────────────────────────────

describe("Switch: types", () => {
  it("SwitchSize is correct union", () => {
    expectTypeOf<SwitchSize>().toEqualTypeOf<"sm" | "md" | "lg">();
  });

  it("SwitchProps has expected properties", () => {
    expectTypeOf<SwitchProps>().toHaveProperty("checked");
    expectTypeOf<SwitchProps>().toHaveProperty("defaultChecked");
    expectTypeOf<SwitchProps>().toHaveProperty("onCheckedChange");
    expectTypeOf<SwitchProps>().toHaveProperty("size");
    expectTypeOf<SwitchProps>().toHaveProperty("disabled");
    expectTypeOf<SwitchProps>().toHaveProperty("name");
    expectTypeOf<SwitchProps>().toHaveProperty("value");
  });
});
