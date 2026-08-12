import { createComponent } from "../composition/create-component";
import { componentClass } from "../composition/class-generation";
import { boxStyles } from "./box.styles";

export interface BoxProps {}

/**
 * Box — the foundational layout primitive.
 *
 * A polymorphic container with minimal reset styles (border-box, min-width: 0).
 * Use Box as the base building block for custom layouts or as a generic wrapper.
 */
export const Box = createComponent<BoxProps, "div">({
  displayName: "Box",
  defaultElement: "div",
  useComponent: ({ ref }) => ({
    rootProps: { ref, className: componentClass(boxStyles.name) },
  }),
});
