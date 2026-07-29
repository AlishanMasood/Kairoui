import { describe, it, expect } from "vitest";

describe("vitest infrastructure", () => {
  it("runs tests successfully", () => {
    expect(true).toBe(true);
  });

  it("supports TypeScript natively", () => {
    const value: number = 42;
    expect(value).toBe(42);
  });
});
