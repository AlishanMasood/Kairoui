import { createElement, forwardRef, useMemo, useCallback, useRef, useEffect } from "react";
import type { HTMLAttributes, ButtonHTMLAttributes } from "react";
import { useControllableState, useId } from "@kairoui/hooks";
import { useFieldContext } from "../field/field-context";
import { useCollection, CollectionContext } from "../collection/use-collection";
import { useCollectionItem } from "../collection/use-collection-item";
import { useCompositeNavigation } from "../collection/use-composite-navigation";
import { useTypeahead } from "../collection/use-typeahead";
import { SelectContext, useSelectContext } from "./select-types";
import type {
  SelectProps,
  SelectTriggerProps,
  SelectContentProps,
  SelectItemProps,
  SelectGroupProps,
  SelectLabelProps,
  SelectSeparatorProps,
  SelectContextValue,
} from "./select-types";

// ─── Select Root ────────────────────────────────────────────────────

export const Select = forwardRef<HTMLDivElement, SelectProps & HTMLAttributes<HTMLDivElement>>(
  function Select(props, ref) {
    const {
      value: controlledValue,
      defaultValue,
      onValueChange,
      open: controlledOpen,
      defaultOpen = false,
      onOpenChange,
      name,
      disabled = false,
      required = false,
      children,
      ...restProps
    } = props;

    const ctx = useFieldContext();
    const resolvedDisabled = disabled || (ctx?.disabled ?? false);
    const resolvedRequired = required || (ctx?.required ?? false);

    const [selectedValue, setSelectedValue] = useControllableState<string | undefined>({
      value: controlledValue,
      defaultValue: defaultValue ?? undefined,
      ...(onValueChange
        ? { onChange: onValueChange as (v: string | undefined) => void }
        : undefined),
      name: "Select",
      state: "value",
    });

    const [open, setOpen] = useControllableState<boolean>({
      value: controlledOpen,
      defaultValue: defaultOpen,
      ...(onOpenChange ? { onChange: onOpenChange } : undefined),
      name: "Select",
      state: "open",
    });

    const [highlightedValue, setHighlightedValue] = useControllableState<string | undefined>({
      value: undefined,
      defaultValue: undefined,
      name: "Select",
      state: "highlighted",
    });

    const triggerId = useId(undefined, { prefix: "kui-select-trigger" });
    const contentId = useId(undefined, { prefix: "kui-select-content" });
    const valueId = useId(undefined, { prefix: "kui-select-value" });

    const collection = useCollection();

    const selectCtx: SelectContextValue = useMemo(
      () => ({
        value: selectedValue,
        open,
        disabled: resolvedDisabled,
        required: resolvedRequired,
        highlightedValue,
        onValueChange: (v: string) => {
          setSelectedValue(v);
          setOpen(false);
        },
        onOpenChange: setOpen,
        setHighlightedValue,
        triggerId,
        contentId,
        valueId,
      }),
      [
        selectedValue,
        open,
        resolvedDisabled,
        resolvedRequired,
        highlightedValue,
        setSelectedValue,
        setOpen,
        setHighlightedValue,
        triggerId,
        contentId,
        valueId,
      ],
    );

    return createElement(
      SelectContext.Provider,
      { value: selectCtx },
      createElement(
        CollectionContext.Provider,
        { value: collection },
        createElement(
          "div",
          {
            ...restProps,
            ref,
            "data-kui-component": "Select",
            ...(resolvedDisabled ? { "data-disabled": "" } : undefined),
          },
          children,
          // Hidden input for form participation
          name &&
            createElement("input", {
              type: "hidden",
              name,
              value: selectedValue ?? "",
              disabled: resolvedDisabled,
              "aria-hidden": "true",
              tabIndex: -1,
            }),
        ),
      ),
    );
  },
);

// ─── Select Trigger ─────────────────────────────────────────────────

export const SelectTrigger = forwardRef<
  HTMLButtonElement,
  SelectTriggerProps & ButtonHTMLAttributes<HTMLButtonElement>
>(function SelectTrigger(props, ref) {
  const { placeholder, children, className, id, ...restProps } = props;
  const ctx = useSelectContext();
  const fieldCtx = useFieldContext();
  const resolvedId = id ?? ctx.triggerId;

  const handleClick = useCallback(() => {
    if (ctx.disabled) return;
    ctx.onOpenChange(!ctx.open);
  }, [ctx]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (ctx.disabled) return;
      if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (!ctx.open) {
          ctx.onOpenChange(true);
        }
      }
    },
    [ctx],
  );

  const displayValue = children ?? (ctx.value ? undefined : placeholder);

  return createElement(
    "button",
    {
      ...restProps,
      ref,
      type: "button",
      id: resolvedId,
      role: "combobox",
      "aria-expanded": ctx.open,
      "aria-haspopup": "listbox",
      "aria-controls": ctx.contentId,
      "aria-activedescendant": ctx.highlightedValue
        ? `${ctx.contentId}-${ctx.highlightedValue}`
        : undefined,
      "aria-required": ctx.required ? "true" : undefined,
      "aria-invalid": fieldCtx?.invalid ? "true" : undefined,
      disabled: ctx.disabled,
      className: className ? `kui-select-trigger ${className}` : "kui-select-trigger",
      "data-kui-component": "SelectTrigger",
      "data-state": ctx.open ? "open" : "closed",
      onClick: handleClick,
      onKeyDown: handleKeyDown,
      ...(fieldCtx?.hasLabel ? { "aria-labelledby": fieldCtx.labelId } : undefined),
    },
    createElement("span", { "data-kui-component": "SelectValue", id: ctx.valueId }, displayValue),
    createElement("span", { "aria-hidden": "true", "data-kui-component": "SelectIcon" }, "▾"),
  );
});

