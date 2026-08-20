import { forwardRef, createElement, useMemo } from "react";
import type { HTMLAttributes, CSSProperties } from "react";
import { AppShellContext, useAppShellContext, normalizeDimension } from "./app-shell-types";
import type {
  AppShellRootProps,
  AppShellHeaderRootProps,
  AppShellSidebarRootProps,
  AppShellMainRootProps,
  AppShellAsideRootProps,
  AppShellFooterRootProps,
} from "./app-shell-types";

// ─── AppShell (Root) ────────────────────────────────────────────────

export const AppShell = forwardRef<
  HTMLDivElement,
  AppShellRootProps & HTMLAttributes<HTMLDivElement>
>(function AppShell(props, ref) {
  const {
    layout = "sidebar",
    fixed = false,
    headerHeight,
    sidebarWidth,
    sidebarCollapsedWidth,
    sidebarCollapsed = false,
    asideWidth,
    footerHeight,
    className,
    children,
    ...rest
  } = props;

  const hh = normalizeDimension(headerHeight, "60px");
  const sw = normalizeDimension(sidebarWidth, "240px");
  const scw = normalizeDimension(sidebarCollapsedWidth, "60px");
  const aw = normalizeDimension(asideWidth, "280px");
  const fh = normalizeDimension(footerHeight, "auto");

  const ctx = useMemo(
    () => ({
      layout,
      fixed,
      headerHeight: hh,
      sidebarWidth: sw,
      sidebarCollapsedWidth: scw,
      sidebarCollapsed,
      asideWidth: aw,
      footerHeight: fh,
    }),
    [layout, fixed, hh, sw, scw, sidebarCollapsed, aw, fh],
  );

  const style: CSSProperties = {
    display: "grid",
    minHeight: "100vh",
    gridTemplateRows: `${hh} 1fr ${fh}`,
    gridTemplateColumns: layout === "sidebar" ? `${sidebarCollapsed ? scw : sw} 1fr` : "1fr",
    ["--kui-shell-header-height" as string]: hh,
    ["--kui-shell-sidebar-width" as string]: sidebarCollapsed ? scw : sw,
    ["--kui-shell-aside-width" as string]: aw,
    ["--kui-shell-footer-height" as string]: fh,
  };

  return createElement(
    AppShellContext.Provider,
    { value: ctx },
    createElement(
      "div",
      { ...rest, ref, "data-layout": layout, "data-kui-component": "AppShell", className, style },
      children,
    ),
  );
});

// ─── AppShell.Header ────────────────────────────────────────────────

export const AppShellHeader = forwardRef<
  HTMLElement,
  AppShellHeaderRootProps & HTMLAttributes<HTMLElement>
>(function AppShellHeader(props, ref) {
  const { fixed: fixedOverride, className, children, ...rest } = props;
  const ctx = useAppShellContext();
  const isFixed = fixedOverride ?? ctx.fixed;

  const style: CSSProperties = {
    gridColumn: "1 / -1",
    height: ctx.headerHeight,
    ...(isFixed ? { position: "sticky", top: 0, zIndex: 10 } : undefined),
  };

  return createElement(
    "header",
    {
      ...rest,
      ref,
      "data-fixed": isFixed || undefined,
      "data-kui-component": "AppShellHeader",
      className,
      style,
    },
    children,
  );
});

// ─── AppShell.Sidebar ───────────────────────────────────────────────

export const AppShellSidebar = forwardRef<
  HTMLElement,
  AppShellSidebarRootProps & HTMLAttributes<HTMLElement>
>(function AppShellSidebar(props, ref) {
  const { side = "left", className, children, ...rest } = props;
  const ctx = useAppShellContext();

  const style: CSSProperties = {
    width: ctx.sidebarCollapsed ? ctx.sidebarCollapsedWidth : ctx.sidebarWidth,
    overflowY: "auto",
    ...(ctx.fixed
      ? { position: "sticky", top: ctx.headerHeight, height: `calc(100vh - ${ctx.headerHeight})` }
      : undefined),
  };

  return createElement(
    "aside",
    { ...rest, ref, "data-side": side, "data-kui-component": "AppShellSidebar", className, style },
    children,
  );
});

// ─── AppShell.Main ──────────────────────────────────────────────────

export const AppShellMain = forwardRef<
  HTMLElement,
  AppShellMainRootProps & HTMLAttributes<HTMLElement>
>(function AppShellMain(props, ref) {
  const { className, children, ...rest } = props;

  const style: CSSProperties = { overflowY: "auto", minWidth: 0 };

  return createElement(
    "main",
    { ...rest, ref, "data-kui-component": "AppShellMain", className, style },
    children,
  );
});

// ─── AppShell.Aside ─────────────────────────────────────────────────

export const AppShellAside = forwardRef<
  HTMLElement,
  AppShellAsideRootProps & HTMLAttributes<HTMLElement>
>(function AppShellAside(props, ref) {
  const { className, children, ...rest } = props;
  const ctx = useAppShellContext();

  const style: CSSProperties = { width: ctx.asideWidth, overflowY: "auto" };

  return createElement(
    "aside",
    { ...rest, ref, "data-kui-component": "AppShellAside", className, style },
    children,
  );
});

// ─── AppShell.Footer ────────────────────────────────────────────────

export const AppShellFooter = forwardRef<
  HTMLElement,
  AppShellFooterRootProps & HTMLAttributes<HTMLElement>
>(function AppShellFooter(props, ref) {
  const { fixed: fixedOverride, className, children, ...rest } = props;
  const ctx = useAppShellContext();
  const isFixed = fixedOverride ?? false;

  const style: CSSProperties = {
    gridColumn: "1 / -1",
    height: ctx.footerHeight,
    ...(isFixed ? { position: "sticky", bottom: 0, zIndex: 10 } : undefined),
  };

  return createElement(
    "footer",
    {
      ...rest,
      ref,
      "data-fixed": isFixed || undefined,
      "data-kui-component": "AppShellFooter",
      className,
      style,
    },
    children,
  );
});
