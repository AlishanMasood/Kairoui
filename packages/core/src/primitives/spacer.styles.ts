import type { ComponentStyleContract } from "../composition/style-contract";

/** Style contract for the Spacer primitive. */
export const spacerStyles: ComponentStyleContract = {
  name: "spacer",
  slots: {
    root: {
      base: {
        flexShrink: "0",
      },
    },
  },
};
