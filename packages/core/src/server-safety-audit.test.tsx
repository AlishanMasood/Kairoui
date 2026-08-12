/**
 * Server-safety audit for the Phase 6 styling and composition engine.
 *
 * Validates that all styling/composition modules can be imported and used
 * without accessing browser globals, and that SSR + hydration produce
 * consistent results.
 */
import { describe, it, expect, afterEach, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { render, screen, cleanup } from "@testing-library/react";
import { StrictMode, createElement } from "react";

import { Box } from "./proof/box";
import { Text } from "./proof/text";
import { Button } from "./proof/button";
import { generateComponentCss, generateStylesheet } from "./composition/generate-css";
import { generateLayerOrder, wrapInLayer, CSS_LAYERS } from "./composition/css-layers";
import {
  componentClass,
  slotClass,
  variantClass,
  stateSelector,
} from "./composition/class-generation";
import { measureCssSize, deduplicateRules } from "./composition/deduplicate-css";
import { boxStyleContract } from "./proof/box.styles";
import { textStyleContract } from "./proof/text.styles";
import { buttonStyleContract } from "./proof/button.styles";

afterEach(cleanup);

// ─── CSS generation is server-safe (pure computation) ───────────────

describe("Server safety: CSS generation", () => {
  it("generateComponentCss works without DOM", () => {
    const css = generateComponentCss({ contract: boxStyleContract });
    expect(css).toContain(".kui-box");
  });

  it("generateStylesheet works without DOM", () => {
    const css = generateStylesheet([
      { contract: boxStyleContract },
      { contract: textStyleContract },
      { contract: buttonStyleContract },
    ]);
    expect(css).toContain(".kui-box");
    expect(css).toContain(".kui-text");
    expect(css).toContain(".kui-button");
  });

  it("generateLayerOrder works without DOM", () => {
    expect(generateLayerOrder()).toContain("@layer");
  });

  it("wrapInLayer works without DOM", () => {
    expect(wrapInLayer("kui.components", ".a {}")).toContain("@layer kui.components");
  });

  it("CSS_LAYERS is a static array", () => {
    expect(CSS_LAYERS).toHaveLength(5);
  });

  it("componentClass works without DOM", () => {
    expect(componentClass("button")).toBe("kui-button");
  });

  it("slotClass works without DOM", () => {
    expect(slotClass("button", "content")).toBe("kui-button__content");
  });

  it("variantClass works without DOM", () => {
    expect(variantClass("button", "solid")).toBe("kui-button--solid");
  });

  it("stateSelector works without DOM", () => {
    expect(stateSelector("disabled")).toContain("disabled");
  });

  it("measureCssSize works without DOM", () => {
    const metrics = measureCssSize(".a { color: red; }");
    expect(metrics.bytes).toBeGreaterThan(0);
  });

  it("deduplicateRules works without DOM", () => {
    expect(deduplicateRules(".a {\n  color: red;\n}")).toContain(".a");
  });
});

// ─── SSR rendering produces class-based output ──────────────────────

describe("Server safety: SSR rendering", () => {
  it("Box renders to string with base class", () => {
    const html = renderToString(createElement(Box, null, "Content"));
    expect(html).toContain("kui-box");
    expect(html).toContain("Content");
    expect(html).not.toContain("undefined");
  });

  it("Text renders to string with base class", () => {
    const html = renderToString(createElement(Text, { as: "p" }, "Hello"));
    expect(html).toContain("kui-text");
    expect(html).toContain("<p");
    expect(html).toContain("Hello");
  });

  it("Button renders to string with variant classes", () => {
    const html = renderToString(
      createElement(Button, { appearance: "outline", size: "lg" }, "Click"),
    );
    expect(html).toContain("kui-button");
    expect(html).toContain("kui-button--outline");
    expect(html).toContain("kui-button--lg");
    expect(html).toContain("Click");
  });

  it("Button SSR renders slot classes", () => {
    const html = renderToString(
      createElement(Button, { startIcon: createElement("span", null, "★") }, "Star"),
    );
    expect(html).toContain("kui-button__start-icon");
    expect(html).toContain("kui-button__content");
  });

  it("SSR output contains no inline style for base component styles", () => {
    const html = renderToString(createElement(Box, null, "Clean"));
    expect(html).not.toMatch(/style="[^"]*display/);
  });

  it("Text SSR uses class-based typography, not inline styles", () => {
    const html = renderToString(createElement(Text, null, "Body"));
    expect(html).not.toMatch(/style="[^"]*font-family/);
    expect(html).not.toMatch(/style="[^"]*font-size/);
  });

  it("disabled Button SSR has data-disabled attribute", () => {
    const html = renderToString(createElement(Button, { disabled: true }, "Off"));
    expect(html).toContain("data-disabled");
    expect(html).toContain("disabled");
  });

  it("loading Button SSR has aria-busy", () => {
    const html = renderToString(createElement(Button, { loading: true }, "Wait"));
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain("data-loading");
  });
});

