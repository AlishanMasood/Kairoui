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

function baseCells(): readonly PermissionCell[] {
  return [
    { subjectId: "admin", actionId: "read", state: "granted" },
    { subjectId: "admin", actionId: "write", state: "granted" },
    { subjectId: "member", actionId: "read", state: "granted" },
    { subjectId: "member", actionId: "write", state: "denied" },
  ];
}

// â”€â”€â”€ Root â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

describe("<PermissionMatrix> root", () => {
  it("renders a role=application root with aria-roledescription", () => {
    const { container } = render(
      <PermissionMatrix subjects={SUBJECTS} actions={ACTIONS} cells={baseCells()} />,
    );
    const root = container.querySelector<HTMLElement>("[role=application]");
    expect(root).not.toBeNull();
    expect(root?.getAttribute("aria-roledescription")).toBe("Permission matrix");
  });

  it("renders the grid + one row per subject", () => {
    const { container } = render(
      <PermissionMatrix subjects={SUBJECTS} actions={ACTIONS} cells={baseCells()} />,
    );
    const grid = container.querySelector<HTMLElement>("[role=grid]");
    expect(grid).not.toBeNull();
    const rows = container.querySelectorAll("[data-permission-matrix-row]");
    expect(rows.length).toBe(2);
  });

  it("applies className / style / id / aria-label", () => {
    const { container } = render(
      <PermissionMatrix
        subjects={SUBJECTS}
        actions={ACTIONS}
        cells={baseCells()}
        className="my-matrix"
        style={{ height: 320 }}
        id="matrix"
        aria-label="Team matrix"
      />,
    );
    const root = container.querySelector<HTMLElement>("[role=application]");
    expect(root?.getAttribute("id")).toBe("matrix");
    expect(root?.getAttribute("aria-label")).toBe("Team matrix");
    expect(root?.className).toContain("my-matrix");
    expect(root?.style.height).toBe("320px");
  });

  it("renders a live-polite announcer", () => {
    const { container } = render(
      <PermissionMatrix subjects={SUBJECTS} actions={ACTIONS} cells={baseCells()} />,
    );
    const announcer = container.querySelector("[data-permission-matrix-announcer]");
    expect(announcer).not.toBeNull();
    expect(announcer?.getAttribute("aria-live")).toBe("polite");
  });
});

// â”€â”€â”€ Cells â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

