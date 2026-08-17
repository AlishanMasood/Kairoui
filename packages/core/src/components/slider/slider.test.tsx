import { describe, it, expect, vi, afterEach } from "vitest";
import { createRef } from "react";
import { render, screen, cleanup } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { Slider, SliderTrack, SliderRange, SliderThumb } from "./slider";
import { Field } from "../field/field";

afterEach(cleanup);

function BasicSlider({
  value,
  defaultValue,
  onValueChange,
  onValueCommit,
  min,
  max,
  step,
  disabled,
  name,
  orientation,
  getValueLabel,
}: {
  value?: number;
  defaultValue?: number;
  onValueChange?: (v: number) => void;
  onValueCommit?: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  name?: string;
  orientation?: "horizontal" | "vertical";
  getValueLabel?: (v: number) => string;
}) {
  return (
    <Slider
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      onValueCommit={onValueCommit}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      name={name}
      orientation={orientation}
      getValueLabel={getValueLabel}
      data-testid="slider"
    >
      <SliderTrack data-testid="track">
        <SliderRange data-testid="range" />
      </SliderTrack>
      <SliderThumb data-testid="thumb" />
    </Slider>
  );
}
BasicSlider.displayName = "BasicSlider";

// ─── Rendering ──────────────────────────────────────────────────────

describe("Slider: rendering", () => {
  it("renders root with data-kui-component", () => {
    render(<BasicSlider defaultValue={50} />);
    expect(screen.getByTestId("slider").getAttribute("data-kui-component")).toBe("Slider");
  });

  it("renders track", () => {
    render(<BasicSlider defaultValue={50} />);
    expect(screen.getByTestId("track")).not.toBeNull();
  });

  it("renders range", () => {
    render(<BasicSlider defaultValue={50} />);
    expect(screen.getByTestId("range")).not.toBeNull();
  });

  it("renders thumb with role=slider", () => {
    render(<BasicSlider defaultValue={50} />);
    expect(screen.getByTestId("thumb").getAttribute("role")).toBe("slider");
  });

  it("thumb has aria-valuemin/max/now", () => {
    render(<BasicSlider defaultValue={50} min={0} max={100} />);
    const thumb = screen.getByTestId("thumb");
    expect(thumb.getAttribute("aria-valuemin")).toBe("0");
    expect(thumb.getAttribute("aria-valuemax")).toBe("100");
    expect(thumb.getAttribute("aria-valuenow")).toBe("50");
  });

  it("thumb has aria-orientation", () => {
    render(<BasicSlider defaultValue={50} orientation="vertical" />);
    expect(screen.getByTestId("thumb").getAttribute("aria-orientation")).toBe("vertical");
  });

  it("thumb is focusable", () => {
    render(<BasicSlider defaultValue={50} />);
    expect(screen.getByTestId("thumb").getAttribute("tabindex")).toBe("0");
  });

  it("thumb not focusable when disabled", () => {
    render(<BasicSlider defaultValue={50} disabled />);
    expect(screen.getByTestId("thumb").getAttribute("tabindex")).toBe("-1");
  });

  it("data-orientation on root", () => {
    render(<BasicSlider defaultValue={50} orientation="horizontal" />);
    expect(screen.getByTestId("slider").getAttribute("data-orientation")).toBe("horizontal");
  });
});

// ─── Value ──────────────────────────────────────────────────────────

describe("Slider: value", () => {
  it("controlled: reflects value", () => {
    render(<BasicSlider value={75} onValueChange={() => {}} />);
    expect(screen.getByTestId("thumb").getAttribute("aria-valuenow")).toBe("75");
  });

  it("uncontrolled: uses defaultValue", () => {
    render(<BasicSlider defaultValue={30} />);
    expect(screen.getByTestId("thumb").getAttribute("aria-valuenow")).toBe("30");
  });

  it("snaps to step", () => {
    render(<BasicSlider defaultValue={33} step={10} />);
    expect(screen.getByTestId("thumb").getAttribute("aria-valuenow")).toBe("30");
  });

  it("clamps to min", () => {
    render(<BasicSlider defaultValue={-10} min={0} />);
    expect(screen.getByTestId("thumb").getAttribute("aria-valuenow")).toBe("0");
  });

  it("clamps to max", () => {
    render(<BasicSlider defaultValue={150} max={100} />);
    expect(screen.getByTestId("thumb").getAttribute("aria-valuenow")).toBe("100");
  });
});

