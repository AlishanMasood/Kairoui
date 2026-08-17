import { createContext, useContext } from "react";
import type { ReactNode } from "react";

// ─── Slider Value Types ─────────────────────────────────────────────

/** Single slider: one numeric value. */
export type SliderValue = number;

/** Range slider: two numeric values [start, end]. */
export type RangeSliderValue = [number, number];

// ─── Slider Props ───────────────────────────────────────────────────

export interface SliderProps {
  /** Controlled value. */
  value?: number;
  /** Initial value for uncontrolled mode. */
  defaultValue?: number;
  /** Called when value changes (during drag and on commit). */
  onValueChange?: (value: number) => void;
  /** Called when dragging ends (final committed value). */
  onValueCommit?: (value: number) => void;
  /** Minimum value. Defaults to 0. */
  min?: number;
  /** Maximum value. Defaults to 100. */
  max?: number;
  /** Step increment. Defaults to 1. */
  step?: number;
  /** Layout orientation. */
  orientation?: SliderOrientation;
  /** Whether the slider is disabled. */
  disabled?: boolean;
  /** Form submission name. */
  name?: string;
  /** Accessible label for the thumb's current value (e.g., "50%"). */
  getValueLabel?: (value: number) => string;
  children?: ReactNode;
}

export interface RangeSliderProps {
  /** Controlled value pair. */
  value?: RangeSliderValue;
  /** Initial value for uncontrolled mode. */
  defaultValue?: RangeSliderValue;
  /** Called when value changes. */
  onValueChange?: (value: RangeSliderValue) => void;
  /** Called when dragging ends. */
  onValueCommit?: (value: RangeSliderValue) => void;
  /** Minimum value. Defaults to 0. */
  min?: number;
  /** Maximum value. Defaults to 100. */
  max?: number;
  /** Step increment. Defaults to 1. */
  step?: number;
  /** Minimum distance between thumbs. Defaults to 0. */
  minStepsBetweenThumbs?: number;
  /** Layout orientation. */
  orientation?: SliderOrientation;
  /** Whether the slider is disabled. */
  disabled?: boolean;
  /** Form submission name (submits as name[0] and name[1]). */
  name?: string;
  /** Accessible label for a thumb's current value. */
  getValueLabel?: (value: number, index: number) => string;
  children?: ReactNode;
}

// ─── Shared Slider Types ────────────────────────────────────────────

export type SliderOrientation = "horizontal" | "vertical";

export interface SliderTrackProps {
  children?: ReactNode;
  className?: string;
}

export interface SliderRangeProps {
  className?: string;
}

export interface SliderThumbProps {
  /** For range slider: which thumb (0 or 1). Defaults to 0. */
  index?: number;
  className?: string;
}

// ─── Slider Context ─────────────────────────────────────────────────

export interface SliderContextValue {
  // Geometry
  min: number;
  max: number;
  step: number;
  orientation: SliderOrientation;
  disabled: boolean;

  // Value state (normalized to array for both single and range)
  values: readonly number[];
  /** Percentage position [0–100] for each thumb. */
  thumbPercents: readonly number[];

  // Actions
  onThumbValueChange: (index: number, value: number) => void;
  onThumbValueCommit: () => void;

  // Accessible text
  getValueLabel: ((value: number, index: number) => string) | undefined;

  // ARIA IDs
  trackId: string;
}

export const SliderContext = createContext<SliderContextValue | null>(null);
SliderContext.displayName = "SliderContext";

export function useSliderContext(): SliderContextValue {
  const ctx = useContext(SliderContext);
  if (ctx === null) {
    throw new Error(
      "[KairoUI] Slider parts must be used inside a <Slider> or <RangeSlider> component.",
    );
  }
  return ctx;
}

// ─── Value Utilities ────────────────────────────────────────────────

/** Clamp a value to [min, max] and snap to step. */
export function snapToStep(value: number, min: number, max: number, step: number): number {
  const clamped = Math.min(Math.max(value, min), max);
  const steps = Math.round((clamped - min) / step);
  const snapped = min + steps * step;
  // Ensure we don't exceed max due to floating point
  return Math.min(snapped, max);
}

/** Convert a value to a percentage position within [min, max]. */
export function valueToPercent(value: number, min: number, max: number): number {
  if (max === min) return 0;
  return ((value - min) / (max - min)) * 100;
}

/** Convert a percentage position to a value within [min, max]. */
export function percentToValue(percent: number, min: number, max: number): number {
  return min + (percent / 100) * (max - min);
}
