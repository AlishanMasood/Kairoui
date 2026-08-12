import { createComponent } from "../composition/create-component";
import { componentClass } from "../composition/class-generation";
import { aspectRatioStyles } from "./aspect-ratio.styles";

export interface AspectRatioProps {
  /** Aspect ratio as a number (width/height) or CSS aspect-ratio string (e.g., "16/9"). */
  ratio?: number | string;
}

const CONSUMED_PROPS: readonly string[] = ["ratio"];

/**
 * AspectRatio — fixed aspect ratio container.
 *
 * Constrains children to a given aspect ratio using CSS `aspect-ratio`.
 * Common values: 1 (square), 16/9 (widescreen), 4/3, 21/9.
 */
export const AspectRatio = createComponent<AspectRatioProps, "div">({
  displayName: "AspectRatio",
  defaultElement: "div",
  useComponent: ({ props, ref }) => {
    const { ratio = 1 } = props;
    const value = typeof ratio === "number" ? String(ratio) : ratio;

    return {
      rootProps: {
        ref,
        className: componentClass(aspectRatioStyles.name),
        style: { aspectRatio: value },
      },
      consumedProps: CONSUMED_PROPS,
    };
  },
});
