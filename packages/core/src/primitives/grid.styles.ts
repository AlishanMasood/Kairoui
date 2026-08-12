import type { ComponentStyleContract } from "../composition/style-contract";

/** Style contract for the Grid primitive. */
export const gridStyles: ComponentStyleContract = {
  name: "grid",
  slots: {
    root: {
      base: {
        display: "grid",
        boxSizing: "border-box",
        minWidth: "0",
      },
    },
  },
};
