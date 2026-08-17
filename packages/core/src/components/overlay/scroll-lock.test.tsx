import { describe, it, expect, afterEach, beforeEach } from "vitest";
import { createElement, useState, StrictMode } from "react";
import { render, cleanup, fireEvent, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { ScrollLock, _resetScrollLock } from "./scroll-lock";

beforeEach(() => {
  _resetScrollLock();
  document.body.style.overflow = "";
  document.body.style.paddingRight = "";
});

afterEach(() => {
  cleanup();
  _resetScrollLock();
  document.body.style.overflow = "";
  document.body.style.paddingRight = "";
});

// ─── Basic locking ──────────────────────────────────────────────────

describe("ScrollLock: basic", () => {
  it("sets body overflow to hidden when enabled", () => {
    render(createElement(ScrollLock, { enabled: true }));
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("restores body overflow on unmount", () => {
    document.body.style.overflow = "auto";
    _resetScrollLock();

    const { unmount } = render(createElement(ScrollLock, { enabled: true }));
    expect(document.body.style.overflow).toBe("hidden");

    unmount();
    expect(document.body.style.overflow).toBe("auto");
  });

  it("does not lock when enabled is false", () => {
    render(createElement(ScrollLock, { enabled: false }));
    expect(document.body.style.overflow).toBe("");
  });

  it("defaults enabled to true", () => {
    render(createElement(ScrollLock));
    expect(document.body.style.overflow).toBe("hidden");
  });
});

// ─── Reference counting (nested locks) ─────────────────────────────

describe("ScrollLock: nested locks", () => {
  it("keeps body locked while any lock is active", () => {
    const { unmount: u1 } = render(createElement(ScrollLock, { enabled: true }));
    const { unmount: u2 } = render(createElement(ScrollLock, { enabled: true }));

    expect(document.body.style.overflow).toBe("hidden");

    u2();
    expect(document.body.style.overflow).toBe("hidden");

    u1();
    expect(document.body.style.overflow).toBe("");
  });

  it("restores original style only after last lock unmounts", () => {
    document.body.style.overflow = "scroll";
    _resetScrollLock();

    const { unmount: u1 } = render(createElement(ScrollLock, { enabled: true }));
    const { unmount: u2 } = render(createElement(ScrollLock, { enabled: true }));

    u1();
    expect(document.body.style.overflow).toBe("hidden");

    u2();
    expect(document.body.style.overflow).toBe("scroll");
  });
});

// ─── Dynamic enable/disable ─────────────────────────────────────────

describe("ScrollLock: dynamic toggle", () => {
  it("locks and unlocks when enabled prop changes", () => {
    function Toggle() {
      const [on, setOn] = useState(false);
      return createElement(
        "div",
        null,
        createElement("button", {
          "data-testid": "toggle",
          onClick: () => {
            setOn((v) => !v);
          },
        }),
        createElement(ScrollLock, { enabled: on }),
      );
    }
    Toggle.displayName = "Toggle";

    render(createElement(Toggle));
    expect(document.body.style.overflow).toBe("");

    fireEvent.click(screen.getByTestId("toggle"));
    expect(document.body.style.overflow).toBe("hidden");

    fireEvent.click(screen.getByTestId("toggle"));
    expect(document.body.style.overflow).toBe("");
  });
});

// ─── Cleanup on unmount ─────────────────────────────────────────────

describe("ScrollLock: cleanup", () => {
  it("does not leave overflow hidden after unmount", () => {
    const { unmount } = render(createElement(ScrollLock, { enabled: true }));
    unmount();
    expect(document.body.style.overflow).not.toBe("hidden");
  });
});

// ─── Strict Mode ────────────────────────────────────────────────────

describe("ScrollLock: Strict Mode", () => {
  it("works correctly in StrictMode (effect double-fire)", () => {
    const { unmount } = render(
      createElement(StrictMode, null, createElement(ScrollLock, { enabled: true })),
    );
    expect(document.body.style.overflow).toBe("hidden");

    unmount();
    expect(document.body.style.overflow).toBe("");
  });
});

// ─── SSR ────────────────────────────────────────────────────────────

describe("ScrollLock: SSR", () => {
  it("renders without error during SSR", () => {
    const html = renderToString(createElement(ScrollLock, { enabled: true }));
    expect(html).toBe("");
  });
});
