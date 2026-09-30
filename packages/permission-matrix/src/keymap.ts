// Permission Matrix default key bindings.

export type PermissionMatrixAction =
  | "moveFocusUp"
  | "moveFocusDown"
  | "moveFocusLeft"
  | "moveFocusRight"
  | "moveFocusHome"
  | "moveFocusEnd"
  | "moveFocusGridHome"
  | "moveFocusGridEnd"
  | "moveFocusPageUp"
  | "moveFocusPageDown"
  | "toggle"
  | "selectRow"
  | "selectColumn"
  | "selectAll"
  | "clearSelection"
  | "focusSearch";

export interface PermissionMatrixKeyBinding {
  readonly key: string;
  readonly action: PermissionMatrixAction;
  readonly shift?: boolean;
  readonly ctrl?: boolean;
  readonly alt?: boolean;
  readonly meta?: boolean;
}

export type PermissionMatrixKeymap = readonly PermissionMatrixKeyBinding[];

export const DEFAULT_PERMISSION_MATRIX_KEYMAP: PermissionMatrixKeymap = [
  { key: "ArrowUp", action: "moveFocusUp" },
  { key: "ArrowDown", action: "moveFocusDown" },
  { key: "ArrowLeft", action: "moveFocusLeft" },
  { key: "ArrowRight", action: "moveFocusRight" },
  { key: "Home", action: "moveFocusHome" },
  { key: "End", action: "moveFocusEnd" },
  { key: "Home", action: "moveFocusGridHome", ctrl: true },
  { key: "End", action: "moveFocusGridEnd", ctrl: true },
  { key: "PageUp", action: "moveFocusPageUp" },
  { key: "PageDown", action: "moveFocusPageDown" },
  { key: " ", action: "toggle" },
  { key: "Enter", action: "toggle" },
  { key: " ", action: "selectRow", shift: true },
  { key: " ", action: "selectColumn", ctrl: true },
  { key: "a", action: "selectAll", ctrl: true },
  { key: "A", action: "selectAll", ctrl: true },
  { key: "Escape", action: "clearSelection" },
  { key: "f", action: "focusSearch", ctrl: true },
  { key: "F", action: "focusSearch", ctrl: true },
];

/**
 * Resolves a keyboard event against the keymap. Returns the first
 * matching action, or `null` when no binding matches. Modifier flags
 * match exactly.
 */
export function resolvePermissionMatrixAction(
  event: {
    readonly key: string;
    readonly shiftKey: boolean;
    readonly ctrlKey: boolean;
    readonly altKey: boolean;
    readonly metaKey: boolean;
  },
  keymap: PermissionMatrixKeymap,
): PermissionMatrixAction | null {
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
