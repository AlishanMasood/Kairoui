import { forwardRef, createElement, useMemo, useCallback } from "react";
import type { HTMLAttributes } from "react";
import { useControllableState, useId } from "@kairoui/hooks";
import {
  AccordionInternalContext,
  useAccordionInternalContext,
  AccordionItemInternalContext,
  useAccordionItemInternalContext,
  getAccordionTriggerId,
  getAccordionContentId,
} from "./accordion-types";
import type {
  AccordionRootProps,
  AccordionItemRootProps,
  AccordionHeaderProps,
  AccordionTriggerRootProps,
  AccordionContentRootProps,
} from "./accordion-types";

// ─── Accordion (Root) ───────────────────────────────────────────────

export const Accordion = forwardRef<
  HTMLDivElement,
  AccordionRootProps & HTMLAttributes<HTMLDivElement>
>(function Accordion(props, ref) {
  const {
    type,
    orientation = "vertical",
    dir = "ltr",
    disabled = false,
    className,
    children,
    ...rest
  } = props;

  const baseId = useId(undefined, { prefix: "kui-accordion" });

  // Single mode
  const singleProps =
    type === "single" ? (props as Extract<AccordionRootProps, { type: "single" }>) : null;
  const multiProps =
    type === "multiple" ? (props as Extract<AccordionRootProps, { type: "multiple" }>) : null;

  const [singleValue, setSingleValue] = useControllableState({
    value: singleProps?.value,
    defaultValue: singleProps?.defaultValue ?? "",
    ...(singleProps?.onValueChange ? { onChange: singleProps.onValueChange } : undefined),
  });

  const [multiValue, setMultiValue] = useControllableState({
    value: multiProps?.value,
    defaultValue: multiProps?.defaultValue ?? [],
    ...(multiProps?.onValueChange ? { onChange: multiProps.onValueChange } : undefined),
  });

  const collapsible = singleProps?.collapsible ?? false;
  const openValues: string[] = useMemo(
    () => (type === "single" ? (singleValue ? [singleValue] : []) : multiValue),
    [type, singleValue, multiValue],
  );

  const onItemToggle = useCallback(
    (itemValue: string) => {
      if (type === "single") {
        if (singleValue === itemValue) {
          if (collapsible) setSingleValue("");
        } else {
          setSingleValue(itemValue);
        }
      } else {
        if (multiValue.includes(itemValue)) {
          setMultiValue(multiValue.filter((v) => v !== itemValue));
        } else {
          setMultiValue([...multiValue, itemValue]);
        }
      }
    },
    [type, singleValue, setSingleValue, collapsible, multiValue, setMultiValue],
  );

  const ctx = useMemo(
    () => ({
      type,
      value: openValues,
      onItemToggle,
      collapsible,
      orientation,
      dir,
      disabled,
      baseId,
    }),
    [type, openValues, onItemToggle, collapsible, orientation, dir, disabled, baseId],
  );

  // Strip component-specific props before spreading
  const {
    value: _v,
    defaultValue: _dv,
    onValueChange: _ovc,
    collapsible: _c,
    type: _t,
    ...divProps
  } = rest as Record<string, unknown>;

  return createElement(
    AccordionInternalContext.Provider,
    { value: ctx },
    createElement(
      "div",
      {
        ...divProps,
        ref,
        "data-orientation": orientation,
        "data-kui-component": "Accordion",
        className,
      },
      children,
    ),
  );
});

// ─── Accordion.Item ─────────────────────────────────────────────────

export const AccordionItem = forwardRef<
  HTMLDivElement,
  AccordionItemRootProps & HTMLAttributes<HTMLDivElement>
>(function AccordionItem(props, ref) {
  const { value, disabled: itemDisabled, className, children, ...rest } = props;
  const ctx = useAccordionInternalContext();
  const isDisabled = itemDisabled ?? ctx.disabled;
  const isOpen = ctx.value.includes(value);
  const triggerId = getAccordionTriggerId(ctx.baseId, value);
  const contentId = getAccordionContentId(ctx.baseId, value);

  const itemCtx = useMemo(
    () => ({ value, open: isOpen, disabled: isDisabled, triggerId, contentId }),
    [value, isOpen, isDisabled, triggerId, contentId],
  );

  return createElement(
    AccordionItemInternalContext.Provider,
    { value: itemCtx },
    createElement(
      "div",
      {
        ...rest,
        ref,
        "data-state": isOpen ? "open" : "closed",
        "data-disabled": isDisabled || undefined,
        "data-kui-component": "AccordionItem",
        className,
      },
      children,
    ),
  );
});

