import type { ComponentStyleContract } from "../../composition/style-contract";

export const checkboxStyleContract: ComponentStyleContract<
  "root" | "control" | "indicator" | "input",
  { size: "sm" | "md" | "lg" }
> = {
  name: "checkbox",
  customProperties: {
    "--kui-checkbox-size": "20px",
    "--kui-checkbox-radius": { token: "border.radius.sm", fallback: "4px" },
    "--kui-checkbox-border-color": { token: "color.border.default", fallback: "#d1d1d1" },
    "--kui-checkbox-bg": { token: "color.background.input", fallback: "#fff" },
    "--kui-checkbox-checked-bg": { token: "color.interactive.default", fallback: "#0078d4" },
    "--kui-checkbox-checked-fg": { token: "color.foreground.onInteractive", fallback: "#fff" },
    "--kui-checkbox-gap": { token: "spacing.inline.sm", fallback: "8px" },
  },
  slots: {
    root: {
      base: {
        display: "inline-flex",
        alignItems: "flex-start",
        gap: "var(--kui-checkbox-gap)",
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
        width: "var(--kui-checkbox-size)",
        height: "var(--kui-checkbox-size)",
        borderRadius: "var(--kui-checkbox-radius)",
        border: "2px solid var(--kui-checkbox-border-color)",
        background: "var(--kui-checkbox-bg)",
        flexShrink: "0",
        transition: "background 150ms ease, border-color 150ms ease",
      },
      states: {
        checked: {
          background: "var(--kui-checkbox-checked-bg)",
          borderColor: "var(--kui-checkbox-checked-bg)",
        },
        focusVisible: {
          outline: { token: "focus.outline", fallback: "2px solid #005a9e" },
          outlineOffset: "2px",
        },
      },
    },
    indicator: {
      base: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--kui-checkbox-checked-fg)",
        width: "100%",
        height: "100%",
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
        "--kui-checkbox-size": "16px",
        gap: "6px",
        fontSize: { token: "typography.caption.fontSize", fallback: "0.75rem" },
      },
      md: {
        "--kui-checkbox-size": "20px",
        gap: "8px",
        fontSize: { token: "typography.body.fontSize", fallback: "0.875rem" },
      },
      lg: {
        "--kui-checkbox-size": "24px",
        gap: "10px",
        fontSize: { token: "typography.componentTitle.fontSize", fallback: "1rem" },
      },
    },
  },
  compoundVariants: [],
  defaultVariants: { size: "md" },
};
