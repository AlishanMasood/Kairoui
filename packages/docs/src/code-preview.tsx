import { createElement, useState, useCallback } from "react";
import type { CSSProperties, ReactElement, ReactNode } from "react";

export interface CodePreviewProps {
  /** The source code string. */
  code: string;
  /** Language for syntax highlighting. */
  language?: string;
  /** Preview title. */
  title?: string;
  /** Short description. */
  description?: string;
  /** Rendered component preview (placed above the code). */
  preview?: ReactNode;
  /** Whether the source code is visible by default. */
  defaultExpanded?: boolean;
  /** Custom syntax highlighter (injected by app layer). */
  highlight?: (code: string, language: string) => ReactNode;
  /** Additional className. */
  className?: string;
  /** Inline style overrides. */
  style?: CSSProperties;
}

const containerStyle: CSSProperties = {
  margin: "16px 0",
  borderRadius: "8px",
  border: "1px solid #e5e5e5",
  overflow: "hidden",
};

const headerStyle: CSSProperties = {
  padding: "10px 14px",
  borderBottom: "1px solid #e5e5e5",
  background: "#fafafa",
};

const previewAreaStyle: CSSProperties = {
  padding: "24px",
  background: "#fff",
};

const codeAreaStyle: CSSProperties = {
  borderTop: "1px solid #e5e5e5",
};

const toggleBtnStyle: CSSProperties = {
  appearance: "none",
  border: "none",
  background: "#f5f5f5",
  width: "100%",
  padding: "6px 14px",
  fontSize: "0.75rem",
  color: "#666",
  cursor: "pointer",
  textAlign: "left",
  fontFamily: "inherit",
  borderTop: "1px solid #e5e5e5",
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
  position: "absolute",
  top: "8px",
  right: "8px",
};

/**
 * CodePreview — source code display with optional rendered preview.
 *
 * Combines a component preview area with a collapsible source code section.
 * The `highlight` prop allows app-layer syntax highlighting injection.
 */
export function CodePreview({
  code,
  language,
  title,
  description,
  preview,
  defaultExpanded = true,
  highlight,
  className,
  style,
}: CodePreviewProps): ReactElement {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    void navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    });
  }, [code]);

  const handleToggle = useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  const highlighted = highlight ? highlight(code, language ?? "text") : null;

  return createElement(
    "div",
    {
      "data-kui-docs": "code-preview",
      className,
      style: { ...containerStyle, ...style },
    },
    // Header (title + description)
    title || description
      ? createElement(
          "div",
          { style: headerStyle },
          title
            ? createElement("div", { style: { fontWeight: 600, fontSize: "0.875rem" } }, title)
            : null,
          description
            ? createElement(
                "div",
                { style: { fontSize: "0.8125rem", color: "#666", marginTop: title ? "2px" : 0 } },
                description,
              )
            : null,
        )
      : null,
    // Preview area
    preview
      ? createElement("div", { style: previewAreaStyle, "data-kui-docs": "preview-area" }, preview)
      : null,
    // Toggle button
    createElement(
      "button",
      {
        type: "button",
        onClick: handleToggle,
        "aria-expanded": String(expanded),
        "aria-label": expanded ? "Hide source code" : "Show source code",
        style: toggleBtnStyle,
      },
      expanded ? "▾ Hide code" : "▸ Show code",
    ),
    // Code area (collapsible)
    expanded
      ? createElement(
          "div",
          { style: { ...codeAreaStyle, position: "relative" as const } },
          createElement(
            "button",
            {
              type: "button",
              onClick: handleCopy,
              "aria-label": "Copy code to clipboard",
              style: copyBtnStyle,
            },
            copied ? "Copied!" : "Copy",
          ),
          createElement(
            "pre",
            {
              style: preStyle,
              tabIndex: 0,
              "aria-label": title ? `Code: ${title}` : "Source code",
            },
            highlighted ?? createElement("code", null, code),
          ),
        )
      : null,
  );
}
