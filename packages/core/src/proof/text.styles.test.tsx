import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { Text, textStyleContract } from "./text";
import { generateComponentCss } from "../composition/generate-css";
import { componentClass } from "../composition/class-generation";

afterEach(cleanup);

// ─── Style contract ─────────────────────────────────────────────────

describe("Text: style contract", () => {
  it("contract name is 'text'", () => {
    expect(textStyleContract.name).toBe("text");
  });

  it("defines root slot with base styles", () => {
    expect(textStyleContract.slots["root"].base).toBeDefined();
  });

  it("has custom properties referencing typography tokens", () => {
    const props = textStyleContract.customProperties!;
    expect(props["--kui-text-font"]).toEqual({
      token: "typography.body.fontFamily",
      fallback: "inherit",
    });
    expect(props["--kui-text-size"]).toEqual({
      token: "typography.body.fontSize",
      fallback: "0.875rem",
    });
    expect(props["--kui-text-leading"]).toEqual({
      token: "typography.body.lineHeight",
      fallback: "1.5",
    });
    expect(props["--kui-text-weight"]).toEqual({
      token: "typography.body.fontWeight",
      fallback: "400",
    });
    expect(props["--kui-text-tracking"]).toEqual({
      token: "typography.body.letterSpacing",
      fallback: "0em",
    });
  });

  it("has color custom property referencing foreground token", () => {
    const props = textStyleContract.customProperties!;
    expect(props["--kui-text-color"]).toEqual({
      token: "color.foreground.default",
      fallback: "inherit",
    });
  });

  it("base styles use component-scoped custom properties", () => {
    const base = textStyleContract.slots["root"].base!;
    expect(base["fontFamily"]).toBe("var(--kui-text-font)");
    expect(base["fontSize"]).toBe("var(--kui-text-size)");
    expect(base["lineHeight"]).toBe("var(--kui-text-leading)");
    expect(base["fontWeight"]).toBe("var(--kui-text-weight)");
    expect(base["letterSpacing"]).toBe("var(--kui-text-tracking)");
    expect(base["color"]).toBe("var(--kui-text-color)");
  });

  it("includes margin reset in base styles", () => {
    const base = textStyleContract.slots["root"].base!;
    expect(base["margin"]).toBe("0");
  });
});

// ─── Base class application ─────────────────────────────────────────

describe("Text: base class", () => {
  it("applies kui-text class to root", () => {
    render(<Text data-testid="text" />);
    expect(screen.getByTestId("text").className).toContain("kui-text");
  });

  it("base class matches componentClass utility output", () => {
    expect(componentClass(textStyleContract.name)).toBe("kui-text");
  });

  it("applies base class with polymorphic rendering", () => {
    render(<Text as="p" data-testid="text" />);
    expect(screen.getByTestId("text").className).toContain("kui-text");
    expect(screen.getByTestId("text").tagName).toBe("P");
  });

  it("applies base class when rendered as heading", () => {
    render(<Text as="h1" data-testid="text" />);
    expect(screen.getByTestId("text").className).toContain("kui-text");
  });

  it("applies base class when rendered as label", () => {
    render(<Text as="label" data-testid="text" />);
    expect(screen.getByTestId("text").className).toContain("kui-text");
  });
});

// ─── Consumer overrides ─────────────────────────────────────────────

describe("Text: consumer className override", () => {
  it("consumer className is merged with base class", () => {
    render(<Text data-testid="text" className="custom" />);
    const el = screen.getByTestId("text");
    expect(el.className).toContain("kui-text");
    expect(el.className).toContain("custom");
  });

  it("multiple consumer classes are preserved", () => {
    render(<Text data-testid="text" className="a b c" />);
    const cls = screen.getByTestId("text").className;
    expect(cls).toContain("kui-text");
    expect(cls).toContain("a");
    expect(cls).toContain("b");
    expect(cls).toContain("c");
  });
});

describe("Text: consumer style override", () => {
  it("consumer style is applied", () => {
    render(<Text data-testid="text" style={{ color: "red", fontSize: "2rem" }} />);
    const el = screen.getByTestId("text");
    expect(el.style.color).toBe("red");
    expect(el.style.fontSize).toBe("2rem");
  });

  it("consumer style does not remove base class", () => {
    render(<Text data-testid="text" style={{ fontWeight: "bold" }} />);
    expect(screen.getByTestId("text").className).toContain("kui-text");
  });
});

// ─── Generated CSS ──────────────────────────────────────────────────

describe("Text: CSS generation", () => {
  it("generates valid CSS from contract", () => {
    const css = generateComponentCss({ contract: textStyleContract });
    expect(css).toContain(".kui-text");
  });

  it("generates custom properties with token var() references", () => {
    const css = generateComponentCss({ contract: textStyleContract });
    expect(css).toContain("--kui-text-font: var(--kui-typography-body-font-family, inherit);");
    expect(css).toContain("--kui-text-size: var(--kui-typography-body-font-size, 0.875rem);");
    expect(css).toContain("--kui-text-leading: var(--kui-typography-body-line-height, 1.5);");
    expect(css).toContain("--kui-text-weight: var(--kui-typography-body-font-weight, 400);");
    expect(css).toContain("--kui-text-tracking: var(--kui-typography-body-letter-spacing, 0em);");
    expect(css).toContain("--kui-text-color: var(--kui-color-fg-default, inherit);");
  });

  it("generates base style declarations using custom properties", () => {
    const css = generateComponentCss({ contract: textStyleContract });
    expect(css).toContain("font-family: var(--kui-text-font);");
    expect(css).toContain("font-size: var(--kui-text-size);");
    expect(css).toContain("line-height: var(--kui-text-leading);");
    expect(css).toContain("font-weight: var(--kui-text-weight);");
    expect(css).toContain("letter-spacing: var(--kui-text-tracking);");
    expect(css).toContain("color: var(--kui-text-color);");
    expect(css).toContain("margin: 0;");
  });

  it("CSS output is deterministic", () => {
    const a = generateComponentCss({ contract: textStyleContract });
    const b = generateComponentCss({ contract: textStyleContract });
    expect(a).toBe(b);
  });

  it("custom properties section comes before base styles", () => {
    const css = generateComponentCss({ contract: textStyleContract });
    const propIdx = css.indexOf("--kui-text-font:");
    const baseIdx = css.indexOf("font-family: var(--kui-text-font)");
    expect(propIdx).toBeLessThan(baseIdx);
  });
});

// ─── Semantic polymorphism + styling ────────────────────────────────

describe("Text: semantic polymorphism with styling", () => {
  it("p element retains base class and typography styling", () => {
    render(<Text as="p" data-testid="text" className="paragraph" />);
    const el = screen.getByTestId("text");
    expect(el.tagName).toBe("P");
    expect(el.className).toContain("kui-text");
    expect(el.className).toContain("paragraph");
  });

  it("strong element retains base class", () => {
    render(<Text as="strong" data-testid="text" />);
    const el = screen.getByTestId("text");
    expect(el.tagName).toBe("STRONG");
    expect(el.className).toContain("kui-text");
  });

  it("em element retains base class", () => {
    render(<Text as="em" data-testid="text" />);
    expect(screen.getByTestId("text").className).toContain("kui-text");
  });

  it("blockquote element retains base class", () => {
    render(<Text as="blockquote" data-testid="text" />);
    expect(screen.getByTestId("text").className).toContain("kui-text");
  });
});
