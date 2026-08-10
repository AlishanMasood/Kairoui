import { createComponent } from "../composition/create-component";

/**
 * Internal proof component — validates semantic polymorphism and typography-token integration.
 * Migrated to createComponent factory (KUI-COMP-030).
 */
export const Text = createComponent<Record<string, unknown>, "span">({
  displayName: "Text",
  defaultElement: "span",
  useComponent: ({ ref }) => ({
    rootProps: {
      ref,
      style: {
        fontFamily: "var(--kui-typography-body-font-family, inherit)",
        fontSize: "var(--kui-typography-body-font-size, 0.875rem)",
        lineHeight: "var(--kui-typography-body-line-height, 1.5)",
      },
    },
  }),
});
