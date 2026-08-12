import type { ComponentStyleContract } from "../composition/style-contract";

/** Style contract for the Flex primitive. */
export const flexStyles: ComponentStyleContract = {
  name: "flex",
  slots: {
    root: {
      base: {
        display: "flex",
        boxSizing: "border-box",
        minWidth: "0",
      },
    },
  },
};
