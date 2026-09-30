import { describe, expect, it } from "vitest";
import { assertValidWorkflowStep, assertValidWorkflowSteps } from "./identity";

describe("assertValidWorkflowStep", () => {
  it("accepts a minimal step", () => {
    expect(() => {
      assertValidWorkflowStep({ id: "s1", label: "Start" });
    }).not.toThrow();
  });

  it("rejects an empty id", () => {
    expect(() => {
      assertValidWorkflowStep({ id: "", label: "x" });
    }).toThrow(TypeError);
  });

  it("rejects a non-string label", () => {
    expect(() => {
      assertValidWorkflowStep({ id: "s1", label: 1 as unknown as string });
    }).toThrow(TypeError);
  });

  it("accepts every canonical state", () => {
    for (const state of ["pending", "current", "completed", "error"] as const) {
      expect(() => {
        assertValidWorkflowStep({ id: "s1", label: "x", state });
      }).not.toThrow();
    }
  });

  it("rejects an unknown state", () => {
    expect(() => {
      assertValidWorkflowStep({
        id: "s1",
        label: "x",
        state: "bogus" as unknown as "current",
      });
    }).toThrow(TypeError);
  });
});

describe("assertValidWorkflowSteps", () => {
  it("accepts a well-formed list", () => {
    expect(() => {
      assertValidWorkflowSteps([
        { id: "a", label: "A" },
        { id: "b", label: "B" },
      ]);
    }).not.toThrow();
  });

  it("rejects duplicate ids", () => {
    expect(() => {
      assertValidWorkflowSteps([
        { id: "a", label: "A" },
        { id: "a", label: "B" },
      ]);
    }).toThrow(RangeError);
  });

  it("accepts an empty list", () => {
    expect(() => {
      assertValidWorkflowSteps([]);
    }).not.toThrow();
  });
});
