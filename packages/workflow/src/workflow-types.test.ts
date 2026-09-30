import { describe, expectTypeOf, it } from "vitest";
import type {
  WorkflowNavigatePayload,
  WorkflowNavigationMode,
  WorkflowOrientation,
  WorkflowRootProps,
  WorkflowState,
  WorkflowStep,
  WorkflowStepChangePayload,
  WorkflowStepState,
} from "./workflow-types";

describe("Data shape", () => {
  it("WorkflowStep requires id + label", () => {
    const s: WorkflowStep = { id: "s1", label: "Start" };
    expectTypeOf(s).toEqualTypeOf<WorkflowStep>();
  });

  it("WorkflowStepState is a union of the four canonical values", () => {
    const states: WorkflowStepState[] = ["pending", "current", "completed", "error"];
    expectTypeOf(states[0]!).toEqualTypeOf<WorkflowStepState>();
  });
});

describe("Presentation", () => {
  it("WorkflowOrientation is horizontal or vertical", () => {
    const list: WorkflowOrientation[] = ["horizontal", "vertical"];
    expectTypeOf(list[0]!).toEqualTypeOf<WorkflowOrientation>();
  });

  it("WorkflowNavigationMode is linear or non-linear", () => {
    const list: WorkflowNavigationMode[] = ["linear", "non-linear"];
    expectTypeOf(list[0]!).toEqualTypeOf<WorkflowNavigationMode>();
  });
});

describe("State", () => {
  it("WorkflowState carries currentStepId + focusedStepId", () => {
    const state: WorkflowState = {
      currentStepId: null,
      focusedStepId: null,
    };
    expectTypeOf(state.currentStepId).toEqualTypeOf<string | null>();
  });
});

describe("Callback payloads", () => {
  it("WorkflowStepChangePayload carries step + previous + nativeEvent", () => {
    const p: WorkflowStepChangePayload = {
      step: { id: "s1", label: "Start" },
      previousStepId: null,
      nativeEvent: new MouseEvent("click"),
    };
    expectTypeOf(p.previousStepId).toEqualTypeOf<string | null>();
  });

  it("WorkflowNavigatePayload carries direction + fromStepId + nativeEvent", () => {
    const p: WorkflowNavigatePayload = {
      direction: "next",
      fromStepId: null,
      nativeEvent: null,
    };
    expectTypeOf(p.direction).toEqualTypeOf<"next" | "previous">();
  });
});

describe("Root props", () => {
  it("only requires steps", () => {
    const minimal: WorkflowRootProps = { steps: [] };
    expectTypeOf(minimal).toExtend<WorkflowRootProps>();
  });
});
