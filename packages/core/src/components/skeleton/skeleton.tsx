import { forwardRef, createElement } from "react";
import type { HTMLAttributes, CSSProperties } from "react";

// ─── Types ──────────────────────────────────────────────────────────

export type SkeletonVariant = "text" | "rectangular" | "circular";

export interface SkeletonProps {
  /** Shape variant. Defaults to "text". */
  variant?: SkeletonVariant;
  /** Width (CSS value). */
  width?: string | number;
  /** Height (CSS value). */
  height?: string | number;
  /** Border radius (CSS value). Overrides variant default. */
  radius?: string;
  /** Disable pulse animation. */
  animate?: boolean;
  className?: string;
}

// ─── Skeleton ───────────────────────────────────────────────────────

function resolveRadius(variant: SkeletonVariant, radius?: string): string | undefined {
  if (radius != null) return radius;
  if (variant === "circular") return "50%";
  if (variant === "text") return "4px";
  return undefined;
}

function resolveDimension(value: string | number | undefined): string | undefined {
  if (value == null) return undefined;
  return typeof value === "number" ? `${String(value)}px` : value;
}

export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps & HTMLAttributes<HTMLDivElement>>(
  function Skeleton(props, ref) {
    const { variant = "text", width, height, radius, animate = true, className, ...rest } = props;

    const style: CSSProperties = {
      display: "block",
      width: resolveDimension(width) ?? (variant === "text" ? "100%" : undefined),
      height: resolveDimension(height) ?? (variant === "text" ? "1em" : undefined),
      borderRadius: resolveRadius(variant, radius),
      backgroundColor: "currentColor",
      opacity: 0.12,
      ...(animate ? { animation: "kui-pulse 1.5s ease-in-out infinite" } : undefined),
    };

    return createElement("div", {
      ...rest,
      ref,
      "aria-hidden": "true",
      "data-variant": variant,
      "data-animate": animate,
      "data-kui-component": "Skeleton",
      className,
      style,
    });
  },
);
