import { createElement } from "react";
import type { CSSProperties, ReactElement } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@kairoui/core/components";

export interface PropsTableProp {
  readonly name: string;
  readonly type: string;
  readonly required: boolean;
  readonly defaultValue: string | undefined;
  readonly description: string | undefined;
  readonly deprecated: boolean;
  readonly deprecationMessage?: string | undefined;
  readonly since?: string | undefined;
}

export interface PropsTableProps {
  props: readonly PropsTableProp[];
  title?: string;
  className?: string;
}

const containerStyle: CSSProperties = {
  margin: "24px 0",
  overflowX: "auto",
};

const headerStyle: CSSProperties = {
  fontWeight: 600,
  fontSize: "1.1rem",
  marginBottom: "8px",
};

const nameStyle: CSSProperties = {
  fontFamily: "var(--ifm-font-family-monospace, monospace)",
  fontWeight: 600,
  fontSize: "0.875rem",
  whiteSpace: "nowrap",
};

const typeStyle: CSSProperties = {
  fontFamily: "var(--ifm-font-family-monospace, monospace)",
  fontSize: "0.8125rem",
  color: "#6b7280",
  wordBreak: "break-word",
  maxWidth: "280px",
};

const defaultStyle: CSSProperties = {
  fontFamily: "var(--ifm-font-family-monospace, monospace)",
  fontSize: "0.8125rem",
  color: "#059669",
};

const descStyle: CSSProperties = {
  fontSize: "0.8125rem",
  color: "#374151",
  maxWidth: "320px",
};

const deprecatedStyle: CSSProperties = {
  fontSize: "0.75rem",
  color: "#dc2626",
  fontStyle: "italic",
};

const requiredBadge: CSSProperties = {
  fontSize: "0.6875rem",
  color: "#dc2626",
  fontWeight: 600,
  marginLeft: "4px",
};

export function PropsTable({ props, title, className }: PropsTableProps): ReactElement {
  if (props.length === 0) {
    return createElement(
      "div",
      { "data-kui-docs": "props-table-empty", className },
      "No props documented.",
    );
  }

  const sorted = [...props].sort((a, b) => {
    if (a.required !== b.required) return a.required ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return createElement(
    "div",
    { "data-kui-docs": "props-table", className, style: containerStyle },
    title ? createElement("div", { style: headerStyle }, title) : null,
    createElement(
      Table,
      null,
      createElement(
        TableHeader,
        null,
        createElement(
          TableRow,
          null,
          createElement(TableHead, null, "Prop"),
          createElement(TableHead, null, "Type"),
          createElement(TableHead, null, "Default"),
          createElement(TableHead, null, "Description"),
        ),
      ),
      createElement(
        TableBody,
        null,
        ...sorted.map((prop) =>
          createElement(
            TableRow,
            {
              key: prop.name,
              id: `prop-${prop.name}`,
              style: prop.deprecated ? { opacity: 0.6 } : undefined,
            } as never,
            // Name cell
            createElement(
              TableCell,
              null,
              createElement("span", { style: nameStyle }, prop.name),
              prop.required
                ? createElement("span", { style: requiredBadge, title: "Required" }, "*")
                : null,
            ),
            // Type cell
            createElement(TableCell, null, createElement("code", { style: typeStyle }, prop.type)),
            // Default cell
            createElement(
              TableCell,
              null,
              prop.defaultValue
                ? createElement("code", { style: defaultStyle }, prop.defaultValue)
                : createElement(
                    "span",
                    { style: { color: "#9ca3af", fontSize: "0.8125rem" } },
                    "—",
                  ),
            ),
            // Description cell
            createElement(
              TableCell,
              null,
              prop.deprecated
                ? createElement(
                    "div",
                    null,
                    createElement(
                      "span",
                      { style: deprecatedStyle },
                      `Deprecated${prop.deprecationMessage ? `: ${prop.deprecationMessage}` : ""}`,
                    ),
                    prop.description
                      ? createElement("div", { style: descStyle }, prop.description)
                      : null,
                  )
                : prop.description
                  ? createElement("span", { style: descStyle }, prop.description)
                  : createElement(
                      "span",
                      { style: { color: "#9ca3af", fontSize: "0.8125rem" } },
                      "—",
                    ),
            ),
          ),
        ),
      ),
    ),
  );
}
