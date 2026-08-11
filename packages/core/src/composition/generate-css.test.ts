import { describe, it, expect } from "vitest";
import { generateComponentCss, generateStylesheet } from "./generate-css";
import type { ComponentStyleContract } from "./style-contract";

// ─── Fixtures ───────────────────────────────────────────────────────

const boxContract: ComponentStyleContract = {
  name: "box",
  slots: {
    root: { base: { display: "block" } },
  },
};

const buttonContract: ComponentStyleContract<
  "root" | "startIcon" | "content",
  { appearance: "solid" | "outlined"; size: "sm" | "md" }
> = {
  name: "button",
  customProperties: {
    "--kui-button-bg": { token: "color.interactive.default" },
    "--kui-button-fg": "white",
  },
  slots: {
    root: {
      base: {
        display: "inline-flex",
        alignItems: "center",
        height: "var(--kui-button-height)",
      },
      states: {
        disabled: { opacity: "0.5", cursor: "not-allowed" },
        hovered: { background: "var(--kui-color-hover)" },
      },
    },
    startIcon: {
      base: { display: "flex", width: "1em" },
    },
    content: {
      base: { display: "inline-flex" },
    },
  },
  variants: {
    appearance: {
      solid: { background: "var(--kui-button-bg)" },
      outlined: { background: "transparent", border: "1px solid currentColor" },
    },
    size: {
      sm: { height: "28px", fontSize: "12px" },
      md: { height: "36px", fontSize: "14px" },
    },
  },
  compoundVariants: [
    {
      condition: { appearance: "solid", size: "sm" },
      styles: { padding: "0 8px" },
    },
  ],
  defaultVariants: { appearance: "solid", size: "md" },
};

// ─── generateComponentCss ───────────────────────────────────────────

describe("generateComponentCss", () => {
  it("generates base styles", () => {
    const css = generateComponentCss({ contract: boxContract });
    expect(css).toContain(".kui-box");
    expect(css).toContain("display: block;");
  });

  it("generates custom properties", () => {
    const css = generateComponentCss({ contract: buttonContract });
    expect(css).toContain("--kui-button-bg: var(--kui-color-interactive-default);");
    expect(css).toContain("--kui-button-fg: white;");
  });

  it("generates slot base styles", () => {
    const css = generateComponentCss({ contract: buttonContract });
    expect(css).toContain(".kui-button__start-icon");
    expect(css).toContain("width: 1em;");
    expect(css).toContain(".kui-button__content");
  });

  it("generates variant modifier rules", () => {
    const css = generateComponentCss({ contract: buttonContract });
    expect(css).toContain(".kui-button--solid");
    expect(css).toContain(".kui-button--outlined");
    expect(css).toContain(".kui-button--sm");
    expect(css).toContain(".kui-button--md");
  });

  it("generates compound variant rules", () => {
    const css = generateComponentCss({ contract: buttonContract });
    expect(css).toContain("padding: 0 8px;");
  });

  it("generates state selector rules", () => {
    const css = generateComponentCss({ contract: buttonContract });
    expect(css).toContain("[data-disabled]");
    expect(css).toContain("opacity: 0.5;");
    expect(css).toContain(":hover");
    expect(css).toContain("var(--kui-color-hover)");
  });

  it("converts camelCase properties to kebab-case", () => {
    const css = generateComponentCss({ contract: buttonContract });
    expect(css).toContain("align-items: center;");
    expect(css).toContain("font-size:");
  });

  it("resolves TokenReference to var()", () => {
    const css = generateComponentCss({ contract: buttonContract });
    expect(css).toContain("var(--kui-color-interactive-default)");
  });

  it("does not generate empty rules", () => {
    const contract: ComponentStyleContract = {
      name: "empty",
      slots: { root: { base: {} } },
    };
    const css = generateComponentCss({ contract });
    expect(css).toBe("");
  });

  it("supports component name override", () => {
    const css = generateComponentCss({ contract: boxContract, componentName: "card" });
    expect(css).toContain(".kui-card");
    expect(css).not.toContain(".kui-box");
  });
});

// ─── CSS ordering ───────────────────────────────────────────────────

describe("generateComponentCss: ordering", () => {
  it("custom properties come before base styles", () => {
    const css = generateComponentCss({ contract: buttonContract });
    const propIdx = css.indexOf("--kui-button-bg");
    const baseIdx = css.indexOf("display: inline-flex");
    expect(propIdx).toBeLessThan(baseIdx);
  });

  it("base styles come before variant styles", () => {
    const css = generateComponentCss({ contract: buttonContract });
    const baseIdx = css.indexOf("display: inline-flex");
    const variantIdx = css.indexOf(".kui-button--solid");
    expect(baseIdx).toBeLessThan(variantIdx);
  });

  it("variant styles come before state styles", () => {
    const css = generateComponentCss({ contract: buttonContract });
    const variantIdx = css.indexOf(".kui-button--solid");
    const stateIdx = css.indexOf("[data-disabled]");
    expect(variantIdx).toBeLessThan(stateIdx);
  });

  it("variants are sorted alphabetically by axis", () => {
    const css = generateComponentCss({ contract: buttonContract });
    const solidIdx = css.indexOf(".kui-button--solid"); // appearance
    const smIdx = css.indexOf(".kui-button--sm"); // size
    expect(solidIdx).toBeLessThan(smIdx);
  });
});

// ─── generateStylesheet ─────────────────────────────────────────────

describe("generateStylesheet", () => {
  it("combines multiple component CSS", () => {
    const css = generateStylesheet([{ contract: boxContract }, { contract: buttonContract }]);
    expect(css).toContain(".kui-box");
    expect(css).toContain(".kui-button");
  });

  it("sorts components alphabetically", () => {
    const css = generateStylesheet([{ contract: buttonContract }, { contract: boxContract }]);
    const boxIdx = css.indexOf(".kui-box");
    const btnIdx = css.indexOf(".kui-button");
    expect(boxIdx).toBeLessThan(btnIdx);
  });

  it("returns empty string for no contracts", () => {
    expect(generateStylesheet([])).toBe("");
  });
});

// ─── Determinism ────────────────────────────────────────────────────

describe("CSS generation: determinism", () => {
  it("same contract produces identical output", () => {
    const a = generateComponentCss({ contract: buttonContract });
    const b = generateComponentCss({ contract: buttonContract });
    expect(a).toBe(b);
  });

  it("stylesheet order is consistent", () => {
    const a = generateStylesheet([{ contract: buttonContract }, { contract: boxContract }]);
    const b = generateStylesheet([{ contract: boxContract }, { contract: buttonContract }]);
    expect(a).toBe(b);
  });
});

// ─── Boolean variants ───────────────────────────────────────────────

describe("CSS generation: boolean variants", () => {
  it("generates class for true value only", () => {
    const contract: ComponentStyleContract<"root", { fullWidth: "true" | "false" }> = {
      name: "button",
      slots: { root: {} },
      variants: {
        fullWidth: {
          true: { width: "100%" },
          false: { width: "auto" },
        },
      },
      defaultVariants: { fullWidth: "false" },
    };
    const css = generateComponentCss({ contract });
    expect(css).toContain(".kui-button--full-width");
    expect(css).toContain("width: 100%;");
    expect(css).not.toContain("width: auto;"); // false value skipped
  });
});
