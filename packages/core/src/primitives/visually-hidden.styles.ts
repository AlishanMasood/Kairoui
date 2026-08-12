import type { ComponentStyleContract } from "../composition/style-contract";

/** Style contract for the VisuallyHidden primitive. */
export const visuallyHiddenStyles: ComponentStyleContract = {
  name: "visually-hidden",
  slots: {
    root: {
      base: {
        position: "absolute",
        width: "1px",
        height: "1px",
        padding: "0",
        margin: "-1px",
        overflow: "hidden",
        clip: "rect(0, 0, 0, 0)",
        whiteSpace: "nowrap",
        borderWidth: "0",
      },
    },
  },
};
