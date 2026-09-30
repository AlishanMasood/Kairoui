import type { Meta, StoryObj } from "@storybook/react";
import { Workflow } from "@kairoui-pro/workflow";
import type { WorkflowStep } from "@kairoui-pro/workflow";
import { useState } from "react";
// eslint-disable-next-line import-x/no-internal-modules
import "@kairoui-pro/workflow/styles.css";

const STEPS: readonly WorkflowStep[] = [
  { id: "start", label: "Start", state: "completed" },
  { id: "config", label: "Configure", state: "completed" },
  { id: "review", label: "Review" },
  { id: "publish", label: "Publish", optional: true },
];

function BasicWorkflow() {
  const [currentStepId, setCurrentStepId] = useState<string | null>("review");
  return (
    <div style={{ width: 720, padding: 16 }}>
      <Workflow
        steps={STEPS}
        currentStepId={currentStepId}
        onStepChange={({ step }) => {
          setCurrentStepId(step.id);
        }}
      />
    </div>
  );
}

function Vertical() {
  const [currentStepId, setCurrentStepId] = useState<string | null>("config");
  return (
    <div style={{ width: 320, padding: 16 }}>
      <Workflow
        steps={STEPS}
        orientation="vertical"
        currentStepId={currentStepId}
        onStepChange={({ step }) => {
          setCurrentStepId(step.id);
        }}
      />
    </div>
  );
}

function WithProgressAndNav() {
  const [currentStepId, setCurrentStepId] = useState<string | null>("start");
  return (
    <div style={{ width: 720, padding: 16 }}>
      <Workflow
        steps={STEPS}
        currentStepId={currentStepId}
        showProgress
        onStepChange={({ step }) => {
          setCurrentStepId(step.id);
        }}
      >
        <Workflow.Progress />
        <Workflow.List>
          {STEPS.map((s) => (
            <Workflow.Step key={s.id} stepId={s.id} />
          ))}
        </Workflow.List>
        <Workflow.Nav />
      </Workflow>
    </div>
  );
}

function ErrorAndDisabled() {
  const withError: readonly WorkflowStep[] = [
    { id: "s1", label: "Signed in", state: "completed" },
    { id: "s2", label: "Verified", state: "completed" },
    { id: "s3", label: "Payment", state: "error", description: "Card declined" },
    { id: "s4", label: "Confirmation", disabled: true },
  ];
  return (
    <div style={{ width: 720, padding: 16 }}>
      <Workflow steps={withError} currentStepId="s3" />
    </div>
  );
}

function CustomRender() {
  return (
    <div style={{ width: 720, padding: 16 }}>
      <Workflow
        steps={STEPS}
        renderStep={({ step, state, isCurrent }) => (
          <div style={{ padding: 4 }}>
            <strong>{step.label}</strong>
            <span style={{ marginLeft: 8, opacity: 0.6 }}>({state})</span>
            {isCurrent ? " ←" : null}
          </div>
        )}
      />
    </div>
  );
}

const meta: Meta<typeof Workflow> = {
  title: "Pro / Workflow",
  component: Workflow,
  parameters: {
    docs: {
      description: {
        component:
          "Backend-agnostic Stepper / Workflow visualization. Consumer-supplied steps; horizontal or vertical orientation. Ships in `@kairoui-pro/workflow`.",
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof Workflow>;

export const Default: Story = { render: () => <BasicWorkflow /> };
export const VerticalWorkflow: Story = { render: () => <Vertical /> };
export const WithProgressBarAndNav: Story = { render: () => <WithProgressAndNav /> };
export const ErrorAndDisabledSteps: Story = { render: () => <ErrorAndDisabled /> };
export const CustomRenderer: Story = { render: () => <CustomRender /> };
