# @kairoui-pro/permission-matrix

Backend-agnostic Permission Matrix UI for KairoUI. Consumer-supplied
subjects, actions, and cells; tri-state cells with `granted` /
`denied` / `unset` / `inherited` / `indeterminate`; bulk row / column
/ all actions; keyboard-first navigation; virtualization opt-in.

See [`docs/architecture/PHASE14-PERMISSION-MATRIX-ARCHITECTURE.md`](../../docs/architecture/PHASE14-PERMISSION-MATRIX-ARCHITECTURE.md)
for the contract.

## Backend agnosticism (non-negotiable)

- No RBAC / ABAC / policy schema shipped.
- No authorization performed.
- No persistence.
- No API calls.
- Consumer owns adapters into their own backend model.

## Usage

```ts
import "@kairoui-pro/permission-matrix/styles.css";
```

```tsx
<PermissionMatrix
  subjects={roles}
  actions={permissions}
  cells={cells}
  onCellChange={({ subject, action, toState }) => persist(subject.id, action.id, toState)}
/>
```
