import { createElement } from "react";
import type { ReactNode } from "react";

export interface ComponentHeaderProps {
  /** Component name (e.g., "Button"). */
  name: string;
  /** Short description. */
  description?: string;
  /** Package that exports this component (e.g., "@kairoui/core/primitives"). */
  package?: string;
  /** Component status. */
  status?: "stable" | "beta" | "experimental";
  children?: ReactNode;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  stable: { label: "Stable", color: "#1a7f37" },
  beta: { label: "Beta", color: "#d4a017" },
  experimental: { label: "Experimental", color: "#9a6700" },
};

/**
 * ComponentHeader — renders the title block for a component documentation page.
 */
export function ComponentHeader({
  name,
  description,
  package: pkg,
  status,
  children,
}: ComponentHeaderProps) {
  const statusInfo = status ? STATUS_LABELS[status] : undefined;

  return createElement(
    "div",
    { "data-kui-docs": "component-header", style: { marginBottom: "24px" } },
    createElement(
      "h1",
      { style: { margin: "0 0 8px 0", fontSize: "2rem", fontWeight: 700 } },
      name,
    ),
    statusInfo
      ? createElement(
          "span",
          {
            style: {
              display: "inline-block",
              fontSize: "0.75rem",
              fontWeight: 600,
              padding: "2px 8px",
              borderRadius: "4px",
              background: `${statusInfo.color}18`,
              color: statusInfo.color,
              marginBottom: "8px",
            },
          },
          statusInfo.label,
        )
      : null,
    description
      ? createElement(
          "p",
          { style: { margin: "0 0 8px 0", fontSize: "1rem", color: "#555" } },
          description,
        )
      : null,
    pkg
      ? createElement(
          "code",
          {
            style: {
              fontSize: "0.8125rem",
              color: "#666",
              background: "#f5f5f5",
              padding: "2px 6px",
              borderRadius: "3px",
            },
          },
          pkg,
        )
      : null,
    children,
  );
}
