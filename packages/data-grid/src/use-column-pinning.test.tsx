import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useColumnPinning } from "./use-column-pinning";
import { initialColumnState, pinColumn as reducePinColumn } from "./column-model";
import type { ColumnPinning, ColumnPinSide, ColumnState, DataGridColumnDef } from "./column-types";

interface Row {
  readonly id: string;
}

const cols: readonly DataGridColumnDef<Row>[] = [
  { id: "a", header: "A", accessorKey: "id" },
  { id: "b", header: "B", accessorKey: "id" },
  { id: "c", header: "C", accessorKey: "id", pinnable: false },
];

function makeState(mutator?: (s: ColumnState) => ColumnState): ColumnState {
  const base = initialColumnState(cols);
  return mutator ? mutator(base) : base;
}

describe("useColumnPinning", () => {
  it("exposes the current pinning slice", () => {
    const state = makeState((s) => reducePinColumn(s, "a", "left"));
    const { result } = renderHook(() =>
      useColumnPinning({
        columns: cols,
        state,
        onPin: vi.fn(),
        onPinningChange: vi.fn(),
      }),
    );
    expect(result.current.pinning.left).toEqual(["a"]);
  });

  it("pin(id, side) calls onPin", () => {
    const state = makeState();
    const onPin = vi.fn();
    const { result } = renderHook(() =>
      useColumnPinning({
        columns: cols,
        state,
        onPin,
        onPinningChange: vi.fn(),
      }),
    );
    result.current.pin("a", "left");
    expect(onPin).toHaveBeenCalledWith("a", "left");
  });

  it("unpin(id) calls onPin with side=null when the column is pinned", () => {
    const state = makeState((s) => reducePinColumn(s, "a", "right"));
    const onPin = vi.fn();
    const { result } = renderHook(() =>
      useColumnPinning({
        columns: cols,
        state,
        onPin,
        onPinningChange: vi.fn(),
      }),
    );
    result.current.unpin("a");
    expect(onPin).toHaveBeenCalledWith("a", null);
  });

  it("unpin(id) is a no-op when the column is not pinned", () => {
    const state = makeState();
    const onPin = vi.fn();
    const { result } = renderHook(() =>
      useColumnPinning({
        columns: cols,
        state,
        onPin,
        onPinningChange: vi.fn(),
      }),
    );
    result.current.unpin("a");
    expect(onPin).not.toHaveBeenCalled();
  });

  it("togglePin(id, side) pins when unpinned, unpins when pinned to same side, and switches sides", () => {
    const onPin = vi.fn();
    const initial = makeState();
    const { result, rerender } = renderHook(
      (props: { state: ColumnState }) =>
        useColumnPinning({
          columns: cols,
          state: props.state,
          onPin,
          onPinningChange: vi.fn(),
        }),
      { initialProps: { state: initial } },
    );

    result.current.togglePin("a", "left");
    expect(onPin).toHaveBeenLastCalledWith("a", "left");

    const afterLeft = reducePinColumn(initial, "a", "left");
    rerender({ state: afterLeft });
    result.current.togglePin("a", "left");
    expect(onPin).toHaveBeenLastCalledWith("a", null);

    const afterUnpin = reducePinColumn(afterLeft, "a", null);
    rerender({ state: afterUnpin });
    result.current.togglePin("a", "right");
    expect(onPin).toHaveBeenLastCalledWith("a", "right");
  });

  it("canPin returns false for columns marked pinnable=false", () => {
    const state = makeState();
    const { result } = renderHook(() =>
      useColumnPinning({
        columns: cols,
        state,
        onPin: vi.fn(),
        onPinningChange: vi.fn(),
      }),
    );
    expect(result.current.canPin("c")).toBe(false);
    expect(result.current.canPin("a")).toBe(true);
    expect(result.current.canPin("mystery")).toBe(false);
  });

  it("pin / togglePin refuse to act on pinnable=false columns", () => {
    const state = makeState();
    const onPin = vi.fn();
    const { result } = renderHook(() =>
      useColumnPinning({
        columns: cols,
        state,
        onPin,
        onPinningChange: vi.fn(),
      }),
    );
    result.current.pin("c", "left");
    result.current.togglePin("c", "left");
    expect(onPin).not.toHaveBeenCalled();
  });

  it("getPinSide reflects the current state", () => {
    const state = makeState((s) => reducePinColumn(s, "a", "right"));
    const { result } = renderHook(() =>
      useColumnPinning({
        columns: cols,
        state,
        onPin: vi.fn(),
        onPinningChange: vi.fn(),
      }),
    );
    expect(result.current.getPinSide("a")).toBe<ColumnPinSide | null>("right");
    expect(result.current.getPinSide("b")).toBeNull();
  });

  it("clear() calls onPinningChange with an empty pinning", () => {
    const state = makeState();
    const onPinningChange = vi.fn();
    const { result } = renderHook(() =>
      useColumnPinning({
        columns: cols,
        state,
        onPin: vi.fn(),
        onPinningChange,
      }),
    );
    result.current.clear();
    expect(onPinningChange).toHaveBeenCalledWith<ColumnPinning[]>({ left: [], right: [] });
  });
});
