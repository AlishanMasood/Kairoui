// Scheduler default key bindings. Consumers override any subset via
// the `keymap` prop on `<Scheduler>`. Every action is dispatched from
// the root's `onKeyDown` handler and receives a small `KeymapContext`
// object with the current state and callbacks.
//
// See docs/architecture/PHASE14-SCHEDULER-ARCHITECTURE.md § Keyboard
// Navigation Model for the design.

/** Scheduler keymap action identifiers. */
export type SchedulerAction =
  | "prev"
  | "next"
  | "today"
  | "activate"
  | "cancel"
  | "moveUp"
  | "moveDown"
  | "moveLeft"
  | "moveRight"
  | "resizeEndUp"
  | "resizeEndDown"
  | "resizeStartUp"
  | "resizeStartDown"
  | "prevDay"
  | "nextDay"
  | "delete";

/**
 * Descriptor for one key binding. Modifier flags default to `false`;
 * a modifier must match exactly (a binding with `shift: false` does
 * not fire when Shift is pressed).
 */
export interface SchedulerKeyBinding {
  readonly key: string;
  readonly action: SchedulerAction;
  readonly shift?: boolean;
  readonly ctrl?: boolean;
  readonly alt?: boolean;
  readonly meta?: boolean;
}

export type SchedulerKeymap = readonly SchedulerKeyBinding[];

/** Default key bindings. See ADR § Keyboard Navigation Model. */
export const DEFAULT_SCHEDULER_KEYMAP: SchedulerKeymap = [
  { key: "ArrowUp", action: "moveUp" },
  { key: "ArrowDown", action: "moveDown" },
  { key: "ArrowLeft", action: "moveLeft" },
  { key: "ArrowRight", action: "moveRight" },
  { key: "ArrowUp", action: "resizeEndUp", shift: true },
  { key: "ArrowDown", action: "resizeEndDown", shift: true },
  { key: "ArrowUp", action: "resizeStartUp", ctrl: true },
  { key: "ArrowDown", action: "resizeStartDown", ctrl: true },
  { key: "ArrowLeft", action: "prevDay", alt: true },
  { key: "ArrowRight", action: "nextDay", alt: true },
  { key: "Enter", action: "activate" },
  { key: "F2", action: "activate" },
  { key: " ", action: "activate" },
  { key: "Escape", action: "cancel" },
  { key: "PageUp", action: "prev" },
  { key: "PageDown", action: "next" },
  { key: "Home", action: "today" },
  { key: "Delete", action: "delete" },
  { key: "Backspace", action: "delete" },
];

/**
 * Resolves a keyboard event against a keymap. Returns the first
 * matching action, or `null` when no binding matches. Modifier flags
 * must match exactly — a `shift: true` binding never fires without
 * Shift, and a `shift: false` (default) binding never fires with it.
 */
export function resolveKeymapAction(
  event: {
    readonly key: string;
    readonly shiftKey: boolean;
    readonly ctrlKey: boolean;
    readonly altKey: boolean;
    readonly metaKey: boolean;
  },
  keymap: SchedulerKeymap,
): SchedulerAction | null {
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
