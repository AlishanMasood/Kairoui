import type { ComponentStyleContract } from "../composition/style-contract";

/** Style contract for the Stack primitive. */
export const stackStyles: ComponentStyleContract = {
  name: "stack",
  slots: {
    root: {
      base: {
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
        minWidth: "0",
      },
    },
  },
};
