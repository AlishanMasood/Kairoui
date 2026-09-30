import { describe, expect, it, vi } from "vitest";
import { fireEvent, render } from "@testing-library/react";
import { PermissionMatrix } from "./permission-matrix";
import type {
  PermissionAction,
  PermissionCell,
  PermissionSubject,
} from "./permission-matrix-types";

const SUBJECTS: readonly PermissionSubject[] = [
  { id: "admin", label: "Admin" },
  { id: "member", label: "Member" },
];
const ACTIONS: readonly PermissionAction[] = [
  { id: "read", label: "Read" },
  { id: "write", label: "Write" },
];
const CELLS: readonly PermissionCell[] = [
  { subjectId: "admin", actionId: "read", state: "granted" },
];

describe("Permission Matrix keyboard interactions", () => {
  it("Space toggles the focused cell", () => {
    const onCellChange = vi.fn();
    const { container } = render(
      <PermissionMatrix
        subjects={SUBJECTS}
        actions={ACTIONS}
        cells={CELLS}
        defaultFocusedSubjectId="admin"
        defaultFocusedActionId="read"
        onCellChange={onCellChange}
      />,
    );
    const grid = container.querySelector<HTMLElement>("[role=grid]")!;
    fireEvent.keyDown(grid, { key: " " });
    expect(onCellChange).toHaveBeenCalledOnce();
  });

  it("Enter toggles the focused cell", () => {
    const onCellChange = vi.fn();
    const { container } = render(
      <PermissionMatrix
        subjects={SUBJECTS}
        actions={ACTIONS}
        cells={CELLS}
        defaultFocusedSubjectId="admin"
        defaultFocusedActionId="read"
        onCellChange={onCellChange}
      />,
    );
    const grid = container.querySelector<HTMLElement>("[role=grid]")!;
    fireEvent.keyDown(grid, { key: "Enter" });
    expect(onCellChange).toHaveBeenCalledOnce();
  });

  it("Shift+Space selects the current row", () => {
    const onSelectionChange = vi.fn();
    const { container } = render(
      <PermissionMatrix
        subjects={SUBJECTS}
        actions={ACTIONS}
        cells={CELLS}
        defaultFocusedSubjectId="admin"
        defaultFocusedActionId="read"
        onSelectionChange={onSelectionChange}
      />,
    );
    const grid = container.querySelector<HTMLElement>("[role=grid]")!;
    fireEvent.keyDown(grid, { key: " ", shiftKey: true });
    const call = onSelectionChange.mock.calls.at(-1)?.[0] as { kind: string; subjectId?: string };
    expect(call.kind).toBe("row");
    expect(call.subjectId).toBe("admin");
  });

  it("Ctrl+Space selects the current column", () => {
    const onSelectionChange = vi.fn();
    const { container } = render(
      <PermissionMatrix
        subjects={SUBJECTS}
        actions={ACTIONS}
        cells={CELLS}
        defaultFocusedSubjectId="admin"
        defaultFocusedActionId="read"
        onSelectionChange={onSelectionChange}
      />,
    );
    const grid = container.querySelector<HTMLElement>("[role=grid]")!;
    fireEvent.keyDown(grid, { key: " ", ctrlKey: true });
    const call = onSelectionChange.mock.calls.at(-1)?.[0] as { kind: string; actionId?: string };
    expect(call.kind).toBe("column");
    expect(call.actionId).toBe("read");
  });

  it("Ctrl+A selects all cells", () => {
    const onSelectionChange = vi.fn();
    const { container } = render(
      <PermissionMatrix
        subjects={SUBJECTS}
        actions={ACTIONS}
        cells={CELLS}
        onSelectionChange={onSelectionChange}
      />,
    );
    const grid = container.querySelector<HTMLElement>("[role=grid]")!;
    fireEvent.keyDown(grid, { key: "a", ctrlKey: true });
    const call = onSelectionChange.mock.calls.at(-1)?.[0] as { kind: string };
    expect(call.kind).toBe("all");
  });

  it("Escape clears the selection", () => {
    const onSelectionChange = vi.fn();
    const { container } = render(
      <PermissionMatrix
        subjects={SUBJECTS}
        actions={ACTIONS}
        cells={CELLS}
        defaultSelection={{ kind: "all" }}
        onSelectionChange={onSelectionChange}
      />,
    );
    const grid = container.querySelector<HTMLElement>("[role=grid]")!;
    fireEvent.keyDown(grid, { key: "Escape" });
    const call = onSelectionChange.mock.calls.at(-1)?.[0] as { kind: string };
    expect(call.kind).toBe("none");
  });

  it("ArrowDown moves focus to the next row", () => {
    const onFocusedSubjectChange = vi.fn();
    const { container } = render(
      <PermissionMatrix
        subjects={SUBJECTS}
        actions={ACTIONS}
        cells={CELLS}
        defaultFocusedSubjectId="admin"
        defaultFocusedActionId="read"
        onFocusedSubjectChange={onFocusedSubjectChange}
      />,
    );
    const grid = container.querySelector<HTMLElement>("[role=grid]")!;
    fireEvent.keyDown(grid, { key: "ArrowDown" });
    expect(onFocusedSubjectChange).toHaveBeenCalledWith("member");
  });

  it("ArrowRight moves focus to the next column (RTL swaps)", () => {
    const onFocusedActionChange = vi.fn();
    const { container } = render(
      <PermissionMatrix
        subjects={SUBJECTS}
        actions={ACTIONS}
        cells={CELLS}
        defaultFocusedSubjectId="admin"
        defaultFocusedActionId="read"
        onFocusedActionChange={onFocusedActionChange}
      />,
    );
    const grid = container.querySelector<HTMLElement>("[role=grid]")!;
    fireEvent.keyDown(grid, { key: "ArrowRight" });
    expect(onFocusedActionChange).toHaveBeenCalledWith("write");
  });

  it("Ctrl+End jumps to the last cell in the last row", () => {
    const onFocusedSubjectChange = vi.fn();
    const onFocusedActionChange = vi.fn();
    const { container } = render(
      <PermissionMatrix
        subjects={SUBJECTS}
        actions={ACTIONS}
        cells={CELLS}
        defaultFocusedSubjectId="admin"
        defaultFocusedActionId="read"
        onFocusedSubjectChange={onFocusedSubjectChange}
        onFocusedActionChange={onFocusedActionChange}
      />,
    );
    const grid = container.querySelector<HTMLElement>("[role=grid]")!;
    fireEvent.keyDown(grid, { key: "End", ctrlKey: true });
    expect(onFocusedSubjectChange).toHaveBeenCalledWith("member");
    expect(onFocusedActionChange).toHaveBeenCalledWith("write");
  });
});
