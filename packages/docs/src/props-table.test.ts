import { describe, it, expect, afterEach } from "vitest";
import { createElement } from "react";
import { render, screen, cleanup } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { PropsTable } from "./props-table";
import type { PropsTableProp } from "./props-table";

afterEach(cleanup);

const sampleProps: PropsTableProp[] = [
  {
    name: "disabled",
    type: "boolean",
    required: false,
    defaultValue: "false",
    description: "Disables the component",
    deprecated: false,
  },
  {
    name: "value",
    type: "string",
    required: true,
    defaultValue: undefined,
    description: "Current value",
    deprecated: false,
  },
  {
    name: "appearance",
    type: '"solid" | "outline" | "subtle" | "ghost"',
    required: false,
    defaultValue: '"solid"',
    description: "Visual appearance",
    deprecated: false,
  },
  {
    name: "oldProp",
    type: "string",
    required: false,
    defaultValue: undefined,
    description: "Legacy prop",
    deprecated: true,
    deprecationMessage: "Use newProp instead",
  },
];

describe("PropsTable", () => {
  it("renders a table with prop rows", () => {
    render(createElement(PropsTable, { props: sampleProps }));
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByText("disabled")).toBeInTheDocument();
    expect(screen.getByText("value")).toBeInTheDocument();
    expect(screen.getByText("appearance")).toBeInTheDocument();
  });

  it("shows required props first", () => {
    render(createElement(PropsTable, { props: sampleProps }));
    const rows = screen.getAllByRole("row");
    // Header row + data rows. First data row should be the required prop "value"
    const firstDataRow = rows[1]!;
    expect(firstDataRow.textContent).toContain("value");
  });

  it("shows required indicator", () => {
    render(createElement(PropsTable, { props: sampleProps }));
    expect(screen.getByTitle("Required")).toBeInTheDocument();
  });

  it("shows default values", () => {
    render(createElement(PropsTable, { props: sampleProps }));
    expect(screen.getByText("false")).toBeInTheDocument();
    expect(screen.getByText('"solid"')).toBeInTheDocument();
  });

  it("shows type strings", () => {
    render(createElement(PropsTable, { props: sampleProps }));
    expect(screen.getByText("boolean")).toBeInTheDocument();
  });

  it("shows descriptions", () => {
    render(createElement(PropsTable, { props: sampleProps }));
    expect(screen.getByText("Disables the component")).toBeInTheDocument();
  });

  it("shows deprecated status", () => {
    render(createElement(PropsTable, { props: sampleProps }));
    expect(screen.getByText(/Deprecated.*Use newProp instead/)).toBeInTheDocument();
  });

  it("renders title when provided", () => {
    render(createElement(PropsTable, { props: sampleProps, title: "Button Props" }));
    expect(screen.getByText("Button Props")).toBeInTheDocument();
  });

  it("shows empty message for no props", () => {
    render(createElement(PropsTable, { props: [] }));
    expect(screen.getByText("No props documented.")).toBeInTheDocument();
  });

  it("renders to string (SSR)", () => {
    const html = renderToString(createElement(PropsTable, { props: sampleProps }));
    expect(html).toContain("disabled");
    expect(html).toContain("<table");
    expect(html).toContain("boolean");
  });

  it("has data-kui-docs attribute", () => {
    render(createElement(PropsTable, { props: sampleProps, "data-testid": "pt" } as never));
    const container = document.querySelector("[data-kui-docs='props-table']");
    expect(container).toBeInTheDocument();
  });

  it("generates anchor IDs for deep linking", () => {
    render(createElement(PropsTable, { props: sampleProps }));
    expect(document.getElementById("prop-disabled")).toBeInTheDocument();
    expect(document.getElementById("prop-value")).toBeInTheDocument();
  });
});
