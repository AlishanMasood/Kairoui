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
    const html = renderToString(createElement(Callout, null, "Hello"));
    expect(html).toContain('data-kui-docs="callout"');
    expect(html).toContain("Hello");
  });

  it("renders title when provided", () => {
    const html = renderToString(createElement(Callout, { title: "Note" }, "Body"));
    expect(html).toContain("Note");
    expect(html).toContain("Body");
  });

  it("applies type attribute", () => {
    const html = renderToString(createElement(Callout, { type: "warning" }, "Warn"));
    expect(html).toContain('data-callout-type="warning"');
  });

  it("has role=note for accessibility", () => {
    const html = renderToString(createElement(Callout, null, "Text"));
    expect(html).toContain('role="note"');
  });

  it("has aria-label from title", () => {
    const html = renderToString(createElement(Callout, { title: "Important" }, "X"));
    expect(html).toContain('aria-label="Important"');
  });

  it("has aria-label from type when no title", () => {
    const html = renderToString(createElement(Callout, { type: "danger" }, "X"));
    expect(html).toContain('aria-label="danger"');
  });

  it("renders icon with aria-hidden", () => {
    const html = renderToString(createElement(Callout, { type: "info" }, "Text"));
    expect(html).toContain('aria-hidden="true"');
  });

  it("supports all types", () => {
    for (const type of ["info", "note", "warning", "danger", "success", "tip"] as const) {
      const html = renderToString(createElement(Callout, { type }, "X"));
      expect(html).toContain(`data-callout-type="${type}"`);
    }
  });

  it("accepts className override", () => {
    const html = renderToString(createElement(Callout, { className: "custom" }, "X"));
    expect(html).toContain("custom");
  });

  it("SSR-safe (no browser globals)", () => {
    expect(() => {
      renderToString(createElement(Callout, { type: "tip", title: "Tip" }, "Content"));
    }).not.toThrow();
  });
});
