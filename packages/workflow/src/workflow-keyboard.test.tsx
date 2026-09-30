import { describe, expect, it, vi } from "vitest";
import { fireEvent, render } from "@testing-library/react";
import { Workflow } from "./workflow";
import type { WorkflowStep } from "./workflow-types";

const STEPS: readonly WorkflowStep[] = [
  { id: "a", label: "A" },
  { id: "b", label: "B" },
  { id: "c", label: "C" },
];

describe("Workflow keyboard interactions", () => {
  it("Enter on a focused step activates it", () => {
    const onStepChange = vi.fn();
    const { container } = render(
      <Workflow
        steps={STEPS}
        defaultCurrentStepId="a"
        defaultFocusedStepId="b"
        onStepChange={onStepChange}
      />,
    );
    const list = container.querySelector<HTMLElement>("[data-workflow-list]")!;
    fireEvent.keyDown(list, { key: "Enter" });
    expect(onStepChange).toHaveBeenCalledOnce();
    const payload = onStepChange.mock.calls[0]?.[0] as { step: { id: string } };
    expect(payload.step.id).toBe("b");
  });

  it("Space on a focused step activates it", () => {
    const onStepChange = vi.fn();
    const { container } = render(
      <Workflow
        steps={STEPS}
        defaultCurrentStepId="a"
        defaultFocusedStepId="b"
        onStepChange={onStepChange}
      />,
    );
    const list = container.querySelector<HTMLElement>("[data-workflow-list]")!;
    fireEvent.keyDown(list, { key: " " });
    expect(onStepChange).toHaveBeenCalledOnce();
  });

  it("ArrowRight moves focus to the next step (horizontal)", () => {
    const onFocusedStepChange = vi.fn();
    const { container } = render(
      <Workflow steps={STEPS} defaultFocusedStepId="a" onFocusedStepChange={onFocusedStepChange} />,
    );
    const list = container.querySelector<HTMLElement>("[data-workflow-list]")!;
    fireEvent.keyDown(list, { key: "ArrowRight" });
    expect(onFocusedStepChange).toHaveBeenCalledWith("b");
  });

  it("ArrowLeft moves focus to the previous step (horizontal)", () => {
    const onFocusedStepChange = vi.fn();
    const { container } = render(
      <Workflow steps={STEPS} defaultFocusedStepId="c" onFocusedStepChange={onFocusedStepChange} />,
    );
    const list = container.querySelector<HTMLElement>("[data-workflow-list]")!;
    fireEvent.keyDown(list, { key: "ArrowLeft" });
    expect(onFocusedStepChange).toHaveBeenCalledWith("b");
  });

  it("ArrowDown moves focus to the next step in vertical orientation", () => {
    const onFocusedStepChange = vi.fn();
    const { container } = render(
      <Workflow
        steps={STEPS}
        orientation="vertical"
        defaultFocusedStepId="a"
        onFocusedStepChange={onFocusedStepChange}
      />,
    );
    const list = container.querySelector<HTMLElement>("[data-workflow-list]")!;
    fireEvent.keyDown(list, { key: "ArrowDown" });
    expect(onFocusedStepChange).toHaveBeenCalledWith("b");
  });

  it("Home / End jump to first / last enabled steps", () => {
    const onFocusedStepChange = vi.fn();
    const { container } = render(
      <Workflow steps={STEPS} defaultFocusedStepId="b" onFocusedStepChange={onFocusedStepChange} />,
    );
    const list = container.querySelector<HTMLElement>("[data-workflow-list]")!;
    fireEvent.keyDown(list, { key: "Home" });
    expect(onFocusedStepChange).toHaveBeenLastCalledWith("a");
    fireEvent.keyDown(list, { key: "End" });
    expect(onFocusedStepChange).toHaveBeenLastCalledWith("c");
  });

  it("Arrow keys skip disabled steps", () => {
    const stepsWithDisabled: readonly WorkflowStep[] = [
      { id: "a", label: "A" },
      { id: "b", label: "B", disabled: true },
      { id: "c", label: "C" },
    ];
    const onFocusedStepChange = vi.fn();
    const { container } = render(
      <Workflow
        steps={stepsWithDisabled}
        defaultFocusedStepId="a"
        onFocusedStepChange={onFocusedStepChange}
      />,
    );
    const list = container.querySelector<HTMLElement>("[data-workflow-list]")!;
    fireEvent.keyDown(list, { key: "ArrowRight" });
    expect(onFocusedStepChange).toHaveBeenCalledWith("c");
  });

  it("RTL swaps ArrowLeft / ArrowRight for horizontal orientation", () => {
    const onFocusedStepChange = vi.fn();
    const { container } = render(
      <Workflow
        steps={STEPS}
        dir="rtl"
        defaultFocusedStepId="b"
        onFocusedStepChange={onFocusedStepChange}
      />,
    );
    const list = container.querySelector<HTMLElement>("[data-workflow-list]")!;
    fireEvent.keyDown(list, { key: "ArrowRight" });
    // In RTL, ArrowRight means "visually right" = "previous" for a
    // left-to-right logical layout.
    expect(onFocusedStepChange).toHaveBeenCalledWith("a");
  });

  it("Orthogonal arrow keys are no-ops (ArrowUp/Down in horizontal orientation)", () => {
    const onFocusedStepChange = vi.fn();
    const { container } = render(
      <Workflow steps={STEPS} defaultFocusedStepId="b" onFocusedStepChange={onFocusedStepChange} />,
    );
    const list = container.querySelector<HTMLElement>("[data-workflow-list]")!;
    fireEvent.keyDown(list, { key: "ArrowUp" });
    fireEvent.keyDown(list, { key: "ArrowDown" });
    expect(onFocusedStepChange).not.toHaveBeenCalled();
  });
});
