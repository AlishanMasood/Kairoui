import { createPolymorphicComponent } from "../composition/polymorphic-render";
import type { PolymorphicComponent } from "../composition/polymorphic-types";

/**
 * Internal proof component — validates semantic polymorphism and typography-token integration.
 *
 * NOT a production component. Do not export from the package.
 * Exercises: semantic element targets, htmlFor forwarding, typography CSS variables,
 * polymorphic `as`, ref forwarding, prop merging.
 */
export const Text: PolymorphicComponent<
  Record<string, unknown>,
  "span"
> = createPolymorphicComponent<Record<string, unknown>, "span">({
  displayName: "Text",
  defaultElement: "span",
  useProps: (_props, ref) => {
    return {
      ref,
      "data-kui-component": "Text",
      style: {
        fontFamily: "var(--kui-typography-body-font-family, inherit)",
        fontSize: "var(--kui-typography-body-font-size, 0.875rem)",
        lineHeight: "var(--kui-typography-body-line-height, 1.5)",
      },
    };
  },
});
