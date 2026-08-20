import { forwardRef, createElement } from "react";
import type { ReactNode, HTMLAttributes } from "react";

// ─── Types ──────────────────────────────────────────────────────────

export interface BreadcrumbsRootProps {
  /** Accessible label for the nav. Defaults to "Breadcrumb". */
  label?: string;
  className?: string;
  children?: ReactNode;
}

export interface BreadcrumbsListProps {
  className?: string;
  children?: ReactNode;
}

export interface BreadcrumbsItemProps {
  className?: string;
  children?: ReactNode;
}

export interface BreadcrumbsLinkProps {
  href?: string;
  className?: string;
  children?: ReactNode;
}

export interface BreadcrumbsSeparatorProps {
  className?: string;
  children?: ReactNode;
}

export interface BreadcrumbsCurrentProps {
  className?: string;
  children?: ReactNode;
}

// ─── Breadcrumbs (Root) ─────────────────────────────────────────────

export const Breadcrumbs = forwardRef<
  HTMLElement,
  BreadcrumbsRootProps & HTMLAttributes<HTMLElement>
>(function Breadcrumbs(props, ref) {
  const { label = "Breadcrumb", className, children, ...rest } = props;

  return createElement(
    "nav",
    { ...rest, ref, "aria-label": label, "data-kui-component": "Breadcrumbs", className },
    children,
  );
});

// ─── Breadcrumbs.List ───────────────────────────────────────────────

export const BreadcrumbsList = forwardRef<
  HTMLOListElement,
  BreadcrumbsListProps & HTMLAttributes<HTMLOListElement>
>(function BreadcrumbsList(props, ref) {
  const { className, children, ...rest } = props;

  return createElement(
    "ol",
    { ...rest, ref, "data-kui-component": "BreadcrumbsList", className },
    children,
  );
});

// ─── Breadcrumbs.Item ───────────────────────────────────────────────

export const BreadcrumbsItem = forwardRef<
  HTMLLIElement,
  BreadcrumbsItemProps & HTMLAttributes<HTMLLIElement>
>(function BreadcrumbsItem(props, ref) {
  const { className, children, ...rest } = props;

  return createElement(
    "li",
    { ...rest, ref, "data-kui-component": "BreadcrumbsItem", className },
    children,
  );
});

// ─── Breadcrumbs.Link ───────────────────────────────────────────────

export const BreadcrumbsLink = forwardRef<
  HTMLAnchorElement,
  BreadcrumbsLinkProps & HTMLAttributes<HTMLAnchorElement>
>(function BreadcrumbsLink(props, ref) {
  const { href, className, children, ...rest } = props;

  return createElement(
    "a",
    { ...rest, ref, href, "data-kui-component": "BreadcrumbsLink", className },
    children,
  );
});

// ─── Breadcrumbs.Separator ──────────────────────────────────────────

export const BreadcrumbsSeparator = forwardRef<
  HTMLSpanElement,
  BreadcrumbsSeparatorProps & HTMLAttributes<HTMLSpanElement>
>(function BreadcrumbsSeparator(props, ref) {
  const { className, children = "/", ...rest } = props;

  return createElement(
    "span",
    {
      ...rest,
      ref,
      role: "presentation",
      "aria-hidden": "true",
      "data-kui-component": "BreadcrumbsSeparator",
      className,
    },
    children,
  );
});

// ─── Breadcrumbs.Current ────────────────────────────────────────────

export const BreadcrumbsCurrent = forwardRef<
  HTMLSpanElement,
  BreadcrumbsCurrentProps & HTMLAttributes<HTMLSpanElement>
>(function BreadcrumbsCurrent(props, ref) {
  const { className, children, ...rest } = props;

  return createElement(
    "span",
    { ...rest, ref, "aria-current": "page", "data-kui-component": "BreadcrumbsCurrent", className },
    children,
  );
});
