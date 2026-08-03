import { describe, it, expect, beforeEach } from "vitest";
import {
  joinId,
  sanitizeIdPart,
  toKebabCase,
  toDataAttributeName,
  toAriaId,
  capitalize,
  trimWhitespace,
  generateId,
  resetIdCounter,
} from "./string";

describe("sanitizeIdPart", () => {
  it("keeps alphanumeric and hyphens", () => {
    expect(sanitizeIdPart("hello-world")).toBe("hello-world");
    expect(sanitizeIdPart("abc123")).toBe("abc123");
  });

  it("replaces spaces and special chars with hyphens", () => {
    expect(sanitizeIdPart("hello world")).toBe("hello-world");
    expect(sanitizeIdPart("foo@bar!baz")).toBe("foo-bar-baz");
  });

  it("collapses consecutive hyphens", () => {
    expect(sanitizeIdPart("a---b")).toBe("a-b");
    expect(sanitizeIdPart("a   b")).toBe("a-b");
  });

  it("strips leading/trailing hyphens", () => {
    expect(sanitizeIdPart("-hello-")).toBe("hello");
    expect(sanitizeIdPart("  hello  ")).toBe("hello");
  });

  it("handles empty string", () => {
    expect(sanitizeIdPart("")).toBe("");
  });

  it("preserves unicode letters", () => {
    expect(sanitizeIdPart("café")).toBe("café");
    expect(sanitizeIdPart("über")).toBe("über");
  });

  it("handles numbers", () => {
    expect(sanitizeIdPart("item42")).toBe("item42");
  });
});

describe("joinId", () => {
  it("joins parts with hyphens", () => {
    expect(joinId("menu", "item", 1)).toBe("menu-item-1");
  });

  it("filters null and undefined", () => {
    expect(joinId("a", null, "b", undefined, "c")).toBe("a-b-c");
  });

  it("filters empty strings", () => {
    expect(joinId("a", "", "b")).toBe("a-b");
  });

  it("sanitizes each part", () => {
    expect(joinId("my component", "item 1")).toBe("my-component-item-1");
  });

  it("returns empty string for all-empty input", () => {
    expect(joinId(null, undefined, "")).toBe("");
  });
});

describe("toKebabCase", () => {
  it("converts camelCase", () => {
    expect(toKebabCase("camelCase")).toBe("camel-case");
    expect(toKebabCase("myComponent")).toBe("my-component");
  });

  it("converts PascalCase", () => {
    expect(toKebabCase("PascalCase")).toBe("pascal-case");
    expect(toKebabCase("MyComponent")).toBe("my-component");
  });

  it("handles consecutive uppercase (acronyms)", () => {
    expect(toKebabCase("HTMLElement")).toBe("html-element");
    expect(toKebabCase("getURLPath")).toBe("get-url-path");
  });

  it("handles already-kebab-case", () => {
    expect(toKebabCase("already-kebab")).toBe("already-kebab");
  });

  it("handles single word", () => {
    expect(toKebabCase("hello")).toBe("hello");
    expect(toKebabCase("Hello")).toBe("hello");
  });

  it("handles empty string", () => {
    expect(toKebabCase("")).toBe("");
  });

  it("handles numbers in string", () => {
    expect(toKebabCase("item2Name")).toBe("item2-name");
  });
});

describe("toDataAttributeName", () => {
  it("adds data- prefix", () => {
    expect(toDataAttributeName("theme")).toBe("data-theme");
    expect(toDataAttributeName("kuiMode")).toBe("data-kui-mode");
  });

  it("does not double-prefix", () => {
    expect(toDataAttributeName("data-theme")).toBe("data-theme");
  });

  it("handles PascalCase input", () => {
    expect(toDataAttributeName("MyAttr")).toBe("data-my-attr");
  });

  it("removes invalid characters", () => {
    expect(toDataAttributeName("foo@bar")).toBe("data-foo-bar");
  });
});

describe("toAriaId", () => {
  it("produces same output as joinId", () => {
    expect(toAriaId("dialog", "title")).toBe("dialog-title");
    expect(toAriaId("menu", null, "item", 3)).toBe("menu-item-3");
  });
});

describe("capitalize", () => {
  it("capitalizes first character", () => {
    expect(capitalize("hello")).toBe("Hello");
  });

  it("handles empty string", () => {
    expect(capitalize("")).toBe("");
  });

  it("handles already-capitalized", () => {
    expect(capitalize("Hello")).toBe("Hello");
  });

  it("handles single character", () => {
    expect(capitalize("a")).toBe("A");
  });

  it("preserves rest of string", () => {
    expect(capitalize("hELLO")).toBe("HELLO");
  });
});

describe("trimWhitespace", () => {
  it("trims leading and trailing whitespace", () => {
    expect(trimWhitespace("  hello  ")).toBe("hello");
  });

  it("collapses internal whitespace", () => {
    expect(trimWhitespace("hello   world")).toBe("hello world");
  });

  it("handles tabs and newlines", () => {
    expect(trimWhitespace("\t hello \n world \t")).toBe("hello world");
  });

  it("handles empty string", () => {
    expect(trimWhitespace("")).toBe("");
  });

  it("handles string with only whitespace", () => {
    expect(trimWhitespace("   ")).toBe("");
  });
});

describe("generateId", () => {
  beforeEach(() => {
    resetIdCounter();
  });

  it("generates sequential ids with prefix", () => {
    expect(generateId()).toBe("kui-1");
    expect(generateId()).toBe("kui-2");
    expect(generateId()).toBe("kui-3");
  });

  it("accepts custom prefix", () => {
    expect(generateId("menu")).toBe("menu-1");
    expect(generateId("dialog")).toBe("dialog-2");
  });

  it("produces deterministic output", () => {
    const first = generateId("test");
    resetIdCounter();
    const second = generateId("test");
    expect(first).toBe(second);
  });
});
