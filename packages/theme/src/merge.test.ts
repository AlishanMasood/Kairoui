import { describe, it, expect } from "vitest";
import {
  mergeThemeOverrides,
  mergeColorOverrides,
  mergeTypographyOverrides,
  mergeSpacingOverrides,
  mergeElevationOverrides,
  mergeMetadata,
  applyPartialOverride,
} from "./merge";

describe("mergeThemeOverrides", () => {
  it("merges color overrides from two layers", () => {
    const { merged, errors } = mergeThemeOverrides(
      { color: { interactive: { default: "#0066cc" } } },
      { color: { interactive: { hover: "#0052a3" } } },
    );
    expect(errors).toEqual([]);
    expect(merged.color?.interactive?.["default"]).toBe("#0066cc");
    expect(merged.color?.interactive?.["hover"]).toBe("#0052a3");
  });

  it("later layer overrides earlier values", () => {
    const { merged } = mergeThemeOverrides(
      { color: { text: { primary: "#111" } } },
      { color: { text: { primary: "#000" } } },
    );
    expect(merged.color?.text?.["primary"]).toBe("#000");
  });

  it("preserves non-conflicting groups", () => {
    const { merged } = mergeThemeOverrides(
      { color: { text: { primary: "#111" } } },
      { elevation: { raised: "none" } },
    );
    expect(merged.color?.text?.["primary"]).toBe("#111");
    expect(merged.elevation?.["raised"]).toBe("none");
  });

  it("rejects unknown top-level group keys", () => {
    const { errors } = mergeThemeOverrides({}, { animation: { duration: "200ms" } } as never);
    expect(errors.length).toBe(1);
    expect(errors[0]?.type).toBe("unknown_key");
    expect(errors[0]?.path).toBe("animation");
  });

  it("rejects null group values", () => {
    const { errors } = mergeThemeOverrides({ color: { text: { primary: "#111" } } }, {
      color: null,
    } as never);
    expect(errors.length).toBe(1);
    expect(errors[0]?.type).toBe("null_value");
  });

  it("rejects non-object group values", () => {
    const { errors } = mergeThemeOverrides({}, { color: "red" } as never);
    expect(errors.length).toBe(1);
    expect(errors[0]?.type).toBe("invalid_type");
  });

  it("does not mutate base", () => {
    const base = { color: { interactive: { default: "#0066cc" } } };
    const baseCopy = JSON.stringify(base);
    mergeThemeOverrides(base, { color: { interactive: { default: "#ff0000" } } });
    expect(JSON.stringify(base)).toBe(baseCopy);
  });

  it("does not mutate layer", () => {
    const layer = { color: { interactive: { default: "#ff0000" } } };
    const layerCopy = JSON.stringify(layer);
    mergeThemeOverrides({}, layer);
    expect(JSON.stringify(layer)).toBe(layerCopy);
  });

  it("produces deterministic output", () => {
    const base = { color: { text: { primary: "#111" } } };
    const layer = { color: { text: { secondary: "#222" } }, elevation: { raised: "none" } };
    const a = mergeThemeOverrides(base, layer);
    const b = mergeThemeOverrides(base, layer);
    expect(JSON.stringify(a.merged)).toBe(JSON.stringify(b.merged));
  });
});

describe("mergeColorOverrides", () => {
  it("merges known color subcategories", () => {
    const { merged, errors } = mergeColorOverrides(
      { text: { primary: "#111" } },
      { border: { default: "#ccc" } },
    );
    expect(errors).toEqual([]);
    expect(merged.text?.["primary"]).toBe("#111");
    expect(merged.border?.["default"]).toBe("#ccc");
  });

  it("rejects unknown color subcategory", () => {
    const { errors } = mergeColorOverrides({}, { accent: { primary: "#ff0000" } } as never);
    expect(errors.length).toBe(1);
    expect(errors[0]?.type).toBe("unknown_key");
    expect(errors[0]?.path).toBe("color.accent");
  });

  it("preserves existing values not in layer", () => {
    const { merged } = mergeColorOverrides(
      { text: { primary: "#111", secondary: "#222" } },
      { text: { primary: "#000" } },
    );
    expect(merged.text?.["primary"]).toBe("#000");
    expect(merged.text?.["secondary"]).toBe("#222");
  });
});

describe("mergeTypographyOverrides", () => {
  it("merges typography roles", () => {
    const { merged, errors } = mergeTypographyOverrides(
      { body: { fontFamily: "Inter" } },
      { body: { fontSize: "14px" } },
    );
    expect(errors).toEqual([]);
    expect(merged["body"]?.["fontFamily"]).toBe("Inter");
    expect(merged["body"]?.["fontSize"]).toBe("14px");
  });
});

describe("mergeSpacingOverrides", () => {
  it("merges spacing values", () => {
    const { merged, errors } = mergeSpacingOverrides(
      { inline: { sm: "0.5rem" } },
      { inline: { md: "0.75rem" } },
    );
    expect(errors).toEqual([]);
    expect(merged["inline"]?.["sm"]).toBe("0.5rem");
    expect(merged["inline"]?.["md"]).toBe("0.75rem");
  });
});

