import { describe, it, expect, afterEach } from "vitest";
import { createElement } from "react";
import { render, screen, cleanup } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { ApiReference } from "./api-reference";
import type { PropsTableProp } from "./props-table";
import type { ApiReferencePart } from "./api-reference";

afterEach(cleanup);

const sampleProps: PropsTableProp[] = [
  {
    name: "disabled",
    type: "boolean",
    required: false,
    defaultValue: "false",
    description: "Disables the button",
    deprecated: false,
  },
  {
    name: "appearance",
    type: '"solid" | "outline"',
    required: false,
    defaultValue: '"solid"',
    description: "Visual style",
    deprecated: false,
  },
];

const sampleParts: ApiReferencePart[] = [
  {
    name: "TabsList",
    propsInterface: "TabsListProps",
    props: [
      {
        name: "loop",
        type: "boolean",
        required: false,
        defaultValue: "true",
        description: "Loop navigation",
        deprecated: false,
      },
    ],
    description: "Container for tab triggers",
  },
  {
    name: "TabsTrigger",
    propsInterface: "TabsTriggerProps",
    props: [
      {
        name: "value",
        type: "string",
        required: true,
        defaultValue: undefined,
        description: "Tab value",
        deprecated: false,
      },
      {
        name: "disabled",
        type: "boolean",
        required: false,
        defaultValue: undefined,
        description: "Disables trigger",
        deprecated: false,
      },
    ],
  },
];

// ─── Basic rendering ────────────────────────────────────────────────

describe("ApiReference", () => {
  it("renders component header with name", () => {
    render(
      createElement(ApiReference, {
        name: "Button",
        description: "A button component",
        packagePath: "@kairoui/core/components",
        imports: ["Button"],
        props: sampleProps,
      }),
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Button");
  });

  it("renders import statement", () => {
    render(
      createElement(ApiReference, {
        name: "Button",
        packagePath: "@kairoui/core/components",
        imports: ["Button"],
        props: sampleProps,
      }),
    );
    expect(screen.getByText(/import.*Button.*from/)).toBeInTheDocument();
  });

  it("renders props table", () => {
    render(
      createElement(ApiReference, {
        name: "Button",
        packagePath: "@kairoui/core/components",
        imports: ["Button"],
        props: sampleProps,
      }),
    );
    expect(screen.getByText("disabled")).toBeInTheDocument();
    expect(screen.getByText("appearance")).toBeInTheDocument();
  });

  it("renders compound component parts", () => {
    render(
      createElement(ApiReference, {
        name: "Tabs",
        packagePath: "@kairoui/core/components",
        imports: ["Tabs", "TabsList", "TabsTrigger"],
        parts: sampleParts,
      }),
    );
    expect(screen.getByText("<TabsList />")).toBeInTheDocument();
    expect(screen.getByText("<TabsTrigger />")).toBeInTheDocument();
    expect(screen.getByText("Container for tab triggers")).toBeInTheDocument();
  });

  it("renders part props tables", () => {
    render(
      createElement(ApiReference, {
        name: "Tabs",
        packagePath: "@kairoui/core/components",
        imports: ["Tabs"],
        parts: sampleParts,
      }),
    );
    expect(screen.getByText("loop")).toBeInTheDocument();
    expect(screen.getByText("value")).toBeInTheDocument();
  });

  it("has data-kui-docs attribute", () => {
    render(
      createElement(ApiReference, {
        name: "Button",
        packagePath: "@kairoui/core/components",
        imports: ["Button"],
      }),
    );
    expect(document.querySelector("[data-kui-docs='api-reference']")).toBeInTheDocument();
  });

  it("generates anchor IDs for compound parts", () => {
    render(
      createElement(ApiReference, {
        name: "Tabs",
        packagePath: "@kairoui/core/components",
        imports: ["Tabs"],
        parts: sampleParts,
      }),
    );
    expect(document.getElementById("api-TabsList")).toBeInTheDocument();
    expect(document.getElementById("api-TabsTrigger")).toBeInTheDocument();
  });

  it("renders without props or parts gracefully", () => {
    render(
      createElement(ApiReference, {
        name: "Spinner",
        packagePath: "@kairoui/core/components",
        imports: ["Spinner"],
      }),
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Spinner");
  });

  it("renders to string (SSR)", () => {
    const html = renderToString(
      createElement(ApiReference, {
        name: "Button",
        packagePath: "@kairoui/core/components",
        imports: ["Button"],
        props: sampleProps,
      }),
    );
    expect(html).toContain("Button");
    expect(html).toContain("disabled");
    expect(html).toContain("<table");
  });
});