// ─── Keyboard ───────────────────────────────────────────────────────

describe("Slider: keyboard", () => {
  it("ArrowRight increments by step", async () => {
    const handler = vi.fn();
    const user = userEvent.setup();
    render(<BasicSlider defaultValue={50} step={5} onValueChange={handler} />);
    screen.getByTestId("thumb").focus();
    await user.keyboard("{ArrowRight}");
    expect(handler).toHaveBeenCalledWith(55);
  });

  it("ArrowLeft decrements by step", async () => {
    const handler = vi.fn();
    const user = userEvent.setup();
    render(<BasicSlider defaultValue={50} step={5} onValueChange={handler} />);
    screen.getByTestId("thumb").focus();
    await user.keyboard("{ArrowLeft}");
    expect(handler).toHaveBeenCalledWith(45);
  });

  it("ArrowUp increments", async () => {
    const handler = vi.fn();
    const user = userEvent.setup();
    render(<BasicSlider defaultValue={50} onValueChange={handler} />);
    screen.getByTestId("thumb").focus();
    await user.keyboard("{ArrowUp}");
    expect(handler).toHaveBeenCalledWith(51);
  });

  it("ArrowDown decrements", async () => {
    const handler = vi.fn();
    const user = userEvent.setup();
    render(<BasicSlider defaultValue={50} onValueChange={handler} />);
    screen.getByTestId("thumb").focus();
    await user.keyboard("{ArrowDown}");
    expect(handler).toHaveBeenCalledWith(49);
  });

  it("Home goes to min", async () => {
    const handler = vi.fn();
    const user = userEvent.setup();
    render(<BasicSlider defaultValue={50} min={10} onValueChange={handler} />);
    screen.getByTestId("thumb").focus();
    await user.keyboard("{Home}");
    expect(handler).toHaveBeenCalledWith(10);
  });

  it("End goes to max", async () => {
    const handler = vi.fn();
    const user = userEvent.setup();
    render(<BasicSlider defaultValue={50} max={90} onValueChange={handler} />);
    screen.getByTestId("thumb").focus();
    await user.keyboard("{End}");
    expect(handler).toHaveBeenCalledWith(90);
  });

  it("does not change when disabled", async () => {
    const handler = vi.fn();
    const user = userEvent.setup();
    render(<BasicSlider defaultValue={50} disabled onValueChange={handler} />);
    screen.getByTestId("thumb").focus();
    await user.keyboard("{ArrowRight}");
    expect(handler).not.toHaveBeenCalled();
  });

  it("clamps at max boundary", async () => {
    const handler = vi.fn();
    const user = userEvent.setup();
    render(<BasicSlider defaultValue={99} max={100} onValueChange={handler} />);
    screen.getByTestId("thumb").focus();
    await user.keyboard("{ArrowRight}");
    expect(handler).toHaveBeenCalledWith(100);
    await user.keyboard("{ArrowRight}");
    // Should still be 100, called again but clamped
    expect(handler).toHaveBeenLastCalledWith(100);
  });
});

// ─── Range positioning ──────────────────────────────────────────────

