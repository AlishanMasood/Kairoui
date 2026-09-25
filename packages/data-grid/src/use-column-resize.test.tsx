import { describe, it, expect, vi } from "vitest";
import { fireEvent, render } from "@testing-library/react";
import { createElement } from "react";
import type { CSSProperties } from "react";
import { useColumnResize } from "./use-column-resize";
import type { DataGridColumnDef } from "./column-types";

interface Row {
  readonly id: string;
  readonly name: string;
}

const cols: readonly DataGridColumnDef<Row>[] = [
  { id: "name", header: "Name", accessorKey: "name", minWidth: 60, maxWidth: 400, resizable: true },
  { id: "fixed", header: "Fixed", accessorKey: "id", resizable: false },
];

interface HarnessProps {
  readonly columnId: string;
  readonly currentWidth: number;
  readonly onResize: (columnId: string, width: number) => void;
  readonly dir?: "ltr" | "rtl";
  readonly step?: number;
  readonly disabled?: boolean;
}

function Harness(props: HarnessProps): ReturnType<typeof createElement> {
  const { resizeHandleProps } = useColumnResize({
    columnId: props.columnId,
    columns: cols,
    currentWidth: props.currentWidth,
    onResize: props.onResize,
    ...(props.dir ? { dir: props.dir } : undefined),
    ...(props.step !== undefined ? { step: props.step } : undefined),
    ...(props.disabled !== undefined ? { disabled: props.disabled } : undefined),
  });
  const style: CSSProperties = { width: 12, height: 24, background: "gray" };
  return createElement("div", {
    "data-testid": "handle",
    style,
    ...resizeHandleProps,
  });
}

// ─── ARIA + defaults ──────────────────────────────────────────────

describe("useColumnResize — ARIA", () => {
  it("renders a WAI-ARIA separator with vertical orientation", () => {
    const onResize = vi.fn();
    const { getByTestId } = render(
      createElement(Harness, { columnId: "name", currentWidth: 150, onResize }),
    );
    const handle = getByTestId("handle");
    expect(handle.getAttribute("role")).toBe("separator");
    expect(handle.getAttribute("aria-orientation")).toBe("vertical");
    expect(handle.getAttribute("aria-valuenow")).toBe("150");
    expect(handle.getAttribute("aria-valuemin")).toBe("60");
    expect(handle.getAttribute("aria-valuemax")).toBe("400");
    expect(handle.getAttribute("tabindex")).toBe("0");
    expect(handle.getAttribute("data-disabled")).toBe("false");
    expect(handle.getAttribute("data-column-id")).toBe("name");
  });

  it("marks the handle disabled when resizable=false", () => {
    const onResize = vi.fn();
    const { getByTestId } = render(
      createElement(Harness, { columnId: "fixed", currentWidth: 150, onResize }),
    );
    const handle = getByTestId("handle");
    expect(handle.getAttribute("data-disabled")).toBe("true");
    expect(handle.getAttribute("tabindex")).toBe("-1");
  });

  it("marks the handle disabled when disabled prop is true", () => {
    const onResize = vi.fn();
    const { getByTestId } = render(
      createElement(Harness, {
        columnId: "name",
        currentWidth: 150,
        onResize,
        disabled: true,
      }),
    );
    expect(getByTestId("handle").getAttribute("data-disabled")).toBe("true");
  });
});

// ─── Pointer resize ───────────────────────────────────────────────

describe("useColumnResize — pointer", () => {
  it("commits the clamped delta on each pointer move", () => {
    const onResize = vi.fn();
    const { getByTestId } = render(
      createElement(Harness, { columnId: "name", currentWidth: 150, onResize }),
    );
    const handle = getByTestId("handle");
    fireEvent.pointerDown(handle, { clientX: 100, pointerId: 1, button: 0 });
    fireEvent.pointerMove(handle, { clientX: 130, pointerId: 1 });
    expect(onResize).toHaveBeenLastCalledWith("name", 180);
    fireEvent.pointerMove(handle, { clientX: 90, pointerId: 1 });
    expect(onResize).toHaveBeenLastCalledWith("name", 140);
  });

  it("toggles data-resizing while a session is active", () => {
    const onResize = vi.fn();
    const { getByTestId } = render(
      createElement(Harness, { columnId: "name", currentWidth: 150, onResize }),
    );
    const handle = getByTestId("handle");
    fireEvent.pointerDown(handle, { clientX: 100, pointerId: 1, button: 0 });
    expect(handle.getAttribute("data-resizing")).toBe("true");
    fireEvent.pointerUp(handle, { clientX: 100, pointerId: 1 });
    expect(handle.getAttribute("data-resizing")).toBe("false");
  });

  it("ignores pointerdown from non-primary buttons", () => {
    const onResize = vi.fn();
    const { getByTestId } = render(
      createElement(Harness, { columnId: "name", currentWidth: 150, onResize }),
    );
    fireEvent.pointerDown(getByTestId("handle"), { clientX: 100, pointerId: 1, button: 2 });
    fireEvent.pointerMove(getByTestId("handle"), { clientX: 130, pointerId: 1 });
    expect(onResize).not.toHaveBeenCalled();
  });

  it("cancels the drag session on pointercancel", () => {
    const onResize = vi.fn();
    const { getByTestId } = render(
      createElement(Harness, { columnId: "name", currentWidth: 150, onResize }),
    );
    const handle = getByTestId("handle");
    fireEvent.pointerDown(handle, { clientX: 100, pointerId: 1, button: 0 });
    fireEvent.pointerCancel(handle, { clientX: 100, pointerId: 1 });
    expect(handle.getAttribute("data-resizing")).toBe("false");
    fireEvent.pointerMove(handle, { clientX: 130, pointerId: 1 });
    expect(onResize).not.toHaveBeenCalled();
  });

  it("clamps below minWidth and above maxWidth", () => {
    const onResize = vi.fn();
    const { getByTestId } = render(
      createElement(Harness, { columnId: "name", currentWidth: 150, onResize }),
    );
    const handle = getByTestId("handle");
    fireEvent.pointerDown(handle, { clientX: 100, pointerId: 1, button: 0 });
    fireEvent.pointerMove(handle, { clientX: 0, pointerId: 1 });
    expect(onResize).toHaveBeenLastCalledWith("name", 60);
    fireEvent.pointerMove(handle, { clientX: 9999, pointerId: 1 });
    expect(onResize).toHaveBeenLastCalledWith("name", 400);
  });
});

