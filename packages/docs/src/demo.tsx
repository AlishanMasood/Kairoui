import { createElement, useState, useCallback } from "react";
import type { CSSProperties, ReactElement, ReactNode } from "react";

export interface DemoProps {
  /** Rendered component preview. */
  children: ReactNode;
  /** Source code string for the example. */
  code?: string;
  /** Language for syntax highlighting. */
  language?: string;
  /** Demo title. */
  title?: string;
  /** Short description. */
  description?: string;
  /** Whether source is visible by default. */
  defaultShowCode?: boolean;
  /** Custom syntax highlighter (injected by app layer). */
  highlight?: (code: string, language: string) => ReactNode;
  /** Additional className. */
  className?: string;
  /** Inline style overrides. */
  style?: CSSProperties;
}

const containerStyle: CSSProperties = {
  margin: "24px 0",
  borderRadius: "8px",
  border: "1px solid #e5e5e5",
  overflow: "hidden",
};

const headerStyle: CSSProperties = {
  padding: "10px 14px",
  borderBottom: "1px solid #e5e5e5",
  background: "#fafafa",
};

const previewStyle: CSSProperties = {
  padding: "24px",
  background: "#fff",
};

const toolbarStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  padding: "4px 12px",
  background: "#f5f5f5",
  borderTop: "1px solid #e5e5e5",
  fontSize: "0.75rem",
};

const toolbarBtnStyle: CSSProperties = {
  appearance: "none",
  border: "none",
  background: "transparent",
  color: "#666",
  cursor: "pointer",
  padding: "4px 8px",
  borderRadius: "3px",
  fontSize: "0.75rem",
  fontFamily: "inherit",
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

/**
 * Demo — interactive component demonstration for documentation.
 *
 * Renders a live component preview with collapsible source code.
 * Designed for extension: future versions will add theme switching,
 * RTL/LTR, responsive viewport, and fullscreen — without breaking the API.
 */
export function Demo({
  children,
  code,
  language = "tsx",
  title,
  description,
  defaultShowCode = false,
  highlight,
  className,
  style,
}: DemoProps): ReactElement {
  const [showCode, setShowCode] = useState(defaultShowCode);
  const [copied, setCopied] = useState(false);

  const handleToggleCode = useCallback(() => {
    setShowCode((prev) => !prev);
  }, []);

  const handleCopy = useCallback(() => {
    if (!code) return;
    void navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    });
  }, [code]);

  const highlighted = code && highlight ? highlight(code, language) : null;

  return createElement(
    "div",
    {
      "data-kui-docs": "demo",
      className,
      style: { ...containerStyle, ...style },
    },
    // Header
    title || description
      ? createElement(
          "div",
          { style: headerStyle },
          title
            ? createElement("div", { style: { fontWeight: 600, fontSize: "0.9375rem" } }, title)
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
    createElement(
      "div",
      {
        style: previewStyle,
        "data-kui-docs": "demo-preview",
        role: "presentation",
      },
      children,
    ),
    // Toolbar
    code
      ? createElement(
          "div",
          { style: toolbarStyle, role: "toolbar", "aria-label": "Demo controls" },
          createElement(
            "button",
            {
              type: "button",
              onClick: handleToggleCode,
              "aria-expanded": String(showCode),
              "aria-label": showCode ? "Hide source code" : "Show source code",
              style: toolbarBtnStyle,
            },
            showCode ? "◁ Hide code" : "▷ View code",
          ),
          showCode
            ? createElement(
                "button",
                {
                  type: "button",
                  onClick: handleCopy,
                  "aria-label": "Copy code to clipboard",
                  style: toolbarBtnStyle,
                },
                copied ? "✓ Copied" : "⎘ Copy",
              )
            : null,
        )
      : null,
    // Source code
    showCode && code
      ? createElement(
          "pre",
          {
            style: preStyle,
            tabIndex: 0,
            "aria-label": title ? `Source: ${title}` : "Demo source code",
          },
          highlighted ?? createElement("code", null, code),
        )
      : null,
  );
}
