import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { Workflow } from "./workflow";
import type { WorkflowStep } from "./workflow-types";

const STEPS: readonly WorkflowStep[] = [
  { id: "a", label: "A", state: "completed" },
  { id: "b", label: "B" },
  { id: "c", label: "C" },
];

describe("Workflow accessibility", () => {
  it("root exposes role=group + aria-label fallback", () => {
    const { container } = render(<Workflow steps={STEPS} />);
    const root = container.querySelector<HTMLElement>("[role=group]");
    expect(root?.getAttribute("aria-label")).toBeTruthy();
  });

  it("list uses role=list", () => {
    const { container } = render(<Workflow steps={STEPS} />);
    const list = container.querySelector<HTMLElement>("[data-workflow-list]");
    expect(list?.getAttribute("role")).toBe("list");
  });

  it("wrappers use role=listitem with aria-posinset / aria-setsize", () => {
    const { container } = render(<Workflow steps={STEPS} />);
    const wrappers = container.querySelectorAll<HTMLElement>("[data-workflow-step-wrapper]");
    expect(wrappers.length).toBe(3);
    expect(wrappers[0]?.getAttribute("role")).toBe("listitem");
    expect(wrappers[0]?.getAttribute("aria-posinset")).toBe("1");
    expect(wrappers[0]?.getAttribute("aria-setsize")).toBe("3");
  });

  it("steps use <button> with aria-label + aria-current for the current step", () => {
    const { container } = render(<Workflow steps={STEPS} currentStepId="b" />);
    const current = container.querySelector<HTMLElement>('[data-workflow-step="b"]');
    expect(current?.tagName).toBe("BUTTON");
    expect(current?.getAttribute("aria-current")).toBe("step");
    expect(current?.getAttribute("aria-label")).toContain("B");
  });

  it("connectors are aria-hidden decorative elements", () => {
    const { container } = render(<Workflow steps={STEPS} />);
    const connectors = container.querySelectorAll("[data-workflow-connector]");
    for (const c of Array.from(connectors)) {
      expect(c.getAttribute("aria-hidden")).toBe("true");
    }
  });

  it("aria-labelledby is applied without a duplicate aria-label", () => {
    const { container } = render(
      <div>
        <h1 id="heading">Onboarding</h1>
        <Workflow steps={STEPS} aria-labelledby="heading" />
      </div>,
    );
    const root = container.querySelector<HTMLElement>("[role=group]");
    expect(root?.getAttribute("aria-labelledby")).toBe("heading");
    expect(root?.getAttribute("aria-label")).toBeNull();
  });

  it("announcer exposes aria-live=polite + aria-atomic=true", () => {
    const { container } = render(<Workflow steps={STEPS} />);
    const announcer = container.querySelector("[data-workflow-announcer]");
    expect(announcer?.getAttribute("aria-live")).toBe("polite");
    expect(announcer?.getAttribute("aria-atomic")).toBe("true");
  });

  it("progress exposes role=progressbar + aria-valuenow / aria-valuemin / aria-valuemax", () => {
    const { container } = render(<Workflow steps={STEPS} showProgress />);
    const progress = container.querySelector<HTMLElement>("[data-workflow-progress]");
    expect(progress?.getAttribute("role")).toBe("progressbar");
    expect(progress?.getAttribute("aria-valuemin")).toBe("0");
    expect(progress?.getAttribute("aria-valuemax")).toBe("100");
    expect(progress?.getAttribute("aria-valuenow")).toBeTruthy();
  });

  it("disabled steps set the native disabled attribute", () => {
    const stepsWithDisabled: readonly WorkflowStep[] = [
      { id: "a", label: "A" },
      { id: "b", label: "B", disabled: true },
    ];
    const { container } = render(<Workflow steps={stepsWithDisabled} />);
    const b = container.querySelector<HTMLButtonElement>('[data-workflow-step="b"]');
    expect(b?.disabled).toBe(true);
  });
});
