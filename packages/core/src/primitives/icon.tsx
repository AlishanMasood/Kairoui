import { createComponent } from "../composition/create-component";
import { componentClass } from "../composition/class-generation";
import { iconStyles } from "./icon.styles";

export type IconSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface IconProps {
  /** Icon size preset, number (px), or custom CSS value. */
  size?: string | number;
  /** Accessible label. Required for meaningful icons; omit for decorative. */
  label?: string;
  /** CSS color (defaults to currentColor via class). */
  color?: string;
}

const SIZE_MAP: Record<IconSize, string> = {
  xs: "12px",
  sm: "16px",
  md: "20px",
  lg: "24px",
  xl: "32px",
};

const CONSUMED_PROPS: readonly string[] = ["size", "label", "color"];

/**
 * Icon — accessible SVG icon wrapper.
 *
 * Wraps consumer-provided SVG content with consistent sizing and accessibility.
 * Decorative icons (no `label`) get aria-hidden="true".
 * Meaningful icons require a `label` for screen readers.
 */
export const Icon = createComponent<IconProps, "svg">({
  displayName: "Icon",
  defaultElement: "svg",
  useComponent: ({ props, ref }) => {
    const { size = "md", label, color } = props;

    const resolved =
      typeof size === "number" ? `${String(size)}px` : SIZE_MAP[size as IconSize] || size;

    const style: Record<string, string> = { width: resolved, height: resolved };
    if (color) style["color"] = color;

    const accessibilityProps: Record<string, unknown> = {};
    if (label) {
      accessibilityProps["role"] = "img";
      accessibilityProps["aria-label"] = label;
    } else {
      accessibilityProps["aria-hidden"] = "true";
    }

    return {
      rootProps: { ref, className: componentClass(iconStyles.name), style },
      accessibilityProps,
      consumedProps: CONSUMED_PROPS,
    };
  },
});
