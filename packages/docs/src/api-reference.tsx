import { createElement } from "react";
import type { CSSProperties, ReactElement } from "react";
import { ComponentHeader } from "./component-header";
import { ImportStatement } from "./import-statement";
import { PropsTable } from "./props-table";
import type { PropsTableProp } from "./props-table";

export interface ApiReferencePart {
  readonly name: string;
  readonly propsInterface: string;
  readonly props: readonly PropsTableProp[];
  readonly description?: string | undefined;
}

export interface ApiReferenceProps {
  name: string;
  description?: string;
  packagePath: string;
  status?: "stable" | "beta" | "experimental";
  imports: readonly string[];
  props?: readonly PropsTableProp[];
  parts?: readonly ApiReferencePart[];
  className?: string;
}

const sectionStyle: CSSProperties = {
  marginTop: "24px",
};

const partHeaderStyle: CSSProperties = {
  fontSize: "1.25rem",
  fontWeight: 600,
  marginTop: "32px",
  marginBottom: "4px",
  fontFamily: "var(--ifm-font-family-monospace, monospace)",
};

const partDescStyle: CSSProperties = {
  fontSize: "0.875rem",
  color: "#6b7280",
  marginBottom: "8px",
};

/**
 * ApiReference — full API documentation section for a component.
 * Composes ComponentHeader + ImportStatement + PropsTable.
 */
export function ApiReference({
  name,
  description,
  packagePath,
  status = "beta",
  imports,
  props,
  parts,
  className,
}: ApiReferenceProps): ReactElement {
  return createElement(
    "div",
    { "data-kui-docs": "api-reference", className },
    // Header
    createElement(ComponentHeader, {
      name,
      ...(description ? { description } : undefined),
      package: packagePath,
      status,
    }),
    // Import statement
    createElement(ImportStatement, {
      imports: [...imports],
      from: packagePath,
    }),
    // Single component props
    props && props.length > 0
      ? createElement(
          "div",
          { style: sectionStyle },
          createElement(PropsTable, { props, title: "Props" }),
        )
      : null,
    // Compound component parts
    parts && parts.length > 0
      ? createElement(
          "div",
          { style: sectionStyle },
          ...parts.map((part) =>
            createElement(
              "div",
              { key: part.name, id: `api-${part.name}` },
              createElement("div", { style: partHeaderStyle }, `<${part.name} />`),
              part.description
                ? createElement("p", { style: partDescStyle }, part.description)
                : null,
              part.props.length > 0
                ? createElement(PropsTable, { props: part.props })
                : createElement(
                    "p",
                    { style: { fontSize: "0.8125rem", color: "#9ca3af" } },
                    "No component-specific props.",
                  ),
            ),
          ),
        )
      : null,
  );
}
