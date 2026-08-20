import { createContext, useContext } from "react";
import type { ReactNode } from "react";

// ─── Pagination Root Props ──────────────────────────────────────────

export interface PaginationRootProps {
  /** Controlled current page (1-indexed). */
  page?: number;
  /** Initial page for uncontrolled mode. Defaults to 1. */
  defaultPage?: number;
  /** Called when page changes. */
  onPageChange?: (page: number) => void;
  /** Total number of pages. */
  totalPages: number;
  /** Pages shown on each side of current. Defaults to 1. */
  siblingCount?: number;
  /** Pages shown at start/end. Defaults to 1. */
  boundaryCount?: number;
  /** Text direction. */
  dir?: "ltr" | "rtl";
  /** Accessible label for the nav. Defaults to "Pagination". */
  label?: string;
  /** Generate href for a page (enables link-based navigation). */
  getPageHref?: (page: number) => string;
  className?: string;
  children?: ReactNode;
}

// ─── Pagination Item Props ──────────────────────────────────────────

export interface PaginationItemProps {
  /** Page number this item represents. */
  page: number;
  className?: string;
  children?: ReactNode;
}

// ─── Pagination Previous/Next/First/Last Props ──────────────────────

export interface PaginationPreviousProps {
  className?: string;
  children?: ReactNode;
}

export interface PaginationNextProps {
  className?: string;
  children?: ReactNode;
}

export interface PaginationFirstProps {
  className?: string;
  children?: ReactNode;
}

export interface PaginationLastProps {
  className?: string;
  children?: ReactNode;
}

// ─── Pagination Ellipsis Props ──────────────────────────────────────

export interface PaginationEllipsisRootProps {
  className?: string;
  children?: ReactNode;
}

// ─── Pagination Context ─────────────────────────────────────────────

export interface PaginationInternalContextValue {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  dir: "ltr" | "rtl";
  getPageHref: ((page: number) => string) | undefined;
}

export const PaginationInternalContext = createContext<PaginationInternalContextValue | null>(null);
PaginationInternalContext.displayName = "PaginationInternalContext";

export function usePaginationInternalContext(): PaginationInternalContextValue {
  const ctx = useContext(PaginationInternalContext);
  if (ctx === null) {
    throw new Error("Pagination compound components must be used within <Pagination>.");
  }
  return ctx;
}

// ─── Page range computation ─────────────────────────────────────────

export interface PageRange {
  items: Array<{ type: "page"; page: number } | { type: "ellipsis" }>;
}

export function computePageRange(
  page: number,
  totalPages: number,
  siblingCount: number,
  boundaryCount: number,
): PageRange {
  const items: PageRange["items"] = [];

  const startPages = range(1, Math.min(boundaryCount, totalPages));
  const endPages = range(Math.max(totalPages - boundaryCount + 1, boundaryCount + 1), totalPages);

  const siblingsStart = Math.max(
    Math.min(page - siblingCount, totalPages - boundaryCount - siblingCount * 2 - 1),
    boundaryCount + 2,
  );
  const siblingsEnd = Math.min(
    Math.max(page + siblingCount, boundaryCount + siblingCount * 2 + 2),
    endPages.length > 0 ? (endPages[0] ?? totalPages + 1) - 2 : totalPages - 1,
  );

  for (const p of startPages) items.push({ type: "page", page: p });

  if (siblingsStart > boundaryCount + 2) {
    items.push({ type: "ellipsis" });
  } else if (boundaryCount + 1 < (endPages[0] ?? totalPages + 1) - 1) {
    items.push({ type: "page", page: boundaryCount + 1 });
  }

  for (const p of range(siblingsStart, siblingsEnd)) items.push({ type: "page", page: p });

  if (siblingsEnd < (endPages[0] ?? totalPages + 1) - 2) {
    items.push({ type: "ellipsis" });
  } else if (
    (endPages[0] ?? totalPages + 1) - 1 > boundaryCount &&
    (endPages[0] ?? totalPages + 1) - 1 <= totalPages
  ) {
    items.push({ type: "page", page: (endPages[0] ?? totalPages + 1) - 1 });
  }

  for (const p of endPages) items.push({ type: "page", page: p });

  return { items };
}

function range(start: number, end: number): number[] {
  const result: number[] = [];
  for (let i = start; i <= end; i++) result.push(i);
  return result;
}
