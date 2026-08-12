import { createComponent } from "../composition/create-component";
import { componentClass } from "../composition/class-generation";
import { boxStyles } from "../primitives/box.styles";

/**
 * Internal proof component — validates the composition architecture end-to-end.
 * Production Box lives in ../primitives/box.tsx.
 */
export const Box = createComponent<Record<string, unknown>, "div">({
  displayName: "Box",
  defaultElement: "div",
  useComponent: ({ ref }) => ({
    rootProps: { ref, className: componentClass(boxStyles.name) },
  }),
});

export { boxStyles as boxStyleContract };
