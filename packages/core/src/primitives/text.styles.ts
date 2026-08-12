import type { ComponentStyleContract } from "../composition/style-contract";

/** Style contract for the Text primitive. */
export const textStyles: ComponentStyleContract = {
  name: "text",
  customProperties: {
    "--kui-text-font": { token: "typography.body.fontFamily", fallback: "inherit" },
    "--kui-text-size": { token: "typography.body.fontSize", fallback: "0.875rem" },
    "--kui-text-weight": { token: "typography.body.fontWeight", fallback: "400" },
    "--kui-text-leading": { token: "typography.body.lineHeight", fallback: "1.5" },
    "--kui-text-tracking": { token: "typography.body.letterSpacing", fallback: "0em" },
    "--kui-text-color": { token: "color.foreground.default", fallback: "inherit" },
  },
  slots: {
    root: {
      base: {
        fontFamily: "var(--kui-text-font)",
        fontSize: "var(--kui-text-size)",
        fontWeight: "var(--kui-text-weight)",
        lineHeight: "var(--kui-text-leading)",
        letterSpacing: "var(--kui-text-tracking)",
        color: "var(--kui-text-color)",
        margin: "0",
      },
    },
  },
};
