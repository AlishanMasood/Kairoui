import { createComponent } from "../composition/create-component";
import { componentClass } from "../composition/class-generation";
import { textStyles } from "../primitives/text.styles";

/**
 * Internal proof component — validates semantic polymorphism and typography-token integration.
 * Production Text lives in ../primitives/text.tsx.
 */
export const Text = createComponent<Record<string, unknown>, "span">({
  displayName: "Text",
  defaultElement: "span",
  useComponent: ({ ref }) => ({
    rootProps: { ref, className: componentClass(textStyles.name) },
  }),
});

export { textStyles as textStyleContract };
