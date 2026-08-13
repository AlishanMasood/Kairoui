import type { ComponentStyleContract } from "../../composition/style-contract";

export const iconButtonStyleContract: ComponentStyleContract<
  "root" | "icon" | "loadingIndicator",
  { appearance: "solid" | "outline" | "subtle" | "ghost"; size: "sm" | "md" | "lg" }
> = {
  name: "icon-button",
  customProperties: {
    "--kui-icon-button-bg": { token: "color.interactive.default", fallback: "#0078d4" },
    "--kui-icon-button-fg": { token: "color.foreground.onInteractive", fallback: "#fff" },
    "--kui-icon-button-border-color": "transparent",
    "--kui-icon-button-size": { token: "control.height.md", fallback: "36px" },
    "--kui-icon-button-icon-size": "20px",
    "--kui-icon-button-radius": { token: "border.radius.md", fallback: "6px" },
  },
  slots: {
    root: {
      base: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        boxSizing: "border-box",
        width: "var(--kui-icon-button-size)",
        height: "var(--kui-icon-button-size)",
        padding: "0",
        fontSize: "var(--kui-icon-button-icon-size)",
        fontFamily: "inherit",
        lineHeight: "1",
        color: "var(--kui-icon-button-fg)",
        background: "var(--kui-icon-button-bg)",
        border: "1px solid var(--kui-icon-button-border-color)",
        borderRadius: "var(--kui-icon-button-radius)",
        cursor: "pointer",
        textDecoration: "none",
        userSelect: "none",
        position: "relative",
        verticalAlign: "middle",
        flexShrink: "0",
        transition: "background 150ms ease, border-color 150ms ease, opacity 150ms ease",
      },
      states: {
        disabled: {
          opacity: "0.5",
          cursor: "not-allowed",
          pointerEvents: "none",
        },
        hovered: {
          background: { token: "color.interactive.hovered", fallback: "#106ebe" },
        },
        pressed: {
          background: { token: "color.interactive.pressed", fallback: "#005a9e" },
        },
        focusVisible: {
          outline: { token: "focus.outline", fallback: "2px solid #005a9e" },
          outlineOffset: "2px",
        },
        loading: {
          cursor: "wait",
          pointerEvents: "none",
        },
      },
    },
    icon: {
      base: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "var(--kui-icon-button-icon-size)",
        height: "var(--kui-icon-button-icon-size)",
        flexShrink: "0",
      },
    },
    loadingIndicator: {
      base: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "absolute",
        inset: "0",
      },
    },
  },
  variants: {
    appearance: {
      solid: {
        background: "var(--kui-icon-button-bg)",
        color: "var(--kui-icon-button-fg)",
      },
      outline: {
        background: "transparent",
        color: { token: "color.foreground.default", fallback: "#242424" },
        borderColor: { token: "color.border.default", fallback: "#d1d1d1" },
      },
      subtle: {
        background: "transparent",
        color: { token: "color.foreground.default", fallback: "#242424" },
        borderColor: "transparent",
      },
      ghost: {
        background: "transparent",
        color: { token: "color.foreground.default", fallback: "#242424" },
        borderColor: "transparent",
      },
    },
    size: {
      sm: {
        width: { token: "control.height.sm", fallback: "28px" },
        height: { token: "control.height.sm", fallback: "28px" },
        fontSize: "16px",
      },
      md: {
        width: { token: "control.height.md", fallback: "36px" },
        height: { token: "control.height.md", fallback: "36px" },
        fontSize: "20px",
      },
      lg: {
        width: { token: "control.height.lg", fallback: "44px" },
        height: { token: "control.height.lg", fallback: "44px" },
        fontSize: "24px",
      },
    },
  },
  compoundVariants: [],
  defaultVariants: { appearance: "subtle", size: "md" },
};
