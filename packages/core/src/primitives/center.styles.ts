import type { ComponentStyleContract } from "../composition/style-contract";

/** Style contract for the Center primitive. */
export const centerStyles: ComponentStyleContract = {
  name: "center",
  slots: {
    root: {
      base: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxSizing: "border-box",
        minWidth: "0",
      },
    },
  },
};
