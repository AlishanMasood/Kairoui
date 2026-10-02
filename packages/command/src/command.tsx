import {
  createContext,
  createElement,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  ChangeEvent,
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent,
  ReactNode,
} from "react";
import { useControllableState, useEventCallback, useMergedRefs } from "@kairoui/hooks";
// eslint-disable-next-line import-x/no-internal-modules
import { DismissableLayer, FocusScope, Portal } from "@kairoui/core/components/overlay/command";
import type {
  CommandDialogProps,
  CommandEmptyProps,
  CommandFilter,
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
import { applyFilter, defaultFilter as defaultCommandFilter, filterByPage } from "./command-filter";
import {
  closePalette,
  currentPageId,
  moveHighlight,
  popPage as reducePopPage,
  pushPage as reducePushPage,
  setHighlight as reduceSetHighlight,
  setQuery as reduceSetQuery,
  snapHighlight,
} from "./command-state";

// ─── Contexts ──────────────────────────────────────────────────────

const EMPTY_PAGE_STACK: readonly CommandPageId[] = [];

interface CommandContextValue {
  readonly state: CommandState;
  readonly filter: CommandFilter;
  readonly triggerId: string;
  readonly dialogId: string;
  readonly inputId: string;
  readonly listId: string;
  readonly label: string;
  readonly setTriggerElement: (el: HTMLElement | null) => void;
  readonly setInputElement: (el: HTMLInputElement | null) => void;
  readonly getTriggerElement: () => HTMLElement | null;
  readonly getInputElement: () => HTMLInputElement | null;
  readonly registerItem: (item: CommandItem) => () => void;
  readonly items: readonly CommandItem[];
  readonly visibleItems: readonly CommandItem[];
  readonly setOpen: (open: boolean) => void;
  readonly setQuery: (query: string) => void;
  readonly setHighlight: (id: CommandItemId | null) => void;
  readonly pushPage: (pageId: CommandPageId) => void;
  readonly popPage: () => void;
  readonly closePalette: () => void;
  readonly executeItem: (item: CommandItem) => void;
}

const CommandContext = createContext<CommandContextValue | null>(null);
CommandContext.displayName = "CommandContext";

function useCommandContext(hookName: string): CommandContextValue {
  const ctx = useContext(CommandContext);
  if (!ctx) {
    throw new Error(`${hookName} must be used inside <Command.Root>`);
  }
  return ctx;
}

interface CommandGroupContextValue {
  readonly groupId: string;
  readonly pageId: CommandPageId | null;
}

const CommandGroupContext = createContext<CommandGroupContextValue | null>(null);
CommandGroupContext.displayName = "CommandGroupContext";

// ─── Root ──────────────────────────────────────────────────────────

function CommandRoot(props: CommandRootProps): ReactNode {
  const {
    open: openProp,
    defaultOpen,
    onOpenChange,
    query: queryProp,
    defaultQuery,
    onQueryChange,
    highlightedId: highlightedProp,
    defaultHighlightedId,
    onHighlightChange,
    pageStack: pageStackProp,
    defaultPageStack,
    onPageStackChange,
    filter,
    label = "Command palette",
    onItemSelect,
    children,
  } = props;

  const [open, setOpenRaw] = useControllableState<boolean>({
    value: openProp,
    defaultValue: defaultOpen ?? false,
    ...(onOpenChange ? { onChange: onOpenChange } : undefined),
    name: "Command",
    state: "open",
  });

  const [query, setQueryRaw] = useControllableState<string>({
    value: queryProp,
    defaultValue: defaultQuery ?? "",
    ...(onQueryChange ? { onChange: onQueryChange } : undefined),
    name: "Command",
    state: "query",
  });

  const [highlightedId, setHighlightRaw] = useControllableState<CommandItemId | null>({
    value: highlightedProp,
    defaultValue: defaultHighlightedId ?? null,
    ...(onHighlightChange ? { onChange: onHighlightChange } : undefined),
    name: "Command",
    state: "highlightedId",
  });

  const [pageStack, setPageStackRaw] = useControllableState<readonly CommandPageId[]>({
    value: pageStackProp,
    defaultValue: defaultPageStack === undefined ? EMPTY_PAGE_STACK : defaultPageStack,
    ...(onPageStackChange ? { onChange: onPageStackChange } : undefined),
    name: "Command",
    state: "pageStack",
  });

  const state: CommandState = useMemo(
    () => ({ open, query, highlightedId, pageStack }),
    [highlightedId, open, pageStack, query],
  );

  const activeFilter = filter ?? defaultCommandFilter;
  const onItemSelectStable = useEventCallback(onItemSelect ?? (() => undefined));

  // ─── Item registry ────────────────────────────────────────────
  // Items register in mount order. The `items` array is derived from an
  // internal `Map` snapshot so state updates are cheap and React can
  // re-render the palette when items appear or disappear.
  const [items, setItems] = useState<readonly CommandItem[]>([]);

  const registerItem = useCallback((item: CommandItem) => {
    setItems((prev) => {
      const next = prev.filter((it) => it.id !== item.id);
      next.push(item);
      return next;
    });
    return () => {
      setItems((prev) => prev.filter((it) => it.id !== item.id));
    };
  }, []);

  // Only items on the current page participate in filtering.
  const pageId = currentPageId(state);
  const pageItems = useMemo(() => filterByPage(items, pageId), [items, pageId]);
  const visibleItems = useMemo(
    () => applyFilter(pageItems, query, activeFilter),
    [activeFilter, pageItems, query],
  );

  // Ensure the highlight lands on a valid visible item whenever the visible
  // set changes (initial mount, query change, page transition).
  useEffect(() => {
    if (visibleItems.length === 0) {
      if (highlightedId !== null) setHighlightRaw(() => null);
      return;
    }
    const stillVisible = visibleItems.some((it) => it.id === highlightedId);
    if (!stillVisible) {
      const first = snapHighlight(visibleItems, "first");
      if (first !== highlightedId) setHighlightRaw(() => first);
    }
  }, [highlightedId, setHighlightRaw, visibleItems]);

  // Reset transient slices whenever the palette closes.
  useEffect(() => {
    if (open) return;
    if (query !== "") setQueryRaw(() => "");
    if (highlightedId !== null) setHighlightRaw(() => null);
    if (pageStack.length !== 0) setPageStackRaw(() => []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // ─── Public setters ────────────────────────────────────────────
  const triggerRef = useRef<HTMLElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const generatedTriggerId = useId();
  const generatedDialogId = useId();
  const generatedInputId = useId();
  const generatedListId = useId();

  const setTriggerElement = useCallback((el: HTMLElement | null) => {
    triggerRef.current = el;
  }, []);
  const setInputElement = useCallback((el: HTMLInputElement | null) => {
    inputRef.current = el;
  }, []);
  const getTriggerElement = useCallback(() => triggerRef.current, []);
  const getInputElement = useCallback(() => inputRef.current, []);

  const setOpen = useCallback(
    (next: boolean) => {
      setOpenRaw((prev) =>
        next ? (prev ? prev : true) : closePalette({ ...state, open: prev }).open,
      );
    },
    [setOpenRaw, state],
  );

  const setQuery = useCallback(
    (next: string) => {
      setQueryRaw((prev) => reduceSetQuery({ ...state, query: prev }, next).query);
    },
    [setQueryRaw, state],
  );

  const setHighlight = useCallback(
    (next: CommandItemId | null) => {
      setHighlightRaw(
        (prev) => reduceSetHighlight({ ...state, highlightedId: prev }, next).highlightedId,
      );
    },
    [setHighlightRaw, state],
  );

  const pushPage = useCallback(
    (nextId: CommandPageId) => {
      const nextState = reducePushPage(state, nextId);
      if (nextState.pageStack !== state.pageStack) setPageStackRaw(() => nextState.pageStack);
      if (nextState.query !== state.query) setQueryRaw(() => nextState.query);
      if (nextState.highlightedId !== state.highlightedId) {
        setHighlightRaw(() => nextState.highlightedId);
      }
    },
    [setHighlightRaw, setPageStackRaw, setQueryRaw, state],
  );

  const popPage = useCallback(() => {
    const nextState = reducePopPage(state);
    if (nextState.pageStack !== state.pageStack) setPageStackRaw(() => nextState.pageStack);
    if (nextState.query !== state.query) setQueryRaw(() => nextState.query);
    if (nextState.highlightedId !== state.highlightedId) {
      setHighlightRaw(() => nextState.highlightedId);
    }
  }, [setHighlightRaw, setPageStackRaw, setQueryRaw, state]);

  const closePaletteCb = useCallback(() => {
    setOpenRaw(() => false);
  }, [setOpenRaw]);

  const executeItem = useCallback(
    (item: CommandItem) => {
      if (item.disabled) return;
      try {
        item.onSelect();
      } finally {
        onItemSelectStable(item);
      }
    },
    [onItemSelectStable],
  );

  const contextValue: CommandContextValue = useMemo(
    () => ({
      state,
      filter: activeFilter,
      triggerId: generatedTriggerId,
      dialogId: generatedDialogId,
      inputId: generatedInputId,
      listId: generatedListId,
      label,
      setTriggerElement,
      setInputElement,
      getTriggerElement,
      getInputElement,
      registerItem,
      items,
      visibleItems,
      setOpen,
      setQuery,
      setHighlight,
      pushPage,
      popPage,
      closePalette: closePaletteCb,
      executeItem,
    }),
    [
      activeFilter,
      closePaletteCb,
      executeItem,
      generatedDialogId,
      generatedInputId,
      generatedListId,
      generatedTriggerId,
      getInputElement,
      getTriggerElement,
      items,
      label,
      popPage,
      pushPage,
      registerItem,
      setHighlight,
      setInputElement,
      setOpen,
      setQuery,
      setTriggerElement,
      state,
      visibleItems,
    ],
  );

  return createElement(
    CommandContext.Provider,
    // eslint-disable-next-line react-hooks/refs
    { value: contextValue },
    children,
  );
}

// ─── Trigger ───────────────────────────────────────────────────────

const CommandTrigger = forwardRef<HTMLButtonElement, CommandTriggerProps>(
  function CommandTrigger(props, forwardedRef) {
    const ctx = useCommandContext("Command.Trigger");
    const { children, className, id, disabled, ...rest } = props;
    const mergedRef = useMergedRefs<HTMLButtonElement>(forwardedRef, ctx.setTriggerElement);
    return createElement(
      "button",

      {
        ref: mergedRef,
        type: "button",
        id: id ?? ctx.triggerId,
        "data-kui-slot": "CommandTrigger",
        "data-state": ctx.state.open ? "open" : "closed",
        "aria-haspopup": "dialog",
        "aria-expanded": ctx.state.open,
        "aria-controls": ctx.state.open ? ctx.dialogId : undefined,
        className,
        disabled,
        onClick: () => {
          if (disabled) return;
          ctx.setOpen(!ctx.state.open);
        },
        ...rest,
      },
      children,
    );
  },
);

// ─── Dialog ────────────────────────────────────────────────────────

function CommandDialog(props: CommandDialogProps): ReactNode {
  const ctx = useCommandContext("Command.Dialog");
  const {
    children,
    className,
    container,
    forceMount = false,
    onOpenAutoFocus,
    onCloseAutoFocus,
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledby,
    "aria-describedby": ariaDescribedby,
  } = props;

  const isOpen = ctx.state.open;
  const shouldRender = forceMount || isOpen;

  const inputRefForScope = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    if (!isOpen) return;
    inputRefForScope.current = ctx.getInputElement();
  }, [ctx, isOpen]);

  // Restore focus to the trigger when the dialog closes.
  const wasOpenRef = useRef(false);
  useEffect(() => {
    if (isOpen) {
      wasOpenRef.current = true;
      return;
    }
    if (wasOpenRef.current) {
      wasOpenRef.current = false;
      const restoreEvent = new Event("commandCloseAutoFocus", { cancelable: true });
      onCloseAutoFocus?.(restoreEvent);
      if (!restoreEvent.defaultPrevented) {
        ctx.getTriggerElement()?.focus();
      }
    }
  }, [ctx, isOpen, onCloseAutoFocus]);

  useEffect(() => {
    if (!isOpen) return;
    const evt = new Event("commandOpenAutoFocus", { cancelable: true });
    onOpenAutoFocus?.(evt);
  }, [isOpen, onOpenAutoFocus]);

  if (!shouldRender) return null;

  const dialogNode = createElement(
    DismissableLayer,
    {
      onEscapeKeyDown: (event: KeyboardEvent) => {
        if (ctx.state.pageStack.length > 0) {
          event.preventDefault();
          ctx.popPage();
          return;
        }
        ctx.closePalette();
      },
      onPointerDownOutside: () => {
        ctx.closePalette();
      },
    },
    createElement(
      FocusScope,
      // eslint-disable-next-line react-hooks/refs
      {
        trapped: isOpen,
        autoFocus: isOpen,
        initialFocusRef: inputRefForScope,
      },
      createElement(
        "div",
        {
          role: "dialog",
          "aria-modal": true,
          "aria-label": ariaLabel ?? (ariaLabelledby ? undefined : ctx.label),
          "aria-labelledby": ariaLabelledby,
          "aria-describedby": ariaDescribedby,
          id: ctx.dialogId,
          "data-kui-slot": "CommandDialog",
          "data-state": isOpen ? "open" : "closed",
          "data-kui-command-page": currentPageId(ctx.state) ?? "root",
          className,
          style: forceMount && !isOpen ? { display: "none" } : undefined,
        },
        children,
      ),
    ),
  );

  return container === null
    ? dialogNode
    : createElement(Portal, { container: container ?? null }, dialogNode);
}

// ─── Input ─────────────────────────────────────────────────────────

const CommandInput = forwardRef<HTMLInputElement, CommandInputProps>(
  function CommandInput(props, forwardedRef) {
    const ctx = useCommandContext("Command.Input");
    const { placeholder, className, id, autoFocus, "aria-label": ariaLabel } = props;
    const mergedRef = useMergedRefs<HTMLInputElement>(forwardedRef, ctx.setInputElement);

    const onChange = useCallback(
      (event: ChangeEvent<HTMLInputElement>) => {
        ctx.setQuery(event.target.value);
      },
      [ctx],
    );

    const onKeyDown = useCallback(
      (event: ReactKeyboardEvent<HTMLInputElement>) => {
        switch (event.key) {
          case "ArrowDown": {
            event.preventDefault();
            const next = moveHighlight(ctx.visibleItems, ctx.state.highlightedId, 1);
            ctx.setHighlight(next);
            return;
          }
          case "ArrowUp": {
            event.preventDefault();
            const next = moveHighlight(ctx.visibleItems, ctx.state.highlightedId, -1);
            ctx.setHighlight(next);
            return;
          }
          case "Home": {
            event.preventDefault();
            ctx.setHighlight(snapHighlight(ctx.visibleItems, "first"));
            return;
          }
          case "End": {
            event.preventDefault();
            ctx.setHighlight(snapHighlight(ctx.visibleItems, "last"));
            return;
          }
          case "Enter": {
            if (ctx.state.highlightedId === null) return;
            const item = ctx.visibleItems.find((it) => it.id === ctx.state.highlightedId);
            if (!item) return;
            event.preventDefault();
            ctx.executeItem(item);
            return;
          }
          case "Backspace": {
            if (ctx.state.query !== "") return;
            if (ctx.state.pageStack.length === 0) return;
            event.preventDefault();
            ctx.popPage();
            return;
          }
          default:
            return;
        }
      },
      [ctx],
    );

    return createElement("input", {
      ref: mergedRef,
      type: "text",
      role: "combobox",
      id: id ?? ctx.inputId,
      "data-kui-slot": "CommandInput",
      "aria-label": ariaLabel ?? "Search commands",
      "aria-autocomplete": "list",
      "aria-expanded": true,
      "aria-controls": ctx.listId,
      "aria-activedescendant": ctx.state.highlightedId
        ? `${ctx.listId}::${ctx.state.highlightedId}`
        : undefined,
      autoComplete: "off",
      spellCheck: false,
      autoFocus,
      placeholder,
      value: ctx.state.query,
      className,
      onChange,
      onKeyDown,
    });
  },
);

// ─── List ──────────────────────────────────────────────────────────

const CommandList = forwardRef<HTMLDivElement, CommandListProps>(
  function CommandList(props, forwardedRef) {
    const ctx = useCommandContext("Command.List");
    const { children, className, id, "aria-label": ariaLabel } = props;
    return createElement(
      "div",
      // eslint-disable-next-line react-hooks/refs
      {
        ref: forwardedRef,
        role: "listbox",
        id: id ?? ctx.listId,
        "data-kui-slot": "CommandList",
        "aria-label": ariaLabel,
        className,
      },
      children,
    );
  },
);

// ─── Group ─────────────────────────────────────────────────────────

const CommandGroup = forwardRef<HTMLDivElement, CommandGroupProps>(
  function CommandGroup(props, forwardedRef) {
    const ctx = useCommandContext("Command.Group");
    const { id, heading, pageId = null, children, className } = props;
    const headingId = `${ctx.listId}::heading::${id}`;

    const groupContext = useMemo<CommandGroupContextValue>(
      () => ({ groupId: id, pageId }),
      [id, pageId],
    );

    // Hide the group entirely when it belongs to a page that isn't current
    // OR when no item inside it is visible after filtering.
    const activePage = currentPageId(ctx.state);
    const belongsToActivePage = pageId === activePage;
    const visibleInGroup = useMemo(
      () => ctx.visibleItems.filter((it) => it.groupId === id),
      [ctx.visibleItems, id],
    );
    const shouldHide = !belongsToActivePage || visibleInGroup.length === 0;

    return createElement(
      CommandGroupContext.Provider,
      { value: groupContext },
      createElement(
        "div",
        // eslint-disable-next-line react-hooks/refs
        {
          ref: forwardedRef,
          role: "group",
          "aria-labelledby": heading ? headingId : undefined,
          "data-kui-slot": "CommandGroup",
          "data-kui-group-id": id,
          "data-kui-empty": shouldHide ? "true" : undefined,
          className,
          hidden: shouldHide || undefined,
        },
        heading
          ? createElement(
              "div",
              {
                id: headingId,
                role: "presentation",
                "data-kui-slot": "CommandGroupHeading",
              },
              heading,
            )
          : null,
        children,
      ),
    );
  },
);

// ─── Item ──────────────────────────────────────────────────────────

const CommandItemComponent = forwardRef<HTMLDivElement, CommandItemProps>(
  function CommandItem(props, forwardedRef) {
    const ctx = useCommandContext("Command.Item");
    const group = useContext(CommandGroupContext);
    const { id, keywords, searchText, disabled = false, onSelect, children, className } = props;
    const domRef = useRef<HTMLDivElement | null>(null);
    const mergedRef = useMergedRefs<HTMLDivElement>(forwardedRef, domRef);

    // Derive search text from the rendered content when not given explicitly.
    const [derivedSearchText, setDerivedSearchText] = useState<string>(searchText ?? "");
    useLayoutEffect(() => {
      if (searchText !== undefined) return;
      const el = domRef.current;
      const text = (el?.textContent ?? "").trim();
      setDerivedSearchText(text);
    }, [children, searchText]);

    const effectiveSearchText = searchText ?? derivedSearchText;
    const effectiveKeywords = useMemo(() => keywords ?? [], [keywords]);
    const effectivePageId = group?.pageId ?? null;
    const effectiveGroupId = group?.groupId ?? null;
    const onSelectStable = useEventCallback(onSelect ?? (() => undefined));

    const registration: CommandItem = useMemo(
      () => ({
        id,
        groupId: effectiveGroupId,
        pageId: effectivePageId,
        searchText: effectiveSearchText,
        keywords: effectiveKeywords,
        disabled,
        onSelect: onSelectStable,
      }),
      [
        disabled,
        effectiveGroupId,
        effectiveKeywords,
        effectivePageId,
        effectiveSearchText,
        id,
        onSelectStable,
      ],
    );

    useEffect(() => {
      const unregister = ctx.registerItem(registration);
      return () => {
        unregister();
      };
      // Depend only on the stable `registerItem` and the memoized `registration`
      // shape — `ctx` re-creates on every state change and would cause a
      // register/unregister loop.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ctx.registerItem, registration]);

    const isVisible = ctx.visibleItems.some((it) => it.id === id);
    const isHighlighted = ctx.state.highlightedId === id;

    useEffect(() => {
      if (!isHighlighted) return;
      domRef.current?.scrollIntoView({ block: "nearest" });
    }, [isHighlighted]);

    return createElement(
      "div",
      {
        ref: mergedRef,
        role: "option",
        id: `${ctx.listId}::${id}`,
        "data-kui-slot": "CommandItem",
        "data-kui-item-id": id,
        "data-highlighted": isHighlighted ? "true" : undefined,
        "data-disabled": disabled ? "true" : undefined,
        "aria-selected": isHighlighted,
        "aria-disabled": disabled || undefined,
        tabIndex: -1,
        className,
        hidden: !isVisible || undefined,
        onMouseEnter: () => {
          if (disabled) return;
          ctx.setHighlight(id);
        },
        onClick: (event: MouseEvent<HTMLDivElement>) => {
          event.preventDefault();
          if (disabled) return;
          ctx.executeItem(registration);
        },
      },
      children,
    );
  },
);

// ─── Separator ─────────────────────────────────────────────────────

const CommandSeparator = forwardRef<HTMLDivElement, CommandSeparatorProps>(
  function CommandSeparator(props, forwardedRef) {
    const { className, id } = props;
    return createElement("div", {
      ref: forwardedRef,
      role: "separator",
      id,
      "data-kui-slot": "CommandSeparator",
      className,
    });
  },
);

// ─── Empty ─────────────────────────────────────────────────────────

function CommandEmpty(props: CommandEmptyProps): ReactNode {
  const ctx = useCommandContext("Command.Empty");
  const { children, className } = props;
  const hasVisible = ctx.visibleItems.length > 0;
  if (hasVisible) return null;
  return createElement(
    "div",
    {
      role: "presentation",
      "data-kui-slot": "CommandEmpty",
      className,
    },
    children,
  );
}

// ─── Public API ────────────────────────────────────────────────────

/** Access the palette context. Throws when used outside `<Command.Root>`. */
export function useCommand(): CommandContextValue {
  return useCommandContext("useCommand");
}

/** Bare-name exports for consumers who prefer explicit composition. */
export {
  CommandRoot,
  CommandTrigger,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandGroup,
  CommandItemComponent,
  CommandSeparator,
  CommandEmpty,
};

interface CommandCompound {
  (props: CommandRootProps): ReactNode;
  Root: typeof CommandRoot;
  Trigger: typeof CommandTrigger;
  Dialog: typeof CommandDialog;
  Input: typeof CommandInput;
  List: typeof CommandList;
  Group: typeof CommandGroup;
  Item: typeof CommandItemComponent;
  Separator: typeof CommandSeparator;
  Empty: typeof CommandEmpty;
}

const CommandCompoundImpl = CommandRoot as unknown as CommandCompound;
CommandCompoundImpl.Root = CommandRoot;
CommandCompoundImpl.Trigger = CommandTrigger;
CommandCompoundImpl.Dialog = CommandDialog;
CommandCompoundImpl.Input = CommandInput;
CommandCompoundImpl.List = CommandList;
CommandCompoundImpl.Group = CommandGroup;
CommandCompoundImpl.Item = CommandItemComponent;
CommandCompoundImpl.Separator = CommandSeparator;
CommandCompoundImpl.Empty = CommandEmpty;

export const Command = CommandCompoundImpl;
