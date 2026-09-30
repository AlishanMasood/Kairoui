import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { Workflow } from "./workflow";
import type { WorkflowStep } from "./workflow-types";

const STEPS: readonly WorkflowStep[] = [
  { id: "a", label: "A", state: "completed" },
  { id: "b", label: "B" },
];

describe("Workflow SSR", () => {
  it("renders to a static string without throwing", () => {
    const html = renderToString(<Workflow steps={STEPS} />);
    expect(html).toContain("kui-workflow");
    expect(html).toContain('role="group"');
    expect(html).toContain('role="list"');
  });

  it("renders steps + connectors during SSR", () => {
    const html = renderToString(<Workflow steps={STEPS} />);
    expect(html).toContain('data-workflow-step="a"');
    expect(html).toContain('data-workflow-step="b"');
    expect(html).toContain("data-workflow-connector");
  });

  it("renders vertical orientation during SSR", () => {
    const html = renderToString(<Workflow steps={STEPS} orientation="vertical" />);
    expect(html).toContain('data-workflow-orientation="vertical"');
  });

  it("renders progress bar during SSR when enabled", () => {
    const html = renderToString(<Workflow steps={STEPS} showProgress />);
    expect(html).toContain("data-workflow-progress");
    expect(html).toContain('role="progressbar"');
  });

  it("renders dir=rtl during SSR", () => {
    const html = renderToString(<Workflow steps={STEPS} dir="rtl" />);
    expect(html).toContain('dir="rtl"');
  });
});
