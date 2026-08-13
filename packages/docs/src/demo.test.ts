import { describe, it, expect } from "vitest";
import { renderToString } from "react-dom/server";
import { createElement } from "react";
import { Demo } from "./demo";

describe("Demo: rendering", () => {
  it("renders children in preview area", () => {
    const html = renderToString(createElement(Demo, null, createElement("div", null, "Preview")));
    expect(html).toContain("Preview");
    expect(html).toContain('data-kui-docs="demo-preview"');
  });

  it("applies data-kui-docs attribute", () => {
    const html = renderToString(createElement(Demo, null, "X"));
    expect(html).toContain('data-kui-docs="demo"');
  });

  it("renders title", () => {
    const html = renderToString(createElement(Demo, { title: "Button Example" }, "X"));
    expect(html).toContain("Button Example");
  });

  it("renders description", () => {
    const html = renderToString(createElement(Demo, { description: "Shows usage" }, "X"));
    expect(html).toContain("Shows usage");
  });
});

describe("Demo: source code", () => {
  it("hides code by default", () => {
    const html = renderToString(createElement(Demo, { code: "const x = 1;" }, "X"));
    expect(html).not.toContain("const x = 1;");
    expect(html).toContain("View code");
  });

  it("shows code when defaultShowCode=true", () => {
    const html = renderToString(
      createElement(Demo, { code: "const x = 1;", defaultShowCode: true }, "X"),
    );
    expect(html).toContain("const x = 1;");
    expect(html).toContain("Hide code");
  });

  it("renders toolbar when code is provided", () => {
    const html = renderToString(createElement(Demo, { code: "x" }, "X"));
    expect(html).toContain('role="toolbar"');
    expect(html).toContain('aria-label="Demo controls"');
  });

  it("does not render toolbar when no code", () => {
    const html = renderToString(createElement(Demo, null, "X"));
    expect(html).not.toContain("toolbar");
  });

  it("renders copy button when code is shown", () => {
    const html = renderToString(createElement(Demo, { code: "x", defaultShowCode: true }, "X"));
    expect(html).toContain("Copy");
    expect(html).toContain('aria-label="Copy code to clipboard"');
  });

  it("does not render copy button when code is hidden", () => {
    const html = renderToString(createElement(Demo, { code: "x" }, "X"));
    expect(html).not.toContain('aria-label="Copy code to clipboard"');
  });
});

describe("Demo: accessibility", () => {
  it("toggle has aria-expanded", () => {
    const html = renderToString(createElement(Demo, { code: "x" }, "X"));
    expect(html).toContain('aria-expanded="false"');
  });

  it("toggle has accessible label (show)", () => {
    const html = renderToString(createElement(Demo, { code: "x" }, "X"));
    expect(html).toContain('aria-label="Show source code"');
  });

  it("toggle has accessible label (hide)", () => {
    const html = renderToString(createElement(Demo, { code: "x", defaultShowCode: true }, "X"));
    expect(html).toContain('aria-label="Hide source code"');
  });

  it("pre has accessible label from title", () => {
    const html = renderToString(
      createElement(Demo, { code: "x", title: "Stack", defaultShowCode: true }, "X"),
    );
    expect(html).toContain('aria-label="Source: Stack"');
  });

  it("pre has default accessible label", () => {
    const html = renderToString(createElement(Demo, { code: "x", defaultShowCode: true }, "X"));
    expect(html).toContain('aria-label="Demo source code"');
  });

  it("preview area has role=presentation", () => {
    const html = renderToString(createElement(Demo, null, "X"));
    expect(html).toContain('role="presentation"');
  });
});

describe("Demo: highlight integration", () => {
  it("uses custom highlight function", () => {
    const highlight = (code: string) => createElement("mark", null, code);
    const html = renderToString(
      createElement(Demo, { code: "y", highlight, defaultShowCode: true }, "X"),
    );
    expect(html).toContain("<mark>");
    expect(html).toContain("y");
  });

  it("falls back to plain code without highlighter", () => {
    const html = renderToString(createElement(Demo, { code: "plain", defaultShowCode: true }, "X"));
    expect(html).toContain("<code");
    expect(html).toContain("plain");
  });
});

describe("Demo: consumer overrides", () => {
  it("accepts className", () => {
    const html = renderToString(createElement(Demo, { className: "custom-demo" }, "X"));
    expect(html).toContain("custom-demo");
  });
});

describe("Demo: SSR safety", () => {
  it("renders complete demo without errors", () => {
    expect(() => {
      renderToString(
        createElement(
          Demo,
          {
            title: "Button",
            description: "Primary button example",
            code: "<Button>Click me</Button>",
            language: "tsx",
            defaultShowCode: true,
          },
          createElement("button", null, "Click me"),
        ),
      );
    }).not.toThrow();
  });

  it("renders without code prop", () => {
    expect(() => {
      renderToString(createElement(Demo, { title: "Preview only" }, "Content"));
    }).not.toThrow();
  });
});
