import { describe, it, expect } from "vitest";
import { renderToString } from "react-dom/server";
import { createElement } from "react";
import { CodePreview } from "./code-preview";

describe("CodePreview", () => {
  it("renders code content", () => {
    const html = renderToString(createElement(CodePreview, { code: "const x = 1;" }));
    expect(html).toContain("const x = 1;");
  });

  it("applies data-kui-docs attribute", () => {
    const html = renderToString(createElement(CodePreview, { code: "x" }));
    expect(html).toContain('data-kui-docs="code-preview"');
  });

  it("renders title", () => {
    const html = renderToString(createElement(CodePreview, { code: "x", title: "Example" }));
    expect(html).toContain("Example");
  });

  it("renders description", () => {
    const html = renderToString(
      createElement(CodePreview, { code: "x", description: "Shows usage" }),
    );
    expect(html).toContain("Shows usage");
  });

  it("renders preview area when preview is provided", () => {
    const html = renderToString(
      createElement(CodePreview, {
        code: "x",
        preview: createElement("div", null, "Rendered"),
      }),
    );
    expect(html).toContain("Rendered");
    expect(html).toContain('data-kui-docs="preview-area"');
  });

  it("renders toggle button", () => {
    const html = renderToString(createElement(CodePreview, { code: "x" }));
    expect(html).toContain("Hide code");
  });

  it("shows code by default (defaultExpanded=true)", () => {
    const html = renderToString(createElement(CodePreview, { code: "const y = 2;" }));
    expect(html).toContain("const y = 2;");
    expect(html).toContain('aria-expanded="true"');
  });

  it("hides code when defaultExpanded=false", () => {
    const html = renderToString(
      createElement(CodePreview, { code: "hidden", defaultExpanded: false }),
    );
    expect(html).not.toContain("<pre");
    expect(html).toContain("Show code");
    expect(html).toContain('aria-expanded="false"');
  });

  it("renders copy button when expanded", () => {
    const html = renderToString(createElement(CodePreview, { code: "x" }));
    expect(html).toContain("Copy");
    expect(html).toContain('aria-label="Copy code to clipboard"');
  });

  it("toggle button has accessible label", () => {
    const html = renderToString(createElement(CodePreview, { code: "x" }));
    expect(html).toContain('aria-label="Hide source code"');
  });

  it("pre has accessible label from title", () => {
    const html = renderToString(createElement(CodePreview, { code: "x", title: "Usage" }));
    expect(html).toContain('aria-label="Code: Usage"');
  });

  it("uses custom highlight function", () => {
    const highlight = (code: string) => createElement("mark", null, code);
    const html = renderToString(
      createElement(CodePreview, { code: "y", highlight, language: "ts" }),
    );
    expect(html).toContain("<mark>");
  });

  it("accepts className", () => {
    const html = renderToString(createElement(CodePreview, { code: "x", className: "demo" }));
    expect(html).toContain("demo");
  });

  it("SSR-safe", () => {
    expect(() => {
      renderToString(
        createElement(CodePreview, {
          code: "const App = () => {};",
          title: "App",
          description: "Main component",
          language: "tsx",
          preview: createElement("div", null, "Preview"),
        }),
      );
    }).not.toThrow();
  });
});
