import { describe, expect, it, vi } from "vitest";
import { fireEvent, render } from "@testing-library/react";
import { Workflow } from "./workflow";
import type { WorkflowStep } from "./workflow-types";

const STEPS: readonly WorkflowStep[] = [
  { id: "start", label: "Start", state: "completed" },
  { id: "config", label: "Configure", state: "completed" },
  { id: "review", label: "Review" },
  { id: "finish", label: "Finish" },
];

// ─── Root ────────────────────────────────────────────────────────

describe("<Workflow> root", () => {
  it("renders a role=group root with orientation", () => {
    const { container } = render(<Workflow steps={STEPS} />);
    const root = container.querySelector<HTMLElement>("[role=group]");
    expect(root).not.toBeNull();
    expect(root?.getAttribute("data-workflow-orientation")).toBe("horizontal");
  });

  it("renders one button per step by default", () => {
    const { container } = render(<Workflow steps={STEPS} />);
    const steps = container.querySelectorAll("[data-workflow-step]");
    expect(steps.length).toBe(4);
  });

  it("applies className / style / id / aria-label", () => {
    const { container } = render(
      <Workflow
        steps={STEPS}
        className="my-flow"
        style={{ padding: 4 }}
        id="wf"
        aria-label="Onboarding"
      />,
    );
    const root = container.querySelector<HTMLElement>("[role=group]");
    expect(root?.getAttribute("id")).toBe("wf");
    expect(root?.getAttribute("aria-label")).toBe("Onboarding");
    expect(root?.className).toContain("my-flow");
    expect(root?.style.padding).toBe("4px");
  });

  it("renders vertical orientation when requested", () => {
    const { container } = render(<Workflow steps={STEPS} orientation="vertical" />);
    const root = container.querySelector<HTMLElement>("[role=group]");
    expect(root?.getAttribute("data-workflow-orientation")).toBe("vertical");
    expect(root?.className).toContain("kui-workflow--vertical");
  });

  it("renders a live-polite announcer", () => {
    const { container } = render(<Workflow steps={STEPS} />);
    const announcer = container.querySelector("[data-workflow-announcer]");
    expect(announcer?.getAttribute("aria-live")).toBe("polite");
  });
});

// ─── State resolution ────────────────────────────────────────────

describe("State resolution", () => {
  it("marks the current step with aria-current=step", () => {
    const { container } = render(<Workflow steps={STEPS} currentStepId="review" />);
    const btn = container.querySelector<HTMLButtonElement>('[data-workflow-step="review"]');
    expect(btn?.getAttribute("aria-current")).toBe("step");
  });

  it("propagates completed / error / pending as data-workflow-step-state", () => {
    const { container } = render(
      <Workflow
        steps={[
          { id: "a", label: "A", state: "completed" },
          { id: "b", label: "B", state: "error" },
          { id: "c", label: "C" },
        ]}
      />,
    );
    const wrappers = container.querySelectorAll<HTMLElement>("[data-workflow-step-wrapper]");
    expect(wrappers[0]?.dataset["workflowStepState"]).toBe("completed");
    expect(wrappers[1]?.dataset["workflowStepState"]).toBe("error");
    expect(wrappers[2]?.dataset["workflowStepState"]).toBe("pending");
  });
});

// ─── Interaction ─────────────────────────────────────────────────

