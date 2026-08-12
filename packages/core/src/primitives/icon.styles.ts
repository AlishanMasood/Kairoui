import type { ComponentStyleContract } from "../composition/style-contract";

/** Style contract for the Icon primitive. */
export const iconStyles: ComponentStyleContract = {
  name: "icon",
  slots: {
    root: {
      base: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: "0",
        fill: "currentColor",
        lineHeight: "1",
      },
    },
  },
};
