import { useEffect } from "react";
import { useEventCallback } from "@kairoui/hooks";

// ─── Shortcut binding ─────────────────────────────────────────────

export interface CommandShortcutOptions {
  /** Ctrl/Cmd + K by default. Set `false` for a specific field to opt out. */
  readonly ctrlOrMeta?: boolean;
  readonly shift?: boolean;
  readonly alt?: boolean;
  /** Case-insensitive key literal. */
  readonly key: string;
  /** When `false`, the shortcut is not attached. Useful for feature flags. */
  readonly enabled?: boolean;
  /**
   * Element the listener attaches to. Defaults to `document`. Pass a
   * ref to scope the shortcut to a subtree.
   */
  readonly target?: HTMLElement | Document | null;
  /** Fired when the shortcut matches. `event.preventDefault()` before calling. */
  readonly onTrigger: (event: KeyboardEvent) => void;
}

function matchesModifiers(
  event: KeyboardEvent,
  ctrlOrMeta: boolean,
  shift: boolean,
  alt: boolean,
): boolean {
  const hasCtrlOrMeta = event.ctrlKey || event.metaKey;
  if (ctrlOrMeta && !hasCtrlOrMeta) return false;
  if (!ctrlOrMeta && hasCtrlOrMeta) return false;
  if (shift !== event.shiftKey) return false;
  if (alt !== event.altKey) return false;
  return true;
}

/**
 * Attach a keyboard-shortcut listener that fires `onTrigger` when the
 * modifiers + key match. Consumers wire it to `Command.setOpen(true)`
 * to bring up the palette globally.
 *
 * This hook does **not** open a global command registry — it only
 * subscribes to a key combination. KUI-ENT-001 forbids a shared
 * registry unless separately approved.
 */
export function useCommandShortcut(options: CommandShortcutOptions): void {
  const {
    ctrlOrMeta = true,
    shift = false,
    alt = false,
    key,
    enabled = true,
    target,
    onTrigger,
  } = options;

  const onTriggerStable = useEventCallback(onTrigger);
  const wanted = key.toLowerCase();

  useEffect(() => {
    if (!enabled) return;
    if (typeof window === "undefined") return;
    const el = target ?? document;
    const handler = (event: Event): void => {
      const kb = event as KeyboardEvent;
      if (kb.key.toLowerCase() !== wanted) return;
      if (!matchesModifiers(kb, ctrlOrMeta, shift, alt)) return;
      onTriggerStable(kb);
    };
    el.addEventListener("keydown", handler);
    return () => {
      el.removeEventListener("keydown", handler);
    };
  }, [alt, ctrlOrMeta, enabled, onTriggerStable, shift, target, wanted]);
}
