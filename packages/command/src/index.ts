// @kairoui-pro/command — public API surface.
//
// Enterprise Command Palette for KairoUI. Reuses `@kairoui/core`
// overlay + collection primitives. See
// docs/architecture/PHASE14-ENTERPRISE-ARCHITECTURE.md for the
// full contract.

export type {
  CommandAccessibilityProps,
  CommandDialogProps,
  CommandEmptyProps,
  CommandFilter,
  CommandGroupId,
  CommandGroupProps,
  CommandInputProps,
  CommandItem,
  CommandItemId,
  CommandItemProps,
  CommandListProps,
  CommandPageId,
  CommandRootProps,
  CommandSeparatorProps,
  CommandState,
  CommandTriggerProps,
} from "./command-types";

export { applyFilter, defaultFilter, filterByPage, tokenizeQuery } from "./command-filter";

export {
  EMPTY_COMMAND_STATE,
  closePalette,
  currentPageId,
  findHighlightIndex,
  moveHighlight,
  openPalette,
  popPage,
  pushPage,
  setHighlight,
  setQuery,
  snapHighlight,
} from "./command-state";

export {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItemComponent,
  CommandList,
  CommandRoot,
  CommandSeparator,
  CommandTrigger,
  useCommand,
} from "./command";

export { useCommandShortcut } from "./use-command-shortcut";
export type { CommandShortcutOptions } from "./use-command-shortcut";
