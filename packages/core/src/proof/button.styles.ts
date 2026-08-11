import type { ComponentStyleContract } from "../composition/style-contract";

/** Style contract for the Button proof component. */
export const buttonStyleContract: ComponentStyleContract<
  "root" | "startIcon" | "content" | "endIcon" | "loadingIndicator",
  { appearance: "solid" | "outline" | "subtle"; size: "sm" | "md" | "lg" }
> = {
  name: "button",
  customProperties: {
    "--kui-button-bg": { token: "color.interactive.default", fallback: "#0078d4" },
    "--kui-button-fg": { token: "color.foreground.onInteractive", fallback: "#fff" },
    "--kui-button-border-color": "transparent",
    "--kui-button-height": { token: "control.height.md", fallback: "36px" },
    "--kui-button-padding-x": { token: "spacing.inline.md", fallback: "16px" },
    "--kui-button-font-size": { token: "typography.body.fontSize", fallback: "0.875rem" },
    "--kui-button-font-weight": { token: "typography.label.fontWeight", fallback: "500" },
    "--kui-button-radius": { token: "border.radius.md", fallback: "6px" },
    "--kui-button-gap": { token: "spacing.inline.xs", fallback: "6px" },
  },
  slots: {
    root: {
      base: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        boxSizing: "border-box",
        height: "var(--kui-button-height)",
        paddingLeft: "var(--kui-button-padding-x)",
        paddingRight: "var(--kui-button-padding-x)",
        fontSize: "var(--kui-button-font-size)",
        fontWeight: "var(--kui-button-font-weight)",
        fontFamily: "inherit",
        lineHeight: "1",
        color: "var(--kui-button-fg)",
        background: "var(--kui-button-bg)",
        border: "1px solid var(--kui-button-border-color)",
        borderRadius: "var(--kui-button-radius)",
        gap: "var(--kui-button-gap)",
        cursor: "pointer",
        textDecoration: "none",
        userSelect: "none",
        whiteSpace: "nowrap",
        position: "relative",
        verticalAlign: "middle",
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
    startIcon: {
      base: {
        display: "flex",
        alignItems: "center",
        flexShrink: "0",
      },
    },
    content: {
      base: {
        display: "inline-flex",
        alignItems: "center",
      },
    },
    endIcon: {
      base: {
        display: "flex",
        alignItems: "center",
        flexShrink: "0",
      },
    },
    loadingIndicator: {
      base: {
        display: "inline-flex",
        alignItems: "center",
        marginLeft: "var(--kui-button-gap)",
      },
    },
  },
  variants: {
    appearance: {
      solid: {
        background: "var(--kui-button-bg)",
        color: "var(--kui-button-fg)",
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
    },
    size: {
      sm: {
        height: { token: "control.height.sm", fallback: "28px" },
        paddingLeft: { token: "spacing.inline.sm", fallback: "10px" },
        paddingRight: { token: "spacing.inline.sm", fallback: "10px" },
        fontSize: { token: "typography.caption.fontSize", fallback: "0.75rem" },
        gap: "4px",
      },
      md: {
        height: { token: "control.height.md", fallback: "36px" },
        paddingLeft: { token: "spacing.inline.md", fallback: "16px" },
        paddingRight: { token: "spacing.inline.md", fallback: "16px" },
        fontSize: { token: "typography.body.fontSize", fallback: "0.875rem" },
      },
      lg: {
        height: { token: "control.height.lg", fallback: "44px" },
        paddingLeft: { token: "spacing.inline.md", fallback: "20px" },
        paddingRight: { token: "spacing.inline.md", fallback: "20px" },
        fontSize: { token: "typography.componentTitle.fontSize", fallback: "1rem" },
        gap: "8px",
      },
    },
  },
  compoundVariants: [
    {
      condition: { appearance: "outline", size: "sm" },
      styles: { paddingLeft: "8px", paddingRight: "8px" },
    },
    {
      condition: { appearance: "subtle", size: "sm" },
      styles: { paddingLeft: "8px", paddingRight: "8px" },
    },
  ],
  defaultVariants: { appearance: "solid", size: "md" },
};