describe("Slider: range positioning", () => {
  it("range width reflects value percentage", () => {
    render(<BasicSlider defaultValue={50} min={0} max={100} />);
    expect(screen.getByTestId("range").style.width).toBe("50%");
  });

  it("range height for vertical orientation", () => {
    render(<BasicSlider defaultValue={75} orientation="vertical" />);
    expect(screen.getByTestId("range").style.height).toBe("75%");
  });

  it("thumb left position reflects percentage", () => {
    render(<BasicSlider defaultValue={25} />);
    expect(screen.getByTestId("thumb").style.left).toBe("25%");
  });

  it("thumb bottom for vertical", () => {
    render(<BasicSlider defaultValue={60} orientation="vertical" />);
    expect(screen.getByTestId("thumb").style.bottom).toBe("60%");
  });
});

// ─── Accessible value text ──────────────────────────────────────────

describe("Slider: getValueLabel", () => {
  it("sets aria-valuetext from getValueLabel", () => {
    render(<BasicSlider defaultValue={50} getValueLabel={(v) => `${String(v)}%`} />);
    expect(screen.getByTestId("thumb").getAttribute("aria-valuetext")).toBe("50%");
  });

  it("no aria-valuetext without getValueLabel", () => {
    render(<BasicSlider defaultValue={50} />);
    expect(screen.getByTestId("thumb").getAttribute("aria-valuetext")).toBeNull();
  });
});

// ─── Form participation ─────────────────────────────────────────────

describe("Slider: form", () => {
  it("renders hidden input with name and value", () => {
    const { container } = render(<BasicSlider name="vol" defaultValue={80} />);
    const hidden = container.querySelector('input[type="hidden"]') as HTMLInputElement;
    expect(hidden).not.toBeNull();
    expect(hidden.name).toBe("vol");
    expect(hidden.value).toBe("80");
  });

  it("submits value with form", async () => {
    const user = userEvent.setup();
    let submitted: string | null = null;
    function Form() {
      return (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submitted = new FormData(e.currentTarget).get("vol") as string;
          }}
        >
          <BasicSlider name="vol" defaultValue={60} />
          <button type="submit">Go</button>
        </form>
      );
    }
    Form.displayName = "Form";
    render(<Form />);
    await user.click(screen.getByText("Go"));
    expect(submitted).toBe("60");
  });
});

// ─── Disabled ───────────────────────────────────────────────────────

describe("Slider: disabled", () => {
  it("sets data-disabled", () => {
    render(<BasicSlider defaultValue={50} disabled />);
    expect(screen.getByTestId("slider").hasAttribute("data-disabled")).toBe(true);
  });

  it("thumb has aria-disabled", () => {
    render(<BasicSlider defaultValue={50} disabled />);
    expect(screen.getByTestId("thumb").getAttribute("aria-disabled")).toBe("true");
  });
});

// ─── Field integration ──────────────────────────────────────────────

describe("Slider: Field integration", () => {
  it("gets disabled from Field", () => {
    render(
      <Field disabled>
        <Slider data-testid="slider" defaultValue={50}>
          <SliderTrack>
            <SliderRange />
          </SliderTrack>
          <SliderThumb data-testid="thumb" />
        </Slider>
      </Field>,
    );
    expect(screen.getByTestId("thumb").getAttribute("aria-disabled")).toBe("true");
  });
});

// ─── Ref ────────────────────────────────────────────────────────────

describe("Slider: refs", () => {
  it("forwards ref on thumb", () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <Slider defaultValue={50}>
        <SliderTrack>
          <SliderRange />
        </SliderTrack>
        <SliderThumb ref={ref} />
      </Slider>,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
    expect(ref.current!.getAttribute("role")).toBe("slider");
  });
});

// ─── SSR ────────────────────────────────────────────────────────────

describe("Slider: SSR", () => {
  it("renders to string", () => {
    const html = renderToString(
      <Slider name="vol" defaultValue={50} min={0} max={100}>
        <SliderTrack>
          <SliderRange />
        </SliderTrack>
        <SliderThumb />
      </Slider>,
    );
    expect(html).toContain('data-kui-component="Slider"');
    expect(html).toContain('role="slider"');
    expect(html).toContain('aria-valuenow="50"');
    expect(html).toContain('name="vol"');
    expect(html).toContain('value="50"');
  });
});