describe("Cells", () => {
  it("maps state to aria-checked correctly", () => {
    const cells: readonly PermissionCell[] = [
      { subjectId: "admin", actionId: "read", state: "granted" },
      { subjectId: "admin", actionId: "write", state: "denied" },
      { subjectId: "member", actionId: "read", state: "inherited" },
      { subjectId: "member", actionId: "write", state: "unset" },
    ];
    const { container } = render(
      <PermissionMatrix subjects={SUBJECTS} actions={ACTIONS} cells={cells} />,
    );
    const g = container.querySelector<HTMLElement>('[data-state="granted"]');
    const d = container.querySelector<HTMLElement>('[data-state="denied"]');
    const inh = container.querySelector<HTMLElement>('[data-state="inherited"]');
    const u = container.querySelector<HTMLElement>('[data-state="unset"]');
    expect(g?.getAttribute("aria-checked")).toBe("true");
    expect(d?.getAttribute("aria-checked")).toBe("false");
    expect(inh?.getAttribute("aria-checked")).toBe("mixed");
    expect(u?.getAttribute("aria-checked")).toBe("false");
  });

  it("fires onCellChange when a cell is clicked", () => {
    const onCellChange = vi.fn();
    const { container } = render(
      <PermissionMatrix
        subjects={SUBJECTS}
        actions={ACTIONS}
        cells={baseCells()}
        onCellChange={onCellChange}
      />,
    );
    const cell = container.querySelector<HTMLElement>(
      '[data-subject-id="admin"][data-action-id="read"]',
    )!;
    fireEvent.click(cell);
    expect(onCellChange).toHaveBeenCalledOnce();
    const payload = onCellChange.mock.calls[0]?.[0] as {
      readonly subject: PermissionSubject;
      readonly action: PermissionAction;
      readonly fromState: string;
      readonly toState: string;
    };
    expect(payload.subject.id).toBe("admin");
    expect(payload.action.id).toBe("read");
    expect(payload.fromState).toBe("granted");
    expect(payload.toState).toBe("unset");
  });

  it("does not fire onCellChange when the cell is disabled", () => {
    const cells: readonly PermissionCell[] = [
      { subjectId: "admin", actionId: "read", state: "granted", disabled: true },
    ];
    const onCellChange = vi.fn();
    const { container } = render(
      <PermissionMatrix
        subjects={SUBJECTS}
        actions={ACTIONS}
        cells={cells}
        onCellChange={onCellChange}
      />,
    );
    const cell = container.querySelector<HTMLElement>(
      '[data-subject-id="admin"][data-action-id="read"]',
    )!;
    expect(cell.getAttribute("aria-disabled")).toBe("true");
    fireEvent.click(cell);
    expect(onCellChange).not.toHaveBeenCalled();
  });

  it("does not fire onCellChange when the matrix is readOnly", () => {
    const onCellChange = vi.fn();
    const { container } = render(
      <PermissionMatrix
        subjects={SUBJECTS}
        actions={ACTIONS}
        cells={baseCells()}
        readOnly
        onCellChange={onCellChange}
      />,
    );
    const cell = container.querySelector<HTMLElement>(
      '[data-subject-id="admin"][data-action-id="read"]',
    )!;
    fireEvent.click(cell);
    expect(onCellChange).not.toHaveBeenCalled();
  });

  it("uses renderCell to render custom cell content", () => {
    const { container } = render(
      <PermissionMatrix
        subjects={SUBJECTS}
        actions={ACTIONS}
        cells={baseCells()}
        renderCell={({ cell }) => <span data-testid="custom">{cell.state}</span>}
      />,
    );
    const custom = container.querySelectorAll("[data-testid=custom]");
    expect(custom.length).toBe(4);
  });

  it("respects the grant-deny toggle mode: granted â†’ denied â†’ unset â†’ granted", () => {
    const onCellChange = vi.fn();
    const { rerender, container } = render(
      <PermissionMatrix
        subjects={SUBJECTS}
        actions={ACTIONS}
        cells={baseCells()}
        toggleMode="grant-deny"
        onCellChange={onCellChange}
      />,
    );
    let cell = container.querySelector<HTMLElement>(
      '[data-subject-id="admin"][data-action-id="read"]',
    )!;
    fireEvent.click(cell);
    expect(onCellChange.mock.calls[0]?.[0]).toMatchObject({ toState: "denied" });

    // Apply the change and rerender.
    const nextCells: readonly PermissionCell[] = [
      ...baseCells().filter((c) => !(c.subjectId === "admin" && c.actionId === "read")),
      { subjectId: "admin", actionId: "read", state: "denied" },
    ];
    rerender(
      <PermissionMatrix
        subjects={SUBJECTS}
        actions={ACTIONS}
        cells={nextCells}
        toggleMode="grant-deny"
        onCellChange={onCellChange}
      />,
    );
    cell = container.querySelector<HTMLElement>(
      '[data-subject-id="admin"][data-action-id="read"]',
    )!;
    fireEvent.click(cell);
    expect(onCellChange.mock.calls[1]?.[0]).toMatchObject({ toState: "unset" });
  });

  it("does not toggle inherited cells by default", () => {
    const cells: readonly PermissionCell[] = [
      { subjectId: "admin", actionId: "read", state: "inherited" },
    ];
    const onCellChange = vi.fn();
    const { container } = render(
      <PermissionMatrix
        subjects={SUBJECTS}
        actions={ACTIONS}
        cells={cells}
        onCellChange={onCellChange}
      />,
    );
    const cell = container.querySelector<HTMLElement>(
      '[data-subject-id="admin"][data-action-id="read"]',
    )!;
    fireEvent.click(cell);
    expect(onCellChange).not.toHaveBeenCalled();
  });

  it("toggles inherited cells when overrideOnInheritedToggle is on", () => {
    const cells: readonly PermissionCell[] = [
      { subjectId: "admin", actionId: "read", state: "inherited" },
    ];
    const onCellChange = vi.fn();
    const { container } = render(
      <PermissionMatrix
        subjects={SUBJECTS}
        actions={ACTIONS}
        cells={cells}
        overrideOnInheritedToggle
        onCellChange={onCellChange}
      />,
    );
    const cell = container.querySelector<HTMLElement>(
      '[data-subject-id="admin"][data-action-id="read"]',
    )!;
    fireEvent.click(cell);
    expect(onCellChange).toHaveBeenCalledOnce();
  });
});

