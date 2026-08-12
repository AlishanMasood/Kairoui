import { describe, it, expect } from "vitest";

describe("@kairoui/docs: package smoke test", () => {
  it("module exports an object", async () => {
    const mod = await import("./index");
    expect(mod).toBeDefined();
    expect(typeof mod).toBe("object");
  });
});
