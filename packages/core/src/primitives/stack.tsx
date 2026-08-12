import { createComponent } from "../composition/create-component";
import { componentClass } from "../composition/class-generation";
import { stackStyles } from "./stack.styles";
import type { FlexAlign } from "./flex";

export interface StackProps {
  /** Gap between children (CSS gap value or number in px). */
  gap?: string | number;
  /** Align items on the cross axis. */
  align?: FlexAlign;
  /** Stack direction: vertical (default) or horizontal. */
  direction?: "vertical" | "horizontal";
}

const ALIGN_MAP: Record<string, string> = {
  start: "flex-start",
  center: "center",
  end: "flex-end",
  stretch: "stretch",
  baseline: "baseline",
};

const CONSUMED_PROPS: readonly string[] = ["gap", "align", "direction"];

/**
 * Stack — one-dimensional spacing primitive.
 *
 * Stacks children vertically (default) or horizontally with consistent gap.
 * A simpler API than Flex for the most common layout pattern.
 */
export const Stack = createComponent<StackProps, "div">({
  displayName: "Stack",
  defaultElement: "div",
  useComponent: ({ props, ref }) => {
    const { gap, align, direction } = props;

    const style: Record<string, string | number | undefined> = {};
    if (gap !== undefined) style["gap"] = typeof gap === "number" ? `${String(gap)}px` : gap;
    if (align) style["alignItems"] = ALIGN_MAP[align] ?? align;
    if (direction === "horizontal") style["flexDirection"] = "row";

    return {
      rootProps: { ref, className: componentClass(stackStyles.name), style },
      consumedProps: CONSUMED_PROPS,
    };
  },
});
