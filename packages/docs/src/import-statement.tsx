import { createElement } from "react";

export interface ImportStatementProps {
  /** Named imports (e.g., ["Box", "Stack"]). */
  imports: readonly string[];
  /** Package path (e.g., "@kairoui/core/primitives"). */
  from: string;
}

/**
 * ImportStatement — renders a copy-friendly import statement.
 */
export function ImportStatement({ imports, from }: ImportStatementProps) {
  const code = `import { ${imports.join(", ")} } from "${from}";`;

  return createElement(
    "div",
    { "data-kui-docs": "import-statement", style: { margin: "12px 0" } },
    createElement(
      "pre",
      {
        style: {
          margin: 0,
          background: "#1e1e1e",
          color: "#d4d4d4",
          padding: "10px 14px",
          borderRadius: "6px",
          fontSize: "0.8125rem",
          fontFamily: "monospace",
          overflow: "auto",
          userSelect: "all",
        },
      },
      createElement("code", null, code),
    ),
  );
}
