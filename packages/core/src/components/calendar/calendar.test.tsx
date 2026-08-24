import { describe, it, expect, afterEach, vi } from "vitest";
import { createElement, createRef, StrictMode } from "react";
import { render, cleanup, screen, fireEvent } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { Calendar } from "./calendar";

afterEach(cleanup);

// ─── Basic rendering ────────────────────────────────────────────────

describe("Calendar: rendering", () => {
  it("renders with role=grid", () => {
    render(createElement(Calendar));
    expect(screen.getByRole("grid")).toBeInTheDocument();
  });

  it("renders weekday headers", () => {
    render(createElement(Calendar));
    const ths = document.querySelectorAll("[data-kui-component='CalendarWeekday']");
    expect(ths).toHaveLength(7);
  });

  it("renders day cells", () => {
    render(createElement(Calendar));
    const cells = screen.getAllByRole("gridcell");
    expect(cells.length).toBeGreaterThanOrEqual(28);
  });

  it("renders month heading", () => {
    render(createElement(Calendar, { defaultValue: new Date(2026, 0, 15) } as never));
    expect(screen.getByText(/January.*2026/)).toBeInTheDocument();
  });

  it("renders prev/next buttons", () => {
    render(createElement(Calendar));
    expect(screen.getByLabelText("Previous month")).toBeInTheDocument();
    expect(screen.getByLabelText("Next month")).toBeInTheDocument();
  });
});

// ─── Selection ──────────────────────────────────────────────────────

describe("Calendar: selection", () => {
  it("selects a date on click", () => {
    render(createElement(Calendar, { defaultValue: new Date(2026, 0, 15) } as never));
    const day20 = screen.getByText("20");
    fireEvent.click(day20);
    expect(day20.getAttribute("aria-selected")).toBe("true");
    expect(day20.getAttribute("data-selected")).toBe("true");
  });

  it("calls onValueChange on selection", () => {
    const onChange = vi.fn();
    render(
      createElement(Calendar, {
        defaultValue: new Date(2026, 0, 15),
        onValueChange: onChange,
      } as never),
    );
    fireEvent.click(screen.getByText("22"));
    expect(onChange).toHaveBeenCalled();
    const selected = onChange.mock.calls[0]![0] as Date;
    expect(selected.getDate()).toBe(22);
  });

  it("works in controlled mode", () => {
    const { rerender } = render(createElement(Calendar, { value: new Date(2026, 0, 10) } as never));
    expect(screen.getByText("10").getAttribute("aria-selected")).toBe("true");
    rerender(createElement(Calendar, { value: new Date(2026, 0, 20) } as never));
    expect(screen.getByText("20").getAttribute("aria-selected")).toBe("true");
  });

  it("disabled dates are not selectable", () => {
    const onChange = vi.fn();
    render(
      createElement(Calendar, {
        defaultValue: new Date(2026, 0, 15),
        disabled: (d: Date) => d.getDate() === 20,
        onValueChange: onChange,
      } as never),
    );
    fireEvent.click(screen.getByText("20"));
    expect(onChange).not.toHaveBeenCalled();
  });
});

// ─── Navigation ─────────────────────────────────────────────────────

describe("Calendar: month navigation", () => {
  it("prev button shows previous month", () => {
    render(createElement(Calendar, { defaultValue: new Date(2026, 5, 15) } as never));
    fireEvent.click(screen.getByLabelText("Previous month"));
    expect(screen.getByText(/May.*2026/)).toBeInTheDocument();
  });

  it("next button shows next month", () => {
    render(createElement(Calendar, { defaultValue: new Date(2026, 5, 15) } as never));
    fireEvent.click(screen.getByLabelText("Next month"));
    expect(screen.getByText(/July.*2026/)).toBeInTheDocument();
  });

  it("navigates across year boundary", () => {
    render(createElement(Calendar, { defaultValue: new Date(2026, 0, 15) } as never));
    fireEvent.click(screen.getByLabelText("Previous month"));
    expect(screen.getByText(/December.*2025/)).toBeInTheDocument();
  });
});

// ─── Keyboard navigation ────────────────────────────────────────────

