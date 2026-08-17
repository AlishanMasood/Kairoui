import { createElement, forwardRef, useMemo, useCallback, useRef } from "react";
import type { HTMLAttributes } from "react";
import { useControllableState, useId } from "@kairoui/hooks";
import { useFieldContext } from "../field/field-context";
import { SliderContext, useSliderContext, snapToStep, valueToPercent } from "./slider-types";
import type {
  SliderProps,
  SliderTrackProps,
  SliderRangeProps,
  SliderThumbProps,
  SliderContextValue,
} from "./slider-types";

// ─── Slider Root ────────────────────────────────────────────────────

export const Slider = forwardRef<HTMLDivElement, SliderProps & HTMLAttributes<HTMLDivElement>>(
  function Slider(props, ref) {
    const {
      value: controlledValue,
      defaultValue,
      onValueChange,
      onValueCommit,
      min = 0,
      max = 100,
      step = 1,
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
    const trackId = useId(undefined, { prefix: "kui-slider-track" });

    const [currentValue, setCurrentValue] = useControllableState<number>({
      value: controlledValue,
      defaultValue: defaultValue ?? min,
      ...(onValueChange ? { onChange: onValueChange } : undefined),
      name: "Slider",
      state: "value",
    });

    const snappedValue = snapToStep(currentValue, min, max, step);
    const percent = valueToPercent(snappedValue, min, max);

    const handleThumbValueChange = useCallback(
      (_index: number, nextValue: number) => {
        const snapped = snapToStep(nextValue, min, max, step);
        setCurrentValue(snapped);
      },
      [min, max, step, setCurrentValue],
    );

    const handleThumbValueCommit = useCallback(() => {
      onValueCommit?.(snappedValue);
    }, [onValueCommit, snappedValue]);

    const ctx: SliderContextValue = useMemo(
      () => ({
        min,
        max,
        step,
        orientation,
        disabled: resolvedDisabled,
        values: [snappedValue],
        thumbPercents: [percent],
        onThumbValueChange: handleThumbValueChange,
        onThumbValueCommit: handleThumbValueCommit,
        getValueLabel: getValueLabel ? (v: number) => getValueLabel(v) : undefined,
        trackId,
      }),
      [
        min,
        max,
        step,
        orientation,
        resolvedDisabled,
        snappedValue,
        percent,
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
          className: className ? `kui-slider ${className}` : "kui-slider",
          "data-kui-component": "Slider",
          "data-orientation": orientation,
          ...(resolvedDisabled ? { "data-disabled": "" } : undefined),
        },
        children,
        name &&
          createElement("input", {
            type: "hidden",
            name,
            value: String(snappedValue),
            disabled: resolvedDisabled,
            "aria-hidden": "true",
            tabIndex: -1,
          }),
      ),
    );
  },
);

// ─── Slider Track ───────────────────────────────────────────────────

export const SliderTrack = forwardRef<
  HTMLDivElement,
  SliderTrackProps & HTMLAttributes<HTMLDivElement>
>(function SliderTrack(props, ref) {
  const { children, className, ...restProps } = props;
  const ctx = useSliderContext();
  const trackRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (ctx.disabled) return;
      const track = trackRef.current;
      if (!track) return;

      e.preventDefault();
      const rect = track.getBoundingClientRect();
      const percent =
        ctx.orientation === "horizontal"
          ? ((e.clientX - rect.left) / rect.width) * 100
          : ((rect.bottom - e.clientY) / rect.height) * 100;

      const clampedPercent = Math.min(Math.max(percent, 0), 100);
      const rawValue = ctx.min + (clampedPercent / 100) * (ctx.max - ctx.min);
      ctx.onThumbValueChange(0, rawValue);
      ctx.onThumbValueCommit();
    },
    [ctx],
  );

  return createElement(
    "div",
    {
      ...restProps,
      ref: (el: HTMLDivElement | null) => {
        trackRef.current = el;
        if (typeof ref === "function") ref(el);
        else if (ref) ref.current = el;
      },
      id: ctx.trackId,
      className: className ? `kui-slider-track ${className}` : "kui-slider-track",
      "data-kui-component": "SliderTrack",
      "data-orientation": ctx.orientation,
      onPointerDown: handlePointerDown,
    },
    children,
  );
});

// ─── Slider Range ───────────────────────────────────────────────────

export const SliderRange = forwardRef<
  HTMLDivElement,
  SliderRangeProps & HTMLAttributes<HTMLDivElement>
>(function SliderRange(props, ref) {
  const { className, ...restProps } = props;
  const ctx = useSliderContext();
  const percent = ctx.thumbPercents[0] ?? 0;

  const style =
    ctx.orientation === "horizontal"
      ? { width: `${String(percent)}%` }
      : { height: `${String(percent)}%` };

  return createElement("div", {
    ...restProps,
    ref,
    className: className ? `kui-slider-range ${className}` : "kui-slider-range",
    "data-kui-component": "SliderRange",
    "data-orientation": ctx.orientation,
    style,
  });
});

// ─── Slider Thumb ───────────────────────────────────────────────────

export const SliderThumb = forwardRef<
  HTMLDivElement,
  SliderThumbProps & HTMLAttributes<HTMLDivElement>
>(function SliderThumb(props, ref) {
  const { index = 0, className, ...restProps } = props;
  const ctx = useSliderContext();
  const thumbRef = useRef<HTMLDivElement>(null);

  const currentValue = ctx.values[index] ?? ctx.min;
  const percent = ctx.thumbPercents[index] ?? 0;
  const valueText = ctx.getValueLabel?.(currentValue, index);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (ctx.disabled) return;
      let nextValue = currentValue;

      switch (e.key) {
        case "ArrowRight":
        case "ArrowUp":
          e.preventDefault();
          nextValue = currentValue + ctx.step;
          break;
        case "ArrowLeft":
        case "ArrowDown":
          e.preventDefault();
          nextValue = currentValue - ctx.step;
          break;
        case "Home":
          e.preventDefault();
          nextValue = ctx.min;
          break;
        case "End":
          e.preventDefault();
          nextValue = ctx.max;
          break;
        case "PageUp":
          e.preventDefault();
          nextValue = currentValue + ctx.step * 10;
          break;
        case "PageDown":
          e.preventDefault();
          nextValue = currentValue - ctx.step * 10;
          break;
        default:
          return;
      }

      ctx.onThumbValueChange(index, nextValue);
      ctx.onThumbValueCommit();
    },
    [ctx, currentValue, index],
  );

  const positionStyle =
    ctx.orientation === "horizontal"
      ? { left: `${String(percent)}%` }
      : { bottom: `${String(percent)}%` };

  return createElement("div", {
    ...restProps,
    ref: (el: HTMLDivElement | null) => {
      thumbRef.current = el;
      if (typeof ref === "function") ref(el);
      else if (ref) ref.current = el;
    },
    role: "slider",
    tabIndex: ctx.disabled ? -1 : 0,
    "aria-valuemin": ctx.min,
    "aria-valuemax": ctx.max,
    "aria-valuenow": currentValue,
    "aria-valuetext": valueText,
    "aria-orientation": ctx.orientation,
    "aria-disabled": ctx.disabled ? "true" : undefined,
    className: className ? `kui-slider-thumb ${className}` : "kui-slider-thumb",
    "data-kui-component": "SliderThumb",
    "data-orientation": ctx.orientation,
    style: positionStyle,
    onKeyDown: handleKeyDown,
  });
});
