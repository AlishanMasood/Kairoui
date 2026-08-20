import { createElement } from "react";
import type { CSSProperties, ReactElement, ReactNode } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@kairoui/core/components";

export interface TabbedDemoTab {
  /** Unique value identifier for the tab. */
  value: string;
  /** Tab label text. */
  label: string;
  /** Content to render in the tab panel. */
  children: ReactNode;
}

export interface TabbedDemoProps {
  /** Tabs to render. */
  tabs: TabbedDemoTab[];
  /** Default active tab value. Defaults to first tab. */
  defaultValue?: string;
  /** Additional className on the container. */
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

const listStyle: CSSProperties = {
  display: "flex",
  gap: 0,
  padding: "0 12px",
  background: "#fafafa",
  borderBottom: "1px solid #e5e5e5",
};

const triggerStyle: CSSProperties = {
  padding: "8px 14px",
  fontSize: "0.8125rem",
  fontFamily: "inherit",
  cursor: "pointer",
  border: "none",
  background: "transparent",
  borderBottom: "2px solid transparent",
  color: "#666",
};

const panelStyle: CSSProperties = {
  padding: "20px",
};

/**
 * TabbedDemo — multi-tab documentation example using the production Tabs component.
 *
 * Dogfoods @kairoui/core Tabs for real-world use in documentation.
 */
export function TabbedDemo({
  tabs,
  defaultValue,
  className,
  style,
}: TabbedDemoProps): ReactElement {
  const firstValue = tabs[0]?.value ?? "";

  return createElement(
    "div",
    {
      "data-kui-docs": "tabbed-demo",
      className,
      style: { ...containerStyle, ...style },
    },
    createElement(
      Tabs,
      { defaultValue: defaultValue ?? firstValue },
      createElement(
        TabsList,
        { style: listStyle },
        ...tabs.map((tab) =>
          createElement(
            TabsTrigger,
            { key: tab.value, value: tab.value, style: triggerStyle },
            tab.label,
          ),
        ),
      ),
      ...tabs.map((tab) =>
        createElement(
          TabsContent,
          { key: tab.value, value: tab.value, style: panelStyle },
          tab.children,
        ),
      ),
    ),
  );
}
