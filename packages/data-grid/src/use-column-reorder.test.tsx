import { describe, it, expect, vi } from "vitest";
import { act, fireEvent, render } from "@testing-library/react";
import { createElement, useImperativeHandle, useRef } from "react";
import type { RefObject } from "react";
import { useColumnReorder, REORDER_MIME } from "./use-column-reorder";
import { initialColumnState, pinColumn } from "./column-model";
import type { ColumnState, DataGridColumnDef } from "./column-types";

interface Row {
  readonly id: string;
  readonly name: string;
}

const cols: readonly DataGridColumnDef<Row>[] = [
  { id: "a", header: "A", accessorKey: "id" },
  { id: "b", header: "B", accessorKey: "id" },
  { id: "c", header: "C", accessorKey: "id" },
  { id: "d", header: "D", accessorKey: "id" },
  { id: "locked", header: "Locked", accessorKey: "id", reorderable: false },
];

interface HarnessHandle {
  readonly canReorder: boolean;
  readonly moveLeft: () => void;
  readonly moveRight: () => void;
  readonly moveTo: (targetIndex: number) => void;
}

interface HarnessProps {
  readonly columnId: string;
  readonly state: ColumnState;
  readonly onMove: (columnId: string, targetIndex: number) => void;
  readonly dir?: "ltr" | "rtl";
  readonly disabled?: boolean;
  readonly handleRef: RefObject<HarnessHandle | null>;
}

function Harness(props: HarnessProps): ReturnType<typeof createElement> {
  const reorder = useColumnReorder({
    columnId: props.columnId,
    columns: cols,
    state: props.state,
    onMove: props.onMove,
    ...(props.dir ? { dir: props.dir } : undefined),
    ...(props.disabled !== undefined ? { disabled: props.disabled } : undefined),
  });
  useImperativeHandle(
    props.handleRef,
    () => ({
      canReorder: reorder.canReorder,
      moveLeft: reorder.moveLeft,
      moveRight: reorder.moveRight,
      moveTo: reorder.moveTo,
    }),
    [reorder],
  );
  return createElement(
    "div",
    {
      "data-testid": `col-${props.columnId}`,
      ...reorder.dragHandleProps,
      ...reorder.dropTargetProps,
    },
    props.columnId,
  );
}

function renderReorder(props: Omit<HarnessProps, "handleRef">) {
  const handleRef: RefObject<HarnessHandle | null> = { current: null };
  const result = render(createElement(Harness, { ...props, handleRef }));
  const handle = (): HarnessHandle => {
    if (handleRef.current === null) throw new Error("Harness ref not populated yet");
    return handleRef.current;
  };
  return { ...result, handle };
}

// Emulate a minimal DataTransfer store for happy-dom.
function fakeDataTransfer(payload = ""): DataTransfer {
  const store = new Map<string, string>();
  if (payload !== "") store.set(REORDER_MIME, payload);
  return {
    dropEffect: "none",
    effectAllowed: "uninitialized",
    files: [] as unknown as FileList,
    items: [] as unknown as DataTransferItemList,
    types: Array.from(store.keys()) as unknown as ReadonlyArray<string>,
    clearData(): void {
      store.clear();
    },
    getData(format: string): string {
      return store.get(format) ?? "";
    },
    setData(format: string, data: string): void {
      store.set(format, data);
    },
    setDragImage(): void {
      /* noop */
    },
  } as unknown as DataTransfer;
}

// ─── Programmatic reorder ─────────────────────────────────────────

describe("useColumnReorder — programmatic", () => {
  it("moveLeft swaps within the center pin group in LTR", () => {
    const state = initialColumnState(cols);
    const onMove = vi.fn();
    const { handle } = renderReorder({ columnId: "c", state, onMove });
    act(() => {
      handle().moveLeft();
    });
    expect(onMove).toHaveBeenCalledWith("c", 1);
  });

  it("moveRight swaps within the center pin group in LTR", () => {
    const state = initialColumnState(cols);
    const onMove = vi.fn();
    const { handle } = renderReorder({ columnId: "b", state, onMove });
    act(() => {
      handle().moveRight();
    });
    expect(onMove).toHaveBeenCalledWith("b", 2);
  });

  it("inverts direction in RTL", () => {
    const state = initialColumnState(cols);
    const onMove = vi.fn();
    const { handle } = renderReorder({ columnId: "b", state, onMove, dir: "rtl" });
    act(() => {
      handle().moveLeft();
    });
    expect(onMove).toHaveBeenCalledWith("b", 2);
  });

  it("respects reorderable=false", () => {
    const state = initialColumnState(cols);
    const onMove = vi.fn();
    const { handle } = renderReorder({ columnId: "locked", state, onMove });
    act(() => {
      handle().moveLeft();
      handle().moveRight();
    });
    expect(onMove).not.toHaveBeenCalled();
    expect(handle().canReorder).toBe(false);
  });

  it("cannot cross pin group boundaries", () => {
    let state = initialColumnState(cols);
    state = pinColumn(state, "a", "left");
    const onMove = vi.fn();
    const { handle } = renderReorder({ columnId: "a", state, onMove });
    act(() => {
      handle().moveLeft();
      handle().moveRight();
    });
    expect(onMove).not.toHaveBeenCalled();
  });

  it("moveTo delegates directly to the canonical-order reducer", () => {
    const state = initialColumnState(cols);
    const onMove = vi.fn();
    const { handle } = renderReorder({ columnId: "c", state, onMove });
    act(() => {
      handle().moveTo(0);
    });
    expect(onMove).toHaveBeenCalledWith("c", 0);
  });

  it("moveTo is a no-op when disabled", () => {
    const state = initialColumnState(cols);
    const onMove = vi.fn();
    const { handle } = renderReorder({ columnId: "c", state, onMove, disabled: true });
    act(() => {
      handle().moveTo(0);
    });
    expect(onMove).not.toHaveBeenCalled();
  });
});

