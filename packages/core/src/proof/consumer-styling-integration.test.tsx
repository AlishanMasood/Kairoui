/**
 * Consumer integration test for the Phase 6 styling engine.
 *
 * Validates styling from an external consumer perspective:
 * - CSS file generation and content
 * - Theme token references
 * - Base styles, variants, compound variants
 * - Slot styles
 * - State selectors
 * - CSS layer strategy
 * - Consumer override patterns
 * - Multiple components coexistence
 * - SSR rendering with class output
 * - Deterministic output
 * - Size metrics
 */
import { describe, it, expect, afterEach } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen, cleanup } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { generateComponentCss, generateStylesheet } from "../composition/generate-css";
import type { GenerateCssInput } from "../composition/generate-css";
import { generateLayerOrder, wrapInLayer, CSS_LAYERS } from "../composition/css-layers";
import { measureCssSize } from "../composition/deduplicate-css";
import { Box, boxStyleContract } from "../proof/box";
import { Text, textStyleContract } from "../proof/text";
import { Button, buttonStyleContract } from "../proof/button";

afterEach(cleanup);

// ─── dist/styles.css existence and content ──────────────────────────

const DIST_CSS_PATH = resolve(import.meta.dirname, "../../dist/styles.css");

describe("Consumer: styles.css build artifact", () => {
  it("dist/styles.css exists after build", () => {
    expect(existsSync(DIST_CSS_PATH)).toBe(true);
  });

  it("starts with @layer order declaration", () => {
    const css = readFileSync(DIST_CSS_PATH, "utf-8");
    expect(css).toMatch(
      /^@layer kui\.reset, kui\.base, kui\.components, kui\.utilities, kui\.overrides;/,
    );
  });

  it("wraps component styles in kui.components layer", () => {
    const css = readFileSync(DIST_CSS_PATH, "utf-8");
    expect(css).toContain("@layer kui.components {");
  });

  it("contains Box styles", () => {
    const css = readFileSync(DIST_CSS_PATH, "utf-8");
    expect(css).toContain(".kui-box");
  });

  it("contains Text styles", () => {
    const css = readFileSync(DIST_CSS_PATH, "utf-8");
    expect(css).toContain(".kui-text");
  });

  it("contains Button styles", () => {
    const css = readFileSync(DIST_CSS_PATH, "utf-8");
    expect(css).toContain(".kui-button");
  });

  it("contains Button variant classes", () => {
    const css = readFileSync(DIST_CSS_PATH, "utf-8");
    expect(css).toContain(".kui-button--outline");
    expect(css).toContain(".kui-button--subtle");
    expect(css).toContain(".kui-button--sm");
    expect(css).toContain(".kui-button--lg");
  });

  it("contains slot classes", () => {
    const css = readFileSync(DIST_CSS_PATH, "utf-8");
    expect(css).toContain(".kui-button__start-icon");
    expect(css).toContain(".kui-button__content");
    expect(css).toContain(".kui-button__end-icon");
  });

  it("contains state selectors", () => {
    const css = readFileSync(DIST_CSS_PATH, "utf-8");
    expect(css).toContain("[data-disabled]");
    expect(css).toContain(":hover");
    expect(css).toContain(":focus-visible");
  });

  it("contains token var() references", () => {
    const css = readFileSync(DIST_CSS_PATH, "utf-8");
    expect(css).toContain("var(--kui-color-interactive-default");
    expect(css).toContain("var(--kui-control-height-md");
    expect(css).toContain("var(--kui-typography-body-font-size");
  });

  it("does not use !important", () => {
    const css = readFileSync(DIST_CSS_PATH, "utf-8");
    expect(css).not.toContain("!important");
  });

  it("is reasonably sized", () => {
    const css = readFileSync(DIST_CSS_PATH, "utf-8");
    expect(css.length).toBeGreaterThan(1000);
    expect(css.length).toBeLessThan(20000);
  });
});

// ─── CSS layer strategy ─────────────────────────────────────────────

