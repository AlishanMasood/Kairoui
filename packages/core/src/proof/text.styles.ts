import type { ComponentStyleContract } from "../composition/style-contract";

/** Style contract for the Text proof component. */
export const textStyleContract: ComponentStyleContract = {
  name: "text",
  customProperties: {
    "--kui-text-font-family": { token: "typography.body.fontFamily", fallback: "inherit" },
    "--kui-text-font-size": { token: "typography.body.fontSize", fallback: "0.875rem" },
    "--kui-text-line-height": { token: "typography.body.lineHeight", fallback: "1.5" },
    "--kui-text-font-weight": { token: "typography.body.fontWeight", fallback: "400" },
    "--kui-text-letter-spacing": { token: "typography.body.letterSpacing", fallback: "0em" },
    "--kui-text-color": { token: "color.foreground.default", fallback: "inherit" },
  },
  slots: {
    root: {
      base: {
        fontFamily: "var(--kui-text-font-family)",
        fontSize: "var(--kui-text-font-size)",
        lineHeight: "var(--kui-text-line-height)",
        fontWeight: "var(--kui-text-font-weight)",
        letterSpacing: "var(--kui-text-letter-spacing)",
        color: "var(--kui-text-color)",
        margin: "0",
      },
    },
  },
};
