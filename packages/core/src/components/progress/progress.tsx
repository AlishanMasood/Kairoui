import { forwardRef, createElement } from "react";
import type { ReactNode, HTMLAttributes, CSSProperties } from "react";

// ─── Types ──────────────────────────────────────────────────────────

export type ProgressSize = "sm" | "md" | "lg";

export interface ProgressProps {
  /** Current value. Undefined = indeterminate. */
  value?: number;
  /** Minimum value. Defaults to 0. */
  min?: number;
  /** Maximum value. Defaults to 100. */
  max?: number;
  /** Accessible label. */
  label?: string;
  /** Custom value text for screen readers (e.g. "3 of 10 steps"). */
  valueText?: string;
  children?: ReactNode;
  className?: string;
}

export interface ProgressTrackProps {
  className?: string;
  children?: ReactNode;
}

export interface ProgressIndicatorProps {
  className?: string;
}

// ─── Progress (Root) ────────────────────────────────────────────────

export const Progress = forwardRef<HTMLDivElement, ProgressProps & HTMLAttributes<HTMLDivElement>>(
  function Progress(props, ref) {
    const { value, min = 0, max = 100, label, valueText, className, children, ...rest } = props;
    const indeterminate = value == null;
    const percent = indeterminate ? undefined : Math.round(((value - min) / (max - min)) * 100);

    return createElement(
      "div",
      {
        ...rest,
        ref,
        role: "progressbar",
        "aria-valuenow": indeterminate ? undefined : value,
        "aria-valuemin": min,
        "aria-valuemax": max,
        "aria-valuetext": valueText ?? (percent != null ? `${String(percent)}%` : undefined),
        "aria-label": label,
        "data-state": indeterminate ? "indeterminate" : "determinate",
        "data-value": percent,
        "data-kui-component": "Progress",
        className,
      },
      children,
    );
  },
);

// ─── Progress.Track ─────────────────────────────────────────────────

export const ProgressTrack = forwardRef<
  HTMLDivElement,
  ProgressTrackProps & HTMLAttributes<HTMLDivElement>
>(function ProgressTrack(props, ref) {
  const { className, children, ...rest } = props;

  return createElement(
    "div",
    { ...rest, ref, "data-kui-component": "ProgressTrack", className },
    children,
  );
});

// ─── Progress.Indicator ─────────────────────────────────────────────

export const ProgressIndicator = forwardRef<
  HTMLDivElement,
  ProgressIndicatorProps & HTMLAttributes<HTMLDivElement>
>(function ProgressIndicator(props, ref) {
  const { className, ...rest } = props;

  return createElement("div", {
    ...rest,
    ref,
    "data-kui-component": "ProgressIndicator",
    className,
  });
});

// ─── Spinner Types ──────────────────────────────────────────────────

export type SpinnerSize = "sm" | "md" | "lg";

export interface SpinnerProps {
  /** Size variant. Defaults to "md". */
  size?: SpinnerSize;
  /** Accessible label. Defaults to "Loading". */
  label?: string;
  className?: string;
}

// ─── Spinner ────────────────────────────────────────────────────────

const SPINNER_SIZES: Record<SpinnerSize, string> = { sm: "16px", md: "24px", lg: "32px" };

export const Spinner = forwardRef<HTMLSpanElement, SpinnerProps & HTMLAttributes<HTMLSpanElement>>(
  function Spinner(props, ref) {
    const { size = "md", label = "Loading", className, ...rest } = props;
    const dim = SPINNER_SIZES[size];

    const style: CSSProperties = {
      display: "inline-block",
      width: dim,
      height: dim,
      borderRadius: "50%",
      border: "2px solid currentColor",
      borderTopColor: "transparent",
      animation: "kui-spin 0.6s linear infinite",
    };

    return createElement("span", {
      ...rest,
      ref,
      role: "status",
      "aria-label": label,
      "data-size": size,
      "data-kui-component": "Spinner",
      className,
      style,
    });
  },
);