describe("Consumer: CSS layer behavior", () => {
  it("layer order is correct (low → high priority)", () => {
    expect(CSS_LAYERS).toEqual([
      "kui.reset",
      "kui.base",
      "kui.components",
      "kui.utilities",
      "kui.overrides",
    ]);
  });

  it("consumer unlayered CSS has higher specificity than layered", () => {
    const css = readFileSync(DIST_CSS_PATH, "utf-8");
    // All component CSS is inside @layer kui.components
    // Consumer CSS without @layer automatically wins (CSS spec)
    const outsideLayer = css.split("@layer kui.components {")[0]!;
    expect(outsideLayer).not.toContain(".kui-button");
    expect(outsideLayer).not.toContain(".kui-box");
  });

  it("generateLayerOrder produces valid declaration", () => {
    const order = generateLayerOrder();
    expect(order).toBe("@layer kui.reset, kui.base, kui.components, kui.utilities, kui.overrides;");
  });

  it("wrapInLayer wraps content correctly", () => {
    const wrapped = wrapInLayer("kui.components", ".test { color: red; }");
    expect(wrapped).toContain("@layer kui.components {");
    expect(wrapped).toContain("  .test { color: red; }");
  });
});

// ─── Theme token consumption ────────────────────────────────────────

describe("Consumer: theme token references", () => {
  it("Box generates minimal reset styles", () => {
    const css = generateComponentCss({ contract: boxStyleContract });
    expect(css).toContain("box-sizing: border-box;");
    expect(css).toContain("min-width: 0;");
  });

  it("Text uses typography body tokens", () => {
    const css = generateComponentCss({ contract: textStyleContract });
    expect(css).toContain("var(--kui-typography-body-font-family, inherit)");
    expect(css).toContain("var(--kui-typography-body-font-size, 0.875rem)");
    expect(css).toContain("var(--kui-typography-body-line-height, 1.5)");
  });

  it("Button uses interactive color tokens", () => {
    const css = generateComponentCss({ contract: buttonStyleContract });
    expect(css).toContain("var(--kui-color-interactive-default, #0078d4)");
    expect(css).toContain("var(--kui-color-fg-on-interactive, #fff)");
  });

  it("Button size variants reference density tokens", () => {
    const css = generateComponentCss({ contract: buttonStyleContract });
    expect(css).toContain("var(--kui-control-height-sm, 28px)");
    expect(css).toContain("var(--kui-control-height-lg, 44px)");
  });

  it("all token references have fallback values", () => {
    const css = readFileSync(DIST_CSS_PATH, "utf-8");
    // Every var(--kui-* should have a fallback
    const tokenVarMatches = css.match(/var\(--kui-[^)]+\)/g) ?? [];
    expect(tokenVarMatches.length).toBeGreaterThan(0);
    for (const match of tokenVarMatches) {
      // Component-scoped custom property vars (e.g., var(--kui-button-bg)) don't need fallbacks
      if (!match.includes(",") && match.match(/var\(--kui-(box|text|button)-/)) continue;
      // Token references should have fallbacks
      if (match.match(/var\(--kui-(color|typography|control|border|space|focus)-/)) {
        expect(match).toContain(",");
      }
    }
  });
});

// ─── Variant CSS generation ─────────────────────────────────────────

describe("Consumer: variant CSS output", () => {
  it("generates non-default appearance variant rules", () => {
    const css = generateComponentCss({ contract: buttonStyleContract });
    expect(css).not.toContain(".kui-button--solid"); // default — not generated
    expect(css).toContain(".kui-button--outline");
    expect(css).toContain(".kui-button--subtle");
  });

  it("generates non-default size variant rules", () => {
    const css = generateComponentCss({ contract: buttonStyleContract });
    expect(css).toContain(".kui-button--sm");
    expect(css).not.toContain(".kui-button--md"); // default — not generated
    expect(css).toContain(".kui-button--lg");
  });

  it("compound variants generate combined selector", () => {
    const css = generateComponentCss({ contract: buttonStyleContract });
    // Compound: outline + sm and subtle + sm
    expect(css).toContain("padding-left: 8px;");
    expect(css).toContain("padding-right: 8px;");
  });
});

// ─── Consumer className/style overrides ─────────────────────────────

describe("Consumer: className and style overrides", () => {
  it("Box accepts consumer className", () => {
    render(<Box data-testid="box" className="app-card" />);
    const cls = screen.getByTestId("box").className;
    expect(cls).toContain("kui-box");
    expect(cls).toContain("app-card");
  });

  it("Text accepts consumer className", () => {
    render(<Text data-testid="text" className="body-text" />);
    const cls = screen.getByTestId("text").className;
    expect(cls).toContain("kui-text");
    expect(cls).toContain("body-text");
  });

  it("Button accepts consumer className alongside variants", () => {
    render(
      <Button data-testid="btn" className="primary-action" appearance="outline" size="lg">
        Go
      </Button>,
    );
    const cls = screen.getByTestId("btn").className;
    expect(cls).toContain("kui-button");
    expect(cls).toContain("kui-button--outline");
    expect(cls).toContain("kui-button--lg");
    expect(cls).toContain("primary-action");
  });

  it("consumer style prop works on all components", () => {
    render(
      <div>
        <Box data-testid="box" style={{ margin: "4px" }} />
        <Text data-testid="text" style={{ color: "red" }}>
          Hi
        </Text>
        <Button data-testid="btn" style={{ width: "200px" }}>
          Click
        </Button>
      </div>,
    );
    expect(screen.getByTestId("box").style.margin).toBe("4px");
    expect(screen.getByTestId("text").style.color).toBe("red");
    expect(screen.getByTestId("btn").style.width).toBe("200px");
  });
});

// ─── Multiple components on one page ────────────────────────────────

describe("Consumer: multiple components coexistence", () => {
  it("renders all three proof components simultaneously", () => {
    render(
      <Box data-testid="box">
        <Text data-testid="text">Label</Text>
        <Button data-testid="btn">Click</Button>
      </Box>,
    );
    expect(screen.getByTestId("box").className).toContain("kui-box");
    expect(screen.getByTestId("text").className).toContain("kui-text");
    expect(screen.getByTestId("btn").className).toContain("kui-button");
  });

  it("class names do not conflict between components", () => {
    render(
      <div>
        <Box data-testid="box" />
        <Text data-testid="text">Hi</Text>
        <Button data-testid="btn">Go</Button>
      </div>,
    );
    const boxCls = screen.getByTestId("box").className;
    const textCls = screen.getByTestId("text").className;
    const btnCls = screen.getByTestId("btn").className;
    expect(boxCls).not.toContain("kui-text");
    expect(boxCls).not.toContain("kui-button");
    expect(textCls).not.toContain("kui-box");
    expect(textCls).not.toContain("kui-button");
    expect(btnCls).not.toContain("kui-box");
    expect(btnCls).not.toContain("kui-text");
  });

  it("stylesheet contains all components sorted alphabetically", () => {
    const contracts: GenerateCssInput[] = [
      { contract: buttonStyleContract },
      { contract: boxStyleContract },
      { contract: textStyleContract },
    ];
    const css = generateStylesheet(contracts);
    const boxIdx = css.indexOf(".kui-box");
    const btnIdx = css.indexOf(".kui-button");
    const textIdx = css.indexOf(".kui-text");
    expect(boxIdx).toBeLessThan(btnIdx);
    expect(btnIdx).toBeLessThan(textIdx);
  });
});

// ─── SSR rendering ──────────────────────────────────────────────────

describe("Consumer: SSR rendering", () => {
  it("Box renders with base class in SSR", () => {
    const html = renderToString(<Box className="container">Content</Box>);
    expect(html).toContain("kui-box");
    expect(html).toContain("container");
    expect(html).toContain("Content");
  });

  it("Text renders with base class in SSR", () => {
    const html = renderToString(<Text as="p">Paragraph</Text>);
    expect(html).toContain("kui-text");
    expect(html).toContain("<p");
    expect(html).toContain("Paragraph");
  });

  it("Button renders with variant classes in SSR", () => {
    const html = renderToString(
      <Button appearance="outline" size="sm">
        Submit
      </Button>,
    );
    expect(html).toContain("kui-button");
    expect(html).toContain("kui-button--outline");
    expect(html).toContain("kui-button--sm");
    expect(html).toContain("Submit");
  });

  it("SSR output includes slot classes", () => {
    const html = renderToString(<Button startIcon={<span>★</span>}>Star</Button>);
    expect(html).toContain("kui-button__start-icon");
    expect(html).toContain("kui-button__content");
  });

  it("full page SSR with multiple components", () => {
    const html = renderToString(
      <Box>
        <Text as="h1">Title</Text>
        <Text as="p">Body text</Text>
        <Button appearance="solid" size="lg">
          Action
        </Button>
        <Button appearance="outline" disabled>
          Cancel
        </Button>
      </Box>,
    );
    expect(html).toContain("kui-box");
    expect(html).toContain("kui-text");
    expect(html).toContain("kui-button");
    expect(html).toContain("kui-button--outline");
    expect(html).toContain("kui-button--lg");
    expect(html).toContain("data-disabled");
  });
});

// ─── CSS size and determinism ───────────────────────────────────────

describe("Consumer: CSS size and determinism", () => {
  it("repeated generation produces identical output", () => {
    const contracts: GenerateCssInput[] = [
      { contract: boxStyleContract },
      { contract: textStyleContract },
      { contract: buttonStyleContract },
    ];
    const a = generateStylesheet(contracts, { layer: "kui.components", includeLayerOrder: true });
    const b = generateStylesheet(contracts, { layer: "kui.components", includeLayerOrder: true });
    expect(a).toBe(b);
  });

  it("measureCssSize returns meaningful metrics", () => {
    const css = readFileSync(DIST_CSS_PATH, "utf-8");
    const metrics = measureCssSize(css);
    expect(metrics.bytes).toBeGreaterThan(1000);
    expect(metrics.ruleCount).toBeGreaterThan(5);
    expect(metrics.uniqueSelectors).toBeGreaterThan(5);
    expect(metrics.declarationCount).toBeGreaterThan(20);
  });

  it("generated CSS has no duplicate rules", () => {
    const css = readFileSync(DIST_CSS_PATH, "utf-8");
    // Extract rules inside the layer (skip the @layer wrapper lines)
    const layerContent = css.split("@layer kui.components {")[1]?.split("\n}")[0] ?? "";
    // No exact duplicate rule blocks
    const ruleBlocks = layerContent.split("\n\n").filter((b) => b.trim());
    const uniqueBlocks = new Set(ruleBlocks);
    expect(uniqueBlocks.size).toBe(ruleBlocks.length);
  });
});

// ─── Hydration compatibility ────────────────────────────────────────

describe("Consumer: hydration compatibility", () => {
  it("SSR and client render produce same class names", () => {
    const ssrHtml = renderToString(<Button appearance="outline">OK</Button>);
    render(
      <Button data-testid="btn" appearance="outline">
        OK
      </Button>,
    );
    const clientCls = screen.getByTestId("btn").className;
    // SSR should contain the same classes
    for (const cls of clientCls.split(" ")) {
      if (cls) expect(ssrHtml).toContain(cls);
    }
  });

  it("SSR output does not contain inline style for base component styles", () => {
    const html = renderToString(<Box>Content</Box>);
    // Box should not inject inline styles for its base styling
    expect(html).not.toContain("style=");
  });

  it("Text SSR does not inject typography as inline style", () => {
    const html = renderToString(<Text>Hello</Text>);
    // Typography is now class-based, not inline
    expect(html).not.toContain("font-family:");
    expect(html).not.toContain("font-size:");
  });
});

// ─── Tree shaking ───────────────────────────────────────────────────

describe("Consumer: tree shaking", () => {
  it("style contracts are plain objects (no side effects)", () => {
    // Contracts are just data — no function calls, no side effects
    expect(typeof boxStyleContract).toBe("object");
    expect(typeof textStyleContract).toBe("object");
    expect(typeof buttonStyleContract).toBe("object");
  });

  it("CSS generation functions are pure", () => {
    // Calling generate with same input always returns same output (no global state)
    const input: GenerateCssInput = { contract: boxStyleContract };
    const a = generateComponentCss(input);
    const b = generateComponentCss(input);
    expect(a).toBe(b);
  });
});
