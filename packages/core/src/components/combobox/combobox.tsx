import { createElement, forwardRef, useMemo, useCallback } from "react";
import type { HTMLAttributes, InputHTMLAttributes, ButtonHTMLAttributes } from "react";
import { useControllableState, useId } from "@kairoui/hooks";
import { useFieldContext } from "../field/field-context";
import {
  useCollection,
  CollectionContext,
  useCollectionContext,
} from "../collection/use-collection";
import { useCollectionItem } from "../collection/use-collection-item";
import { resolveNextItem } from "../collection/collection-navigation";
import { ComboboxContext, useComboboxContext } from "./combobox-types";
import type {
  ComboboxProps,
  ComboboxInputProps,
  ComboboxTriggerProps,
  ComboboxClearProps,
  ComboboxContentProps,
  ComboboxItemProps,
  ComboboxEmptyProps,
  ComboboxGroupProps,
  ComboboxLabelProps,
  ComboboxContextValue,
} from "./combobox-types";

// ─── Combobox Root ──────────────────────────────────────────────────

export const Combobox = forwardRef<HTMLDivElement, ComboboxProps & HTMLAttributes<HTMLDivElement>>(
  function Combobox(props, ref) {
    const {
      value: controlledValue,
      defaultValue,
      onValueChange,
      inputValue: controlledInputValue,
      defaultInputValue = "",
      onInputValueChange,
      open: controlledOpen,
      defaultOpen = false,
      onOpenChange,
      name,
      disabled = false,
      required = false,
      allowCustomValue = false,
      children,
      ...restProps
    } = props;

    const fieldCtx = useFieldContext();
    const resolvedDisabled = disabled || (fieldCtx?.disabled ?? false);
    const resolvedRequired = required || (fieldCtx?.required ?? false);

    const [selectedValue, setSelectedValue] = useControllableState<string | undefined>({
      value: controlledValue,
      defaultValue: defaultValue ?? undefined,
      ...(onValueChange
        ? { onChange: onValueChange as (v: string | undefined) => void }
        : undefined),
      name: "Combobox",
      state: "value",
    });

    const [inputValue, setInputValue] = useControllableState<string>({
      value: controlledInputValue,
      defaultValue: defaultInputValue,
      ...(onInputValueChange ? { onChange: onInputValueChange } : undefined),
      name: "Combobox",
      state: "inputValue",
    });

    const [open, setOpen] = useControllableState<boolean>({
      value: controlledOpen,
      defaultValue: defaultOpen,
      ...(onOpenChange ? { onChange: onOpenChange } : undefined),
      name: "Combobox",
      state: "open",
    });

    const [highlightedValue, setHighlightedValue] = useControllableState<string | undefined>({
      value: undefined,
      defaultValue: undefined,
      name: "Combobox",
      state: "highlighted",
    });

    const inputId = useId(undefined, { prefix: "kui-cb-input" });
    const listboxId = useId(undefined, { prefix: "kui-cb-list" });
    const triggerId = useId(undefined, { prefix: "kui-cb-trigger" });

    const collection = useCollection();

    const clearValue = useCallback(() => {
      setSelectedValue(undefined);
      setInputValue("");
      setHighlightedValue(undefined);
    }, [setSelectedValue, setInputValue, setHighlightedValue]);

    const handleValueChange = useCallback(
      (v: string) => {
        setSelectedValue(v);
        // Set input text to the selected item's label
        const item = collection.getByValue(v);
        if (item) {
          setInputValue(item.label);
        }
        setOpen(false);
        setHighlightedValue(undefined);
      },
      [setSelectedValue, setInputValue, setOpen, setHighlightedValue, collection],
    );

    const ctx: ComboboxContextValue = useMemo(
      () => ({
        value: selectedValue,
        inputValue,
        open,
        disabled: resolvedDisabled,
        required: resolvedRequired,
        allowCustomValue,
        highlightedValue,
        onValueChange: handleValueChange,
        onInputValueChange: setInputValue,
        onOpenChange: setOpen,
        setHighlightedValue,
        clearValue,
        inputId,
        listboxId,
        triggerId,
      }),
      [
        selectedValue,
        inputValue,
        open,
        resolvedDisabled,
        resolvedRequired,
        allowCustomValue,
        highlightedValue,
        handleValueChange,
        setInputValue,
        setOpen,
        setHighlightedValue,
        clearValue,
        inputId,
        listboxId,
        triggerId,
      ],
    );

    return createElement(
      ComboboxContext.Provider,
      { value: ctx },
      createElement(
        CollectionContext.Provider,
        { value: collection },
        createElement(
          "div",
          {
            ...restProps,
            ref,
            "data-kui-component": "Combobox",
            ...(resolvedDisabled ? { "data-disabled": "" } : undefined),
          },
          children,
          name &&
            createElement("input", {
              type: "hidden",
              name,
              value: selectedValue ?? (allowCustomValue ? inputValue : ""),
              disabled: resolvedDisabled,
              "aria-hidden": "true",
              tabIndex: -1,
            }),
        ),
      ),
    );
  },
);

