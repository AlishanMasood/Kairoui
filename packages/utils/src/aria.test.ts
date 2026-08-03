import { describe, it, expect } from "vitest";
import {
  mergeAriaTokenList,
  mergeAriaLabelledBy,
  mergeAriaDescribedBy,
  mergeAriaControls,
  mergeAriaOwns,
  resolveBooleanAria,
} from "./aria";

describe("mergeAriaTokenList", () => {
  it("merges multiple token strings", () => {
    expect(mergeAriaTokenList("id-1", "id-2")).toBe("id-1 id-2");
  });

  it("deduplicates tokens", () => {
    expect(mergeAriaTokenList("id-1 id-2", "id-2 id-3")).toBe("id-1 id-2 id-3");
  });

  it("preserves insertion order (consumer first)", () => {
    expect(mergeAriaTokenList("consumer-id", "internal-id")).toBe("consumer-id internal-id");
  });

  it("skips null and undefined sources", () => {
    expect(mergeAriaTokenList(null, "id-1", undefined, "id-2")).toBe("id-1 id-2");
  });

  it("removes empty tokens from whitespace", () => {
    expect(mergeAriaTokenList("  id-1   id-2  ")).toBe("id-1 id-2");
  });

  it("returns undefined for all-empty input", () => {
    expect(mergeAriaTokenList(null, undefined)).toBeUndefined();
    expect(mergeAriaTokenList("", "  ")).toBeUndefined();
  });

  it("returns undefined for no arguments", () => {
    expect(mergeAriaTokenList()).toBeUndefined();
  });

  it("handles single token", () => {
    expect(mergeAriaTokenList("only-one")).toBe("only-one");
  });

  it("handles repeated tokens across sources", () => {
    expect(mergeAriaTokenList("a b", "b c", "c d")).toBe("a b c d");
  });
});

describe("mergeAriaLabelledBy", () => {
  it("merges labelledby token lists", () => {
    expect(mergeAriaLabelledBy("title-id", "subtitle-id")).toBe("title-id subtitle-id");
  });

  it("deduplicates", () => {
    expect(mergeAriaLabelledBy("label-1 label-2", "label-2")).toBe("label-1 label-2");
  });

  it("returns undefined when empty", () => {
    expect(mergeAriaLabelledBy(null)).toBeUndefined();
  });
});

describe("mergeAriaDescribedBy", () => {
  it("merges describedby token lists", () => {
    expect(mergeAriaDescribedBy("desc-1", "desc-2")).toBe("desc-1 desc-2");
  });

  it("consumer description comes first", () => {
    expect(mergeAriaDescribedBy("user-desc", "error-desc")).toBe("user-desc error-desc");
  });
});

describe("mergeAriaControls", () => {
  it("merges controls token lists", () => {
    expect(mergeAriaControls("panel-1", "panel-2")).toBe("panel-1 panel-2");
  });

  it("deduplicates", () => {
    expect(mergeAriaControls("panel-1", "panel-1")).toBe("panel-1");
  });
});

describe("mergeAriaOwns", () => {
  it("merges owns token lists", () => {
    expect(mergeAriaOwns("popup-1", "popup-2")).toBe("popup-1 popup-2");
  });

  it("returns undefined when empty", () => {
    expect(mergeAriaOwns(undefined)).toBeUndefined();
  });
});

describe("resolveBooleanAria", () => {
  it("converts true to 'true' string", () => {
    expect(resolveBooleanAria({ "aria-disabled": true })).toEqual({
      "aria-disabled": "true",
    });
  });

  it("converts false to 'false' string", () => {
    expect(resolveBooleanAria({ "aria-expanded": false })).toEqual({
      "aria-expanded": "false",
    });
  });

  it("omits undefined values", () => {
    expect(resolveBooleanAria({ "aria-disabled": true, "aria-hidden": undefined })).toEqual({
      "aria-disabled": "true",
    });
  });

  it("handles multiple attributes", () => {
    expect(
      resolveBooleanAria({
        "aria-disabled": true,
        "aria-expanded": false,
        "aria-selected": true,
      }),
    ).toEqual({
      "aria-disabled": "true",
      "aria-expanded": "false",
      "aria-selected": "true",
    });
  });

  it("returns empty object when all undefined", () => {
    expect(resolveBooleanAria({ "aria-hidden": undefined })).toEqual({});
  });

  it("returns empty object for empty input", () => {
    expect(resolveBooleanAria({})).toEqual({});
  });

  it("produces deterministic key order", () => {
    const result = resolveBooleanAria({
      "aria-selected": true,
      "aria-disabled": true,
      "aria-expanded": false,
    });
    expect(Object.keys(result)).toEqual(["aria-disabled", "aria-expanded", "aria-selected"]);
  });
});
