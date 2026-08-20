import { forwardRef, createElement, useMemo, useCallback } from "react";
import type { HTMLAttributes } from "react";
import { useControllableState } from "@kairoui/hooks";
import { PaginationInternalContext, usePaginationInternalContext } from "./pagination-types";
import type {
  PaginationRootProps,
  PaginationItemProps,
  PaginationPreviousProps,
  PaginationNextProps,
  PaginationEllipsisRootProps,
} from "./pagination-types";

// ─── Pagination (Root) ──────────────────────────────────────────────

export const Pagination = forwardRef<
  HTMLElement,
  PaginationRootProps & HTMLAttributes<HTMLElement>
>(function Pagination(props, ref) {
  const {
    page: controlledPage,
    defaultPage,
    onPageChange: onPageChangeProp,
    totalPages,
    dir = "ltr",
    label = "Pagination",
    getPageHref,
    className,
    children,
    ...rest
  } = props;

  const [page, setPage] = useControllableState({
    value: controlledPage,
    defaultValue: defaultPage ?? 1,
    ...(onPageChangeProp ? { onChange: onPageChangeProp } : undefined),
  });

  const onPageChange = useCallback(
    (next: number) => {
      if (next >= 1 && next <= totalPages) setPage(next);
    },
    [totalPages, setPage],
  );

  const ctx = useMemo(
    () => ({ page, totalPages, onPageChange, dir, getPageHref }),
    [page, totalPages, onPageChange, dir, getPageHref],
  );

  return createElement(
    PaginationInternalContext.Provider,
    { value: ctx },
    createElement(
      "nav",
      { ...rest, ref, "aria-label": label, "data-kui-component": "Pagination", className },
      children,
    ),
  );
});

// ─── Pagination.Item ────────────────────────────────────────────────

export const PaginationItem = forwardRef<
  HTMLButtonElement,
  PaginationItemProps & HTMLAttributes<HTMLButtonElement>
>(function PaginationItem(props, ref) {
  const { page, className, children, ...rest } = props;
  const ctx = usePaginationInternalContext();
  const isCurrent = ctx.page === page;
  const href = ctx.getPageHref?.(page);

  if (href) {
    return createElement(
      "a",
      {
        ...rest,
        ref: ref as React.Ref<HTMLAnchorElement>,
        href,
        "aria-current": isCurrent ? "page" : undefined,
        "data-state": isCurrent ? "active" : "inactive",
        "data-kui-component": "PaginationItem",
        className,
        onClick: (e: React.MouseEvent) => {
          e.preventDefault();
          ctx.onPageChange(page);
        },
      },
      children ?? String(page),
    );
  }

  return createElement(
    "button",
    {
      ...rest,
      ref,
      type: "button",
      "aria-current": isCurrent ? "page" : undefined,
      "aria-label": `Page ${String(page)}`,
      "data-state": isCurrent ? "active" : "inactive",
      "data-kui-component": "PaginationItem",
      className,
      onClick: () => {
        ctx.onPageChange(page);
      },
    },
    children ?? String(page),
  );
});

// ─── Pagination.Previous ────────────────────────────────────────────

export const PaginationPrevious = forwardRef<
  HTMLButtonElement,
  PaginationPreviousProps & HTMLAttributes<HTMLButtonElement>
>(function PaginationPrevious(props, ref) {
  const { className, children = "Previous", ...rest } = props;
  const ctx = usePaginationInternalContext();
  const disabled = ctx.page <= 1;

  return createElement(
    "button",
    {
      ...rest,
      ref,
      type: "button",
      "aria-label": "Go to previous page",
      "aria-disabled": disabled || undefined,
      "data-disabled": disabled || undefined,
      "data-kui-component": "PaginationPrevious",
      className,
      onClick: () => {
        if (!disabled) ctx.onPageChange(ctx.page - 1);
      },
    },
    children,
  );
});

// ─── Pagination.Next ────────────────────────────────────────────────

export const PaginationNext = forwardRef<
  HTMLButtonElement,
  PaginationNextProps & HTMLAttributes<HTMLButtonElement>
>(function PaginationNext(props, ref) {
  const { className, children = "Next", ...rest } = props;
  const ctx = usePaginationInternalContext();
  const disabled = ctx.page >= ctx.totalPages;

  return createElement(
    "button",
    {
      ...rest,
      ref,
      type: "button",
      "aria-label": "Go to next page",
      "aria-disabled": disabled || undefined,
      "data-disabled": disabled || undefined,
      "data-kui-component": "PaginationNext",
      className,
      onClick: () => {
        if (!disabled) ctx.onPageChange(ctx.page + 1);
      },
    },
    children,
  );
});

// ─── Pagination.Ellipsis ────────────────────────────────────────────

export const PaginationEllipsis = forwardRef<
  HTMLSpanElement,
  PaginationEllipsisRootProps & HTMLAttributes<HTMLSpanElement>
>(function PaginationEllipsis(props, ref) {
  const { className, children = "…", ...rest } = props;

  return createElement(
    "span",
    { ...rest, ref, "aria-hidden": "true", "data-kui-component": "PaginationEllipsis", className },
    children,
  );
});