// ─── Combobox Input ─────────────────────────────────────────────────

export const ComboboxInput = forwardRef<
  HTMLInputElement,
  ComboboxInputProps & InputHTMLAttributes<HTMLInputElement>
>(function ComboboxInput(props, ref) {
  const { placeholder, className, id, ...restProps } = props;
  const ctx = useComboboxContext();
  const fieldCtx = useFieldContext();
  const collection = useCollectionContext();
  const resolvedId = id ?? ctx.inputId;

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (ctx.disabled) return;
      ctx.onInputValueChange(e.target.value);
      if (!ctx.open) {
        ctx.onOpenChange(true);
      }
      ctx.setHighlightedValue(undefined);
    },
    [ctx],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (ctx.disabled) return;
      const items = collection?.items ?? [];

      switch (e.key) {
        case "ArrowDown": {
          e.preventDefault();
          if (!ctx.open) {
            ctx.onOpenChange(true);
          }
          const next = resolveNextItem(items, ctx.highlightedValue, "next");
          if (next) ctx.setHighlightedValue(next.value);
          break;
        }
        case "ArrowUp": {
          e.preventDefault();
          if (!ctx.open) {
            ctx.onOpenChange(true);
          }
          const prev = resolveNextItem(items, ctx.highlightedValue, "previous");
          if (prev) ctx.setHighlightedValue(prev.value);
          break;
        }
        case "Home": {
          e.preventDefault();
          const first = resolveNextItem(items, undefined, "first");
          if (first) ctx.setHighlightedValue(first.value);
          break;
        }
        case "End": {
          e.preventDefault();
          const last = resolveNextItem(items, undefined, "last");
          if (last) ctx.setHighlightedValue(last.value);
          break;
        }
        case "Enter": {
          e.preventDefault();
          if (ctx.highlightedValue) {
            ctx.onValueChange(ctx.highlightedValue);
          } else if (ctx.allowCustomValue && ctx.inputValue) {
            ctx.onValueChange(ctx.inputValue);
          }
          break;
        }
        case "Escape": {
          e.preventDefault();
          ctx.onOpenChange(false);
          ctx.setHighlightedValue(undefined);
          break;
        }
        case "Tab": {
          ctx.onOpenChange(false);
          ctx.setHighlightedValue(undefined);
          break;
        }
      }
    },
    [ctx, collection],
  );

  const handleFocus = useCallback(() => {
    if (ctx.disabled) return;
    if (!ctx.open) {
      ctx.onOpenChange(true);
    }
  }, [ctx]);

  return createElement("input", {
    ...restProps,
    ref,
    type: "text",
    id: resolvedId,
    value: ctx.inputValue,
    placeholder,
    disabled: ctx.disabled,
    role: "combobox",
    autoComplete: "off",
    "aria-expanded": ctx.open,
    "aria-controls": ctx.listboxId,
    "aria-activedescendant": ctx.highlightedValue
      ? `${ctx.listboxId}-${ctx.highlightedValue}`
      : undefined,
    "aria-autocomplete": "list",
    "aria-required": ctx.required ? "true" : undefined,
    "aria-invalid": fieldCtx?.invalid ? "true" : undefined,
    className: className ? `kui-combobox-input ${className}` : "kui-combobox-input",
    "data-kui-component": "ComboboxInput",
    onChange: handleChange,
    onKeyDown: handleKeyDown,
    onFocus: handleFocus,
    ...(fieldCtx?.hasLabel ? { "aria-labelledby": fieldCtx.labelId } : undefined),
  });
});

// ─── Combobox Trigger ───────────────────────────────────────────────

export const ComboboxTrigger = forwardRef<
  HTMLButtonElement,
  ComboboxTriggerProps & ButtonHTMLAttributes<HTMLButtonElement>
>(function ComboboxTrigger(props, ref) {
  const { children, className, ...restProps } = props;
  const ctx = useComboboxContext();

  const handleClick = useCallback(() => {
    if (ctx.disabled) return;
    ctx.onOpenChange(!ctx.open);
  }, [ctx]);

  return createElement(
    "button",
    {
      ...restProps,
      ref,
      type: "button",
      id: ctx.triggerId,
      tabIndex: -1,
      "aria-label": "Toggle options",
      "aria-expanded": ctx.open,
      "aria-controls": ctx.listboxId,
      disabled: ctx.disabled,
      className: className ? `kui-combobox-trigger ${className}` : "kui-combobox-trigger",
      "data-kui-component": "ComboboxTrigger",
      onClick: handleClick,
    },
    children ?? "▾",
  );
});