describe("mergeElevationOverrides", () => {
  it("merges elevation values", () => {
    const { merged, errors } = mergeElevationOverrides(
      { raised: "0 1px 3px rgba(0,0,0,0.1)" },
      { overlay: "0 4px 6px rgba(0,0,0,0.1)" },
    );
    expect(errors).toEqual([]);
    expect(merged["raised"]).toBe("0 1px 3px rgba(0,0,0,0.1)");
    expect(merged["overlay"]).toBe("0 4px 6px rgba(0,0,0,0.1)");
  });

  it("later value overrides earlier", () => {
    const { merged } = mergeElevationOverrides({ raised: "old" }, { raised: "new" });
    expect(merged["raised"]).toBe("new");
  });
});

describe("mergeMetadata", () => {
  it("merges metadata records", () => {
    const { merged, errors } = mergeMetadata(
      { author: "A", version: "1" },
      { version: "2", team: "B" },
    );
    expect(errors).toEqual([]);
    expect(merged).toEqual({ author: "A", version: "2", team: "B" });
  });

  it("rejects non-string values", () => {
    const { errors } = mergeMetadata({}, { count: 42 as unknown as string });
    expect(errors.length).toBe(1);
    expect(errors[0]?.type).toBe("invalid_type");
  });

  it("does not mutate base", () => {
    const base = { author: "A" };
    const copy = JSON.stringify(base);
    mergeMetadata(base, { author: "B" });
    expect(JSON.stringify(base)).toBe(copy);
  });
});

describe("applyPartialOverride", () => {
  it("applies partial override to a target", () => {
    const { merged, errors } = applyPartialOverride(
      { color: "#111", size: "large" },
      { color: "#000" },
    );
    expect(errors).toEqual([]);
    expect(merged.color).toBe("#000");
    expect(merged.size).toBe("large");
  });

  it("rejects unknown keys", () => {
    const { errors } = applyPartialOverride({ name: "test" }, { bogus: "value" });
    expect(errors.length).toBe(1);
    expect(errors[0]?.type).toBe("unknown_key");
  });

  it("recursively merges nested objects", () => {
    const { merged } = applyPartialOverride({ nested: { a: "1", b: "2" } }, { nested: { a: "X" } });
    expect(merged.nested).toEqual({ a: "X", b: "2" });
  });

  it("does not mutate target", () => {
    const target = { name: "original", nested: { key: "val" } };
    const copy = JSON.stringify(target);
    applyPartialOverride(target, { name: "changed" });
    expect(JSON.stringify(target)).toBe(copy);
  });
});

describe("edge cases", () => {
  describe("undefined values", () => {
    it("skips undefined values in source", () => {
      const { merged, errors } = mergeThemeOverrides(
        { color: { text: { primary: "#111" } } },
        { color: { text: { primary: undefined } } },
      );
      expect(errors).toEqual([]);
      expect(merged.color?.text?.["primary"]).toBe("#111");
    });
  });

  describe("null values", () => {
    it("rejects null at leaf level", () => {
      const { errors } = applyPartialOverride({ name: "test" }, { name: null });
      expect(errors.length).toBe(1);
      expect(errors[0]?.type).toBe("null_value");
    });
  });

  describe("empty objects", () => {
    it("empty layer produces no changes", () => {
      const base = { color: { text: { primary: "#111" } } };
      const { merged } = mergeThemeOverrides(base, {});
      expect(JSON.stringify(merged)).toBe(JSON.stringify(base));
    });

    it("empty base with content layer produces layer values", () => {
      const { merged } = mergeThemeOverrides({}, { elevation: { raised: "none" } });
      expect(merged.elevation?.["raised"]).toBe("none");
    });
  });

  describe("prototype pollution", () => {
    it("rejects __proto__ key", () => {
      const malicious = Object.create(null) as Record<string, unknown>;
      malicious["__proto__"] = { admin: true };
      const { errors } = applyPartialOverride({ name: "safe" }, malicious);
      expect(errors.some((e) => e.path.includes("__proto__"))).toBe(true);
    });

    it("rejects constructor key", () => {
      const { errors } = mergeMetadata({}, { constructor: "evil" });
      expect(errors.some((e) => e.path.includes("constructor"))).toBe(true);
    });

    it("rejects prototype key", () => {
      const { errors } = mergeThemeOverrides({}, { prototype: {} } as never);
      expect(errors.some((e) => e.path.includes("prototype"))).toBe(true);
    });
  });

  describe("arrays", () => {
    it("replaces arrays entirely, no partial merge", () => {
      const { merged } = applyPartialOverride(
        { items: ["a", "b", "c"] as unknown },
        { items: ["x"] as unknown },
      );
      expect(merged.items).toEqual(["x"]);
    });
  });

  describe("invalid value types", () => {
    it("rejects function values", () => {
      const { errors } = applyPartialOverride({ name: "test" }, { name: () => "fn" });
      expect(errors.length).toBe(1);
      expect(errors[0]?.type).toBe("invalid_type");
    });

    it("rejects boolean values", () => {
      const { errors } = applyPartialOverride({ name: "test" }, { name: true });
      expect(errors.length).toBe(1);
      expect(errors[0]?.type).toBe("invalid_type");
    });
  });
});
