import { describe, it, expect } from "vitest";
import { renderToString } from "react-dom/server";
import { createElement } from "react";
import { CodeBlock } from "./code-block";

describe("CodeBlock", () => {
  it("renders code content", () => {
    const html = renderToString(createElement(CodeBlock, null, "const x = 1;"));
    expect(html).toContain("const x = 1;");
  });

  it("applies data-kui-docs attribute", () => {
    const html = renderToString(createElement(CodeBlock, null, "code"));
    expect(html).toContain('data-kui-docs="code-block"');
  });

  it("renders language metadata", () => {
    const html = renderToString(createElement(CodeBlock, { language: "tsx" }, "code"));
    expect(html).toContain('data-language="tsx"');
  });

  it("renders filename in header", () => {
    const html = renderToString(createElement(CodeBlock, { filename: "app.tsx" }, "code"));
    expect(html).toContain("app.tsx");
  });

  it("renders copy button by default", () => {
    const html = renderToString(createElement(CodeBlock, null, "code"));
    expect(html).toContain("Copy");
    expect(html).toContain('aria-label="Copy code to clipboard"');
  });

  it("hides copy button when copyable=false", () => {
    const html = renderToString(
      createElement(CodeBlock, { copyable: false, filename: "x.ts" }, "code"),
    );
    expect(html).not.toContain("Copy");
  });

  it("uses pre element for code display", () => {
    const html = renderToString(createElement(CodeBlock, null, "code"));
    expect(html).toContain("<pre");
    expect(html).toContain("<code");
  });

  it("pre has tabIndex for keyboard accessibility", () => {
    const html = renderToString(createElement(CodeBlock, null, "code"));
    expect(html).toContain('tabindex="0"');
  });

  it("pre has aria-label", () => {
    const html = renderToString(createElement(CodeBlock, { filename: "util.ts" }, "code"));
    expect(html).toContain('aria-label="Code: util.ts"');
  });

  it("uses custom highlight function when provided", () => {
    const highlight = (code: string, _lang: string) => `<span class="highlighted">${code}</span>`;
    const html = renderToString(createElement(CodeBlock, { highlight, language: "ts" }, "x = 1"));
    expect(html).toContain("highlighted");
    expect(html).toContain("x = 1");
  });

  it("renders without highlight function (plain text fallback)", () => {
    const html = renderToString(createElement(CodeBlock, { language: "ts" }, "x = 1"));
    expect(html).toContain("x = 1");
    expect(html).toContain("<code");
  });

  it("accepts className", () => {
    const html = renderToString(createElement(CodeBlock, { className: "custom" }, "code"));
    expect(html).toContain("custom");
  });

  it("SSR-safe (no browser globals at render)", () => {
    expect(() => {
      renderToString(
        createElement(CodeBlock, { language: "tsx", filename: "app.tsx" }, "const App = () => {};"),
      );
    }).not.toThrow();
  });
});
