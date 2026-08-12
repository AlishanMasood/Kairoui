import { createComponent } from "../composition/create-component";
import { componentClass } from "../composition/class-generation";
import { spacerStyles } from "./spacer.styles";

export interface SpacerProps {
  /** Size of the spacer (CSS value or number in px). */
  size?: string | number;
  /** Axis: sets height (vertical, default) or width (horizontal). */
  axis?: "vertical" | "horizontal";
}

const CONSUMED_PROPS: readonly string[] = ["size", "axis"];

/**
 * Spacer — explicit whitespace primitive.
 *
 * Inserts intentional space between elements. Prefer `gap` on Flex/Stack
 * for uniform spacing; use Spacer for one-off spacing needs.
 */
export const Spacer = createComponent<SpacerProps, "div">({
  displayName: "Spacer",
  defaultElement: "div",
  useComponent: ({ props, ref }) => {
    const { size = 16, axis = "vertical" } = props;
    const resolved = typeof size === "number" ? `${String(size)}px` : size;

    const style: Record<string, string> =
      axis === "horizontal" ? { width: resolved } : { height: resolved };

    return {
      rootProps: { ref, className: componentClass(spacerStyles.name), style },
      accessibilityProps: { "aria-hidden": "true" },
      consumedProps: CONSUMED_PROPS,
    };
  },
});
