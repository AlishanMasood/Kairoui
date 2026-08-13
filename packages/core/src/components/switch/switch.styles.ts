import type { ComponentStyleContract } from "../../composition/style-contract";

export const switchStyleContract: ComponentStyleContract<
  "root" | "track" | "thumb" | "input",
  { size: "sm" | "md" | "lg" }
> = {
  name: "switch",
  customProperties: {
    "--kui-switch-width": "40px",
    "--kui-switch-height": "22px",
    "--kui-switch-thumb-size": "16px",
    "--kui-switch-thumb-offset": "3px",
    "--kui-switch-track-bg": { token: "color.border.default", fallback: "#d1d1d1" },
    "--kui-switch-track-checked-bg": { token: "color.interactive.default", fallback: "#0078d4" },
    "--kui-switch-thumb-bg": { token: "color.foreground.onInteractive", fallback: "#fff" },
    "--kui-switch-gap": { token: "spacing.inline.sm", fallback: "8px" },
  },
  slots: {
    root: {
      base: {
        display: "inline-flex",
        alignItems: "center",
        gap: "var(--kui-switch-gap)",
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
    track: {
      base: {
        display: "inline-flex",
        alignItems: "center",
        width: "var(--kui-switch-width)",
        height: "var(--kui-switch-height)",
        borderRadius: "calc(var(--kui-switch-height) / 2)",
        background: "var(--kui-switch-track-bg)",
        flexShrink: "0",
        position: "relative",
        transition: "background 150ms ease",
      },
      states: {
        checked: {
          background: "var(--kui-switch-track-checked-bg)",
        },
        focusVisible: {
          outline: { token: "focus.outline", fallback: "2px solid #005a9e" },
          outlineOffset: "2px",
        },
      },
    },
    thumb: {
      base: {
        display: "block",
        width: "var(--kui-switch-thumb-size)",
        height: "var(--kui-switch-thumb-size)",
        borderRadius: "50%",
        background: "var(--kui-switch-thumb-bg)",
        position: "absolute",
        left: "var(--kui-switch-thumb-offset)",
        transition: "left 150ms ease",
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
        "--kui-switch-width": "32px",
        "--kui-switch-height": "18px",
        "--kui-switch-thumb-size": "12px",
        gap: "6px",
        fontSize: { token: "typography.caption.fontSize", fallback: "0.75rem" },
      },
      md: {
        "--kui-switch-width": "40px",
        "--kui-switch-height": "22px",
        "--kui-switch-thumb-size": "16px",
        gap: "8px",
        fontSize: { token: "typography.body.fontSize", fallback: "0.875rem" },
      },
      lg: {
        "--kui-switch-width": "48px",
        "--kui-switch-height": "28px",
        "--kui-switch-thumb-size": "20px",
        gap: "10px",
        fontSize: { token: "typography.componentTitle.fontSize", fallback: "1rem" },
      },
    },
  },
  compoundVariants: [],
  defaultVariants: { size: "md" },
};