// ─── Keyboard reorder ─────────────────────────────────────────────

describe("useColumnReorder — keyboard", () => {
  it("Ctrl+ArrowLeft on the drag handle moves the column left", () => {
    const state = initialColumnState(cols);
    const onMove = vi.fn();
    const { getByTestId } = renderReorder({ columnId: "c", state, onMove });
    fireEvent.keyDown(getByTestId("col-c"), { key: "ArrowLeft", ctrlKey: true });
    expect(onMove).toHaveBeenCalledWith("c", 1);
  });

  it("Ctrl+ArrowRight on the drag handle moves the column right", () => {
    const state = initialColumnState(cols);
    const onMove = vi.fn();
    const { getByTestId } = renderReorder({ columnId: "b", state, onMove });
    fireEvent.keyDown(getByTestId("col-b"), { key: "ArrowRight", ctrlKey: true });
    expect(onMove).toHaveBeenCalledWith("b", 2);
  });

  it("Ctrl+Home / Ctrl+End snap to the ends of the pin group", () => {
    const state = initialColumnState(cols);
    const onMove = vi.fn();
    const { getByTestId } = renderReorder({ columnId: "c", state, onMove });
    fireEvent.keyDown(getByTestId("col-c"), { key: "Home", ctrlKey: true });
    expect(onMove).toHaveBeenLastCalledWith("c", 0);
    fireEvent.keyDown(getByTestId("col-c"), { key: "End", ctrlKey: true });
    expect(onMove).toHaveBeenLastCalledWith("c", 4);
  });

  it("ignores keys without Ctrl / Meta modifier", () => {
    const state = initialColumnState(cols);
    const onMove = vi.fn();
    const { getByTestId } = renderReorder({ columnId: "c", state, onMove });
    fireEvent.keyDown(getByTestId("col-c"), { key: "ArrowLeft" });
    expect(onMove).not.toHaveBeenCalled();
  });
});

// ─── Native HTML5 DnD ─────────────────────────────────────────────

describe("useColumnReorder — native drag and drop", () => {
  it("sets the reorder payload on dragstart", () => {
    const state = initialColumnState(cols);
    const onMove = vi.fn();
    const { getByTestId } = renderReorder({ columnId: "b", state, onMove });
    const dt = fakeDataTransfer();
    fireEvent.dragStart(getByTestId("col-b"), { dataTransfer: dt });
    expect(dt.getData(REORDER_MIME)).toBe("b");
    expect(getByTestId("col-b").getAttribute("data-dragging")).toBe("true");
  });

  it("marks matching pin-group columns as drop targets during dragover", () => {
    const state = initialColumnState(cols);
    const onMove = vi.fn();
    const { getByTestId } = renderReorder({ columnId: "c", state, onMove });
    const dt = fakeDataTransfer("b");
    fireEvent.dragOver(getByTestId("col-c"), { dataTransfer: dt });
    expect(getByTestId("col-c").getAttribute("data-drop-target")).toBe("true");
  });

  it("refuses drops from other pin groups", () => {
    let state = initialColumnState(cols);
    state = pinColumn(state, "a", "left");
    const onMove = vi.fn();
    const { getByTestId } = renderReorder({ columnId: "c", state, onMove });
    const dt = fakeDataTransfer("a");
    fireEvent.drop(getByTestId("col-c"), { dataTransfer: dt });
    expect(onMove).not.toHaveBeenCalled();
  });

  it("routes a valid drop to onMove with the canonical target index", () => {
    const state = initialColumnState(cols);
    const onMove = vi.fn();
    const { getByTestId } = renderReorder({ columnId: "c", state, onMove });
    const dt = fakeDataTransfer("b");
    fireEvent.drop(getByTestId("col-c"), { dataTransfer: dt });
    expect(onMove).toHaveBeenCalledWith("b", 2);
  });

  it("does not enable native drag when disabled", () => {
    const state = initialColumnState(cols);
    const onMove = vi.fn();
    const { getByTestId } = renderReorder({
      columnId: "c",
      state,
      onMove,
      disabled: true,
    });
    expect(getByTestId("col-c").getAttribute("draggable")).toBe("false");
  });

  it("clears the drop-target attribute on drag leave", () => {
    const state = initialColumnState(cols);
    const onMove = vi.fn();
    const { getByTestId } = renderReorder({ columnId: "c", state, onMove });
    const dt = fakeDataTransfer("b");
    fireEvent.dragOver(getByTestId("col-c"), { dataTransfer: dt });
    expect(getByTestId("col-c").getAttribute("data-drop-target")).toBe("true");
    fireEvent.dragLeave(getByTestId("col-c"), { dataTransfer: dt });
    expect(getByTestId("col-c").getAttribute("data-drop-target")).toBe("false");
  });
});

// Silence unused import warning if useRef ends up not needed.
void useRef;
