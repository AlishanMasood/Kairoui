import type { ComponentStyleContract } from "../composition/style-contract";

/** Style contract for the Heading primitive. */
export const headingStyles: ComponentStyleContract = {
  name: "heading",
  customProperties: {
    "--kui-heading-font": { token: "typography.sectionTitle.fontFamily", fallback: "inherit" },
    "--kui-heading-size": { token: "typography.sectionTitle.fontSize", fallback: "1.125rem" },
    "--kui-heading-weight": { token: "typography.sectionTitle.fontWeight", fallback: "600" },
    "--kui-heading-leading": { token: "typography.sectionTitle.lineHeight", fallback: "1.375" },
    "--kui-heading-tracking": { token: "typography.sectionTitle.letterSpacing", fallback: "0em" },
    "--kui-heading-color": { token: "color.foreground.default", fallback: "inherit" },
  },
  slots: {
    root: {
      base: {
        fontFamily: "var(--kui-heading-font)",
        fontSize: "var(--kui-heading-size)",
        fontWeight: "var(--kui-heading-weight)",
        lineHeight: "var(--kui-heading-leading)",
        letterSpacing: "var(--kui-heading-tracking)",
        color: "var(--kui-heading-color)",
        margin: "0",
      },
    },
  },
};
