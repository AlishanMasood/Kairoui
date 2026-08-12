import type { ComponentStyleContract } from "../composition/style-contract";

/** Style contract for the AspectRatio primitive. */
export const aspectRatioStyles: ComponentStyleContract = {
  name: "aspect-ratio",
  slots: {
    root: {
      base: {
        boxSizing: "border-box",
        overflow: "hidden",
      },
    },
  },
};