// ─── RTL pointer resize ───────────────────────────────────────────

describe("useColumnResize — RTL", () => {
  it("inverts pointer delta when dir=rtl", () => {
    const onResize = vi.fn();
    const { getByTestId } = render(
      createElement(Harness, {
        columnId: "name",
        currentWidth: 150,
        onResize,
        dir: "rtl",
      }),
    );
    const handle = getByTestId("handle");
    fireEvent.pointerDown(handle, { clientX: 100, pointerId: 1, button: 0 });
    fireEvent.pointerMove(handle, { clientX: 130, pointerId: 1 });
    expect(onResize).toHaveBeenLastCalledWith("name", 120);
  });

  it("inverts arrow keys when dir=rtl", () => {
    const onResize = vi.fn();
    const { getByTestId } = render(
      createElement(Harness, {
        columnId: "name",
        currentWidth: 150,
        onResize,
        dir: "rtl",
        step: 10,
      }),
    );
    fireEvent.keyDown(getByTestId("handle"), { key: "ArrowRight" });
    expect(onResize).toHaveBeenLastCalledWith("name", 140);
    fireEvent.keyDown(getByTestId("handle"), { key: "ArrowLeft" });
    expect(onResize).toHaveBeenLastCalledWith("name", 160);
  });
});

// ─── Keyboard resize ──────────────────────────────────────────────

describe("useColumnResize — keyboard", () => {
  it("ArrowLeft shrinks by step; ArrowRight grows by step", () => {
    const onResize = vi.fn();
    const { getByTestId } = render(
      createElement(Harness, {
        columnId: "name",
        currentWidth: 150,
        onResize,
        step: 8,
      }),
    );
    fireEvent.keyDown(getByTestId("handle"), { key: "ArrowLeft" });
    expect(onResize).toHaveBeenLastCalledWith("name", 142);
    fireEvent.keyDown(getByTestId("handle"), { key: "ArrowRight" });
    expect(onResize).toHaveBeenLastCalledWith("name", 158);
  });

  it("Shift+Arrow uses a 4× step", () => {
    const onResize = vi.fn();
    const { getByTestId } = render(
      createElement(Harness, {
        columnId: "name",
        currentWidth: 200,
        onResize,
        step: 10,
      }),
    );
    fireEvent.keyDown(getByTestId("handle"), { key: "ArrowRight", shiftKey: true });
    expect(onResize).toHaveBeenLastCalledWith("name", 240);
  });

  it("Home snaps to minWidth and End snaps to maxWidth", () => {
    const onResize = vi.fn();
    const { getByTestId } = render(
      createElement(Harness, { columnId: "name", currentWidth: 200, onResize }),
    );
    fireEvent.keyDown(getByTestId("handle"), { key: "Home" });
    expect(onResize).toHaveBeenLastCalledWith("name", 60);
    fireEvent.keyDown(getByTestId("handle"), { key: "End" });
    expect(onResize).toHaveBeenLastCalledWith("name", 400);
  });

  it("does not react to keys when disabled", () => {
    const onResize = vi.fn();
    const { getByTestId } = render(
      createElement(Harness, {
        columnId: "fixed",
        currentWidth: 150,
        onResize,
      }),
    );
    fireEvent.keyDown(getByTestId("handle"), { key: "ArrowRight" });
    expect(onResize).not.toHaveBeenCalled();
  });

  it("ignores unrelated keys", () => {
    const onResize = vi.fn();
    const { getByTestId } = render(
      createElement(Harness, { columnId: "name", currentWidth: 150, onResize }),
    );
    fireEvent.keyDown(getByTestId("handle"), { key: "Enter" });
    fireEvent.keyDown(getByTestId("handle"), { key: " " });
    fireEvent.keyDown(getByTestId("handle"), { key: "Tab" });
    expect(onResize).not.toHaveBeenCalled();
  });
});
