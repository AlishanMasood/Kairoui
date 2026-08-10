import { createComponent } from "../composition/create-component";

/**
 * Internal proof component — validates the composition architecture end-to-end.
 * Migrated to createComponent factory (KUI-COMP-030).
 */
export const Box = createComponent<Record<string, unknown>, "div">({
  displayName: "Box",
  defaultElement: "div",
  useComponent: ({ ref }) => ({
    rootProps: { ref },
  }),
});
