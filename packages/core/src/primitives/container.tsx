import { createComponent } from "../composition/create-component";
import { componentClass } from "../composition/class-generation";
import { containerStyles } from "./container.styles";

export type ContainerSize = "sm" | "md" | "lg" | "xl" | "full";

export interface ContainerProps {
  /** Max-width preset or custom CSS value. */
  maxWidth?: string;
  /** Horizontal gutter (padding). CSS value or number in px. */
  gutter?: string | number;
}

const SIZE_MAP: Record<ContainerSize, string> = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1200px",
  full: "none",
};

const CONSUMED_PROPS: readonly string[] = ["maxWidth", "gutter"];

/**
 * Container — constrained content width primitive.
 *
 * Centers content horizontally with a max-width and gutters.
 * Use `maxWidth` for preset sizes or a custom CSS value.
 */
export const Container = createComponent<ContainerProps, "div">({
  displayName: "Container",
  defaultElement: "div",
  useComponent: ({ props, ref }) => {
    const { maxWidth, gutter } = props;

    const style: Record<string, string | number | undefined> = {};
    if (maxWidth) {
      style["maxWidth"] = SIZE_MAP[maxWidth as ContainerSize] || maxWidth;
    }
    if (gutter !== undefined) {
      const val = typeof gutter === "number" ? `${String(gutter)}px` : gutter;
      style["paddingLeft"] = val;
      style["paddingRight"] = val;
    }

    return {
      rootProps: { ref, className: componentClass(containerStyles.name), style },
      consumedProps: CONSUMED_PROPS,
    };
  },
});
