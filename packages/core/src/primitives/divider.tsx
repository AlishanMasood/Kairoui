import { createComponent } from "../composition/create-component";
import { componentClass } from "../composition/class-generation";
import { dividerStyles } from "./divider.styles";

export type DividerOrientation = "horizontal" | "vertical";

export interface DividerProps {
  /** Orientation of the divider. */
  orientation?: DividerOrientation;
  /** When true, the divider is purely decorative (role="none"). */
  decorative?: boolean;
}

const CONSUMED_PROPS: readonly string[] = ["orientation", "decorative"];

/**
 * Divider — semantic separator primitive.
 *
 * Renders an `<hr>` with native separator semantics. Use `decorative` for
 * visual-only dividers that should not be announced to screen readers.
 */
export const Divider = createComponent<DividerProps, "hr">({
  displayName: "Divider",
  defaultElement: "hr",
  useComponent: ({ props, ref }) => {
    const { orientation = "horizontal", decorative } = props;
    const isVertical = orientation === "vertical";

    const style: Record<string, string> = isVertical
      ? {
          width: "var(--kui-divider-size, 1px)",
          height: "auto",
          alignSelf: "stretch",
          borderLeft: "var(--kui-divider-size, 1px) solid var(--kui-divider-color, #e0e0e0)",
        }
      : {
          height: "var(--kui-divider-size, 1px)",
          width: "100%",
          borderTop: "var(--kui-divider-size, 1px) solid var(--kui-divider-color, #e0e0e0)",
        };

    const accessibilityProps: Record<string, unknown> = {};
    if (decorative) {
      accessibilityProps["role"] = "none";
    } else if (isVertical) {
      accessibilityProps["aria-orientation"] = "vertical";
    }

    return {
      rootProps: { ref, className: componentClass(dividerStyles.name), style },
      accessibilityProps,
      consumedProps: CONSUMED_PROPS,
    };
  },
});
