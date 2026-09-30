import type { Meta, StoryObj } from "@storybook/react";
import { PermissionMatrix } from "@kairoui-pro/permission-matrix";
import type {
  PermissionAction,
  PermissionCell,
  PermissionSubject,
} from "@kairoui-pro/permission-matrix";
import { useState } from "react";
// eslint-disable-next-line import-x/no-internal-modules
import "@kairoui-pro/permission-matrix/styles.css";

const ROLES: readonly PermissionSubject[] = [
  { id: "admin", label: "Admin" },
  { id: "member", label: "Member" },
  { id: "guest", label: "Guest" },
];

const PERMISSIONS: readonly PermissionAction[] = [
  { id: "read", label: "Read" },
  { id: "write", label: "Write" },
  { id: "delete", label: "Delete" },
  { id: "admin", label: "Administer" },
];

function seedCells(): readonly PermissionCell[] {
  return [
    { subjectId: "admin", actionId: "read", state: "granted" },
    { subjectId: "admin", actionId: "write", state: "granted" },
    { subjectId: "admin", actionId: "delete", state: "granted" },
    { subjectId: "admin", actionId: "admin", state: "granted" },
    { subjectId: "member", actionId: "read", state: "granted" },
    { subjectId: "member", actionId: "write", state: "granted" },
    { subjectId: "member", actionId: "delete", state: "denied" },
    { subjectId: "member", actionId: "admin", state: "denied" },
    { subjectId: "guest", actionId: "read", state: "granted" },
    { subjectId: "guest", actionId: "write", state: "denied" },
    { subjectId: "guest", actionId: "delete", state: "denied" },
    { subjectId: "guest", actionId: "admin", state: "denied" },
  ];
}

function BasicMatrix() {
  const [cells, setCells] = useState<readonly PermissionCell[]>(seedCells);
  return (
    <div style={{ width: 640 }}>
      <PermissionMatrix
        subjects={ROLES}
        actions={PERMISSIONS}
        cells={cells}
        toggleMode="grant-deny"
        enableSearch
        onCellChange={({ subject, action, toState }) => {
          setCells((prev) => {
            const idx = prev.findIndex(
              (c) => c.subjectId === subject.id && c.actionId === action.id,
            );
            const next = [...prev];
            if (idx >= 0) {
              next[idx] = { subjectId: subject.id, actionId: action.id, state: toState };
            } else {
              next.push({ subjectId: subject.id, actionId: action.id, state: toState });
            }
            return next;
          });
        }}
        onBulkChange={({ changes }) => {
          setCells((prev) => {
            const map = new Map(prev.map((c) => [`${c.subjectId}\u0000${c.actionId}`, c]));
            for (const change of changes) {
              map.set(`${change.subjectId}\u0000${change.actionId}`, {
                subjectId: change.subjectId,
                actionId: change.actionId,
                state: change.toState,
              });
            }
            return Array.from(map.values());
          });
        }}
      />
    </div>
  );
}

function InheritedStates() {
  const inheritedCells: readonly PermissionCell[] = [
    ...seedCells(),
    { subjectId: "guest", actionId: "read", state: "inherited" },
  ];
  return (
    <div style={{ width: 640 }}>
      <PermissionMatrix
        subjects={ROLES}
        actions={PERMISSIONS}
        cells={inheritedCells}
        toggleMode="grant-deny"
      />
    </div>
  );
}

function ReadOnly() {
  return (
    <div style={{ width: 640 }}>
      <PermissionMatrix subjects={ROLES} actions={PERMISSIONS} cells={seedCells()} readOnly />
    </div>
  );
}

function ResourceActionMode() {
  const resources: readonly PermissionSubject[] = [
    { id: "workspace-1", label: "Workspace A" },
    { id: "workspace-2", label: "Workspace B" },
  ];
  const actions: readonly PermissionAction[] = [
    { id: "read", label: "Read" },
    { id: "write", label: "Write" },
  ];
  const cells: readonly PermissionCell[] = [
    { subjectId: "workspace-1", actionId: "read", state: "granted" },
    { subjectId: "workspace-1", actionId: "write", state: "denied" },
    { subjectId: "workspace-2", actionId: "read", state: "granted" },
  ];
  return (
    <div style={{ width: 640 }}>
      <PermissionMatrix
        mode="resource-action"
        subjects={resources}
        actions={actions}
        cells={cells}
      />
    </div>
  );
}

const meta: Meta<typeof PermissionMatrix> = {
  title: "Pro / Permission Matrix",
  component: PermissionMatrix,
  parameters: {
    docs: {
      description: {
        component:
          "Backend-agnostic Permission Matrix. Consumer-supplied subjects, actions, and cells; tri-state cells; bulk row/column/all actions. Ships in `@kairoui-pro/permission-matrix`.",
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof PermissionMatrix>;

export const Default: Story = { render: () => <BasicMatrix /> };
export const InheritedAndIndeterminate: Story = { render: () => <InheritedStates /> };
export const ReadOnlyMatrix: Story = { render: () => <ReadOnly /> };
export const ResourceActionModeStory: Story = { render: () => <ResourceActionMode /> };