// ─── Hydration consistency ──────────────────────────────────────────

describe("Server safety: hydration consistency", () => {
  it("Box: SSR class matches client class", () => {
    const ssrHtml = renderToString(createElement(Box, { className: "app" }, "Hi"));
    render(
      <Box data-testid="box" className="app">
        Hi
      </Box>,
    );
    const clientCls = screen.getByTestId("box").className;
    for (const cls of clientCls.split(" ").filter(Boolean)) {
      expect(ssrHtml).toContain(cls);
    }
  });

  it("Button: SSR variant classes match client", () => {
    const ssrHtml = renderToString(
      createElement(Button, { appearance: "subtle", size: "sm" }, "Go"),
    );
    render(
      <Button data-testid="btn" appearance="subtle" size="sm">
        Go
      </Button>,
    );
    const clientCls = screen.getByTestId("btn").className;
    for (const cls of clientCls.split(" ").filter(Boolean)) {
      expect(ssrHtml).toContain(cls);
    }
  });

  it("Text: SSR output matches client structure", () => {
    const ssrHtml = renderToString(createElement(Text, { as: "h1" }, "Title"));
    render(
      <Text as="h1" data-testid="text">
        Title
      </Text>,
    );
    const el = screen.getByTestId("text");
    expect(ssrHtml).toContain(el.tagName.toLowerCase());
    expect(ssrHtml).toContain("kui-text");
  });
});

// ─── React Strict Mode double-invocation safety ─────────────────────

describe("Server safety: Strict Mode", () => {
  it("Box renders correctly in StrictMode", () => {
    render(
      <StrictMode>
        <Box data-testid="box">OK</Box>
      </StrictMode>,
    );
    expect(screen.getByTestId("box").textContent).toBe("OK");
    expect(screen.getByTestId("box").className).toContain("kui-box");
  });

  it("Text renders correctly in StrictMode", () => {
    render(
      <StrictMode>
        <Text data-testid="text" as="p">
          Paragraph
        </Text>
      </StrictMode>,
    );
    expect(screen.getByTestId("text").tagName).toBe("P");
    expect(screen.getByTestId("text").className).toContain("kui-text");
  });

  it("Button with variants renders correctly in StrictMode", () => {
    render(
      <StrictMode>
        <Button data-testid="btn" appearance="outline" size="lg">
          Click
        </Button>
      </StrictMode>,
    );
    const cls = screen.getByTestId("btn").className;
    expect(cls).toContain("kui-button");
    expect(cls).toContain("kui-button--outline");
    expect(cls).toContain("kui-button--lg");
  });

  it("Button disabled in StrictMode has correct attributes", () => {
    render(
      <StrictMode>
        <Button data-testid="btn" disabled>
          Disabled
        </Button>
      </StrictMode>,
    );
    expect(screen.getByTestId("btn").hasAttribute("disabled")).toBe(true);
    expect(screen.getByTestId("btn").hasAttribute("data-disabled")).toBe(true);
  });

  it("multiple components in StrictMode render without errors", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <StrictMode>
        <Box>
          <Text as="h1">Title</Text>
          <Button appearance="solid" size="md">
            Action
          </Button>
          <Button appearance="outline" disabled>
            Cancel
          </Button>
        </Box>
      </StrictMode>,
    );
    const reactWarnings = spy.mock.calls.filter(
      (call) => typeof call[0] === "string" && call[0].includes("Warning:"),
    );
    expect(reactWarnings).toHaveLength(0);
    spy.mockRestore();
  });
});

// ─── No-DOM module import safety ────────────────────────────────────

describe("Server safety: module imports", () => {
  it("style contracts are plain objects (no DOM access on import)", () => {
    expect(typeof boxStyleContract).toBe("object");
    expect(typeof textStyleContract).toBe("object");
    expect(typeof buttonStyleContract).toBe("object");
  });

  it("CSS generation functions are pure (no side effects)", () => {
    const a = generateComponentCss({ contract: boxStyleContract });
    const b = generateComponentCss({ contract: boxStyleContract });
    expect(a).toBe(b);
  });

  it("class generation functions are stateless", () => {
    expect(componentClass("x")).toBe(componentClass("x"));
    expect(slotClass("x", "y")).toBe(slotClass("x", "y"));
  });
});
