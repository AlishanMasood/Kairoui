import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { Workflow } from "./workflow";
import type { WorkflowStep } from "./workflow-types";

describe("Workflow performance", () => {
  it("renders 100 steps under a generous budget", () => {
    const steps: WorkflowStep[] = [];
    for (let i = 0; i < 100; i++) {
      steps.push({ id: `s${String(i)}`, label: `Step ${String(i)}` });
    }
    const t0 = performance.now();
    const { container } = render(<Workflow steps={steps} />);
    const t1 = performance.now();
    const rendered = container.querySelectorAll("[data-workflow-step]");
    expect(rendered.length).toBe(100);
    expect(t1 - t0).toBeLessThan(5000);
  });

  it("renders 50 steps vertically without throwing", () => {
    const steps: WorkflowStep[] = [];
    for (let i = 0; i < 50; i++) {
      steps.push({ id: `s${String(i)}`, label: `Step ${String(i)}` });
    }
    const { container } = render(<Workflow steps={steps} orientation="vertical" />);
    expect(container.querySelectorAll("[data-workflow-step]").length).toBe(50);
  });
});
