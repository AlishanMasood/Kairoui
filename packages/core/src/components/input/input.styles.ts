import type { ComponentStyleContract } from "../../composition/style-contract";

export const inputStyleContract: ComponentStyleContract<"root", { size: "sm" | "md" | "lg" }> = {
  name: "input",
  customProperties: {
    "--kui-input-height": { token: "control.height.md", fallback: "36px" },
    "--kui-input-padding-x": { token: "spacing.inline.md", fallback: "12px" },
    "--kui-input-font-size": { token: "typography.body.fontSize", fallback: "0.875rem" },
    "--kui-input-radius": { token: "border.radius.md", fallback: "6px" },
    "--kui-input-border-color": { token: "color.border.default", fallback: "#d1d1d1" },
    "--kui-input-bg": { token: "color.background.input", fallback: "#fff" },
    "--kui-input-fg": { token: "color.foreground.default", fallback: "#242424" },
    "--kui-input-placeholder": { token: "color.foreground.muted", fallback: "#999" },
  },
  slots: {
    root: {
      base: {
        display: "block",
        boxSizing: "border-box",
        width: "100%",
        height: "var(--kui-input-height)",
        paddingLeft: "var(--kui-input-padding-x)",
        paddingRight: "var(--kui-input-padding-x)",
        fontSize: "var(--kui-input-font-size)",
        fontFamily: "inherit",
        lineHeight: "1.5",
        color: "var(--kui-input-fg)",
        background: "var(--kui-input-bg)",
        border: "1px solid var(--kui-input-border-color)",
        borderRadius: "var(--kui-input-radius)",
        outline: "none",
        transition: "border-color 150ms ease, box-shadow 150ms ease",
      },
      states: {
        disabled: {
          opacity: "0.5",
          cursor: "not-allowed",
        },
        focusVisible: {
          borderColor: { token: "color.interactive.default", fallback: "#0078d4" },
          outline: { token: "focus.outline", fallback: "2px solid #0078d4" },
          outlineOffset: "-1px",
        },
        invalid: {
          borderColor: { token: "color.status.danger", fallback: "#d13438" },
        },
      },
    },
  },
  variants: {
    size: {
      sm: {
        height: { token: "control.height.sm", fallback: "28px" },
        paddingLeft: { token: "spacing.inline.sm", fallback: "8px" },
        paddingRight: { token: "spacing.inline.sm", fallback: "8px" },
        fontSize: { token: "typography.caption.fontSize", fallback: "0.75rem" },
      },
      md: {
        height: { token: "control.height.md", fallback: "36px" },
        paddingLeft: { token: "spacing.inline.md", fallback: "12px" },
        paddingRight: { token: "spacing.inline.md", fallback: "12px" },
        fontSize: { token: "typography.body.fontSize", fallback: "0.875rem" },
      },
      lg: {
        height: { token: "control.height.lg", fallback: "44px" },
        paddingLeft: { token: "spacing.inline.md", fallback: "14px" },
        paddingRight: { token: "spacing.inline.md", fallback: "14px" },
        fontSize: { token: "typography.componentTitle.fontSize", fallback: "1rem" },
      },
    },
  },
  compoundVariants: [],
  defaultVariants: { size: "md" },
};
