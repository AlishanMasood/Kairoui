import { describe, it, expect, expectTypeOf } from "vitest";
import { createElement } from "react";
import { renderHook } from "@testing-library/react";

import {
  PaginationInternalContext,
  usePaginationInternalContext,
  computePageRange,
} from "./pagination-types";
import type {
  PaginationRootProps,
  PaginationItemProps,
  PaginationInternalContextValue,
} from "./pagination-types";

// ─── Context ────────────────────────────────────────────────────────

describe("Pagination architecture: context", () => {
  it("usePaginationInternalContext throws outside provider", () => {
    expect(() => renderHook(() => usePaginationInternalContext())).toThrow(
      "Pagination compound components must be used within <Pagination>.",
    );
  });

  it("returns context value inside provider", () => {
    const value: PaginationInternalContextValue = {
      page: 3,
      totalPages: 10,
      onPageChange: () => {},
      dir: "ltr",
      getPageHref: undefined,
    };
    const { result } = renderHook(() => usePaginationInternalContext(), {
      wrapper: ({ children }) =>
        createElement(PaginationInternalContext.Provider, { value }, children),
    });
    expect(result.current.page).toBe(3);
    expect(result.current.totalPages).toBe(10);
  });
});

// ─── Page range computation ─────────────────────────────────────────

describe("Pagination architecture: computePageRange", () => {
  it("small total (all pages fit)", () => {
    const result = computePageRange(1, 5, 1, 1);
    const pages = result.items
      .filter((i) => i.type === "page")
      .map((i) => (i as { page: number }).page);
    expect(pages).toEqual([1, 2, 3, 4, 5]);
  });

  it("beginning of large range", () => {
    const result = computePageRange(1, 10, 1, 1);
    expect(result.items[0]).toEqual({ type: "page", page: 1 });
    expect(result.items[result.items.length - 1]).toEqual({ type: "page", page: 10 });
    expect(result.items.some((i) => i.type === "ellipsis")).toBe(true);
  });

  it("middle of large range shows both ellipses", () => {
    const result = computePageRange(5, 10, 1, 1);
    const ellipses = result.items.filter((i) => i.type === "ellipsis");
    expect(ellipses.length).toBe(2);
  });

  it("end of large range", () => {
    const result = computePageRange(10, 10, 1, 1);
    expect(result.items[result.items.length - 1]).toEqual({ type: "page", page: 10 });
  });

  it("respects siblingCount", () => {
    const result = computePageRange(5, 20, 2, 1);
    const pages = result.items
      .filter((i) => i.type === "page")
      .map((i) => (i as { page: number }).page);
    expect(pages).toContain(3);
    expect(pages).toContain(4);
    expect(pages).toContain(5);
    expect(pages).toContain(6);
    expect(pages).toContain(7);
  });
});

// ─── Type contracts ─────────────────────────────────────────────────

describe("Pagination architecture: type contracts", () => {
  it("PaginationRootProps has required totalPages", () => {
    expectTypeOf<PaginationRootProps>().toHaveProperty("totalPages");
    expectTypeOf<PaginationRootProps>().toHaveProperty("page");
    expectTypeOf<PaginationRootProps>().toHaveProperty("defaultPage");
    expectTypeOf<PaginationRootProps>().toHaveProperty("onPageChange");
    expectTypeOf<PaginationRootProps>().toHaveProperty("siblingCount");
    expectTypeOf<PaginationRootProps>().toHaveProperty("boundaryCount");
    expectTypeOf<PaginationRootProps>().toHaveProperty("getPageHref");
  });

  it("PaginationItemProps requires page", () => {
    expectTypeOf<PaginationItemProps>().toHaveProperty("page");
  });

  it("PaginationInternalContextValue includes getPageHref", () => {
    expectTypeOf<PaginationInternalContextValue>().toHaveProperty("getPageHref");
  });
});
