import { describe, it, expect, expectTypeOf } from "vitest";
import { createElement } from "react";
import { renderHook } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import {
  SliderContext,
  useSliderContext,
  snapToStep,
  valueToPercent,
  percentToValue,
} from "./slider-types";
import type {
  SliderProps,
  RangeSliderProps,
  SliderValue,
  RangeSliderValue,
  SliderContextValue,
} from "./slider-types";

// ─── snapToStep ─────────────────────────────────────────────────────

describe("snapToStep", () => {
  it("snaps to nearest step", () => {
    expect(snapToStep(7, 0, 100, 5)).toBe(5);
    expect(snapToStep(8, 0, 100, 5)).toBe(10);
  });

  it("clamps to min", () => {
    expect(snapToStep(-5, 0, 100, 1)).toBe(0);
  });

  it("clamps to max", () => {
    expect(snapToStep(150, 0, 100, 1)).toBe(100);
  });

  it("handles step=0.1", () => {
    expect(snapToStep(0.33, 0, 1, 0.1)).toBeCloseTo(0.3);
  });

  it("returns min when value equals min", () => {
    expect(snapToStep(0, 0, 100, 10)).toBe(0);
  });

  it("returns max when value equals max", () => {
    expect(snapToStep(100, 0, 100, 10)).toBe(100);
  });
});

// ─── valueToPercent ─────────────────────────────────────────────────

describe("valueToPercent", () => {
  it("converts value to percentage", () => {
    expect(valueToPercent(50, 0, 100)).toBe(50);
    expect(valueToPercent(25, 0, 100)).toBe(25);
  });

  it("handles non-zero min", () => {
    expect(valueToPercent(15, 10, 20)).toBe(50);
  });

  it("returns 0 when min equals max", () => {
    expect(valueToPercent(5, 5, 5)).toBe(0);
  });

  it("returns 0 for min value", () => {
    expect(valueToPercent(0, 0, 100)).toBe(0);
  });

  it("returns 100 for max value", () => {
    expect(valueToPercent(100, 0, 100)).toBe(100);
  });
});

// ─── percentToValue ─────────────────────────────────────────────────

describe("percentToValue", () => {
  it("converts percentage to value", () => {
    expect(percentToValue(50, 0, 100)).toBe(50);
    expect(percentToValue(25, 0, 100)).toBe(25);
  });

  it("handles non-zero min", () => {
    expect(percentToValue(50, 10, 20)).toBe(15);
  });

  it("returns min for 0%", () => {
    expect(percentToValue(0, 0, 100)).toBe(0);
  });

  it("returns max for 100%", () => {
    expect(percentToValue(100, 0, 100)).toBe(100);
  });
});

// ─── Type contracts ─────────────────────────────────────────────────

describe("Slider types", () => {
  it("SliderValue is number", () => {
    expectTypeOf<SliderValue>().toEqualTypeOf<number>();
  });

  it("RangeSliderValue is [number, number]", () => {
    expectTypeOf<RangeSliderValue>().toEqualTypeOf<[number, number]>();
  });

  it("SliderProps has value/defaultValue/onValueChange", () => {
    expectTypeOf<SliderProps>().toHaveProperty("value");
    expectTypeOf<SliderProps>().toHaveProperty("defaultValue");
    expectTypeOf<SliderProps>().toHaveProperty("onValueChange");
    expectTypeOf<SliderProps>().toHaveProperty("onValueCommit");
  });

  it("SliderProps has min/max/step", () => {
    expectTypeOf<SliderProps>().toHaveProperty("min");
    expectTypeOf<SliderProps>().toHaveProperty("max");
    expectTypeOf<SliderProps>().toHaveProperty("step");
  });

  it("SliderProps has orientation/disabled/name", () => {
    expectTypeOf<SliderProps>().toHaveProperty("orientation");
    expectTypeOf<SliderProps>().toHaveProperty("disabled");
    expectTypeOf<SliderProps>().toHaveProperty("name");
  });

  it("RangeSliderProps has minStepsBetweenThumbs", () => {
    expectTypeOf<RangeSliderProps>().toHaveProperty("minStepsBetweenThumbs");
  });

  it("RangeSliderProps has getValueLabel with index", () => {
    expectTypeOf<RangeSliderProps>().toHaveProperty("getValueLabel");
  });

  it("all SliderProps are optional", () => {
    const props: SliderProps = {};
    expect(props.value).toBeUndefined();
  });
});

// ─── SliderContext ──────────────────────────────────────────────────

describe("SliderContext", () => {
  it("throws when used outside provider", () => {
    expect(() => {
      renderHook(() => useSliderContext());
    }).toThrow("Slider parts must be used inside a <Slider>");
  });

  it("returns context value inside provider", () => {
    const ctx: SliderContextValue = {
      min: 0,
      max: 100,
      step: 1,
      orientation: "horizontal",
      disabled: false,
      values: [50],
      thumbPercents: [50],
      onThumbValueChange: () => {},
      onThumbValueCommit: () => {},
      getValueLabel: undefined,
      trackId: "track-1",
    };
    function Wrapper({ children }: { children: React.ReactNode }) {
      return createElement(SliderContext.Provider, { value: ctx }, children);
    }
    Wrapper.displayName = "Wrapper";
    const { result } = renderHook(() => useSliderContext(), { wrapper: Wrapper });
    expect(result.current.min).toBe(0);
    expect(result.current.max).toBe(100);
    expect(result.current.values).toEqual([50]);
  });
});

// ─── SSR safety ─────────────────────────────────────────────────────

describe("Slider types: SSR", () => {
  it("SliderContext.Provider renders on server", () => {
    const ctx: SliderContextValue = {
      min: 0,
      max: 100,
      step: 1,
      orientation: "horizontal",
      disabled: false,
      values: [25],
      thumbPercents: [25],
      onThumbValueChange: () => {},
      onThumbValueCommit: () => {},
      getValueLabel: undefined,
      trackId: "t",
    };
    const html = renderToString(
      createElement(SliderContext.Provider, { value: ctx }, createElement("div", null, "ok")),
    );
    expect(html).toContain("ok");
  });
});
