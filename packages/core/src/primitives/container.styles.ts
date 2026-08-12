import type { ComponentStyleContract } from "../composition/style-contract";

/** Style contract for the Container primitive. */
export const containerStyles: ComponentStyleContract = {
  name: "container",
  customProperties: {
    "--kui-container-max": { token: "spacing.content.maxWidth", fallback: "1200px" },
    "--kui-container-gutter": { token: "spacing.content.gutter", fallback: "24px" },
  },
  slots: {
    root: {
      base: {
        boxSizing: "border-box",
        width: "100%",
        maxWidth: "var(--kui-container-max)",
        marginLeft: "auto",
        marginRight: "auto",
        paddingLeft: "var(--kui-container-gutter)",
        paddingRight: "var(--kui-container-gutter)",
      },
    },
  },
};
