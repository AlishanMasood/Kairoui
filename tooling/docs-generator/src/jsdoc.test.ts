import { describe, it, expect } from "vitest";
import { normalizeDescription, diagnoseSymbol } from "./jsdoc";

// ─── normalizeDescription ───────────────────────────────────────────

describe("normalizeDescription", () => {
  it("trims leading/trailing whitespace", () => {
    expect(normalizeDescription("  hello world  ")).toBe("hello world");
  });

  it("collapses multiple spaces", () => {
    expect(normalizeDescription("hello    world")).toBe("hello world");
  });

  it("preserves single newlines", () => {
    expect(normalizeDescription("line 1\nline 2")).toBe("line 1\nline 2");
  });

  it("collapses triple+ newlines to double", () => {
    expect(normalizeDescription("para 1\n\n\n\npara 2")).toBe("para 1\n\npara 2");
  });

  it("trims each line", () => {
    expect(normalizeDescription("  line 1  \n  line 2  ")).toBe("line 1\nline 2");
  });

  it("returns undefined for empty string", () => {
    expect(normalizeDescription("")).toBeUndefined();
  });

  it("returns undefined for whitespace-only string", () => {
    expect(normalizeDescription("   \n  \n  ")).toBeUndefined();
  });

  it("preserves markdown bold", () => {
    expect(normalizeDescription("This is **bold** text")).toBe("This is **bold** text");
  });

  it("preserves markdown code", () => {
    expect(normalizeDescription("Use `onClick` handler")).toBe("Use `onClick` handler");
  });

  it("handles multiline description", () => {
    const input = "First paragraph.\n\nSecond paragraph with details.";
    const result = normalizeDescription(input);
    expect(result).toBe("First paragraph.\n\nSecond paragraph with details.");
  });
});

// ─── diagnoseSymbol ─────────────────────────────────────────────────
// We test diagnoseSymbol via mock-like objects matching ts.Symbol interface.
// Since actual ts.Symbol requires a full compiler, we test the logic indirectly
// via the extraction tests in extractor.test.ts.

describe("diagnoseSymbol type contract", () => {
  it("diagnoseSymbol is a function", () => {
    expect(typeof diagnoseSymbol).toBe("function");
  });
});
