import { describe, it, expect } from "vitest";
import { renderToString, createElement } from "./test-utils";
import { Callout } from "./index";

describe("@kairoui/docs: package smoke test", () => {
  it("exports Callout component", () => {
    expect(Callout).toBeDefined();
    expect(typeof Callout).toBe("function");
  });
});

describe("@kairoui/docs: Callout", () => {
  it("renders with data-kui-docs attribute", () => {
    const html = renderToString(createElement(Callout, { children: "Hello" }));
    expect(html).toContain('data-kui-docs="callout"');
    expect(html).toContain("Hello");
  });

  it("renders title when provided", () => {
    const html = renderToString(createElement(Callout, { title: "Note", children: "Body" }));
    expect(html).toContain("Note");
    expect(html).toContain("Body");
  });

  it("applies type attribute", () => {
    const html = renderToString(createElement(Callout, { type: "warning", children: "Warn" }));
    expect(html).toContain('data-callout-type="warning"');
  });

  it("SSR-safe (no browser globals)", () => {
    expect(() => {
      renderToString(createElement(Callout, { type: "tip", title: "Tip", children: "Content" }));
    }).not.toThrow();
  });
});
