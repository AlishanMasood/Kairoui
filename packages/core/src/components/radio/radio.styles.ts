import type { ComponentStyleContract } from "../../composition/style-contract";

export const radioStyleContract: ComponentStyleContract<
  "root" | "control" | "indicator" | "input",
  { size: "sm" | "md" | "lg" }
> = {
  name: "radio",
  customProperties: {
    "--kui-radio-size": "20px",
    "--kui-radio-border-color": { token: "color.border.default", fallback: "#d1d1d1" },
    "--kui-radio-bg": { token: "color.background.input", fallback: "#fff" },
    "--kui-radio-checked-bg": { token: "color.interactive.default", fallback: "#0078d4" },
    "--kui-radio-checked-fg": { token: "color.foreground.onInteractive", fallback: "#fff" },
    "--kui-radio-gap": { token: "spacing.inline.sm", fallback: "8px" },
  },
  slots: {
    root: {
      base: {
        display: "inline-flex",
        alignItems: "flex-start",
        gap: "var(--kui-radio-gap)",
        cursor: "pointer",
        position: "relative",
        userSelect: "none",
        verticalAlign: "middle",
      },
      states: {
        disabled: {
          opacity: "0.5",
          cursor: "not-allowed",
        },
      },
    },
    control: {
      base: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: "var(--kui-radio-size)",
        height: "var(--kui-radio-size)",
        borderRadius: "50%",
        border: "2px solid var(--kui-radio-border-color)",
        background: "var(--kui-radio-bg)",
        flexShrink: "0",
        transition: "background 150ms ease, border-color 150ms ease",
      },
      states: {
        checked: {
          background: "var(--kui-radio-checked-bg)",
          borderColor: "var(--kui-radio-checked-bg)",
        },
        focusVisible: {
          outline: { token: "focus.outline", fallback: "2px solid #005a9e" },
          outlineOffset: "2px",
        },
      },
    },
    indicator: {
      base: {
        display: "block",
        width: "8px",
        height: "8px",
        borderRadius: "50%",
        background: "var(--kui-radio-checked-fg)",
      },
    },
    input: {
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
  variants: {
    size: {
      sm: {
        "--kui-radio-size": "16px",
        gap: "6px",
        fontSize: { token: "typography.caption.fontSize", fallback: "0.75rem" },
      },
      md: {
        "--kui-radio-size": "20px",
        gap: "8px",
        fontSize: { token: "typography.body.fontSize", fallback: "0.875rem" },
      },
      lg: {
        "--kui-radio-size": "24px",
        gap: "10px",
        fontSize: { token: "typography.componentTitle.fontSize", fallback: "1rem" },
      },
    },
  },
  compoundVariants: [],
  defaultVariants: { size: "md" },
};
