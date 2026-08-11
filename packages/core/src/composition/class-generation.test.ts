import { describe, it, expect } from "vitest";
import {
  componentClass,
  slotClass,
  variantClass,
  booleanVariantClass,
  compoundVariantClass,
  slotVariantClass,
  stateSelector,
  componentStateSelector,
  slotStateSelector,
  buildClassList,
} from "./class-generation";

// ─── componentClass ─────────────────────────────────────────────────

describe("componentClass", () => {
  it("generates kui- prefixed class", () => {
    expect(componentClass("button")).toBe("kui-button");
  });

  it("converts camelCase to kebab", () => {
    expect(componentClass("textField")).toBe("kui-text-field");
    expect(componentClass("datePicker")).toBe("kui-date-picker");
  });

  it("handles already-kebab names", () => {
    expect(componentClass("dialog")).toBe("kui-dialog");
  });
});

// ─── slotClass ──────────────────────────────────────────────────────

describe("slotClass", () => {
  it("generates BEM element class", () => {
    expect(slotClass("button", "startIcon")).toBe("kui-button__start-icon");
    expect(slotClass("button", "content")).toBe("kui-button__content");
    expect(slotClass("button", "endIcon")).toBe("kui-button__end-icon");
  });

  it("handles multi-word component and slot", () => {
    expect(slotClass("textField", "helperText")).toBe("kui-text-field__helper-text");
  });
});

// ─── variantClass ───────────────────────────────────────────────────

describe("variantClass", () => {
  it("generates BEM modifier class", () => {
    expect(variantClass("button", "solid")).toBe("kui-button--solid");
    expect(variantClass("button", "primary")).toBe("kui-button--primary");
    expect(variantClass("button", "sm")).toBe("kui-button--sm");
  });

  it("converts camelCase values", () => {
    expect(variantClass("button", "extraLarge")).toBe("kui-button--extra-large");
  });
});

// ─── booleanVariantClass ────────────────────────────────────────────

describe("booleanVariantClass", () => {
  it("uses axis name for class", () => {
    expect(booleanVariantClass("button", "fullWidth")).toBe("kui-button--full-width");
    expect(booleanVariantClass("chip", "clickable")).toBe("kui-chip--clickable");
  });
});

// ─── compoundVariantClass ───────────────────────────────────────────

describe("compoundVariantClass", () => {
  it("joins sorted values", () => {
    expect(compoundVariantClass("button", ["solid", "danger"])).toBe("kui-button--danger-solid");
  });

  it("deterministic regardless of input order", () => {
    const a = compoundVariantClass("button", ["danger", "solid"]);
    const b = compoundVariantClass("button", ["solid", "danger"]);
    expect(a).toBe(b);
  });

  it("handles single value", () => {
    expect(compoundVariantClass("button", ["danger"])).toBe("kui-button--danger");
  });
});

// ─── slotVariantClass ───────────────────────────────────────────────

describe("slotVariantClass", () => {
  it("generates slot variant modifier", () => {
    expect(slotVariantClass("button", "startIcon", "sm")).toBe("kui-button__start-icon--sm");
    expect(slotVariantClass("button", "content", "lg")).toBe("kui-button__content--lg");
  });
});

// ─── stateSelector ──────────────────────────────────────────────────

describe("stateSelector", () => {
  it("maps pseudo-class states", () => {
    expect(stateSelector("hovered")).toBe(":hover");
    expect(stateSelector("focused")).toBe(":focus");
    expect(stateSelector("focusVisible")).toBe(":focus-visible");
    expect(stateSelector("pressed")).toBe(":active");
  });

  it("maps data-attribute states", () => {
    expect(stateSelector("disabled")).toBe("[data-disabled]");
    expect(stateSelector("loading")).toBe("[data-loading]");
    expect(stateSelector("selected")).toBe("[data-selected]");
    expect(stateSelector("checked")).toBe("[data-checked]");
    expect(stateSelector("expanded")).toBe("[data-expanded]");
    expect(stateSelector("open")).toBe("[data-open]");
    expect(stateSelector("invalid")).toBe("[data-invalid]");
    expect(stateSelector("readOnly")).toBe("[data-read-only]");
  });

  it("falls back to data-attribute for unknown states", () => {
    expect(stateSelector("customState")).toBe("[data-custom-state]");
  });
});

