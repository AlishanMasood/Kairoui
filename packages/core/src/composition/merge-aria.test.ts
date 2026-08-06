import { describe, it, expect } from "vitest";
import {
  mergeAriaRelationship,
  mergeAriaRelationships,
  reconcileAriaBoolean,
  reconcileAriaBooleans,
  reconcileAriaScalar,
} from "./merge-aria";

describe("mergeAriaRelationship", () => {
  it("returns consumer-only value", () => {
    expect(mergeAriaRelationship({ consumer: "user-label" })).toBe("user-label");
  });

  it("returns internal-only value", () => {
    expect(mergeAriaRelationship({ internal: "internal-id" })).toBe("internal-id");
  });

  it("combines consumer and internal (consumer first)", () => {
    expect(mergeAriaRelationship({ consumer: "user-id", internal: "gen-id" })).toBe(
      "user-id gen-id",
    );
  });

  it("deduplicates repeated IDs", () => {
    expect(mergeAriaRelationship({ consumer: "id-1 id-2", internal: "id-2 id-3" })).toBe(
      "id-1 id-2 id-3",
    );
  });

  it("returns undefined for all empty/null sources", () => {
    expect(mergeAriaRelationship({ consumer: null, internal: undefined })).toBeUndefined();
  });

  it("returns undefined for empty string sources", () => {
    expect(mergeAriaRelationship({ consumer: "  ", internal: "" })).toBeUndefined();
  });

  it("includes slot source between consumer and internal", () => {
    expect(mergeAriaRelationship({ consumer: "c", slot: "s", internal: "i" })).toBe("c s i");
  });

  it("includes accessibility source", () => {
    expect(mergeAriaRelationship({ internal: "int", accessibility: "a11y" })).toBe("int a11y");
  });

  it("includes child source (future asChild)", () => {
    expect(mergeAriaRelationship({ consumer: "consumer", child: "child" })).toBe("consumer child");
  });

  it("handles multiple sources with duplicates", () => {
    expect(
      mergeAriaRelationship({
        consumer: "a b",
        slot: "b c",
        internal: "c d",
      }),
    ).toBe("a b c d");
  });
});

describe("mergeAriaRelationships", () => {
  it("merges multiple relationship attributes", () => {
    const result = mergeAriaRelationships({
      "aria-labelledby": { consumer: "title", internal: "gen-label" },
      "aria-describedby": { internal: "help-text" },
    });
    expect(result).toEqual({
      "aria-labelledby": "title gen-label",
      "aria-describedby": "help-text",
    });
  });

  it("omits attributes with no tokens", () => {
    const result = mergeAriaRelationships({
      "aria-labelledby": { consumer: "label" },
      "aria-describedby": { consumer: null },
    });
    expect(result).toEqual({ "aria-labelledby": "label" });
  });

  it("returns empty object when nothing to merge", () => {
    expect(mergeAriaRelationships({})).toEqual({});
  });

  it("supports aria-errormessage", () => {
    const result = mergeAriaRelationships({
      "aria-errormessage": { internal: "error-id" },
    });
    expect(result).toEqual({ "aria-errormessage": "error-id" });
  });
});

describe("reconcileAriaBoolean", () => {
  it("consumer wins when explicitly set", () => {
    expect(reconcileAriaBoolean({ consumer: true, state: false })).toBe(true);
    expect(reconcileAriaBoolean({ consumer: false, state: true })).toBe(false);
  });

  it("falls back to state when consumer is undefined", () => {
    expect(reconcileAriaBoolean({ state: true, internal: false })).toBe(true);
  });

  it("falls back to internal when consumer and state are undefined", () => {
    expect(reconcileAriaBoolean({ internal: true })).toBe(true);
  });

  it("returns undefined when no source provides a value", () => {
    expect(reconcileAriaBoolean({})).toBeUndefined();
  });

  it("consumer false overrides internal true", () => {
    expect(reconcileAriaBoolean({ consumer: false, internal: true })).toBe(false);
  });
});

describe("reconcileAriaBooleans", () => {
  it("reconciles multiple boolean attributes", () => {
    const result = reconcileAriaBooleans({
      "aria-disabled": { state: true },
      "aria-expanded": { consumer: false, state: true },
    });
    expect(result).toEqual({
      "aria-disabled": "true",
      "aria-expanded": "false",
    });
  });

  it("omits undefined values", () => {
    const result = reconcileAriaBooleans({
      "aria-disabled": { consumer: undefined, state: undefined },
      "aria-expanded": { state: true },
    });
    expect(result).toEqual({ "aria-expanded": "true" });
  });

  it("returns empty object when no values", () => {
    expect(reconcileAriaBooleans({})).toEqual({});
  });
});

describe("reconcileAriaScalar", () => {
  it("consumer wins when set", () => {
    expect(reconcileAriaScalar({ consumer: "assertive", internal: "polite" })).toBe("assertive");
  });

  it("falls back to state", () => {
    expect(reconcileAriaScalar({ state: "page", internal: "step" })).toBe("page");
  });

  it("falls back to internal", () => {
    expect(reconcileAriaScalar({ internal: "horizontal" })).toBe("horizontal");
  });

  it("returns undefined when no source", () => {
    expect(reconcileAriaScalar({})).toBeUndefined();
  });

  it("supports numeric values", () => {
    expect(reconcileAriaScalar({ consumer: 50, internal: 0 })).toBe(50);
  });

  it("consumer 0 overrides internal", () => {
    expect(reconcileAriaScalar({ consumer: 0, internal: 100 })).toBe(0);
  });
});
