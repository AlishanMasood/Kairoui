// Workflow default key bindings. Arrow direction depends on
// orientation; the runtime resolves that mapping.

export type WorkflowAction =
  "moveFocusPrevious" | "moveFocusNext" | "moveFocusFirst" | "moveFocusLast" | "activate";

export interface WorkflowKeyBinding {
  readonly key: string;
  readonly action: WorkflowAction;
  readonly shift?: boolean;
  readonly ctrl?: boolean;
  readonly alt?: boolean;
  readonly meta?: boolean;
}

export type WorkflowKeymap = readonly WorkflowKeyBinding[];

/**
 * Orientation-independent bindings. The consumer's `orientation`
 * prop determines whether Left/Right or Up/Down are treated as
 * previous/next.
 */
export const DEFAULT_WORKFLOW_KEYMAP: WorkflowKeymap = [
  { key: "ArrowLeft", action: "moveFocusPrevious" },
  { key: "ArrowRight", action: "moveFocusNext" },
  { key: "ArrowUp", action: "moveFocusPrevious" },
  { key: "ArrowDown", action: "moveFocusNext" },
  { key: "Home", action: "moveFocusFirst" },
  { key: "End", action: "moveFocusLast" },
  { key: "Enter", action: "activate" },
  { key: " ", action: "activate" },
];

export function resolveWorkflowAction(
  event: {
    readonly key: string;
    readonly shiftKey: boolean;
    readonly ctrlKey: boolean;
    readonly altKey: boolean;
    readonly metaKey: boolean;
  },
  keymap: WorkflowKeymap,
): WorkflowAction | null {
  for (const binding of keymap) {
    if (binding.key !== event.key) continue;
    if ((binding.shift ?? false) !== event.shiftKey) continue;
    if ((binding.ctrl ?? false) !== event.ctrlKey) continue;
    if ((binding.alt ?? false) !== event.altKey) continue;
    if ((binding.meta ?? false) !== event.metaKey) continue;
    return binding.action;
  }
  return null;
}
