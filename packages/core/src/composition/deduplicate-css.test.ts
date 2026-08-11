import { describe, it, expect } from "vitest";
import { deduplicateRules, deduplicateContracts, measureCssSize } from "./deduplicate-css";
import { generateComponentCss, generateStylesheet } from "./generate-css";
import type { ComponentStyleContract } from "./style-contract";

// ─── Fixtures ───────────────────────────────────────────────────────

const buttonContract: ComponentStyleContract<
  "root" | "icon",
  { appearance: "solid" | "outlined"; size: "sm" | "md" }
> = {
  name: "button",
  customProperties: {
    "--kui-button-bg": { token: "color.interactive.default" },
  },
  slots: {
    root: {
      base: { display: "inline-flex", alignItems: "center" },
      states: { disabled: { opacity: "0.5" } },
    },
    icon: { base: { display: "flex", width: "1em" } },
  },
  variants: {
    appearance: {
      solid: { background: "var(--kui-button-bg)" },
      outlined: { background: "transparent" },
    },
    size: {
      sm: { height: "28px" },
      md: { height: "36px" },
    },
  },
  compoundVariants: [
    { condition: { appearance: "solid", size: "sm" }, styles: { padding: "0 8px" } },
  ],
  defaultVariants: { appearance: "solid", size: "md" },
};

const boxContract: ComponentStyleContract = {
  name: "box",
  slots: { root: { base: { display: "block" } } },
};

// ─── deduplicateRules ───────────────────────────────────────────────

describe("deduplicateRules", () => {
  it("returns empty string for empty input", () => {
    expect(deduplicateRules("")).toBe("");
  });

  it("preserves non-duplicate rules", () => {
    const css = ".a {\n  color: red;\n}\n\n.b {\n  color: blue;\n}";
    expect(deduplicateRules(css)).toBe(css);
  });

  it("removes identical duplicate rules", () => {
    const css = ".a {\n  color: red;\n}\n\n.a {\n  color: red;\n}";
    expect(deduplicateRules(css)).toBe(".a {\n  color: red;\n}");
  });

  it("keeps last occurrence of duplicate rules", () => {
    const css = ".a {\n  color: red;\n}\n\n.b {\n  color: blue;\n}\n\n.a {\n  color: red;\n}";
    const result = deduplicateRules(css);
    expect(result).toBe(".b {\n  color: blue;\n}\n\n.a {\n  color: red;\n}");
  });

  it("does NOT merge rules with same selector but different body", () => {
    const css = ".a {\n  color: red;\n}\n\n.a {\n  background: blue;\n}";
    const result = deduplicateRules(css);
    expect(result).toBe(css);
  });

  it("does NOT merge rules with different selectors even if body matches", () => {
    const css = ".a {\n  color: red;\n}\n\n.b {\n  color: red;\n}";
    const result = deduplicateRules(css);
    expect(result).toBe(css);
  });
});

// ─── deduplicateContracts ───────────────────────────────────────────

describe("deduplicateContracts", () => {
  it("returns empty array for empty input", () => {
    expect(deduplicateContracts([])).toEqual([]);
  });

  it("preserves unique contracts", () => {
    const result = deduplicateContracts([{ contract: boxContract }, { contract: buttonContract }]);
    expect(result).toHaveLength(2);
  });

  it("removes duplicate contracts with same name, keeps last", () => {
    const box2: ComponentStyleContract = {
      name: "box",
      slots: { root: { base: { display: "flex" } } },
    };
    const result = deduplicateContracts([{ contract: boxContract }, { contract: box2 }]);
    expect(result).toHaveLength(1);
    expect(result[0]!.contract.slots["root"]!.base).toEqual({ display: "flex" });
  });

  it("uses componentName override for deduplication key", () => {
    const result = deduplicateContracts([
      { contract: boxContract, componentName: "card" },
      { contract: boxContract },
    ]);
    expect(result).toHaveLength(2);
  });

  it("deduplicates by componentName over contract.name", () => {
    const result = deduplicateContracts([
      { contract: boxContract, componentName: "card" },
      { contract: buttonContract, componentName: "card" },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0]!.contract.name).toBe("button");
  });
});

// ─── measureCssSize ─────────────────────────────────────────────────

describe("measureCssSize", () => {
  it("returns zeros for empty input", () => {
    const metrics = measureCssSize("");
    expect(metrics.bytes).toBe(0);
    expect(metrics.ruleCount).toBe(0);
    expect(metrics.uniqueSelectors).toBe(0);
    expect(metrics.declarationCount).toBe(0);
  });

  it("counts rules correctly", () => {
    const css = generateComponentCss({ contract: buttonContract });
    const metrics = measureCssSize(css);
    expect(metrics.ruleCount).toBeGreaterThan(0);
  });

  it("counts unique selectors", () => {
    const css = generateComponentCss({ contract: buttonContract });
    const metrics = measureCssSize(css);
    expect(metrics.uniqueSelectors).toBeGreaterThan(0);
    expect(metrics.uniqueSelectors).toBeLessThanOrEqual(metrics.ruleCount);
  });

  it("counts declarations", () => {
    const css = ".a {\n  color: red;\n  font-size: 14px;\n}\n\n.b {\n  display: flex;\n}";
    const metrics = measureCssSize(css);
    expect(metrics.declarationCount).toBe(3);
  });

  it("reports byte size", () => {
    const css = generateComponentCss({ contract: buttonContract });
    const metrics = measureCssSize(css);
    expect(metrics.bytes).toBe(new TextEncoder().encode(css).length);
  });
});

// ─── Reproducibility ────────────────────────────────────────────────