// ─── Combobox Clear ─────────────────────────────────────────────────

export const ComboboxClear = forwardRef<
  HTMLButtonElement,
  ComboboxClearProps & ButtonHTMLAttributes<HTMLButtonElement>
>(function ComboboxClear(props, ref) {
  const { children, className, ...restProps } = props;
  const ctx = useComboboxContext();

  const handleClick = useCallback(() => {
    if (ctx.disabled) return;
    ctx.clearValue();
  }, [ctx]);

  if (!ctx.value && !ctx.inputValue) return null;

  return createElement(
    "button",
    {
      ...restProps,
      ref,
      type: "button",
      tabIndex: -1,
      "aria-label": "Clear selection",
      disabled: ctx.disabled,
      className: className ? `kui-combobox-clear ${className}` : "kui-combobox-clear",
      "data-kui-component": "ComboboxClear",
      onClick: handleClick,
    },
    children ?? "×",
  );
});

// ─── Combobox Content ───────────────────────────────────────────────

export const ComboboxContent = forwardRef<
  HTMLDivElement,
  ComboboxContentProps & HTMLAttributes<HTMLDivElement>
>(function ComboboxContent(props, ref) {
  const { children, className, ...restProps } = props;
  const ctx = useComboboxContext();

  if (!ctx.open) return null;

  return createElement(
    "div",
    {
      ...restProps,
      ref,
      id: ctx.listboxId,
      role: "listbox",
      "aria-labelledby": ctx.inputId,
      className: className ? `kui-combobox-content ${className}` : "kui-combobox-content",
      "data-kui-component": "ComboboxContent",
      "data-state": "open",
    },
    children,
  );
});

// ─── Combobox Item ──────────────────────────────────────────────────

export const ComboboxItem = forwardRef<
  HTMLDivElement,
  ComboboxItemProps & HTMLAttributes<HTMLDivElement>
>(function ComboboxItem(props, ref) {
  const { value, label, disabled = false, children, className, ...restProps } = props;
  const ctx = useComboboxContext();
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
      id: `${ctx.listboxId}-${value}`,
      role: "option",
      "aria-selected": isSelected,
      "aria-disabled": disabled ? "true" : undefined,
      className: className ? `kui-combobox-item ${className}` : "kui-combobox-item",
      "data-kui-component": "ComboboxItem",
      "data-state": isSelected ? "checked" : "unchecked",
      "data-highlighted": isHighlighted ? "" : undefined,
      "data-disabled": disabled ? "" : undefined,
      onClick: handleClick,
      onPointerMove: handlePointerMove,
    },
    children ?? resolvedLabel,
    isSelected &&
      createElement(
        "span",
        { "aria-hidden": "true", "data-kui-component": "ComboboxItemIndicator" },
        "✓",
      ),
  );
});

// ─── Combobox Empty ─────────────────────────────────────────────────

export const ComboboxEmpty = forwardRef<
  HTMLDivElement,
  ComboboxEmptyProps & HTMLAttributes<HTMLDivElement>
>(function ComboboxEmpty(props, ref) {
  const { children, className, ...restProps } = props;
  return createElement(
    "div",
    {
      ...restProps,
      ref,
      role: "presentation",
      className: className ? `kui-combobox-empty ${className}` : "kui-combobox-empty",
      "data-kui-component": "ComboboxEmpty",
    },
    children ?? "No results found",
  );
});

// ─── Combobox Group ─────────────────────────────────────────────────

export const ComboboxGroup = forwardRef<
  HTMLDivElement,
  ComboboxGroupProps & HTMLAttributes<HTMLDivElement>
>(function ComboboxGroup(props, ref) {
  const { children, className, ...restProps } = props;
  return createElement(
    "div",
    {
      ...restProps,
      ref,
      role: "group",
      className: className ? `kui-combobox-group ${className}` : "kui-combobox-group",
      "data-kui-component": "ComboboxGroup",
    },
    children,
  );
});

// ─── Combobox Label ─────────────────────────────────────────────────

export const ComboboxLabel = forwardRef<
  HTMLDivElement,
  ComboboxLabelProps & HTMLAttributes<HTMLDivElement>
>(function ComboboxLabel(props, ref) {
  const { children, className, ...restProps } = props;
  return createElement(
    "div",
    {
      ...restProps,
      ref,
      className: className ? `kui-combobox-label ${className}` : "kui-combobox-label",
      "data-kui-component": "ComboboxLabel",
    },
    children,
  );
});
