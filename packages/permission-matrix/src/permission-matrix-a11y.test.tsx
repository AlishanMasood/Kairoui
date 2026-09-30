import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
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

describe("Permission Matrix accessibility", () => {
  it("root exposes role=application + aria-roledescription + aria-label fallback", () => {
    const { container } = render(
      <PermissionMatrix subjects={SUBJECTS} actions={ACTIONS} cells={CELLS} />,
    );
    const root = container.querySelector<HTMLElement>("[role=application]");
    expect(root?.getAttribute("aria-roledescription")).toBe("Permission matrix");
    expect(root?.getAttribute("aria-label")).toBeTruthy();
  });

  it("grid exposes role=grid + aria-rowcount + aria-colcount", () => {
    const { container } = render(
      <PermissionMatrix subjects={SUBJECTS} actions={ACTIONS} cells={CELLS} />,
    );
    const grid = container.querySelector<HTMLElement>("[role=grid]");
    expect(grid).not.toBeNull();
    expect(Number(grid?.getAttribute("aria-rowcount"))).toBeGreaterThan(0);
    expect(Number(grid?.getAttribute("aria-colcount"))).toBeGreaterThan(0);
  });

  it("column headers use role=columnheader + aria-selected", () => {
    const { container } = render(
      <PermissionMatrix subjects={SUBJECTS} actions={ACTIONS} cells={CELLS} />,
    );
    const cols = container.querySelectorAll("[data-permission-matrix-column-header]");
    expect(cols.length).toBe(2);
    for (const col of Array.from(cols)) {
      expect(col.getAttribute("role")).toBe("columnheader");
      expect(col.getAttribute("aria-selected")).toBe("false");
    }
  });

  it("row headers use role=rowheader + aria-selected + aria-label", () => {
    const { container } = render(
      <PermissionMatrix subjects={SUBJECTS} actions={ACTIONS} cells={CELLS} />,
    );
    const rows = container.querySelectorAll("[data-permission-matrix-row-header]");
    expect(rows.length).toBe(2);
    for (const row of Array.from(rows)) {
      expect(row.getAttribute("role")).toBe("rowheader");
      expect(row.getAttribute("aria-selected")).toBe("false");
      expect(row.getAttribute("aria-label")).toBeTruthy();
    }
  });

  it("cells use role=gridcell + aria-checked + aria-label", () => {
    const { container } = render(
      <PermissionMatrix subjects={SUBJECTS} actions={ACTIONS} cells={CELLS} />,
    );
    const cells = container.querySelectorAll("[data-permission-matrix-cell]");
    expect(cells.length).toBe(4);
    for (const cell of Array.from(cells)) {
      expect(cell.getAttribute("role")).toBe("gridcell");
      expect(cell.getAttribute("aria-checked")).toBeTruthy();
      expect(cell.getAttribute("aria-label")).toBeTruthy();
    }
  });

  it("announcer exposes aria-live=polite + aria-atomic=true", () => {
    const { container } = render(
      <PermissionMatrix subjects={SUBJECTS} actions={ACTIONS} cells={CELLS} />,
    );
    const announcer = container.querySelector("[data-permission-matrix-announcer]");
    expect(announcer?.getAttribute("aria-live")).toBe("polite");
    expect(announcer?.getAttribute("aria-atomic")).toBe("true");
  });

  it("aria-labelledby is applied without a duplicate aria-label", () => {
    const { container } = render(
      <div>
        <h1 id="heading">Team matrix</h1>
        <PermissionMatrix
          subjects={SUBJECTS}
          actions={ACTIONS}
          cells={CELLS}
          aria-labelledby="heading"
        />
      </div>,
    );
    const root = container.querySelector<HTMLElement>("[role=application]");
    expect(root?.getAttribute("aria-labelledby")).toBe("heading");
    expect(root?.getAttribute("aria-label")).toBeNull();
  });

  it("corner cell exposes aria-selected + aria-label for select-all", () => {
    const { container } = render(
      <PermissionMatrix subjects={SUBJECTS} actions={ACTIONS} cells={CELLS} />,
    );
    const corner = container.querySelector<HTMLElement>("[data-permission-matrix-corner]");
    expect(corner?.getAttribute("aria-selected")).toBe("false");
    expect(corner?.getAttribute("aria-label")).toContain("Select all");
  });
});
