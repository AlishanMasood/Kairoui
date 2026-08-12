import type { ComponentStyleContract } from "../composition/style-contract";

/** Style contract for the Box primitive. */
export const boxStyles: ComponentStyleContract = {
  name: "box",
  slots: {
    root: {
      base: {
        boxSizing: "border-box",
        minWidth: "0",
      },
    },
  },
};
