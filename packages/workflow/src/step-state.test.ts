import { describe, expect, it } from "vitest";
import {
  computeWorkflowProgress,
  countStepsByState,
  findAdjacentStep,
  firstEnabledStep,
  lastEnabledStep,
  resolveStepStates,
} from "./step-state";
import type { WorkflowStep } from "./workflow-types";

const STEPS: readonly WorkflowStep[] = [
  { id: "a", label: "A", state: "completed" },
  { id: "b", label: "B", state: "completed" },
  { id: "c", label: "C" },
  { id: "d", label: "D", state: "error" },
];

describe("resolveStepStates", () => {
  it("overrides matching step with 'current' when currentStepId is set", () => {
    const resolved = resolveStepStates(STEPS, "c");
    expect(resolved.map((r) => r.resolvedState)).toEqual([
      "completed",
      "completed",
      "current",
      "error",
    ]);
  });

  it("falls back to 'pending' for missing state", () => {
    const resolved = resolveStepStates([{ id: "x", label: "X" }], null);
    expect(resolved[0]?.resolvedState).toBe("pending");
  });

  it("preserves index for every step", () => {
    const resolved = resolveStepStates(STEPS, null);
    expect(resolved.map((r) => r.index)).toEqual([0, 1, 2, 3]);
  });

  it("marks isCurrent only on the matched step", () => {
    const resolved = resolveStepStates(STEPS, "b");
    expect(resolved.map((r) => r.isCurrent)).toEqual([false, true, false, false]);
  });
});

describe("countStepsByState", () => {
  it("counts states after resolution", () => {
    const resolved = resolveStepStates(STEPS, "c");
    const counts = countStepsByState(resolved);
    expect(counts.completed).toBe(2);
    expect(counts.current).toBe(1);
    expect(counts.error).toBe(1);
    expect(counts.pending).toBe(0);
  });

  it("returns zeros for an empty list", () => {
    expect(countStepsByState([])).toEqual({
      pending: 0,
      current: 0,
      completed: 0,
      error: 0,
    });
  });
});

describe("computeWorkflowProgress", () => {
  it("returns completed / total based on resolved state", () => {
    const resolved = resolveStepStates(STEPS, null);
    const { completed, total } = computeWorkflowProgress(resolved);
    expect(completed).toBe(2);
    expect(total).toBe(4);
  });

  it("excludes disabled steps from total", () => {
    const stepsWithDisabled: readonly WorkflowStep[] = [
      { id: "a", label: "A", state: "completed" },
      { id: "b", label: "B", disabled: true },
      { id: "c", label: "C" },
    ];
    const { completed, total } = computeWorkflowProgress(
      resolveStepStates(stepsWithDisabled, null),
    );
    expect(completed).toBe(1);
    expect(total).toBe(2);
  });
});

describe("findAdjacentStep", () => {
  it("returns the next step id skipping disabled steps", () => {
    const steps: readonly WorkflowStep[] = [
      { id: "a", label: "A" },
      { id: "b", label: "B", disabled: true },
      { id: "c", label: "C" },
    ];
    expect(findAdjacentStep(steps, "a", "next")).toBe("c");
  });

  it("returns the previous step id skipping disabled steps", () => {
    const steps: readonly WorkflowStep[] = [
      { id: "a", label: "A" },
      { id: "b", label: "B", disabled: true },
      { id: "c", label: "C" },
    ];
    expect(findAdjacentStep(steps, "c", "previous")).toBe("a");
  });

  it("returns null when no reachable step exists", () => {
    expect(findAdjacentStep(STEPS, "d", "next")).toBeNull();
    expect(findAdjacentStep(STEPS, "a", "previous")).toBeNull();
  });

  it("starts from index -1 when fromId is null", () => {
    expect(findAdjacentStep(STEPS, null, "next")).toBe("a");
    expect(findAdjacentStep(STEPS, null, "previous")).toBeNull();
  });
});

describe("firstEnabledStep / lastEnabledStep", () => {
  it("returns the first / last enabled step", () => {
    expect(firstEnabledStep(STEPS)).toBe("a");
    expect(lastEnabledStep(STEPS)).toBe("d");
  });

  it("skips disabled steps at the extremes", () => {
    const steps: readonly WorkflowStep[] = [
      { id: "a", label: "A", disabled: true },
      { id: "b", label: "B" },
      { id: "c", label: "C", disabled: true },
    ];
    expect(firstEnabledStep(steps)).toBe("b");
    expect(lastEnabledStep(steps)).toBe("b");
  });

  it("returns null when every step is disabled", () => {
    const steps: readonly WorkflowStep[] = [
      { id: "a", label: "A", disabled: true },
      { id: "b", label: "B", disabled: true },
    ];
    expect(firstEnabledStep(steps)).toBeNull();
    expect(lastEnabledStep(steps)).toBeNull();
  });
});