// ─── Accordion.Header ───────────────────────────────────────────────

export const AccordionHeader = forwardRef<
  HTMLHeadingElement,
  AccordionHeaderProps & HTMLAttributes<HTMLHeadingElement>
>(function AccordionHeader(props, ref) {
  const { level = 3, className, children, ...rest } = props;
  const tag = `h${String(level)}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

  return createElement(
    tag,
    { ...rest, ref, "data-kui-component": "AccordionHeader", className },
    children,
  );
});

// ─── Accordion.Trigger ──────────────────────────────────────────────

export const AccordionTrigger = forwardRef<
  HTMLButtonElement,
  AccordionTriggerRootProps & HTMLAttributes<HTMLButtonElement>
>(function AccordionTrigger(props, ref) {
  const { className, children, ...rest } = props;
  const ctx = useAccordionInternalContext();
  const itemCtx = useAccordionItemInternalContext();

  const handleClick = () => {
    if (!itemCtx.disabled) ctx.onItemToggle(itemCtx.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const isVertical = ctx.orientation === "vertical";
    const isRtl = ctx.dir === "rtl";

    if (e.key === "ArrowDown" && isVertical) {
      e.preventDefault();
      focusSibling(e.currentTarget as HTMLElement, "next");
    } else if (e.key === "ArrowUp" && isVertical) {
      e.preventDefault();
      focusSibling(e.currentTarget as HTMLElement, "prev");
    } else if (e.key === "ArrowRight" && !isVertical) {
      e.preventDefault();
      focusSibling(e.currentTarget as HTMLElement, isRtl ? "prev" : "next");
    } else if (e.key === "ArrowLeft" && !isVertical) {
      e.preventDefault();
      focusSibling(e.currentTarget as HTMLElement, isRtl ? "next" : "prev");
    } else if (e.key === "Home") {
      e.preventDefault();
      focusSibling(e.currentTarget as HTMLElement, "first");
    } else if (e.key === "End") {
      e.preventDefault();
      focusSibling(e.currentTarget as HTMLElement, "last");
    }
  };

  return createElement(
    "button",
    {
      ...rest,
      ref,
      type: "button",
      id: itemCtx.triggerId,
      "aria-expanded": itemCtx.open,
      "aria-controls": itemCtx.contentId,
      "aria-disabled": itemCtx.disabled || undefined,
      "data-state": itemCtx.open ? "open" : "closed",
      "data-disabled": itemCtx.disabled || undefined,
      "data-kui-component": "AccordionTrigger",
      className,
      onClick: handleClick,
      onKeyDown: handleKeyDown,
    },
    children,
  );
});

function focusSibling(current: HTMLElement, direction: "next" | "prev" | "first" | "last"): void {
  const container = current.closest("[data-kui-component='Accordion']");
  if (!container) return;
  const triggers = Array.from(
    container.querySelectorAll<HTMLElement>(
      "[data-kui-component='AccordionTrigger']:not([aria-disabled='true'])",
    ),
  );
  if (triggers.length === 0) return;

  const idx = triggers.indexOf(current);
  let target: HTMLElement | undefined;

  if (direction === "first") target = triggers[0];
  else if (direction === "last") target = triggers[triggers.length - 1];
  else if (direction === "next") target = triggers[idx + 1] ?? triggers[0];
  else target = triggers[idx - 1] ?? triggers[triggers.length - 1];

  target?.focus();
}

// ─── Accordion.Content ──────────────────────────────────────────────

export const AccordionContent = forwardRef<
  HTMLDivElement,
  AccordionContentRootProps & HTMLAttributes<HTMLDivElement>
>(function AccordionContent(props, ref) {
  const { forceMount = false, className, children, ...rest } = props;
  const itemCtx = useAccordionItemInternalContext();

  if (!forceMount && !itemCtx.open) return null;

  return createElement(
    "div",
    {
      ...rest,
      ref,
      role: "region",
      id: itemCtx.contentId,
      "aria-labelledby": itemCtx.triggerId,
      "data-state": itemCtx.open ? "open" : "closed",
      "data-kui-component": "AccordionContent",
      hidden: !itemCtx.open || undefined,
      className,
    },
    children,
  );
});
