import { describe, it, expect } from "vitest";
import { canUseDOM, canUseWindow, canUseDocument, isServer } from "./environment";

// Tests run in node environment (no DOM)

describe("canUseDOM", () => {
  it("is a function, not a cached constant", () => {
    expect(canUseDOM).toBeTypeOf("function");
  });

  it("returns false in node environment", () => {
    expect(canUseDOM()).toBe(false);
  });
});

describe("canUseWindow", () => {
  it("returns false in node environment", () => {
    expect(canUseWindow()).toBe(false);
  });
});

describe("canUseDocument", () => {
  it("returns false in node environment", () => {
    expect(canUseDocument()).toBe(false);
  });
});

describe("isServer", () => {
  it("is a function, not a cached constant", () => {
    expect(isServer).toBeTypeOf("function");
  });

  it("returns true in node environment", () => {
    expect(isServer()).toBe(true);
  });

  it("returns the inverse of canUseDOM", () => {
    expect(isServer()).toBe(!canUseDOM());
  });
});
