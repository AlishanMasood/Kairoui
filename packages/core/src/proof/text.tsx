import { createComponent } from "../composition/create-component";
import { componentClass } from "../composition/class-generation";
import { textStyleContract } from "./text.styles";

/**
 * Internal proof component — validates semantic polymorphism and typography-token integration.
 * Migrated to Phase 6 styling engine (KUI-STYLE-029).
 */
export const Text = createComponent<Record<string, unknown>, "span">({
  displayName: "Text",
  defaultElement: "span",
  useComponent: ({ ref }) => ({
    rootProps: { ref, className: componentClass(textStyleContract.name) },
  }),
});

export { textStyleContract };
