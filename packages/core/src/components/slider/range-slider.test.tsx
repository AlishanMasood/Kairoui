import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { RangeSlider } from "./range-slider";
import { SliderTrack, SliderRange, SliderThumb } from "./slider";

afterEach(cleanup);

function BasicRange({
  defaultValue,
  onValueChange,
  onValueCommit,
  min = 0,
  max = 100,
  step = 1,
  minStepsBetweenThumbs,
  disabled,
  name,
  getValueLabel,
}: {
  defaultValue?: [number, number];
  onValueChange?: (v: [number, number]) => void;
  onValueCommit?: (v: [number, number]) => void;
  min?: number;
  max?: number;
  step?: number;
  minStepsBetweenThumbs?: number;
  disabled?: boolean;
  name?: string;
  getValueLabel?: (v: number, i: number) => string;
}) {
  return (
    <RangeSlider
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      onValueCommit={onValueCommit}
      min={min}
      max={max}
      step={step}
      minStepsBetweenThumbs={minStepsBetweenThumbs}
      disabled={disabled}
      name={name}
      getValueLabel={getValueLabel}
      data-testid="range-slider"
    >
      <SliderTrack data-testid="track">
        <SliderRange data-testid="range" />
      </SliderTrack>
      <SliderThumb index={0} data-testid="thumb-0" />
      <SliderThumb index={1} data-testid="thumb-1" />
    </RangeSlider>
  );
}
BasicRange.displayName = "BasicRange";

// ─── Rendering ──────────────────────────────────────────────────────

describe("RangeSlider: rendering", () => {
  it("renders with data-kui-component", () => {
    render(<BasicRange defaultValue={[20, 80]} />);
    expect(screen.getByTestId("range-slider").getAttribute("data-kui-component")).toBe(
      "RangeSlider",
    );
  });

  it("renders two thumbs with role=slider", () => {
    render(<BasicRange defaultValue={[20, 80]} />);
    expect(screen.getByTestId("thumb-0").getAttribute("role")).toBe("slider");
    expect(screen.getByTestId("thumb-1").getAttribute("role")).toBe("slider");
  });

  it("first thumb has correct aria-valuenow", () => {
    render(<BasicRange defaultValue={[25, 75]} />);
    expect(screen.getByTestId("thumb-0").getAttribute("aria-valuenow")).toBe("25");
    expect(screen.getByTestId("thumb-1").getAttribute("aria-valuenow")).toBe("75");
  });

  it("both thumbs have aria-valuemin/max", () => {
    render(<BasicRange defaultValue={[20, 80]} min={0} max={100} />);
    expect(screen.getByTestId("thumb-0").getAttribute("aria-valuemin")).toBe("0");
    expect(screen.getByTestId("thumb-1").getAttribute("aria-valuemax")).toBe("100");
  });
});

// ─── Range positioning ──────────────────────────────────────────────

describe("RangeSlider: range positioning", () => {
  it("range left/width reflects thumb positions", () => {
    render(<BasicRange defaultValue={[20, 80]} />);
    const range = screen.getByTestId("range");
    expect(range.style.left).toBe("20%");
    expect(range.style.width).toBe("60%");
  });

  it("thumb positions reflect values", () => {
    render(<BasicRange defaultValue={[30, 70]} />);
    expect(screen.getByTestId("thumb-0").style.left).toBe("30%");
    expect(screen.getByTestId("thumb-1").style.left).toBe("70%");
  });
});

// ─── Keyboard ───────────────────────────────────────────────────────

describe("RangeSlider: keyboard", () => {
  it("ArrowRight on first thumb increases it", async () => {
    const handler = vi.fn();
    const user = userEvent.setup();
    render(<BasicRange defaultValue={[20, 80]} step={5} onValueChange={handler} />);
    screen.getByTestId("thumb-0").focus();
    await user.keyboard("{ArrowRight}");
    expect(handler).toHaveBeenCalledWith([25, 80]);
  });

  it("ArrowLeft on second thumb decreases it", async () => {
    const handler = vi.fn();
    const user = userEvent.setup();
    render(<BasicRange defaultValue={[20, 80]} step={5} onValueChange={handler} />);
    screen.getByTestId("thumb-1").focus();
    await user.keyboard("{ArrowLeft}");
    expect(handler).toHaveBeenCalledWith([20, 75]);
  });

  it("Home on first thumb goes to min", async () => {
    const handler = vi.fn();
    const user = userEvent.setup();
    render(<BasicRange defaultValue={[30, 70]} onValueChange={handler} />);
    screen.getByTestId("thumb-0").focus();
    await user.keyboard("{Home}");
    expect(handler).toHaveBeenCalledWith([0, 70]);
  });

  it("End on second thumb goes to max", async () => {
    const handler = vi.fn();
    const user = userEvent.setup();
    render(<BasicRange defaultValue={[30, 70]} onValueChange={handler} />);
    screen.getByTestId("thumb-1").focus();
    await user.keyboard("{End}");
    expect(handler).toHaveBeenCalledWith([30, 100]);
  });
});

// ─── Thumb collision / min distance ─────────────────────────────────

