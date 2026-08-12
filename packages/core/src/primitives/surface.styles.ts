import type { ComponentStyleContract } from "../composition/style-contract";

/** Style contract for the Surface primitive. */
export const surfaceStyles: ComponentStyleContract = {
  name: "surface",
  customProperties: {
    "--kui-surface-bg": { token: "color.surface.default", fallback: "#ffffff" },
    "--kui-surface-border": { token: "color.border.default", fallback: "transparent" },
    "--kui-surface-radius": { token: "border.radius.md", fallback: "8px" },
    "--kui-surface-shadow": { token: "shadow.sm", fallback: "none" },
  },
  slots: {
    root: {
      base: {
        boxSizing: "border-box",
        background: "var(--kui-surface-bg)",
        border: "1px solid var(--kui-surface-border)",
        borderRadius: "var(--kui-surface-radius)",
        boxShadow: "var(--kui-surface-shadow)",
      },
    },
  },
};
