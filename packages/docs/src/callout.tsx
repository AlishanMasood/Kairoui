import { createElement } from "react";
import type { ReactNode } from "react";

export interface CalloutProps {
  /** Callout type. */
  type?: "info" | "warning" | "error" | "tip";
  /** Title text. */
  title?: string;
  children?: ReactNode;
}

const TYPE_STYLES: Record<string, { borderColor: string; bg: string }> = {
  info: { borderColor: "#0078d4", bg: "#f0f8ff" },
  warning: { borderColor: "#d4a017", bg: "#fffcf0" },
  error: { borderColor: "#d42020", bg: "#fff5f5" },
  tip: { borderColor: "#1a7f37", bg: "#f0fff4" },
};

/**
 * Callout — documentation callout/admonition component.
 *
 * Uses inline styles for now until the full styling system is integrated
 * with Docusaurus's CSS pipeline.
 */
export function Callout({ type = "info", title, children }: CalloutProps) {
  const styles = TYPE_STYLES[type] ?? { borderColor: "#0078d4", bg: "#f0f8ff" };

  return createElement(
    "div",
    {
      style: {
        borderLeft: `4px solid ${styles.borderColor}`,
        background: styles.bg,
        padding: "12px 16px",
        borderRadius: "4px",
        margin: "16px 0",
      },
      "data-kui-docs": "callout",
      "data-callout-type": type,
    },
    title ? createElement("div", { style: { fontWeight: 600, marginBottom: "4px" } }, title) : null,
    createElement("div", null, children),
  );
}
