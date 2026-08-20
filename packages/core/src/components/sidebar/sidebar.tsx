import {
  forwardRef,
  createElement,
  useMemo,
  useCallback,
  useState,
  createContext,
  useContext,
} from "react";
import type { HTMLAttributes, CSSProperties } from "react";
import { SidebarContext, useSidebarContext } from "./sidebar-types";
import type {
  SidebarRootProps,
  SidebarHeaderProps,
  SidebarContentProps,
  SidebarFooterProps,
  SidebarGroupProps,
  SidebarGroupLabelProps,
  SidebarItemProps,
  SidebarLinkProps,
  SidebarTriggerProps,
} from "./sidebar-types";

// ─── Sidebar (Root) ─────────────────────────────────────────────────

export const Sidebar = forwardRef<HTMLElement, SidebarRootProps & HTMLAttributes<HTMLElement>>(
  function Sidebar(props, ref) {
    const {
      collapsed: controlledCollapsed,
      defaultCollapsed,
      onCollapsedChange,
      width = "240px",
      collapsedWidth = "60px",
      side = "left",
      className,
      children,
      ...rest
    } = props;

    const [internalCollapsed, setInternalCollapsed] = useState(defaultCollapsed ?? false);
    const collapsed = controlledCollapsed ?? internalCollapsed;

    const handleCollapsedChange = useCallback(
      (next: boolean) => {
        setInternalCollapsed(next);
        onCollapsedChange?.(next);
      },
      [onCollapsedChange],
    );

    const ctx = useMemo(
      () => ({ collapsed, onCollapsedChange: handleCollapsedChange, width, collapsedWidth, side }),
      [collapsed, handleCollapsedChange, width, collapsedWidth, side],
    );

    const style: CSSProperties = {
      width:
        typeof (collapsed ? collapsedWidth : width) === "number"
          ? `${String(collapsed ? collapsedWidth : width)}px`
          : collapsed
            ? collapsedWidth
            : width,
    };

    return createElement(
      SidebarContext.Provider,
      { value: ctx },
      createElement(
        "aside",
        {
          ...rest,
          ref,
          "data-collapsed": collapsed || undefined,
          "data-side": side,
          "data-kui-component": "Sidebar",
          className,
          style,
        },
        children,
      ),
    );
  },
);

// ─── Sidebar.Header ─────────────────────────────────────────────────

export const SidebarHeader = forwardRef<
  HTMLDivElement,
  SidebarHeaderProps & HTMLAttributes<HTMLDivElement>
>(function SidebarHeader(props, ref) {
  const { className, children, ...rest } = props;

  return createElement(
    "div",
    { ...rest, ref, "data-kui-component": "SidebarHeader", className },
    children,
  );
});

// ─── Sidebar.Content ────────────────────────────────────────────────

export const SidebarContent = forwardRef<
  HTMLDivElement,
  SidebarContentProps & HTMLAttributes<HTMLDivElement>
>(function SidebarContent(props, ref) {
  const { className, children, ...rest } = props;

  return createElement(
    "div",
    { ...rest, ref, role: "navigation", "data-kui-component": "SidebarContent", className },
    children,
  );
});

// ─── Sidebar.Footer ─────────────────────────────────────────────────

export const SidebarFooter = forwardRef<
  HTMLDivElement,
  SidebarFooterProps & HTMLAttributes<HTMLDivElement>
>(function SidebarFooter(props, ref) {
  const { className, children, ...rest } = props;

  return createElement(
    "div",
    { ...rest, ref, "data-kui-component": "SidebarFooter", className },
    children,
  );
});

// ─── Sidebar.Group ──────────────────────────────────────────────────

export const SidebarGroup = forwardRef<
  HTMLDivElement,
  SidebarGroupProps & HTMLAttributes<HTMLDivElement>
>(function SidebarGroup(props, ref) {
  const { collapsible = false, defaultOpen = true, className, children, ...rest } = props;
  const [open, setOpen] = useState(defaultOpen);

  const handleToggle = () => {
    setOpen((v) => !v);
  };

  return createElement(
    "div",
    {
      ...rest,
      ref,
      role: "group",
      "data-collapsible": collapsible || undefined,
      "data-state": collapsible ? (open ? "open" : "closed") : undefined,
      "data-kui-component": "SidebarGroup",
      className,
    },
    collapsible
      ? createElement(
          SidebarGroupContext.Provider,
          { value: { open, toggle: handleToggle } },
          children,
        )
      : children,
  );
});

// Internal context for collapsible groups
const SidebarGroupContext = createContext<{ open: boolean; toggle: () => void } | null>(null);

// ─── Sidebar.GroupLabel ─────────────────────────────────────────────

export const SidebarGroupLabel = forwardRef<
  HTMLDivElement,
  SidebarGroupLabelProps & HTMLAttributes<HTMLDivElement>
>(function SidebarGroupLabel(props, ref) {
  const { className, children, ...rest } = props;
  const groupCtx = useContext(SidebarGroupContext);

  if (groupCtx) {
    return createElement(
      "button",
      {
        ...(rest as HTMLAttributes<HTMLButtonElement>),
        ref: ref as React.Ref<HTMLButtonElement>,
        type: "button",
        "aria-expanded": groupCtx.open,
        "data-kui-component": "SidebarGroupLabel",
        className,
        onClick: groupCtx.toggle,
      },
      children,
    );
  }

  return createElement(
    "div",
    { ...rest, ref, "data-kui-component": "SidebarGroupLabel", className },
    children,
  );
});

// ─── Sidebar.Item ───────────────────────────────────────────────────

export const SidebarItem = forwardRef<
  HTMLDivElement,
  SidebarItemProps & HTMLAttributes<HTMLDivElement>
>(function SidebarItem(props, ref) {
  const { active = false, disabled = false, className, children, ...rest } = props;

  return createElement(
    "div",
    {
      ...rest,
      ref,
      "data-active": active || undefined,
      "data-disabled": disabled || undefined,
      "data-kui-component": "SidebarItem",
      className,
    },
    children,
  );
});

// ─── Sidebar.Link ───────────────────────────────────────────────────

export const SidebarLink = forwardRef<
  HTMLAnchorElement,
  SidebarLinkProps & HTMLAttributes<HTMLAnchorElement>
>(function SidebarLink(props, ref) {
  const { href, active = false, disabled = false, className, children, ...rest } = props;

  return createElement(
    "a",
    {
      ...rest,
      ref,
      href: disabled ? undefined : href,
      "aria-current": active ? "page" : undefined,
      "aria-disabled": disabled || undefined,
      "data-active": active || undefined,
      "data-disabled": disabled || undefined,
      "data-kui-component": "SidebarLink",
      className,
    },
    children,
  );
});

// ─── Sidebar.Trigger ────────────────────────────────────────────────

export const SidebarTrigger = forwardRef<
  HTMLButtonElement,
  SidebarTriggerProps & HTMLAttributes<HTMLButtonElement>
>(function SidebarTrigger(props, ref) {
  const { className, children = "Toggle sidebar", ...rest } = props;
  const ctx = useSidebarContext();

  return createElement(
    "button",
    {
      ...rest,
      ref,
      type: "button",
      "aria-expanded": !ctx.collapsed,
      "aria-label": typeof children === "string" ? children : "Toggle sidebar",
      "data-kui-component": "SidebarTrigger",
      className,
      onClick: () => {
        ctx.onCollapsedChange(!ctx.collapsed);
      },
    },
    children,
  );
});
