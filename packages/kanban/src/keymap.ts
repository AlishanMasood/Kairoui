// Kanban default key bindings. Consumers override any subset via the
// `keymap` prop on `<Kanban>`.
//
// See docs/architecture/PHASE14-KANBAN-ARCHITECTURE.md § Keyboard
// Model.

export type KanbanAction =
  | "moveFocusUp"
  | "moveFocusDown"
  | "moveFocusLeft"
  | "moveFocusRight"
  | "moveFocusHome"
  | "moveFocusEnd"
  | "moveFocusBoardHome"
  | "moveFocusBoardEnd"
  | "activate"
  | "pickup"
  | "commit"
  | "cancel"
  | "delete";

export interface KanbanKeyBinding {
  readonly key: string;
  readonly action: KanbanAction;
  readonly shift?: boolean;
  readonly ctrl?: boolean;
  readonly alt?: boolean;
  readonly meta?: boolean;
}

export type KanbanKeymap = readonly KanbanKeyBinding[];

/** Default key bindings for card-focused keyboard interactions. */
export const DEFAULT_KANBAN_KEYMAP: KanbanKeymap = [
  { key: "ArrowUp", action: "moveFocusUp" },
  { key: "ArrowDown", action: "moveFocusDown" },
  { key: "ArrowLeft", action: "moveFocusLeft" },
  { key: "ArrowRight", action: "moveFocusRight" },
  { key: "Home", action: "moveFocusHome" },
  { key: "End", action: "moveFocusEnd" },
  { key: "Home", action: "moveFocusBoardHome", ctrl: true },
  { key: "End", action: "moveFocusBoardEnd", ctrl: true },
  { key: "Enter", action: "activate" },
  { key: "F2", action: "activate" },
  { key: "Escape", action: "cancel" },
  { key: "Delete", action: "delete" },
  { key: "Backspace", action: "delete" },
];

/**
 * Resolves a keyboard event against a keymap. Returns the first
 * matching action, or `null` when no binding matches. Modifier flags
 * must match exactly.
 */
export function resolveKanbanAction(
  event: {
    readonly key: string;
    readonly shiftKey: boolean;
    readonly ctrlKey: boolean;
    readonly altKey: boolean;
    readonly metaKey: boolean;
  },
  keymap: KanbanKeymap,
): KanbanAction | null {
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
