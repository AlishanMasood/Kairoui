import { createComponent } from "../composition/create-component";
import { componentClass } from "../composition/class-generation";
import { textStyles } from "./text.styles";

export interface TextProps {}

/**
 * Text — the inline/block typography primitive.
 *
 * Renders text with design-system typography tokens. Use `as` to change
 * the semantic element: span (default), p, label, strong, em, small, etc.
 */
export const Text = createComponent<TextProps, "span">({
  displayName: "Text",
  defaultElement: "span",
  useComponent: ({ ref }) => ({
    rootProps: { ref, className: componentClass(textStyles.name) },
  }),
});