describe("CSS generation: reproducibility", () => {
  it("repeated single-component generation produces identical output", () => {
    const results = Array.from({ length: 10 }, () =>
      generateComponentCss({ contract: buttonContract }),
    );
    const first = results[0];
    for (const r of results) {
      expect(r).toBe(first);
    }
  });

  it("repeated stylesheet generation produces identical output", () => {
    const contracts = [{ contract: boxContract }, { contract: buttonContract }];
    const results = Array.from({ length: 10 }, () => generateStylesheet(contracts));
    const first = results[0];
    for (const r of results) {
      expect(r).toBe(first);
    }
  });

  it("input order does not affect stylesheet output", () => {
    const a = generateStylesheet([{ contract: buttonContract }, { contract: boxContract }]);
    const b = generateStylesheet([{ contract: boxContract }, { contract: buttonContract }]);
    expect(a).toBe(b);
  });

  it("stylesheet with layers is reproducible", () => {
    const contracts = [{ contract: boxContract }, { contract: buttonContract }];
    const opts = { layer: "kui.components" as const, includeLayerOrder: true };
    const a = generateStylesheet(contracts, opts);
    const b = generateStylesheet(contracts, opts);
    expect(a).toBe(b);
  });

  it("duplicate contracts produce same output as single contract", () => {
    const single = generateStylesheet([{ contract: boxContract }]);
    const duped = generateStylesheet([{ contract: boxContract }, { contract: boxContract }]);
    expect(duped).toBe(single);
  });
});

// ─── Deduplication in generateStylesheet ────────────────────────────

describe("generateStylesheet: deduplication", () => {
  it("deduplicates identical contracts", () => {
    const css = generateStylesheet([{ contract: boxContract }, { contract: boxContract }]);
    const occurrences = css.split(".kui-box").length - 1;
    // Only one root rule for box
    expect(occurrences).toBe(1);
  });

  it("later contract wins when names collide", () => {
    const box2: ComponentStyleContract = {
      name: "box",
      slots: { root: { base: { display: "flex" } } },
    };
    const css = generateStylesheet([{ contract: boxContract }, { contract: box2 }]);
    expect(css).toContain("display: flex;");
    expect(css).not.toContain("display: block;");
  });

  it("componentName override respected for deduplication", () => {
    const css = generateStylesheet([
      { contract: boxContract, componentName: "card" },
      { contract: boxContract },
    ]);
    expect(css).toContain(".kui-card");
    expect(css).toContain(".kui-box");
  });
});

// ─── Semantic ordering preservation ─────────────────────────────────

describe("CSS generation: semantic ordering", () => {
  it("custom properties → base → variants → compounds → states", () => {
    const css = generateComponentCss({ contract: buttonContract });
    const customPropIdx = css.indexOf("--kui-button-bg");
    const baseIdx = css.indexOf("display: inline-flex");
    const variantIdx = css.indexOf(".kui-button--solid");
    const compoundIdx = css.indexOf("padding: 0 8px");
    const stateIdx = css.indexOf("[data-disabled]");

    expect(customPropIdx).toBeLessThan(baseIdx);
    expect(baseIdx).toBeLessThan(variantIdx);
    expect(variantIdx).toBeLessThan(compoundIdx);
    expect(compoundIdx).toBeLessThan(stateIdx);
  });

  it("slots maintain declaration order within base section", () => {
    const css = generateComponentCss({ contract: buttonContract });
    const rootIdx = css.indexOf(".kui-button {", css.indexOf("display: inline-flex") - 20);
    const iconIdx = css.indexOf(".kui-button__icon");
    expect(rootIdx).toBeLessThan(iconIdx);
  });

  it("variant axes sorted alphabetically", () => {
    const css = generateComponentCss({ contract: buttonContract });
    const appearanceIdx = css.indexOf(".kui-button--solid");
    const sizeIdx = css.indexOf(".kui-button--sm");
    expect(appearanceIdx).toBeLessThan(sizeIdx);
  });

  it("state selectors sorted alphabetically", () => {
    const contract: ComponentStyleContract = {
      name: "input",
      slots: {
        root: {
          base: { display: "block" },
          states: {
            invalid: { borderColor: "red" },
            disabled: { opacity: "0.5" },
            focused: { outline: "2px solid blue" },
          },
        },
      },
    };
    const css = generateComponentCss({ contract });
    const disabledIdx = css.indexOf("[data-disabled]");
    const focusedIdx = css.indexOf(":focus");
    const invalidIdx = css.indexOf("[data-invalid]");
    expect(disabledIdx).toBeLessThan(focusedIdx);
    expect(focusedIdx).toBeLessThan(invalidIdx);
  });
});

// ─── Size measurement integration ──────────────────────────────────

describe("CSS size measurement", () => {
  it("deduplicated output is not larger than raw output", () => {
    const raw = generateComponentCss({ contract: buttonContract });
    const deduped = deduplicateRules(raw);
    const rawMetrics = measureCssSize(raw);
    const dedupedMetrics = measureCssSize(deduped);
    expect(dedupedMetrics.bytes).toBeLessThanOrEqual(rawMetrics.bytes);
  });

  it("stylesheet metrics are consistent across runs", () => {
    const contracts = [{ contract: boxContract }, { contract: buttonContract }];
    const css = generateStylesheet(contracts);
    const m1 = measureCssSize(css);
    const m2 = measureCssSize(css);
    expect(m1).toEqual(m2);
  });

  it("measures multi-component stylesheet", () => {
    const css = generateStylesheet([{ contract: boxContract }, { contract: buttonContract }]);
    const metrics = measureCssSize(css);
    expect(metrics.ruleCount).toBeGreaterThan(1);
    expect(metrics.bytes).toBeGreaterThan(0);
    expect(metrics.declarationCount).toBeGreaterThan(0);
  });
});
