import { createElement, forwardRef, useMemo, useCallback } from "react";
import type { HTMLAttributes } from "react";
import { useControllableState, useId } from "@kairoui/hooks";
import { useFieldContext } from "../field/field-context";
import { SliderContext, snapToStep, valueToPercent } from "./slider-types";
import type { RangeSliderProps, SliderContextValue, RangeSliderValue } from "./slider-types";

function arraysEqual(a: RangeSliderValue, b: RangeSliderValue): boolean {
  return a[0] === b[0] && a[1] === b[1];
}

export const RangeSlider = forwardRef<
  HTMLDivElement,
  RangeSliderProps & HTMLAttributes<HTMLDivElement>
>(function RangeSlider(props, ref) {
  const {
    value: controlledValue,
    defaultValue,
    onValueChange,
    onValueCommit,
    min = 0,
    max = 100,
    step = 1,
    minStepsBetweenThumbs = 0,
    orientation = "horizontal",
    disabled = false,
    name,
    getValueLabel,
    children,
    className,
    ...restProps
  } = props;

  const fieldCtx = useFieldContext();
  const resolvedDisabled = disabled || (fieldCtx?.disabled ?? false);
  const trackId = useId(undefined, { prefix: "kui-range-track" });

  const [values, setValues] = useControllableState<RangeSliderValue>({
    value: controlledValue,
    defaultValue: defaultValue ?? [min, max],
    ...(onValueChange ? { onChange: onValueChange } : undefined),
    isEqual: arraysEqual,
    name: "RangeSlider",
    state: "value",
  });

  const snapped = useMemo<RangeSliderValue>(
    () => [snapToStep(values[0], min, max, step), snapToStep(values[1], min, max, step)],
    [values, min, max, step],
  );

  const thumbPercents = useMemo<readonly number[]>(
    () => [valueToPercent(snapped[0], min, max), valueToPercent(snapped[1], min, max)],
    [snapped, min, max],
  );

  const minDistance = minStepsBetweenThumbs * step;

  const handleThumbValueChange = useCallback(
    (index: number, nextValue: number) => {
      const snap = snapToStep(nextValue, min, max, step);
      setValues((prev) => {
        const next: RangeSliderValue = [...prev];
        next[index] = snap;

        // Enforce ordering + minimum distance
        if (index === 0) {
          const maxAllowed = next[1] - minDistance;
          if (next[0] > maxAllowed) next[0] = snapToStep(maxAllowed, min, max, step);
        } else {
          const minAllowed = next[0] + minDistance;
          if (next[1] < minAllowed) next[1] = snapToStep(minAllowed, min, max, step);
        }

        return next;
      });
    },
    [min, max, step, minDistance, setValues],
  );

  const handleThumbValueCommit = useCallback(() => {
    onValueCommit?.(snapped);
  }, [onValueCommit, snapped]);

  const ctx: SliderContextValue = useMemo(
    () => ({
      min,
      max,
      step,
      orientation,
      disabled: resolvedDisabled,
      values: snapped,
      thumbPercents,
      onThumbValueChange: handleThumbValueChange,
      onThumbValueCommit: handleThumbValueCommit,
      getValueLabel: getValueLabel ? (v: number, i: number) => getValueLabel(v, i) : undefined,
      trackId,
    }),
    [
      min,
      max,
      step,
      orientation,
      resolvedDisabled,
      snapped,
      thumbPercents,
      handleThumbValueChange,
      handleThumbValueCommit,
      getValueLabel,
      trackId,
    ],
  );

  return createElement(
    SliderContext.Provider,
    { value: ctx },
    createElement(
      "div",
      {
        ...restProps,
        ref,
        className: className ? `kui-range-slider ${className}` : "kui-range-slider",
        "data-kui-component": "RangeSlider",
        "data-orientation": orientation,
        ...(resolvedDisabled ? { "data-disabled": "" } : undefined),
      },
      children,
      name &&
        createElement(
          "span",
          { "aria-hidden": "true", style: { display: "none" } },
          createElement("input", {
            type: "hidden",
            name: `${name}[0]`,
            value: String(snapped[0]),
            disabled: resolvedDisabled,
          }),
          createElement("input", {
            type: "hidden",
            name: `${name}[1]`,
            value: String(snapped[1]),
            disabled: resolvedDisabled,
          }),
        ),
    ),
  );
});