// â”€â”€â”€ Row / column selection + bulk â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

describe("Row / column selection + bulk", () => {
  it("clicking a row header selects the row and enables bulk actions", () => {
    const onBulkChange = vi.fn();
    const { container } = render(
      <PermissionMatrix
        subjects={SUBJECTS}
        actions={ACTIONS}
        cells={baseCells()}
        onBulkChange={onBulkChange}
      />,
    );
    const rowHeader = container.querySelector<HTMLElement>(
      '[data-permission-matrix-row-header="admin"]',
    )!;
    fireEvent.click(rowHeader);
    const bulkBtn = container.querySelector<HTMLButtonElement>(
      '[data-permission-matrix-bulk-set="unset"]',
    )!;
    fireEvent.click(bulkBtn);
    expect(onBulkChange).toHaveBeenCalledOnce();
    const payload = onBulkChange.mock.calls[0]?.[0] as {
      source: { kind: string };
      targetState: string;
    };
    expect(payload.source.kind).toBe("row");
    expect(payload.targetState).toBe("unset");
  });

  it("clicking a column header selects the column", () => {
    const onSelectionChange = vi.fn();
    const { container } = render(
      <PermissionMatrix
        subjects={SUBJECTS}
        actions={ACTIONS}
        cells={baseCells()}
        onSelectionChange={onSelectionChange}
      />,
    );
    const colHeader = container.querySelector<HTMLElement>(
      '[data-permission-matrix-column-header="read"]',
    )!;
    fireEvent.click(colHeader);
    const call = onSelectionChange.mock.calls.at(-1)?.[0] as { kind: string; actionId?: string };
    expect(call.kind).toBe("column");
    expect(call.actionId).toBe("read");
  });

  it("clicking the corner cell selects all", () => {
    const { container } = render(
      <PermissionMatrix subjects={SUBJECTS} actions={ACTIONS} cells={baseCells()} />,
    );
    const corner = container.querySelector<HTMLElement>("[data-permission-matrix-corner]")!;
    fireEvent.click(corner);
    expect(corner.getAttribute("aria-selected")).toBe("true");
  });
});

// â”€â”€â”€ Search â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

describe("Search", () => {
  it("filters visible subjects by label + id when enableSearch is on", () => {
    const { container } = render(
      <PermissionMatrix subjects={SUBJECTS} actions={ACTIONS} cells={baseCells()} enableSearch />,
    );
    const input = container.querySelector<HTMLInputElement>("[data-permission-matrix-search]")!;
    fireEvent.change(input, { target: { value: "admin" } });
    const rows = container.querySelectorAll("[data-permission-matrix-row]");
    expect(rows.length).toBe(1);
  });
});

// â”€â”€â”€ Empty state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

describe("Empty state", () => {
  it("renders an empty placeholder when subjects or actions is empty", () => {
    const { container } = render(<PermissionMatrix subjects={[]} actions={ACTIONS} cells={[]} />);
    const empty = container.querySelector("[data-permission-matrix-empty]");
    expect(empty).not.toBeNull();
  });

  it("respects renderEmptyState when provided", () => {
    const { container } = render(
      <PermissionMatrix
        subjects={[]}
        actions={ACTIONS}
        cells={[]}
        renderEmptyState={() => <span data-testid="custom-empty">Nothing here</span>}
      />,
    );
    const custom = container.querySelector("[data-testid=custom-empty]");
    expect(custom?.textContent).toBe("Nothing here");
  });
});

// â”€â”€â”€ RTL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

describe("RTL", () => {
  it("applies dir=rtl on the root", () => {
    const { container } = render(
      <PermissionMatrix subjects={SUBJECTS} actions={ACTIONS} cells={baseCells()} dir="rtl" />,
    );
    const root = container.querySelector<HTMLElement>("[role=application]");
    expect(root?.getAttribute("dir")).toBe("rtl");
  });
});

// â”€â”€â”€ Input validation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

describe("Input validation", () => {
  it("throws on duplicate subject ids", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(() => {
      render(
        <PermissionMatrix
          subjects={[
            { id: "s1", label: "A" },
            { id: "s1", label: "B" },
          ]}
          actions={ACTIONS}
          cells={[]}
        />,
      );
    }).toThrow(/duplicate subject id/);
    spy.mockRestore();
  });
});
