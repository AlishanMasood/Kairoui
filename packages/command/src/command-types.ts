import type { ReactNode } from "react";

// ─── Item identity ─────────────────────────────────────────────────

export type CommandItemId = string;
export type CommandGroupId = string;
export type CommandPageId = string;

// ─── Item shape (registered by <Command.Item>) ─────────────────────

/**
 * Runtime shape of a command item, produced by `<Command.Item>` when it
 * registers with the palette. The consumer never constructs this
 * directly — it exists so filter functions and controlled-state
 * consumers can inspect items uniformly.
 */
export interface CommandItem {
  readonly id: CommandItemId;
  /** Group this item belongs to, or `null` when it lives at the top level. */
  readonly groupId: CommandGroupId | null;
  /** Nested page this item is visible on, or `null` for the root page. */
  readonly pageId: CommandPageId | null;
  /**
   * Consumer-supplied text used by the default filter. Falls back to the
   * item's rendered text content when omitted.
   */
  readonly searchText: string;
  /** Optional keywords used by the default filter (searched independently). */
  readonly keywords: readonly string[];
  readonly disabled: boolean;
  /** Consumer callback fired when this item is executed. */
  readonly onSelect: () => void;
}

// ─── Filter ────────────────────────────────────────────────────────

/**
 * Consumer-supplied filter. Return `true` to keep the item visible.
 * The default filter uses a case-insensitive word-boundary substring
 * match on the item's `searchText` and `keywords`.
 */
export type CommandFilter = (item: CommandItem, query: string) => boolean;

// ─── State ─────────────────────────────────────────────────────────

/**
 * Palette state slice. `pageStack` is empty on the root page; each entry
 * is the `pageId` of a nested command page pushed via
 * `context.pushPage(id)` inside an item's `onSelect`.
 */
export interface CommandState {
  readonly open: boolean;
  readonly query: string;
  readonly highlightedId: CommandItemId | null;
  readonly pageStack: readonly CommandPageId[];
}

// ─── Root component props ──────────────────────────────────────────

/** Common a11y labelling props shared by the palette dialog. */
export interface CommandAccessibilityProps {
  readonly "aria-label"?: string;
  readonly "aria-labelledby"?: string;
  readonly "aria-describedby"?: string;
}

/**
 * `<Command.Root>` props. The root owns state and item registration;
 * every other palette component reads from its context.
 */
export interface CommandRootProps {
  // Controlled / uncontrolled open state.
  readonly open?: boolean;
  readonly defaultOpen?: boolean;
  readonly onOpenChange?: (open: boolean) => void;

  // Controlled / uncontrolled search query.
  readonly query?: string;
  readonly defaultQuery?: string;
  readonly onQueryChange?: (query: string) => void;

  // Controlled highlighted item.
  readonly highlightedId?: CommandItemId | null;
  readonly defaultHighlightedId?: CommandItemId | null;
  readonly onHighlightChange?: (id: CommandItemId | null) => void;

  // Controlled page stack.
  readonly pageStack?: readonly CommandPageId[];
  readonly defaultPageStack?: readonly CommandPageId[];
  readonly onPageStackChange?: (pages: readonly CommandPageId[]) => void;

  /** Custom item filter — overrides the default word-match filter. */
  readonly filter?: CommandFilter;
  /** Human-friendly label announced to assistive tech (defaults to `"Command palette"`). */
  readonly label?: string;
  /** Fired after an item's `onSelect` runs. Consumers commonly close the palette here. */
  readonly onItemSelect?: (item: CommandItem) => void;

  readonly children?: ReactNode;
}

// ─── Anatomy component props ───────────────────────────────────────

export interface CommandTriggerProps {
  readonly children?: ReactNode;
  readonly className?: string;
  readonly id?: string;
  readonly "aria-label"?: string;
  readonly disabled?: boolean;
}

export interface CommandDialogProps extends CommandAccessibilityProps {
  readonly children?: ReactNode;
  readonly className?: string;
  /**
   * Container element for the portal. Defaults to `document.body`.
   * `null` disables portalling and renders in-place.
   */
  readonly container?: HTMLElement | null;
  /** Renders the dialog even when closed (`display: none`). Default `false`. */
  readonly forceMount?: boolean;
  /** Called after the dialog opens and focus lands on the input. */
  readonly onOpenAutoFocus?: (event: Event) => void;
  /** Called when the dialog closes; consumer may `event.preventDefault()`. */
  readonly onCloseAutoFocus?: (event: Event) => void;
}

export interface CommandInputProps {
  readonly placeholder?: string;
  readonly className?: string;
  readonly id?: string;
  readonly autoFocus?: boolean;
  readonly "aria-label"?: string;
}

export interface CommandListProps {
  readonly children?: ReactNode;
  readonly className?: string;
  readonly id?: string;
  readonly "aria-label"?: string;
}

export interface CommandGroupProps {
  /** Stable identifier — used as the base for the heading's `id`. */
  readonly id: CommandGroupId;
  /** Human-friendly heading. */
  readonly heading?: ReactNode;
  /** Restrict the group to a nested page. `null`/undefined = root page. */
  readonly pageId?: CommandPageId | null;
  readonly children?: ReactNode;
  readonly className?: string;
}

export interface CommandItemProps {
  readonly id: CommandItemId;
  /** Optional keywords used by the default filter. */
  readonly keywords?: readonly string[];
  /** Explicit search text — overrides the auto-derived rendered text. */
  readonly searchText?: string;
  readonly disabled?: boolean;
  /** Consumer callback fired when the item is executed. */
  readonly onSelect?: () => void;
  readonly children?: ReactNode;
  readonly className?: string;
}

export interface CommandSeparatorProps {
  readonly className?: string;
  readonly id?: string;
}

export interface CommandEmptyProps {
  readonly children?: ReactNode;
  readonly className?: string;
}
