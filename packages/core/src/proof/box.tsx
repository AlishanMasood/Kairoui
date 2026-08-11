import { createComponent } from "../composition/create-component";
import { componentClass } from "../composition/class-generation";
import { boxStyleContract } from "./box.styles";

/**
 * Internal proof component — validates the composition architecture end-to-end.
 * Migrated to Phase 6 styling engine (KUI-STYLE-028).
 */
export const Box = createComponent<Record<string, unknown>, "div">({
  displayName: "Box",
  defaultElement: "div",
  useComponent: ({ ref }) => ({
    rootProps: { ref, className: componentClass(boxStyleContract.name) },
  }),
});

export { boxStyleContract };