describe("Interaction", () => {
  it("clicking a step fires onStepChange with the new step", () => {
    const onStepChange = vi.fn();
    const { container } = render(
      <Workflow steps={STEPS} defaultCurrentStepId="start" onStepChange={onStepChange} />,
    );
    fireEvent.click(container.querySelector<HTMLButtonElement>('[data-workflow-step="review"]')!);
    expect(onStepChange).toHaveBeenCalledOnce();
    const payload = onStepChange.mock.calls[0]?.[0] as {
      step: { id: string };
      previousStepId: string | null;
    };
    expect(payload.step.id).toBe("review");
    expect(payload.previousStepId).toBe("start");
  });

  it("clicking the current step does NOT re-fire onStepChange", () => {
    const onStepChange = vi.fn();
    const { container } = render(
      <Workflow steps={STEPS} defaultCurrentStepId="review" onStepChange={onStepChange} />,
    );
    fireEvent.click(container.querySelector<HTMLButtonElement>('[data-workflow-step="review"]')!);
    expect(onStepChange).not.toHaveBeenCalled();
  });

  it("clicking a step also fires onStepClick", () => {
    const onStepClick = vi.fn();
    const { container } = render(
      <Workflow steps={STEPS} defaultCurrentStepId="start" onStepClick={onStepClick} />,
    );
    fireEvent.click(container.querySelector<HTMLButtonElement>('[data-workflow-step="review"]')!);
    expect(onStepClick).toHaveBeenCalledOnce();
  });

  it("clicking a disabled step is a no-op", () => {
    const stepsWithDisabled: readonly WorkflowStep[] = [
      { id: "a", label: "A" },
      { id: "b", label: "B", disabled: true },
    ];
    const onStepChange = vi.fn();
    const { container } = render(
      <Workflow steps={stepsWithDisabled} defaultCurrentStepId="a" onStepChange={onStepChange} />,
    );
    const btn = container.querySelector<HTMLButtonElement>('[data-workflow-step="b"]')!;
    expect(btn.disabled).toBe(true);
    fireEvent.click(btn);
    expect(onStepChange).not.toHaveBeenCalled();
  });

  it("uses renderStep to render custom step content", () => {
    const { container } = render(
      <Workflow
        steps={STEPS}
        renderStep={({ step, state }) => (
          <span data-testid="custom">
            {step.label}:{state}
          </span>
        )}
      />,
    );
    const custom = container.querySelectorAll("[data-testid=custom]");
    expect(custom.length).toBe(4);
  });

  it("progress bar reflects completed / total when showProgress is on", () => {
    const { container } = render(<Workflow steps={STEPS} showProgress />);
    const progress = container.querySelector<HTMLElement>("[data-workflow-progress]");
    expect(progress?.getAttribute("role")).toBe("progressbar");
    // 2 of 4 completed = 50%.
    expect(progress?.getAttribute("aria-valuenow")).toBe("50");
  });

  it("Workflow.Nav Previous button is disabled at the first step", () => {
    const { container } = render(
      <Workflow steps={STEPS} defaultCurrentStepId="start">
        <Workflow.List>
          {STEPS.map((s) => (
            <Workflow.Step key={s.id} stepId={s.id} />
          ))}
        </Workflow.List>
        <Workflow.Nav />
      </Workflow>,
    );
    const prev = container.querySelector<HTMLButtonElement>("[data-workflow-nav-prev]");
    expect(prev?.disabled).toBe(true);
    const next = container.querySelector<HTMLButtonElement>("[data-workflow-nav-next]");
    expect(next?.disabled).toBe(false);
  });

  it("Workflow.Nav Next button fires onNavigate + navigates the current step", () => {
    const onNavigate = vi.fn();
    const onStepChange = vi.fn();
    const { container } = render(
      <Workflow
        steps={STEPS}
        defaultCurrentStepId="start"
        onNavigate={onNavigate}
        onStepChange={onStepChange}
      >
        <Workflow.List>
          {STEPS.map((s) => (
            <Workflow.Step key={s.id} stepId={s.id} />
          ))}
        </Workflow.List>
        <Workflow.Nav />
      </Workflow>,
    );
    fireEvent.click(container.querySelector<HTMLButtonElement>("[data-workflow-nav-next]")!);
    expect(onNavigate).toHaveBeenCalledOnce();
    expect(onStepChange).toHaveBeenCalledOnce();
  });
});

// ─── Optional step ───────────────────────────────────────────────

describe("Optional step", () => {
  it("renders the (Optional) hint next to the label", () => {
    const stepsWithOptional: readonly WorkflowStep[] = [
      { id: "a", label: "A" },
      { id: "b", label: "B", optional: true },
    ];
    const { container } = render(<Workflow steps={stepsWithOptional} />);
    const bWrapper = container.querySelector<HTMLElement>('[data-workflow-step-wrapper="b"]');
    expect(bWrapper?.textContent).toContain("Optional");
  });
});

// ─── RTL ─────────────────────────────────────────────────────────

describe("RTL", () => {
  it("applies dir=rtl on the root", () => {
    const { container } = render(<Workflow steps={STEPS} dir="rtl" />);
    const root = container.querySelector<HTMLElement>("[role=group]");
    expect(root?.getAttribute("dir")).toBe("rtl");
  });
});

// ─── Input validation ────────────────────────────────────────────

describe("Input validation", () => {
  it("throws on duplicate step ids", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(() => {
      render(
        <Workflow
          steps={[
            { id: "a", label: "A" },
            { id: "a", label: "B" },
          ]}
        />,
      );
    }).toThrow(/duplicate step id/);
    spy.mockRestore();
  });
});
