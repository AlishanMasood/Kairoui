import type { ComponentStyleContract } from "../../composition/style-contract";

export const textareaStyleContract: ComponentStyleContract<"root", { size: "sm" | "md" | "lg" }> = {
  name: "textarea",
  customProperties: {
    "--kui-textarea-min-height": "80px",
    "--kui-textarea-padding-x": { token: "spacing.inline.md", fallback: "12px" },
    "--kui-textarea-padding-y": { token: "spacing.block.sm", fallback: "8px" },
    "--kui-textarea-font-size": { token: "typography.body.fontSize", fallback: "0.875rem" },
    "--kui-textarea-radius": { token: "border.radius.md", fallback: "6px" },
    "--kui-textarea-border-color": { token: "color.border.default", fallback: "#d1d1d1" },
    "--kui-textarea-bg": { token: "color.background.input", fallback: "#fff" },
    "--kui-textarea-fg": { token: "color.foreground.default", fallback: "#242424" },
  },
  slots: {
    root: {
      base: {
        display: "block",
        boxSizing: "border-box",
        width: "100%",
        minHeight: "var(--kui-textarea-min-height)",
        paddingLeft: "var(--kui-textarea-padding-x)",
        paddingRight: "var(--kui-textarea-padding-x)",
        paddingTop: "var(--kui-textarea-padding-y)",
        paddingBottom: "var(--kui-textarea-padding-y)",
        fontSize: "var(--kui-textarea-font-size)",
        fontFamily: "inherit",
        lineHeight: "1.5",
        color: "var(--kui-textarea-fg)",
        background: "var(--kui-textarea-bg)",
        border: "1px solid var(--kui-textarea-border-color)",
        borderRadius: "var(--kui-textarea-radius)",
        outline: "none",
        resize: "vertical",
        transition: "border-color 150ms ease, box-shadow 150ms ease",
      },
      states: {
        disabled: {
          opacity: "0.5",
          cursor: "not-allowed",
          resize: "none",
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
        minHeight: "60px",
        paddingLeft: { token: "spacing.inline.sm", fallback: "8px" },
        paddingRight: { token: "spacing.inline.sm", fallback: "8px" },
        paddingTop: "6px",
        paddingBottom: "6px",
        fontSize: { token: "typography.caption.fontSize", fallback: "0.75rem" },
      },
      md: {
        minHeight: "80px",
        paddingLeft: { token: "spacing.inline.md", fallback: "12px" },
        paddingRight: { token: "spacing.inline.md", fallback: "12px" },
        fontSize: { token: "typography.body.fontSize", fallback: "0.875rem" },
      },
      lg: {
        minHeight: "120px",
        paddingLeft: { token: "spacing.inline.md", fallback: "14px" },
        paddingRight: { token: "spacing.inline.md", fallback: "14px" },
        fontSize: { token: "typography.componentTitle.fontSize", fallback: "1rem" },
      },
    },
  },
  compoundVariants: [],
  defaultVariants: { size: "md" },
};
