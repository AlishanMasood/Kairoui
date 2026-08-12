import { createElement } from "react";
import type { ReactNode } from "react";

export interface DocsExampleGroupProps {
  /** Group label. */
  title?: string;
  /** Arrange examples in a row or column. */
  direction?: "row" | "column";
  /** Gap between examples (CSS value). */
  gap?: string;
  children?: ReactNode;
}

/**
 * DocsExampleGroup — groups related component examples with consistent layout.
 */
export function DocsExampleGroup({
  title,
  direction = "row",
  gap = "16px",
  children,
}: DocsExampleGroupProps) {
  return createElement(
    "div",
    {
      "data-kui-docs": "example-group",
      style: { margin: "16px 0" },
    },
    title
      ? createElement(
          "div",
          { style: { fontSize: "0.875rem", fontWeight: 500, marginBottom: "8px", color: "#666" } },
          title,
        )
      : null,
    createElement(
      "div",
      {
        style: {
          display: "flex",
          flexDirection: direction,
          flexWrap: direction === "row" ? "wrap" : undefined,
          alignItems: direction === "row" ? "center" : undefined,
          gap,
          padding: "16px",
          border: "1px solid #e5e5e5",
          borderRadius: "8px",
          background: "#fafafa",
        },
      },
      children,
    ),
  );
}
