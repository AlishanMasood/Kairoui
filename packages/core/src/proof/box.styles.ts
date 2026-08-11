import type { ComponentStyleContract } from "../composition/style-contract";

/** Style contract for the Box proof component. */
export const boxStyleContract: ComponentStyleContract = {
  name: "box",
  customProperties: {
    "--kui-box-display": "block",
    "--kui-box-bg": { token: "color.surface.default", fallback: "transparent" },
  },
  slots: {
    root: {
      base: {
        display: "var(--kui-box-display)",
        boxSizing: "border-box",
        background: "var(--kui-box-bg)",
        minWidth: "0",
      },
    },
  },
};
