import { createElement } from "react";
import type { CSSProperties, ReactElement, ReactNode } from "react";

export type CalloutType = "info" | "note" | "warning" | "danger" | "success" | "tip";

export interface CalloutProps {
  /** Callout semantic type. */
  type?: CalloutType;
  /** Optional title. */
  title?: string;
  /** Additional className. */
  className?: string;
  /** Inline style overrides. */
  style?: CSSProperties;
  children?: ReactNode;
}

const TYPE_CONFIG: Record<CalloutType, { borderColor: string; bg: string; icon: string }> = {
  info: { borderColor: "#0078d4", bg: "#f0f8ff", icon: "ℹ️" },
  note: { borderColor: "#6b7280", bg: "#f9fafb", icon: "📝" },
  warning: { borderColor: "#d4a017", bg: "#fffcf0", icon: "⚠️" },
  danger: { borderColor: "#d42020", bg: "#fff5f5", icon: "🚫" },
  success: { borderColor: "#1a7f37", bg: "#f0fff4", icon: "✅" },
  tip: { borderColor: "#0ea5e9", bg: "#f0f9ff", icon: "💡" },
};

/**
 * Callout — documentation admonition component.
 *
 * Renders an accessible callout with semantic type, optional title, and icon.
 * Uses role="note" for screen reader announcement.
 */
export function Callout({
  type = "info",
  title,
  className,
  style,
  children,
}: CalloutProps): ReactElement {
  const config = TYPE_CONFIG[type];

  return createElement(
    "div",
    {
      role: "note",
      "aria-label": title ?? type,
      className,
      style: {
        display: "flex",
        gap: "12px",
        borderLeft: `4px solid ${config.borderColor}`,
        background: config.bg,
        padding: "12px 16px",
        borderRadius: "6px",
        margin: "16px 0",
        ...style,
      },
      "data-kui-docs": "callout",
      "data-callout-type": type,
    },
    createElement(
      "span",
      { "aria-hidden": "true", style: { flexShrink: 0, fontSize: "1.1rem", lineHeight: "1.5" } },
      config.icon,
    ),
    createElement(
      "div",
      { style: { flex: 1, minWidth: 0 } },
      title
        ? createElement(
            "div",
            { style: { fontWeight: 600, marginBottom: "4px", fontSize: "0.9375rem" } },
            title,
          )
        : null,
      createElement("div", { style: { fontSize: "0.875rem", lineHeight: "1.6" } }, children),
    ),
  );
}
