import { describe, it, expect, afterEach } from "vitest";
import { createElement, StrictMode } from "react";
import { render, cleanup, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { Skeleton } from "./skeleton";

afterEach(cleanup);

// ─── Rendering ──────────────────────────────────────────────────────

describe("Skeleton: rendering", () => {
  it("renders with data-kui-component", () => {
    render(createElement(Skeleton, { "data-testid": "sk" } as never));
    expect(screen.getByTestId("sk").getAttribute("data-kui-component")).toBe("Skeleton");
  });

  it("is aria-hidden", () => {
    render(createElement(Skeleton, { "data-testid": "sk" } as never));
    expect(screen.getByTestId("sk").getAttribute("aria-hidden")).toBe("true");
  });
});

// ─── Variants ───────────────────────────────────────────────────────

describe("Skeleton: variants", () => {
  it("defaults to text variant", () => {
    render(createElement(Skeleton, { "data-testid": "sk" } as never));
    expect(screen.getByTestId("sk").getAttribute("data-variant")).toBe("text");
  });

  it("text has width 100% and height 1em", () => {
    render(createElement(Skeleton, { "data-testid": "sk" } as never));
    const el = screen.getByTestId("sk");
    expect(el.style.width).toBe("100%");
    expect(el.style.height).toBe("1em");
  });

  it("rectangular variant", () => {
    render(
      createElement(Skeleton, {
        variant: "rectangular",
        width: 200,
        height: 100,
        "data-testid": "sk",
      } as never),
    );
    const el = screen.getByTestId("sk");
    expect(el.getAttribute("data-variant")).toBe("rectangular");
    expect(el.style.width).toBe("200px");
    expect(el.style.height).toBe("100px");
  });

  it("circular variant has 50% border-radius", () => {
    render(
      createElement(Skeleton, {
        variant: "circular",
        width: 40,
        height: 40,
        "data-testid": "sk",
      } as never),
    );
    expect(screen.getByTestId("sk").style.borderRadius).toBe("50%");
  });

  it("text variant has small border-radius", () => {
    render(createElement(Skeleton, { "data-testid": "sk" } as never));
    expect(screen.getByTestId("sk").style.borderRadius).toBe("4px");
  });

  it("supports custom radius override", () => {
    render(createElement(Skeleton, { radius: "8px", "data-testid": "sk" } as never));
    expect(screen.getByTestId("sk").style.borderRadius).toBe("8px");
  });
});

// ─── Dimensions ─────────────────────────────────────────────────────

describe("Skeleton: dimensions", () => {
  it("supports string width/height", () => {
    render(createElement(Skeleton, { width: "50%", height: "2rem", "data-testid": "sk" } as never));
    const el = screen.getByTestId("sk");
    expect(el.style.width).toBe("50%");
    expect(el.style.height).toBe("2rem");
  });

  it("supports number width/height (px)", () => {
    render(createElement(Skeleton, { width: 120, height: 24, "data-testid": "sk" } as never));
    const el = screen.getByTestId("sk");
    expect(el.style.width).toBe("120px");
    expect(el.style.height).toBe("24px");
  });
});

// ─── Animation ──────────────────────────────────────────────────────

describe("Skeleton: animation", () => {
  it("has pulse animation by default", () => {
    render(createElement(Skeleton, { "data-testid": "sk" } as never));
    expect(screen.getByTestId("sk").style.animation).toContain("kui-pulse");
  });

  it("no animation when animate=false", () => {
    render(createElement(Skeleton, { animate: false, "data-testid": "sk" } as never));
    expect(screen.getByTestId("sk").style.animation).toBe("");
  });

  it("data-animate reflects state", () => {
    render(createElement(Skeleton, { animate: false, "data-testid": "sk" } as never));
    expect(screen.getByTestId("sk").getAttribute("data-animate")).toBe("false");
  });
});

// ─── SSR ────────────────────────────────────────────────────────────

describe("Skeleton: SSR", () => {
  it("renders on server", () => {
    const html = renderToString(createElement(Skeleton, { width: 100, height: 20 }));
    expect(html).toContain("aria-hidden");
    expect(html).toContain("data-kui-component");
  });
});

// ─── Strict Mode ────────────────────────────────────────────────────

describe("Skeleton: Strict Mode", () => {
  it("works in StrictMode", () => {
    render(
      createElement(
        StrictMode,
        null,
        createElement(Skeleton, {
          "data-testid": "sk",
          variant: "circular",
          width: 48,
          height: 48,
        } as never),
      ),
    );
    const el = screen.getByTestId("sk");
    expect(el.style.borderRadius).toBe("50%");
    expect(el.style.width).toBe("48px");
  });
});