describe("Calendar: keyboard", () => {
  it("ArrowRight moves focus forward 1 day", () => {
    render(createElement(Calendar, { defaultValue: new Date(2026, 0, 15) } as never));
    const grid = screen.getByRole("grid");
    const day15 = screen.getByText("15");
    day15.focus();
    fireEvent.keyDown(grid, { key: "ArrowRight" });
    const day16 = screen.getByText("16");
    expect(day16.getAttribute("tabindex")).toBe("0");
  });

  it("ArrowLeft moves focus backward 1 day", () => {
    render(createElement(Calendar, { defaultValue: new Date(2026, 0, 15) } as never));
    const grid = screen.getByRole("grid");
    fireEvent.keyDown(grid, { key: "ArrowLeft" });
    const day14 = screen.getByText("14");
    expect(day14.getAttribute("tabindex")).toBe("0");
  });

  it("ArrowDown moves focus forward 1 week", () => {
    render(createElement(Calendar, { defaultValue: new Date(2026, 0, 15) } as never));
    const grid = screen.getByRole("grid");
    fireEvent.keyDown(grid, { key: "ArrowDown" });
    const day22 = screen.getByText("22");
    expect(day22.getAttribute("tabindex")).toBe("0");
  });

  it("ArrowUp moves focus backward 1 week", () => {
    render(createElement(Calendar, { defaultValue: new Date(2026, 0, 15) } as never));
    const grid = screen.getByRole("grid");
    fireEvent.keyDown(grid, { key: "ArrowUp" });
    const day8 = screen.getByText("8");
    expect(day8.getAttribute("tabindex")).toBe("0");
  });

  it("Enter selects focused date", () => {
    const onChange = vi.fn();
    render(
      createElement(Calendar, {
        defaultValue: new Date(2026, 0, 15),
        onValueChange: onChange,
      } as never),
    );
    const grid = screen.getByRole("grid");
    fireEvent.keyDown(grid, { key: "ArrowRight" });
    const day16 = screen.getByText("16");
    fireEvent.keyDown(day16, { key: "Enter" });
    expect(onChange).toHaveBeenCalled();
  });

  it("RTL reverses ArrowRight/ArrowLeft", () => {
    render(createElement(Calendar, { defaultValue: new Date(2026, 0, 15), dir: "rtl" } as never));
    const grid = screen.getByRole("grid");
    fireEvent.keyDown(grid, { key: "ArrowRight" });
    // RTL: ArrowRight = backward = day 14
    const day14 = screen.getByText("14");
    expect(day14.getAttribute("tabindex")).toBe("0");
  });
});

// ─── Today state ────────────────────────────────────────────────────

describe("Calendar: today", () => {
  it("marks today with data-today", () => {
    const today = new Date();
    render(createElement(Calendar, { defaultValue: today } as never));
    const todayCells = document.querySelectorAll("[data-today='true']");
    expect(todayCells.length).toBeGreaterThanOrEqual(1);
  });
});

// ─── Disabled dates ─────────────────────────────────────────────────

describe("Calendar: disabled", () => {
  it("marks disabled days with aria-disabled", () => {
    render(
      createElement(Calendar, {
        defaultValue: new Date(2026, 0, 15),
        disabled: (d: Date) => d.getDay() === 0 || d.getDay() === 6,
      } as never),
    );
    const disabledCells = document.querySelectorAll("[aria-disabled='true']");
    expect(disabledCells.length).toBeGreaterThan(0);
  });

  it("marks dates outside min/max as disabled", () => {
    render(
      createElement(Calendar, {
        defaultValue: new Date(2026, 0, 15),
        min: new Date(2026, 0, 10),
        max: new Date(2026, 0, 20),
      } as never),
    );
    const day5 = screen.getByText("5");
    expect(day5.getAttribute("aria-disabled")).toBe("true");
    const day25 = screen.getByText("25");
    expect(day25.getAttribute("aria-disabled")).toBe("true");
  });
});

// ─── Outside month ──────────────────────────────────────────────────

describe("Calendar: outside month", () => {
  it("marks outside-month days", () => {
    render(createElement(Calendar, { defaultValue: new Date(2026, 0, 15) } as never));
    const outside = document.querySelectorAll("[data-outside-month='true']");
    expect(outside.length).toBeGreaterThan(0);
  });
});

// ─── Ref forwarding ─────────────────────────────────────────────────

describe("Calendar: ref", () => {
  it("forwards ref to root div", () => {
    const ref = createRef<HTMLDivElement>();
    render(createElement(Calendar, { ref }));
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
    expect(ref.current?.getAttribute("data-kui-component")).toBe("Calendar");
  });
});

// ─── SSR ────────────────────────────────────────────────────────────

describe("Calendar: SSR", () => {
  it("renders to string without errors", () => {
    const html = renderToString(
      createElement(Calendar, { defaultValue: new Date(2026, 0, 15) } as never),
    );
    expect(html).toContain('role="grid"');
    expect(html).toContain("January");
    expect(html).toContain("2026");
    expect(html).toContain('role="gridcell"');
  });
});

// ─── StrictMode ─────────────────────────────────────────────────────

describe("Calendar: StrictMode", () => {
  it("works in StrictMode", () => {
    render(
      createElement(
        StrictMode,
        null,
        createElement(Calendar, { defaultValue: new Date(2026, 0, 15) } as never),
      ),
    );
    expect(screen.getByRole("grid")).toBeInTheDocument();
    expect(screen.getAllByRole("gridcell").length).toBeGreaterThan(0);
  });
});
