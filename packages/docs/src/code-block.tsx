import { createElement, useState, useCallback } from "react";
import type { CSSProperties, ReactElement, ReactNode } from "react";

export interface CodeBlockProps {
  /** The source code to display. */
  children?: string;
  /** Language identifier (e.g., "tsx", "bash"). */
  language?: string;
  /** Optional filename shown above the code. */
  filename?: string;
  /** Show copy button. Defaults to true. */
  copyable?: boolean;
  /** Additional className. */
  className?: string;
  /** Inline style overrides for the container. */
  style?: CSSProperties;
  /** Custom syntax highlighter render function (injected by app layer). */
  highlight?: (code: string, language: string) => ReactNode;
}

const containerStyle: CSSProperties = {
  position: "relative",
  margin: "16px 0",
  borderRadius: "8px",
  overflow: "hidden",
  border: "1px solid #2d2d2d",
};

const headerStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "6px 12px",
  background: "#1a1a1a",
  borderBottom: "1px solid #2d2d2d",
  fontSize: "0.75rem",
  color: "#999",
};

const preStyle: CSSProperties = {
  margin: 0,
  padding: "14px 16px",
  background: "#1e1e1e",
  color: "#d4d4d4",
  fontSize: "0.8125rem",
  fontFamily:
    '"JetBrains Mono", "Fira Code", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  lineHeight: 1.6,
  overflowX: "auto",
  tabSize: 2,
};

const copyBtnStyle: CSSProperties = {
  appearance: "none",
  border: "none",
  background: "transparent",
  color: "#999",
  cursor: "pointer",
  padding: "2px 6px",
  borderRadius: "3px",
  fontSize: "0.75rem",
  fontFamily: "inherit",
};

/**
 * CodeBlock — syntax-highlighted code display for documentation.
 *
 * Renders code with optional filename, copy button, and pluggable syntax highlighting.
 * The `highlight` prop allows the app layer to inject Docusaurus/Prism/Shiki
 * without coupling @kairoui/docs to any specific highlighter.
 */
export function CodeBlock({
  children,
  language,
  filename,
  copyable = true,
  className,
  style,
  highlight,
}: CodeBlockProps): ReactElement {
  const [copied, setCopied] = useState(false);

  const code = children ?? "";

  const handleCopy = useCallback(() => {
    void navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    });
  }, [code]);

  const showHeader = filename || (copyable && !filename);
  const highlighted = highlight ? highlight(code, language ?? "text") : null;

  return createElement(
    "div",
    {
      "data-kui-docs": "code-block",
      "data-language": language,
      className,
      style: { ...containerStyle, ...style },
    },
    showHeader
      ? createElement(
          "div",
          { style: headerStyle },
          createElement("span", null, filename ?? language ?? ""),
          copyable
            ? createElement(
                "button",
                {
                  type: "button",
                  onClick: handleCopy,
                  "aria-label": "Copy code to clipboard",
                  style: copyBtnStyle,
                },
                copied ? "Copied!" : "Copy",
              )
            : null,
        )
      : null,
    createElement(
      "pre",
      { style: preStyle, tabIndex: 0, "aria-label": filename ? `Code: ${filename}` : "Code block" },
      highlighted ?? createElement("code", null, code),
    ),
  );
}
