import { describe, it, expect, afterEach, vi } from "vitest";
import { createElement, StrictMode } from "react";
import { render, cleanup, screen, fireEvent } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import {
  Pagination,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "./pagination";

afterEach(cleanup);

function BasicPagination(props: {
  page?: number;
  defaultPage?: number;
  totalPages?: number;
  onPageChange?: (p: number) => void;
}) {
  const { totalPages = 10, ...rest } = props;
  return createElement(
    Pagination,
    { ...rest, totalPages, "data-testid": "nav" } as never,
    createElement(PaginationPrevious, { "data-testid": "prev" } as never),
    createElement(PaginationItem, { page: 1, "data-testid": "p1" } as never),
    createElement(PaginationItem, { page: 2, "data-testid": "p2" } as never),
    createElement(PaginationItem, { page: 3, "data-testid": "p3" } as never),
    createElement(PaginationEllipsis, { "data-testid": "ellipsis" } as never),
    createElement(PaginationItem, { page: 10, "data-testid": "p10" } as never),
    createElement(PaginationNext, { "data-testid": "next" } as never),
  );
}
BasicPagination.displayName = "BasicPagination";

// ─── Rendering ──────────────────────────────────────────────────────

describe("Pagination: rendering", () => {
  it("renders nav with aria-label", () => {
    render(createElement(BasicPagination, { defaultPage: 1 }));
    expect(screen.getByTestId("nav").tagName).toBe("NAV");
    expect(screen.getByTestId("nav").getAttribute("aria-label")).toBe("Pagination");
  });

  it("current page has aria-current=page", () => {
    render(createElement(BasicPagination, { defaultPage: 2 }));
    expect(screen.getByTestId("p2").getAttribute("aria-current")).toBe("page");
    expect(screen.getByTestId("p1").getAttribute("aria-current")).toBeNull();
  });

  it("ellipsis is aria-hidden", () => {
    render(createElement(BasicPagination, { defaultPage: 1 }));
    expect(screen.getByTestId("ellipsis").getAttribute("aria-hidden")).toBe("true");
  });
});

// ─── Navigation ─────────────────────────────────────────────────────

describe("Pagination: navigation", () => {
  it("clicking page item changes page", () => {
    const onPageChange = vi.fn();
    render(createElement(BasicPagination, { defaultPage: 1, onPageChange }));
    fireEvent.click(screen.getByTestId("p3"));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it("clicking Next advances page", () => {
    const onPageChange = vi.fn();
    render(createElement(BasicPagination, { defaultPage: 1, onPageChange }));
    fireEvent.click(screen.getByTestId("next"));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("clicking Previous goes back", () => {
    const onPageChange = vi.fn();
    render(createElement(BasicPagination, { defaultPage: 3, onPageChange }));
    fireEvent.click(screen.getByTestId("prev"));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("Previous is disabled on first page", () => {
    render(createElement(BasicPagination, { defaultPage: 1 }));
    expect(screen.getByTestId("prev").getAttribute("aria-disabled")).toBe("true");
  });

  it("Next is disabled on last page", () => {
    render(createElement(BasicPagination, { defaultPage: 10 }));
    expect(screen.getByTestId("next").getAttribute("aria-disabled")).toBe("true");
  });

  it("disabled Previous does not fire onPageChange", () => {
    const onPageChange = vi.fn();
    render(createElement(BasicPagination, { defaultPage: 1, onPageChange }));
    fireEvent.click(screen.getByTestId("prev"));
    expect(onPageChange).not.toHaveBeenCalled();
  });
});

// ─── Controlled ─────────────────────────────────────────────────────

describe("Pagination: controlled", () => {
  it("respects controlled page prop", () => {
    render(createElement(BasicPagination, { page: 5 }));
    expect(screen.getByTestId("p1").getAttribute("aria-current")).toBeNull();
  });
});

// ─── data-kui-component ─────────────────────────────────────────────

describe("Pagination: markers", () => {
  it("all parts have data-kui-component", () => {
    render(createElement(BasicPagination, { defaultPage: 1 }));
    expect(screen.getByTestId("nav").getAttribute("data-kui-component")).toBe("Pagination");
    expect(screen.getByTestId("p1").getAttribute("data-kui-component")).toBe("PaginationItem");
    expect(screen.getByTestId("prev").getAttribute("data-kui-component")).toBe(
      "PaginationPrevious",
    );
    expect(screen.getByTestId("next").getAttribute("data-kui-component")).toBe("PaginationNext");
    expect(screen.getByTestId("ellipsis").getAttribute("data-kui-component")).toBe(
      "PaginationEllipsis",
    );
  });
});

// ─── SSR ────────────────────────────────────────────────────────────

describe("Pagination: SSR", () => {
  it("renders on server", () => {
    const html = renderToString(createElement(BasicPagination, { defaultPage: 1 }));
    expect(html).toContain('aria-label="Pagination"');
    expect(html).toContain("Previous");
    expect(html).toContain("Next");
  });
});

// ─── Strict Mode ────────────────────────────────────────────────────

describe("Pagination: Strict Mode", () => {
  it("works in StrictMode", () => {
    const onPageChange = vi.fn();
    render(
      createElement(
        StrictMode,
        null,
        createElement(BasicPagination, { defaultPage: 1, onPageChange }),
      ),
    );
    fireEvent.click(screen.getByTestId("p2"));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });
});
