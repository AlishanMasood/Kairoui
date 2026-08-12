import type { ComponentStyleContract } from "../composition/style-contract";

/** Style contract for the Divider primitive. */
export const dividerStyles: ComponentStyleContract = {
  name: "divider",
  customProperties: {
    "--kui-divider-color": { token: "color.border.default", fallback: "#e0e0e0" },
    "--kui-divider-size": "1px",
  },
  slots: {
    root: {
      base: {
        border: "none",
        margin: "0",
        flexShrink: "0",
      },
    },
  },
};
