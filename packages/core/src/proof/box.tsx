import { createPolymorphicComponent } from "../composition/polymorphic-render";
import type { PolymorphicComponent } from "../composition/polymorphic-types";

/**
 * Internal proof component — validates the composition architecture end-to-end.
 *
 * NOT a production component. Do not export from the package.
 * This exercises: polymorphic `as`, ref forwarding, prop merging, ARIA, events, data-attrs.
 */
export const Box: PolymorphicComponent<Record<string, unknown>, "div"> = createPolymorphicComponent<
  Record<string, unknown>,
  "div"
>({
  displayName: "Box",
  defaultElement: "div",
  useProps: (_props, ref) => {
    return { ref, "data-kui-component": "Box" };
  },
});