// ─── Select Content ─────────────────────────────────────────────────

export const SelectContent = forwardRef<
  HTMLDivElement,
  SelectContentProps & HTMLAttributes<HTMLDivElement>
>(function SelectContent(props, ref) {
  const { children, className, ...restProps } = props;
  const ctx = useSelectContext();
  const collection = useCollection();
  const contentRef = useRef<HTMLDivElement>(null);

  const { handleKeyDown: navKeyDown } = useCompositeNavigation({
    items: collection.items,
    orientation: "vertical",
    loop: true,
    onHighlightChange: ctx.setHighlightedValue,
    onSelect: ctx.onValueChange,
  });

  const { search: typeaheadSearch } = useTypeahead({
    items: collection.items,
    onMatch: ctx.setHighlightedValue,
  });

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        ctx.onOpenChange(false);
        return;
      }
      if (e.key === "Tab") {
        e.preventDefault();
        ctx.onOpenChange(false);
        return;
      }
      // Typeahead for printable chars
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        typeaheadSearch(e.key);
        return;
      }
      navKeyDown(e);
    },
    [ctx, navKeyDown, typeaheadSearch],
  );

  // Focus content when opened
  useEffect(() => {
    if (ctx.open && contentRef.current) {
      contentRef.current.focus();
    }
  }, [ctx.open]);

  if (!ctx.open) return null;

  return createElement(
    CollectionContext.Provider,
    { value: collection },
    createElement(
      "div",
      {
        ...restProps,
        ref: (el: HTMLDivElement | null) => {
          contentRef.current = el;
          if (typeof ref === "function") ref(el);
          else if (ref) ref.current = el;
        },
        id: ctx.contentId,
        role: "listbox",
        tabIndex: -1,
        "aria-labelledby": ctx.triggerId,
        className: className ? `kui-select-content ${className}` : "kui-select-content",
        "data-kui-component": "SelectContent",
        "data-state": "open",
        onKeyDown: handleKeyDown,
      },
      children,
    ),
  );
});

// ─── Select Item ────────────────────────────────────────────────────

export const SelectItem = forwardRef<
  HTMLDivElement,
  SelectItemProps & HTMLAttributes<HTMLDivElement>
>(function SelectItem(props, ref) {
  const { value, label, disabled = false, children, className, ...restProps } = props;
  const ctx = useSelectContext();
  const resolvedLabel = label ?? (typeof children === "string" ? children : value);

  useCollectionItem({ value, label: resolvedLabel, disabled });

  const isSelected = ctx.value === value;
  const isHighlighted = ctx.highlightedValue === value;

  const handleClick = useCallback(() => {
    if (disabled) return;
    ctx.onValueChange(value);
  }, [ctx, value, disabled]);

  const handlePointerMove = useCallback(() => {
    if (disabled) return;
    ctx.setHighlightedValue(value);
  }, [ctx, value, disabled]);

  return createElement(
    "div",
    {
      ...restProps,
      ref,
      id: `${ctx.contentId}-${value}`,
      role: "option",
      "aria-selected": isSelected,
      "aria-disabled": disabled ? "true" : undefined,
      className: className ? `kui-select-item ${className}` : "kui-select-item",
      "data-kui-component": "SelectItem",
      "data-state": isSelected ? "checked" : "unchecked",
      "data-highlighted": isHighlighted ? "" : undefined,
      "data-disabled": disabled ? "" : undefined,
      onClick: handleClick,
      onPointerMove: handlePointerMove,
    },
    createElement("span", { "data-kui-component": "SelectItemText" }, children ?? resolvedLabel),
    isSelected &&
      createElement(
        "span",
        { "data-kui-component": "SelectItemIndicator", "aria-hidden": "true" },
        "✓",
      ),
  );
});

// ─── Select Group ───────────────────────────────────────────────────

export const SelectGroup = forwardRef<
  HTMLDivElement,
  SelectGroupProps & HTMLAttributes<HTMLDivElement>
>(function SelectGroup(props, ref) {
  const { children, className, ...restProps } = props;
  return createElement(
    "div",
    {
      ...restProps,
      ref,
      role: "group",
      className: className ? `kui-select-group ${className}` : "kui-select-group",
      "data-kui-component": "SelectGroup",
    },
    children,
  );
});

// ─── Select Label ───────────────────────────────────────────────────

export const SelectLabel = forwardRef<
  HTMLDivElement,
  SelectLabelProps & HTMLAttributes<HTMLDivElement>
>(function SelectLabel(props, ref) {
  const { children, className, ...restProps } = props;
  return createElement(
    "div",
    {
      ...restProps,
      ref,
      className: className ? `kui-select-label ${className}` : "kui-select-label",
      "data-kui-component": "SelectLabel",
    },
    children,
  );
});

// ─── Select Separator ───────────────────────────────────────────────

export const SelectSeparator = forwardRef<
  HTMLDivElement,
  SelectSeparatorProps & HTMLAttributes<HTMLDivElement>
>(function SelectSeparator(props, ref) {
  const { className, ...restProps } = props;
  return createElement("div", {
    ...restProps,
    ref,
    role: "separator",
    className: className ? `kui-select-separator ${className}` : "kui-select-separator",
    "data-kui-component": "SelectSeparator",
  });
});
