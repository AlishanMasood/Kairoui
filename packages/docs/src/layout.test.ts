import { describe, it, expect } from "vitest";
import { renderToString } from "react-dom/server";
import { createElement } from "react";
import { DocsSection } from "./docs-section";
import { DocsExampleGroup } from "./docs-example-group";

describe("DocsSection", () => {
  it("renders section element", () => {
    const html = renderToString(createElement(DocsSection, null, "Content"));
    expect(html).toContain("<section");
    expect(html).toContain("Content");
  });

  it("renders title as heading", () => {
    const html = renderToString(createElement(DocsSection, { title: "Usage" }, "Body"));
    expect(html).toContain("<h2");
    expect(html).toContain("Usage");
  });

  it("supports level prop", () => {
    const html = renderToString(createElement(DocsSection, { title: "Sub", level: 3 }, "X"));
    expect(html).toContain("<h3");
  });

  it("applies data-kui-docs attribute", () => {
    const html = renderToString(createElement(DocsSection, null, "X"));
    expect(html).toContain('data-kui-docs="section"');
  });

  it("SSR-safe", () => {
    expect(() => {
      renderToString(createElement(DocsSection, { title: "T" }, "C"));
    }).not.toThrow();
  });
});

describe("DocsExampleGroup", () => {
  it("renders container", () => {
    const html = renderToString(createElement(DocsExampleGroup, null, "Items"));
    expect(html).toContain('data-kui-docs="example-group"');
    expect(html).toContain("Items");
  });

  it("renders title", () => {
    const html = renderToString(createElement(DocsExampleGroup, { title: "Sizes" }, "X"));
    expect(html).toContain("Sizes");
  });

  it("defaults to row direction", () => {
    const html = renderToString(createElement(DocsExampleGroup, null, "X"));
    expect(html).toContain("flex-direction:row");
  });

  it("supports column direction", () => {
    const html = renderToString(createElement(DocsExampleGroup, { direction: "column" }, "X"));
    expect(html).toContain("flex-direction:column");
  });

  it("SSR-safe", () => {
    expect(() => {
      renderToString(createElement(DocsExampleGroup, { title: "T", gap: "8px" }, "C"));
    }).not.toThrow();
  });
});
