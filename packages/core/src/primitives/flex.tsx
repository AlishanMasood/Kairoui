import { createComponent } from "../composition/create-component";
import { componentClass } from "../composition/class-generation";
import { flexStyles } from "./flex.styles";

export type FlexDirection = "row" | "column" | "row-reverse" | "column-reverse";
export type FlexWrap = "nowrap" | "wrap" | "wrap-reverse";
export type FlexAlign = "start" | "center" | "end" | "stretch" | "baseline";
export type FlexJustify = "start" | "center" | "end" | "between" | "around" | "evenly";

export interface FlexProps {
  /** Flex direction. */
  direction?: FlexDirection;
  /** Align items on the cross axis. */
  align?: FlexAlign;
  /** Justify content on the main axis. */
  justify?: FlexJustify;
  /** Flex wrapping behavior. */
  wrap?: FlexWrap;
  /** Gap between children (CSS gap value or token-scale key). */
  gap?: string | number;
  /** Display as inline-flex instead of flex. */
  inline?: boolean;
}

const ALIGN_MAP: Record<FlexAlign, string> = {
  start: "flex-start",
  center: "center",
  end: "flex-end",
  stretch: "stretch",
  baseline: "baseline",
};

const JUSTIFY_MAP: Record<FlexJustify, string> = {
  start: "flex-start",
  center: "center",
  end: "flex-end",
  between: "space-between",
  around: "space-around",
  evenly: "space-evenly",
};

const CONSUMED_PROPS: readonly string[] = [
  "direction",
  "align",
  "justify",
  "wrap",
  "gap",
  "inline",
];

/**
 * Flex — flexbox layout primitive.
 *
 * A thin abstraction over CSS flexbox. Supports direction, alignment,
 * justification, wrapping, and gap through typed props.
 */
export const Flex = createComponent<FlexProps, "div">({
  displayName: "Flex",
  defaultElement: "div",
  useComponent: ({ props, ref }) => {
    const { direction, align, justify, wrap, gap, inline } = props;

    const style: Record<string, string | number | undefined> = {};
    if (direction) style["flexDirection"] = direction;
    if (align) style["alignItems"] = ALIGN_MAP[align];
    if (justify) style["justifyContent"] = JUSTIFY_MAP[justify];
    if (wrap) style["flexWrap"] = wrap;
    if (gap !== undefined) style["gap"] = typeof gap === "number" ? `${String(gap)}px` : gap;
    if (inline) style["display"] = "inline-flex";

    return {
      rootProps: { ref, className: componentClass(flexStyles.name), style },
      consumedProps: CONSUMED_PROPS,
    };
  },
});
