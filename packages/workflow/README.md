# @kairoui-pro/workflow

Backend-agnostic Stepper / Workflow visualization for KairoUI.
Consumer-owned step list, current-step tracking, and navigation
callbacks — the component ships **no** workflow engine, no rule
evaluator, and no persistence.

## Non-goals (non-negotiable)

- No workflow engine.
- No business-rule execution.
- No persistence — every navigation flows through a callback.
- No linear-only assumption — non-linear step ordering is fully
  supported when the consumer opts in.

## Usage

```ts
import "@kairoui-pro/workflow/styles.css";
```

```tsx
<Workflow
  steps={steps}
  currentStepId={current}
  onStepChange={(payload) => setCurrent(payload.step.id)}
/>
```
