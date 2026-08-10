import { describe, it, expect } from "vitest";
import {
  DENSITY_MODES,
  resolveDensityStyles,
  getDimensionTokens,
  isDensityResponsiveToken,
  controlHeight,
  inlineSpacing,
  formSpacing,
  contentPadding,
} from "./density-styles";
import type { DensityMode, DensityDimension } from "./density-styles";

// ─── DENSITY_MODES ──────────────────────────────────────────────────

describe("DENSITY_MODES", () => {
  it("contains three modes in order", () => {
    expect(DENSITY_MODES).toEqual(["comfortable", "standard", "compact"]);
  });
});

// ─── resolveDensityStyles ───────────────────────────────────────────

describe("resolveDensityStyles", () => {
  it("resolves density-responsive token to var()", () => {
    const result = resolveDensityStyles([{ property: "height", token: "control.height.md" }]);
    expect(result["height"]).toBe("var(--kui-control-height-md)");
  });

  it("resolves multiple properties", () => {
    const result = resolveDensityStyles([
      { property: "height", token: "control.height.md" },
      { property: "padding", token: "spacing.inline.md" },
      { property: "gap", token: "spacing.inline.sm" },
    ]);
    expect(result["height"]).toBe("var(--kui-control-height-md)");
    expect(result["padding"]).toBe("var(--kui-space-inline-md)");
    expect(result["gap"]).toBe("var(--kui-space-inline-sm)");
  });

  it("includes fallback when provided", () => {
    const result = resolveDensityStyles([
      { property: "height", token: "control.height.md", fallback: "36px" },
    ]);
    expect(result["height"]).toBe("var(--kui-control-height-md, 36px)");
  });

  it("returns empty for empty input", () => {
    expect(resolveDensityStyles([])).toEqual({});
  });
});

// ─── getDimensionTokens ─────────────────────────────────────────────

describe("getDimensionTokens", () => {
  it("returns control height tokens", () => {
    const tokens = getDimensionTokens("controlHeight");
    expect(tokens).toContain("control.height.md");
    expect(tokens).toContain("control.height.sm");
    expect(tokens).toContain("control.height.lg");
  });

  it("returns inline spacing tokens", () => {
    const tokens = getDimensionTokens("inlineSpacing");
    expect(tokens).toContain("spacing.inline.xs");
    expect(tokens).toContain("spacing.inline.sm");
    expect(tokens).toContain("spacing.inline.md");
  });

  it("returns form spacing tokens", () => {
    const tokens = getDimensionTokens("formSpacing");
    expect(tokens).toContain("spacing.form.fieldGap");
    expect(tokens).toContain("spacing.form.labelGap");
  });

  it("returns content padding tokens", () => {
    const tokens = getDimensionTokens("contentPadding");
    expect(tokens).toContain("spacing.content.cardPadding");
    expect(tokens).toContain("spacing.content.tableCell");
  });
});

// ─── isDensityResponsiveToken ───────────────────────────────────────

describe("isDensityResponsiveToken", () => {
  it("returns true for control height tokens", () => {
    expect(isDensityResponsiveToken("control.height.md")).toBe(true);
    expect(isDensityResponsiveToken("control.height.xs")).toBe(true);
  });

  it("returns true for spacing tokens", () => {
    expect(isDensityResponsiveToken("spacing.inline.sm")).toBe(true);
    expect(isDensityResponsiveToken("spacing.form.fieldGap")).toBe(true);
  });

  it("returns false for non-density tokens", () => {
    expect(isDensityResponsiveToken("color.primary")).toBe(false);
    expect(isDensityResponsiveToken("border.radius.sm")).toBe(false);
    expect(isDensityResponsiveToken("shadow.md")).toBe(false);
    expect(isDensityResponsiveToken("typography.body.fontSize")).toBe(false);
  });
});

// ─── Density shorthand helpers ──────────────────────────────────────

describe("controlHeight", () => {
  it("returns var() for each size", () => {
    expect(controlHeight("xs")).toBe("var(--kui-control-height-xs)");
    expect(controlHeight("sm")).toBe("var(--kui-control-height-sm)");
    expect(controlHeight("md")).toBe("var(--kui-control-height-md)");
    expect(controlHeight("lg")).toBe("var(--kui-control-height-lg)");
    expect(controlHeight("xl")).toBe("var(--kui-control-height-xl)");
  });
});

describe("inlineSpacing", () => {
  it("returns var() for each size", () => {
    expect(inlineSpacing("xs")).toBe("var(--kui-space-inline-xs)");
    expect(inlineSpacing("sm")).toBe("var(--kui-space-inline-sm)");
    expect(inlineSpacing("md")).toBe("var(--kui-space-inline-md)");
  });
});

describe("formSpacing", () => {
  it("returns var() for form dimensions", () => {
    expect(formSpacing("fieldGap")).toBe("var(--kui-space-form-field-gap)");
    expect(formSpacing("sectionGap")).toBe("var(--kui-space-form-section-gap)");
    expect(formSpacing("labelGap")).toBe("var(--kui-space-form-label-gap)");
  });
});

describe("contentPadding", () => {
  it("returns var() for content dimensions", () => {
    expect(contentPadding("cardPadding")).toBe("var(--kui-space-content-card-padding)");
    expect(contentPadding("dialogPadding")).toBe("var(--kui-space-content-dialog-padding)");
    expect(contentPadding("toolbarGap")).toBe("var(--kui-space-content-toolbar-gap)");
    expect(contentPadding("tableCell")).toBe("var(--kui-space-content-table-cell)");
  });
});

// ─── Type tests ─────────────────────────────────────────────────────

describe("density types", () => {
  it("DensityMode is a string union", () => {
    const mode: DensityMode = "compact";
    expect(mode).toBe("compact");
  });

  it("DensityDimension is a string union", () => {
    const dim: DensityDimension = "controlHeight";
    expect(dim).toBe("controlHeight");
  });
});
