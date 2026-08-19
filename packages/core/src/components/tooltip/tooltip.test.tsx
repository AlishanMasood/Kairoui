import { describe, it, expect, afterEach, vi, beforeEach } from "vitest";
import { createElement, StrictMode } from "react";
import { render, cleanup, screen, fireEvent, act } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { Tooltip, TooltipTrigger, TooltipPortal, TooltipContent, TooltipArrow } from "./tooltip";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function BasicTooltip(props: {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  delayDuration?: number;
  closeDelay?: number;
}) {
  return createElement(
    Tooltip,
    {
      defaultOpen: props.defaultOpen,
      open: props.open,
      onOpenChange: props.onOpenChange,
      delayDuration: props.delayDuration,
      closeDelay: props.closeDelay,
    },
    createElement(TooltipTrigger, { "data-testid": "trigger" } as never, "Hover me"),
    createElement(
      TooltipPortal,
      null,
      createElement(
        TooltipContent,
        { "data-testid": "content" } as never,
        createElement(TooltipArrow, { "data-testid": "arrow" } as never),
        "Tooltip text",
      ),
    ),
  );
}
BasicTooltip.displayName = "BasicTooltip";

// ─── Rendering ──────────────────────────────────────────────────────

describe("Tooltip: rendering", () => {
  it("renders trigger", () => {
    render(createElement(BasicTooltip));
    expect(screen.getByTestId("trigger").getAttribute("data-kui-component")).toBe("TooltipTrigger");
    expect(screen.getByTestId("trigger").getAttribute("data-state")).toBe("closed");
  });

  it("does not render content when closed", () => {
    render(createElement(BasicTooltip));
    expect(screen.queryByTestId("content")).toBeNull();
  });

  it("renders content when open", () => {
    render(createElement(BasicTooltip, { defaultOpen: true }));
    expect(screen.getByTestId("content")).not.toBeNull();
  });
});

// ─── Hover behavior ─────────────────────────────────────────────────

describe("Tooltip: hover", () => {
  it("opens after delay on pointer enter", () => {
    render(createElement(BasicTooltip, { delayDuration: 200 }));
    fireEvent.pointerEnter(screen.getByTestId("trigger"));

    expect(screen.queryByTestId("content")).toBeNull();

    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(screen.getByTestId("content")).not.toBeNull();
  });

  it("closes after close delay on pointer leave", () => {
    render(createElement(BasicTooltip, { defaultOpen: true, closeDelay: 100 }));
    expect(screen.getByTestId("content")).not.toBeNull();

    fireEvent.pointerLeave(screen.getByTestId("trigger"));
    expect(screen.getByTestId("content")).not.toBeNull();

    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(screen.queryByTestId("content")).toBeNull();
  });

  it("opens immediately when delayDuration is 0", () => {
    render(createElement(BasicTooltip, { delayDuration: 0 }));
    fireEvent.pointerEnter(screen.getByTestId("trigger"));
    expect(screen.getByTestId("content")).not.toBeNull();
  });

  it("cancels open if pointer leaves before delay", () => {
    render(createElement(BasicTooltip, { delayDuration: 500 }));
    fireEvent.pointerEnter(screen.getByTestId("trigger"));
    act(() => {
      vi.advanceTimersByTime(200);
    });
    fireEvent.pointerLeave(screen.getByTestId("trigger"));
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(screen.queryByTestId("content")).toBeNull();
  });
});

// ─── Focus behavior ─────────────────────────────────────────────────

describe("Tooltip: focus", () => {
  it("opens on focus", () => {
    render(createElement(BasicTooltip, { delayDuration: 0 }));
    fireEvent.focus(screen.getByTestId("trigger"));
    expect(screen.getByTestId("content")).not.toBeNull();
  });

  it("closes on blur", () => {
    render(createElement(BasicTooltip, { defaultOpen: true, closeDelay: 0 }));
    fireEvent.blur(screen.getByTestId("trigger"));
    expect(screen.queryByTestId("content")).toBeNull();
  });
});

// ─── Escape ─────────────────────────────────────────────────────────

describe("Tooltip: escape", () => {
  it("closes on Escape key", () => {
    render(createElement(BasicTooltip, { defaultOpen: true }));
    expect(screen.getByTestId("content")).not.toBeNull();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByTestId("content")).toBeNull();
  });
});

// ─── Accessibility ──────────────────────────────────────────────────

describe("Tooltip: accessibility", () => {
  it("content has role=tooltip", () => {
    render(createElement(BasicTooltip, { defaultOpen: true }));
    expect(screen.getByTestId("content").getAttribute("role")).toBe("tooltip");
  });

  it("trigger has aria-describedby pointing to content when open", () => {
    render(createElement(BasicTooltip, { defaultOpen: true }));
    const trigger = screen.getByTestId("trigger");
    const contentId = screen.getByTestId("content").id;
    expect(trigger.getAttribute("aria-describedby")).toBe(contentId);
  });

  it("trigger has no aria-describedby when closed", () => {
    render(createElement(BasicTooltip));
    expect(screen.getByTestId("trigger").getAttribute("aria-describedby")).toBeNull();
  });

  it("content is non-interactive (pointer-events: none)", () => {
    render(createElement(BasicTooltip, { defaultOpen: true }));
    expect(screen.getByTestId("content").style.pointerEvents).toBe("none");
  });
});

// ─── Positioning ────────────────────────────────────────────────────

describe("Tooltip: positioning", () => {
  it("content has positioning styles", () => {
    render(createElement(BasicTooltip, { defaultOpen: true }));
    const content = screen.getByTestId("content");
    expect(content.style.position).toBe("absolute");
    expect(content.style.transform).toContain("translate");
  });

  it("has data-side attribute", () => {
    render(createElement(BasicTooltip, { defaultOpen: true }));
    expect(screen.getByTestId("content").getAttribute("data-side")).not.toBeNull();
  });

  it("arrow renders", () => {
    render(createElement(BasicTooltip, { defaultOpen: true }));
    expect(screen.getByTestId("arrow").getAttribute("data-kui-component")).toBe("TooltipArrow");
  });
});

// ─── SSR ────────────────────────────────────────────────────────────

describe("Tooltip: SSR", () => {
  it("renders trigger on server, not content", () => {
    vi.useRealTimers();
    const html = renderToString(createElement(BasicTooltip));
    expect(html).toContain("Hover me");
    expect(html).not.toContain("Tooltip text");
  });
});

// ─── Strict Mode ────────────────────────────────────────────────────

describe("Tooltip: Strict Mode", () => {
  it("works in StrictMode", () => {
    render(createElement(StrictMode, null, createElement(BasicTooltip, { defaultOpen: true })));
    expect(screen.getByTestId("content")).not.toBeNull();
    expect(screen.getByTestId("content").getAttribute("role")).toBe("tooltip");
  });
});
