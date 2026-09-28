import type { CommandItem, CommandItemId, CommandPageId, CommandState } from "./command-types";

// ─── Empty state ───────────────────────────────────────────────────

export const EMPTY_COMMAND_STATE: CommandState = {
  open: false,
  query: "",
  highlightedId: null,
  pageStack: [],
};

// ─── Selectors ─────────────────────────────────────────────────────

/** Top page ID in the nested-page stack, or `null` when on the root page. */
export function currentPageId(state: CommandState): CommandPageId | null {
  const top = state.pageStack[state.pageStack.length - 1];
  return top ?? null;
}

// ─── Transitions ──────────────────────────────────────────────────

export function openPalette(state: CommandState): CommandState {
  if (state.open) return state;
  return { ...state, open: true };
}

/**
 * Close the palette. The reducer also resets query, highlight, and page
 * stack so the next open starts from a clean base — consumers may
 * override any slice via a controlled prop.
 */
export function closePalette(state: CommandState): CommandState {
  if (!state.open && state.query === "" && state.pageStack.length === 0) return state;
  return {
    open: false,
    query: "",
    highlightedId: null,
    pageStack: [],
  };
}

export function setQuery(state: CommandState, query: string): CommandState {
  if (state.query === query) return state;
  return { ...state, query };
}

export function setHighlight(state: CommandState, id: CommandItemId | null): CommandState {
  if (state.highlightedId === id) return state;
  return { ...state, highlightedId: id };
}

/**
 * Push a nested page onto the stack and reset the query so the child
 * page starts with a fresh search.
 */
export function pushPage(state: CommandState, pageId: CommandPageId): CommandState {
  const top = state.pageStack[state.pageStack.length - 1];
  if (top === pageId) return state;
  return {
    ...state,
    query: "",
    highlightedId: null,
    pageStack: [...state.pageStack, pageId],
  };
}

/**
 * Pop the top nested page. When the stack is empty this is a no-op —
 * consumers close the palette explicitly on Escape at the root page.
 */
export function popPage(state: CommandState): CommandState {
  if (state.pageStack.length === 0) return state;
  return {
    ...state,
    query: "",
    highlightedId: null,
    pageStack: state.pageStack.slice(0, -1),
  };
}

// ─── Highlight helpers ─────────────────────────────────────────────

/**
 * Return the index of the currently-highlighted visible item, or `-1`
 * when no item is highlighted or the highlighted ID is not in the
 * visible set (which happens when the query filters it out).
 */
export function findHighlightIndex(
  visible: readonly CommandItem[],
  highlightedId: CommandItemId | null,
): number {
  if (highlightedId === null) return -1;
  for (let i = 0; i < visible.length; i++) {
    const item = visible[i];
    if (item?.id === highlightedId) return i;
  }
  return -1;
}

/**
 * Move the highlight by `delta` visible items. Wraps around the ends
 * (Radix / Combobox convention) so `ArrowUp` at the top jumps to the
 * bottom. Skips disabled items during traversal.
 */
export function moveHighlight(
  visible: readonly CommandItem[],
  highlightedId: CommandItemId | null,
  delta: 1 | -1,
): CommandItemId | null {
  if (visible.length === 0) return null;
  const enabledIndexes: number[] = [];
  for (let i = 0; i < visible.length; i++) {
    const item = visible[i];
    if (item && !item.disabled) enabledIndexes.push(i);
  }
  if (enabledIndexes.length === 0) return null;

  const currentIndex = findHighlightIndex(visible, highlightedId);
  const currentEnabled = enabledIndexes.indexOf(currentIndex);
  let next: number;
  if (currentEnabled === -1) {
    next = delta === 1 ? 0 : enabledIndexes.length - 1;
  } else {
    next = (currentEnabled + delta + enabledIndexes.length) % enabledIndexes.length;
  }
  const idx = enabledIndexes[next];
  if (idx === undefined) return null;
  const item = visible[idx];
  return item ? item.id : null;
}

/**
 * Snap the highlight to the first / last enabled visible item. Used by
 * `Home` / `End`.
 */
export function snapHighlight(
  visible: readonly CommandItem[],
  edge: "first" | "last",
): CommandItemId | null {
  if (visible.length === 0) return null;
  if (edge === "first") {
    for (const item of visible) {
      if (!item.disabled) return item.id;
    }
    return null;
  }
  for (let i = visible.length - 1; i >= 0; i--) {
    const item = visible[i];
    if (item && !item.disabled) return item.id;
  }
  return null;
}
