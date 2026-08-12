import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { Box, boxStyleContract } from "./box";
import { generateComponentCss } from "../composition/generate-css";
import { componentClass } from "../composition/class-generation";

afterEach(cleanup);

// ─── Style contract ─────────────────────────────────────────────────

describe("Box: style contract", () => {
  it("contract name is 'box'", () => {
    expect(boxStyleContract.name).toBe("box");
  });

  it("defines root slot with base styles", () => {
    expect(boxStyleContract.slots["root"].base).toBeDefined();
  });

  it("base styles include box-sizing reset", () => {
    const base = boxStyleContract.slots["root"].base!;
    expect(base["boxSizing"]).toBe("border-box");
  });

  it("base styles include min-width reset", () => {
    const base = boxStyleContract.slots["root"].base!;
    expect(base["minWidth"]).toBe("0");
  });
});

// ─── Base class application ─────────────────────────────────────────

describe("Box: base class", () => {
  it("applies kui-box class to root", () => {
    render(<Box data-testid="box" />);
    expect(screen.getByTestId("box").className).toContain("kui-box");
  });

  it("applies kui-box class with polymorphic rendering", () => {
    render(<Box as="section" data-testid="box" />);
    expect(screen.getByTestId("box").className).toContain("kui-box");
  });

  it("base class is generated from componentClass utility", () => {
    expect(componentClass(boxStyleContract.name)).toBe("kui-box");
  });
});

// ─── Consumer overrides ─────────────────────────────────────────────

describe("Box: consumer className override", () => {
  it("consumer className is merged with base class", () => {
    render(<Box data-testid="box" className="custom-class" />);
    const el = screen.getByTestId("box");
    expect(el.className).toContain("kui-box");
    expect(el.className).toContain("custom-class");
  });

  it("consumer className does not replace base class", () => {
    render(<Box data-testid="box" className="override" />);
    const classes = screen.getByTestId("box").className.split(" ");
    expect(classes).toContain("kui-box");
    expect(classes).toContain("override");
  });

  it("multiple consumer classes are preserved", () => {
    render(<Box data-testid="box" className="a b c" />);
    const cls = screen.getByTestId("box").className;
    expect(cls).toContain("a");
    expect(cls).toContain("b");
    expect(cls).toContain("c");
    expect(cls).toContain("kui-box");
  });
});

describe("Box: consumer style override", () => {
  it("consumer style is applied", () => {
    render(<Box data-testid="box" style={{ color: "red", padding: "8px" }} />);
    const el = screen.getByTestId("box");
    expect(el.style.color).toBe("red");
    expect(el.style.padding).toBe("8px");
  });

  it("consumer style does not remove base class", () => {
    render(<Box data-testid="box" style={{ display: "flex" }} />);
    expect(screen.getByTestId("box").className).toContain("kui-box");
  });
});

// ─── Generated CSS ──────────────────────────────────────────────────

describe("Box: CSS generation", () => {
  it("generates valid CSS from contract", () => {
    const css = generateComponentCss({ contract: boxStyleContract });
    expect(css).toContain(".kui-box");
  });

  it("generates base style declarations", () => {
    const css = generateComponentCss({ contract: boxStyleContract });
    expect(css).toContain("box-sizing: border-box;");
    expect(css).toContain("min-width: 0;");
  });

  it("CSS output is deterministic", () => {
    const a = generateComponentCss({ contract: boxStyleContract });
    const b = generateComponentCss({ contract: boxStyleContract });
    expect(a).toBe(b);
  });
});

// ─── Polymorphic + styling ──────────────────────────────────────────

describe("Box: polymorphic styling", () => {
  it("preserves base class when rendered as section", () => {
    render(<Box as="section" data-testid="box" className="extra" />);
    const el = screen.getByTestId("box");
    expect(el.tagName).toBe("SECTION");
    expect(el.className).toContain("kui-box");
    expect(el.className).toContain("extra");
  });

  it("preserves base class when rendered as button", () => {
    render(<Box as="button" data-testid="box" />);
    expect(screen.getByTestId("box").className).toContain("kui-box");
  });

  it("preserves base class when rendered as anchor", () => {
    render(<Box as="a" href="#" data-testid="box" />);
    expect(screen.getByTestId("box").className).toContain("kui-box");
  });
});
