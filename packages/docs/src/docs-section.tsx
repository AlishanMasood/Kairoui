import { createElement } from "react";
import type { ReactNode } from "react";

export interface DocsSectionProps {
  /** Section heading text. */
  title?: string;
  /** Heading level (2–6). Defaults to 2. */
  level?: 2 | 3 | 4 | 5 | 6;
  children?: ReactNode;
}

/**
 * DocsSection — a titled documentation section with consistent spacing.
 */
export function DocsSection({ title, level = 2, children }: DocsSectionProps) {
  const Tag = `h${String(level)}` as "h2" | "h3" | "h4" | "h5" | "h6";
  return createElement(
    "section",
    {
      "data-kui-docs": "section",
      style: { marginTop: "32px", marginBottom: "16px" },
    },
    title
      ? createElement(
          Tag,
          {
            style: {
              margin: "0 0 12px 0",
              fontSize: level === 2 ? "1.5rem" : "1.25rem",
              fontWeight: 600,
            },
          },
          title,
        )
      : null,
    children,
  );
}
