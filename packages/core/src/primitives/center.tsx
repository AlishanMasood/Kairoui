import { createComponent } from "../composition/create-component";
import { componentClass } from "../composition/class-generation";
import { centerStyles } from "./center.styles";

export interface CenterProps {
  /** Display as inline-flex instead of flex. */
  inline?: boolean;
}

const CONSUMED_PROPS: readonly string[] = ["inline"];

/**
 * Center — centering layout primitive.
 *
 * Centers children both horizontally and vertically using flexbox.
 */
export const Center = createComponent<CenterProps, "div">({
  displayName: "Center",
  defaultElement: "div",
  useComponent: ({ props, ref }) => {
    const { inline } = props;
    const style: Record<string, string> | undefined = inline
      ? { display: "inline-flex" }
      : undefined;

    return {
      rootProps: { ref, className: componentClass(centerStyles.name), ...(style && { style }) },
      consumedProps: CONSUMED_PROPS,
    };
  },
});