describe("RangeSlider: collision", () => {
  it("first thumb cannot exceed second thumb", async () => {
    const handler = vi.fn();
    const user = userEvent.setup();
    render(<BasicRange defaultValue={[49, 50]} step={1} onValueChange={handler} />);
    screen.getByTestId("thumb-0").focus();
    await user.keyboard("{ArrowRight}");
    // Should be clamped to 50 (equals second thumb since minStepsBetweenThumbs=0)
    expect(handler).toHaveBeenCalledWith([50, 50]);
  });

  it("second thumb cannot go below first thumb", async () => {
    const handler = vi.fn();
    const user = userEvent.setup();
    render(<BasicRange defaultValue={[50, 51]} step={1} onValueChange={handler} />);
    screen.getByTestId("thumb-1").focus();
    await user.keyboard("{ArrowLeft}");
    expect(handler).toHaveBeenCalledWith([50, 50]);
  });

  it("enforces minStepsBetweenThumbs", async () => {
    const handler = vi.fn();
    const user = userEvent.setup();
    render(
      <BasicRange
        defaultValue={[40, 60]}
        step={5}
        minStepsBetweenThumbs={2}
        onValueChange={handler}
      />,
    );
    // minDistance = 2 * 5 = 10. First thumb at 40, second at 60. Move first right.
    screen.getByTestId("thumb-0").focus();
    await user.keyboard("{ArrowRight}");
    expect(handler).toHaveBeenCalledWith([45, 60]);
    // Try to move first thumb to 55 — blocked (60-10=50 is max for first)
    await user.keyboard("{ArrowRight}");
    expect(handler).toHaveBeenCalledWith([50, 60]);
    await user.keyboard("{ArrowRight}");
    // Should be clamped to 50
    expect(handler).toHaveBeenLastCalledWith([50, 60]);
  });
});

// ─── Disabled ───────────────────────────────────────────────────────

describe("RangeSlider: disabled", () => {
  it("sets data-disabled", () => {
    render(<BasicRange defaultValue={[20, 80]} disabled />);
    expect(screen.getByTestId("range-slider").hasAttribute("data-disabled")).toBe(true);
  });

  it("thumbs have aria-disabled", () => {
    render(<BasicRange defaultValue={[20, 80]} disabled />);
    expect(screen.getByTestId("thumb-0").getAttribute("aria-disabled")).toBe("true");
    expect(screen.getByTestId("thumb-1").getAttribute("aria-disabled")).toBe("true");
  });

  it("keyboard does not change value", async () => {
    const handler = vi.fn();
    const user = userEvent.setup();
    render(<BasicRange defaultValue={[20, 80]} disabled onValueChange={handler} />);
    screen.getByTestId("thumb-0").focus();
    await user.keyboard("{ArrowRight}");
    expect(handler).not.toHaveBeenCalled();
  });
});

// ─── Form participation ─────────────────────────────────────────────

describe("RangeSlider: form", () => {
  it("renders two hidden inputs", () => {
    const { container } = render(<BasicRange name="range" defaultValue={[10, 90]} />);
    const inputs = container.querySelectorAll('input[type="hidden"]');
    expect(inputs).toHaveLength(2);
    expect((inputs[0] as HTMLInputElement).name).toBe("range[0]");
    expect((inputs[0] as HTMLInputElement).value).toBe("10");
    expect((inputs[1] as HTMLInputElement).name).toBe("range[1]");
    expect((inputs[1] as HTMLInputElement).value).toBe("90");
  });

  it("submits both values", async () => {
    const user = userEvent.setup();
    const data: Record<string, string> = {};
    function Form() {
      return (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            for (const [k, v] of fd.entries()) {
              data[k] = v as string;
            }
          }}
        >
          <BasicRange name="range" defaultValue={[25, 75]} />
          <button type="submit">Go</button>
        </form>
      );
    }
    Form.displayName = "Form";
    render(<Form />);
    await user.click(screen.getByText("Go"));
    expect(data["range[0]"]).toBe("25");
    expect(data["range[1]"]).toBe("75");
  });
});

// ─── getValueLabel ──────────────────────────────────────────────────

describe("RangeSlider: getValueLabel", () => {
  it("sets aria-valuetext per thumb", () => {
    render(
      <BasicRange
        defaultValue={[20, 80]}
        getValueLabel={(v, i) => `Thumb ${String(i)}: ${String(v)}%`}
      />,
    );
    expect(screen.getByTestId("thumb-0").getAttribute("aria-valuetext")).toBe("Thumb 0: 20%");
    expect(screen.getByTestId("thumb-1").getAttribute("aria-valuetext")).toBe("Thumb 1: 80%");
  });
});

// ─── SSR ────────────────────────────────────────────────────────────

describe("RangeSlider: SSR", () => {
  it("renders to string", () => {
    const html = renderToString(
      <RangeSlider name="range" defaultValue={[10, 90]} min={0} max={100}>
        <SliderTrack>
          <SliderRange />
        </SliderTrack>
        <SliderThumb index={0} />
        <SliderThumb index={1} />
      </RangeSlider>,
    );
    expect(html).toContain('data-kui-component="RangeSlider"');
    expect(html).toContain('role="slider"');
    expect(html).toContain('aria-valuenow="10"');
    expect(html).toContain('aria-valuenow="90"');
    expect(html).toContain('name="range[0]"');
    expect(html).toContain('name="range[1]"');
  });
});
