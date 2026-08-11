import { describe, it, expect } from "vitest";
import { CSS_LAYERS, generateLayerOrder, wrapInLayer } from "./css-layers";
import type { CssLayer } from "./css-layers";
import { generateStylesheet } from "./generate-css";
import type { ComponentStyleContract } from "./style-contract";

// ─── Fixtures ───────────────────────────────────────────────────────

const boxContract: ComponentStyleContract = {
  name: "box",
  slots: { root: { base: { display: "block" } } },
};

const buttonContract: ComponentStyleContract<"root", { size: "sm" | "md" }> = {
  name: "button",
  slots: { root: { base: { display: "inline-flex" } } },
  variants: { size: { sm: { height: "28px" }, md: { height: "36px" } } },
  defaultVariants: { size: "md" },
};

// ─── CSS_LAYERS ─────────────────────────────────────────────────────

describe("CSS_LAYERS", () => {
  it("defines exactly 5 layers", () => {
    expect(CSS_LAYERS).toHaveLength(5);
  });

  it("has correct order", () => {
    expect(CSS_LAYERS).toEqual([
      "kui.reset",
      "kui.base",
      "kui.components",
      "kui.utilities",
      "kui.overrides",
    ]);
  });

  it("all layer names are prefixed with kui.", () => {
    for (const layer of CSS_LAYERS) {
      expect(layer).toMatch(/^kui\./);
    }
  });
});

// ─── generateLayerOrder ─────────────────────────────────────────────

describe("generateLayerOrder", () => {
  it("produces valid @layer declaration", () => {
    const result = generateLayerOrder();
    expect(result).toBe(
      "@layer kui.reset, kui.base, kui.components, kui.utilities, kui.overrides;",
    );
  });

  it("starts with @layer", () => {
    expect(generateLayerOrder()).toMatch(/^@layer /);
  });

  it("ends with semicolon", () => {
    expect(generateLayerOrder()).toMatch(/;$/);
  });
});

// ─── wrapInLayer ────────────────────────────────────────────────────

describe("wrapInLayer", () => {
  it("wraps CSS content in a layer block", () => {
    const css = ".kui-box {\n  display: block;\n}";
    const result = wrapInLayer("kui.components", css);
    expect(result).toBe("@layer kui.components {\n  .kui-box {\n    display: block;\n  }\n}");
  });

  it("returns empty string for empty input", () => {
    expect(wrapInLayer("kui.components", "")).toBe("");
  });

  it("preserves empty lines in multi-rule CSS", () => {
    const css = ".a {\n  color: red;\n}\n\n.b {\n  color: blue;\n}";
    const result = wrapInLayer("kui.base", css);
    expect(result).toContain("@layer kui.base {");
    expect(result).toContain("  .a {");
    expect(result).toContain("  .b {");
  });

  it("works with any valid layer name", () => {
    const layers: CssLayer[] = [
      "kui.reset",
      "kui.base",
      "kui.components",
      "kui.utilities",
      "kui.overrides",
    ];
    for (const layer of layers) {
      const result = wrapInLayer(layer, ".test { color: red; }");
      expect(result).toContain(`@layer ${layer} {`);
    }
  });
});

// ─── Layer ordering (priority) ──────────────────────────────────────

describe("CSS layer ordering", () => {
  it("reset has lowest priority (index 0)", () => {
    expect(CSS_LAYERS.indexOf("kui.reset")).toBe(0);
  });

  it("base comes after reset", () => {
    expect(CSS_LAYERS.indexOf("kui.base")).toBeGreaterThan(CSS_LAYERS.indexOf("kui.reset"));
  });

  it("components comes after base", () => {
    expect(CSS_LAYERS.indexOf("kui.components")).toBeGreaterThan(CSS_LAYERS.indexOf("kui.base"));
  });

  it("utilities comes after components", () => {
    expect(CSS_LAYERS.indexOf("kui.utilities")).toBeGreaterThan(
      CSS_LAYERS.indexOf("kui.components"),
    );
  });

  it("overrides has highest layer priority (last)", () => {
    expect(CSS_LAYERS.indexOf("kui.overrides")).toBe(CSS_LAYERS.length - 1);
  });

  it("consumer unlayered CSS wins over all layers", () => {
    // Unlayered CSS always beats layered CSS in the cascade—this is the spec guarantee.
    // We just verify the layer order declaration doesn't accidentally include unlayered rules.
    const result = generateLayerOrder();
    expect(result).not.toContain("unlayered");
  });
});

// ─── generateStylesheet with layers ─────────────────────────────────

describe("generateStylesheet: layer options", () => {
  it("wraps output in specified layer", () => {
    const css = generateStylesheet([{ contract: boxContract }], { layer: "kui.components" });
    expect(css).toMatch(/^@layer kui\.components \{/);
    expect(css).toContain("  .kui-box {");
    expect(css).toMatch(/\}$/);
  });

  it("prepends layer order declaration", () => {
    const css = generateStylesheet([{ contract: boxContract }], {
      layer: "kui.components",
      includeLayerOrder: true,
    });
    expect(css).toMatch(
      /^@layer kui\.reset, kui\.base, kui\.components, kui\.utilities, kui\.overrides;\n\n@layer kui\.components \{/,
    );
  });

  it("layer order only (no wrapping)", () => {
    const css = generateStylesheet([{ contract: boxContract }], { includeLayerOrder: true });
    expect(css).toMatch(/^@layer kui\.reset/);
    expect(css).toContain(".kui-box {");
    expect(css).not.toMatch(/@layer kui\.components/);
  });

  it("no options produces same output as before", () => {
    const css = generateStylesheet([{ contract: boxContract }]);
    expect(css).toBe(".kui-box {\n  display: block;\n}");
  });

  it("empty contracts with includeLayerOrder returns only declaration", () => {
    const css = generateStylesheet([], { includeLayerOrder: true });
    expect(css).toBe("@layer kui.reset, kui.base, kui.components, kui.utilities, kui.overrides;");
  });

  it("empty contracts with layer returns empty string", () => {
    const css = generateStylesheet([], { layer: "kui.components" });
    expect(css).toBe("");
  });

  it("multiple components wrapped in single layer", () => {
    const css = generateStylesheet([{ contract: boxContract }, { contract: buttonContract }], {
      layer: "kui.components",
    });
    const layerCount = (css.match(/@layer/g) ?? []).length;
    expect(layerCount).toBe(1);
    expect(css).toContain(".kui-box");
    expect(css).toContain(".kui-button");
  });

  it("layer wrapping preserves component sort order", () => {
    const css = generateStylesheet([{ contract: buttonContract }, { contract: boxContract }], {
      layer: "kui.components",
    });
    const boxIdx = css.indexOf(".kui-box");
    const btnIdx = css.indexOf(".kui-button");
    expect(boxIdx).toBeLessThan(btnIdx);
  });
});
