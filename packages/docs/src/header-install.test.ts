import { describe, it, expect } from "vitest";
import { renderToString } from "react-dom/server";
import { createElement } from "react";
import { ComponentHeader } from "./component-header";
import { PackageInstall } from "./package-install";
import { ImportStatement } from "./import-statement";

describe("ComponentHeader", () => {
  it("renders component name as h1", () => {
    const html = renderToString(createElement(ComponentHeader, { name: "Button" }));
    expect(html).toContain("<h1");
    expect(html).toContain("Button");
  });

  it("renders description", () => {
    const html = renderToString(
      createElement(ComponentHeader, { name: "Box", description: "A layout primitive" }),
    );
    expect(html).toContain("A layout primitive");
  });

  it("renders package info", () => {
    const html = renderToString(
      createElement(ComponentHeader, { name: "Box", package: "@kairoui/core/primitives" }),
    );
    expect(html).toContain("@kairoui/core/primitives");
  });

  it("renders status badge", () => {
    const html = renderToString(createElement(ComponentHeader, { name: "Box", status: "stable" }));
    expect(html).toContain("Stable");
  });

  it("renders beta status", () => {
    const html = renderToString(createElement(ComponentHeader, { name: "Grid", status: "beta" }));
    expect(html).toContain("Beta");
  });

  it("applies data-kui-docs attribute", () => {
    const html = renderToString(createElement(ComponentHeader, { name: "X" }));
    expect(html).toContain('data-kui-docs="component-header"');
  });

  it("SSR-safe", () => {
    expect(() => {
      renderToString(
        createElement(ComponentHeader, {
          name: "Button",
          description: "Interactive",
          package: "@kairoui/core",
          status: "stable",
        }),
      );
    }).not.toThrow();
  });
});

describe("PackageInstall", () => {
  it("renders npm command", () => {
    const html = renderToString(createElement(PackageInstall, { package: "@kairoui/core" }));
    expect(html).toContain("npm install @kairoui/core");
  });

  it("renders pnpm command", () => {
    const html = renderToString(createElement(PackageInstall, { package: "@kairoui/core" }));
    expect(html).toContain("pnpm add @kairoui/core");
  });

  it("applies data-kui-docs attribute", () => {
    const html = renderToString(createElement(PackageInstall, { package: "@kairoui/core" }));
    expect(html).toContain('data-kui-docs="package-install"');
  });

  it("SSR-safe", () => {
    expect(() => {
      renderToString(createElement(PackageInstall, { package: "@kairoui/theme" }));
    }).not.toThrow();
  });
});

describe("ImportStatement", () => {
  it("renders import code", () => {
    const html = renderToString(
      createElement(ImportStatement, {
        imports: ["Box", "Stack"],
        from: "@kairoui/core/primitives",
      }),
    );
    expect(html).toContain("import { Box, Stack } from &quot;@kairoui/core/primitives&quot;;");
  });

  it("renders single import", () => {
    const html = renderToString(
      createElement(ImportStatement, { imports: ["useTheme"], from: "@kairoui/core" }),
    );
    expect(html).toContain("useTheme");
    expect(html).toContain("@kairoui/core");
  });

  it("applies data-kui-docs attribute", () => {
    const html = renderToString(
      createElement(ImportStatement, { imports: ["Box"], from: "@kairoui/core/primitives" }),
    );
    expect(html).toContain('data-kui-docs="import-statement"');
  });

  it("SSR-safe", () => {
    expect(() => {
      renderToString(
        createElement(ImportStatement, { imports: ["Flex"], from: "@kairoui/core/primitives" }),
      );
    }).not.toThrow();
  });
});