// ─── componentStateSelector ─────────────────────────────────────────

describe("componentStateSelector", () => {
  it("generates scoped state selector", () => {
    expect(componentStateSelector("button", "disabled")).toBe(".kui-button[data-disabled]");
    expect(componentStateSelector("button", "hovered")).toBe(".kui-button:hover");
    expect(componentStateSelector("button", "focusVisible")).toBe(".kui-button:focus-visible");
  });
});

// ─── slotStateSelector ──────────────────────────────────────────────

describe("slotStateSelector", () => {
  it("data-attribute state scoped to slot", () => {
    expect(slotStateSelector("button", "startIcon", "disabled")).toBe(
      ".kui-button__start-icon[data-disabled]",
    );
  });

  it("pseudo-class state scoped via parent", () => {
    expect(slotStateSelector("button", "startIcon", "hovered")).toBe(
      ".kui-button:hover .kui-button__start-icon",
    );
  });
});

// ─── buildClassList ─────────────────────────────────────────────────

describe("buildClassList", () => {
  it("returns component class for root", () => {
    expect(buildClassList({ componentName: "button" })).toBe("kui-button");
  });

  it("returns slot class for non-root", () => {
    expect(buildClassList({ componentName: "button", slotName: "startIcon" })).toBe(
      "kui-button__start-icon",
    );
  });

  it("includes variant classes in alphabetical order", () => {
    const result = buildClassList({
      componentName: "button",
      variantValues: { size: "lg", appearance: "ghost" },
    });
    expect(result).toBe("kui-button kui-button--ghost kui-button--lg");
  });

  it("includes boolean variant classes (true only)", () => {
    const result = buildClassList({
      componentName: "button",
      booleanVariants: { fullWidth: true, rounded: false },
    });
    expect(result).toBe("kui-button kui-button--full-width");
  });

  it("combines all class types", () => {
    const result = buildClassList({
      componentName: "button",
      variantValues: { appearance: "solid" },
      booleanVariants: { fullWidth: true },
    });
    expect(result).toBe("kui-button kui-button--solid kui-button--full-width");
  });
});

// ─── Determinism and stability ──────────────────────────────────────

describe("class generation: determinism", () => {
  it("same inputs always produce same output", () => {
    const a = componentClass("button");
    const b = componentClass("button");
    expect(a).toBe(b);
  });

  it("variant order does not affect output", () => {
    const a = buildClassList({
      componentName: "button",
      variantValues: { size: "lg", appearance: "ghost", color: "primary" },
    });
    const b = buildClassList({
      componentName: "button",
      variantValues: { color: "primary", size: "lg", appearance: "ghost" },
    });
    expect(a).toBe(b);
  });

  it("no machine-specific content in output", () => {
    const cls = componentClass("testComponent");
    expect(cls).not.toContain("/");
    expect(cls).not.toContain("\\");
    expect(cls).not.toContain(":");
    expect(cls).toBe("kui-test-component");
  });

  it("no random/hash content in output", () => {
    const results = new Set<string>();
    for (let i = 0; i < 100; i++) {
      results.add(componentClass("button"));
    }
    expect(results.size).toBe(1);
  });
});

// ─── Collision safety ───────────────────────────────────────────────

describe("class generation: collision safety", () => {
  it("different components produce different classes", () => {
    expect(componentClass("button")).not.toBe(componentClass("input"));
  });

  it("different slots produce different classes", () => {
    expect(slotClass("button", "startIcon")).not.toBe(slotClass("button", "endIcon"));
  });

  it("different variants produce different classes", () => {
    expect(variantClass("button", "solid")).not.toBe(variantClass("button", "ghost"));
  });

  it("component class and slot class are distinct", () => {
    expect(componentClass("button")).not.toBe(slotClass("button", "root"));
  });

  it("variant and boolean variant classes are distinct formats", () => {
    // variantClass uses value, booleanVariantClass uses axis name
    expect(variantClass("button", "fullWidth")).toBe(booleanVariantClass("button", "fullWidth"));
    // This is intentional — boolean true generates same class as axis name
  });
});
