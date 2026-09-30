import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { PermissionMatrix } from "./permission-matrix";
import type {
  PermissionAction,
  PermissionCell,
  PermissionSubject,
} from "./permission-matrix-types";

describe("Permission Matrix performance", () => {
  it("renders 10 × 20 grid (200 cells) under a generous budget", () => {
    const subjects: PermissionSubject[] = [];
    const actions: PermissionAction[] = [];
    const cells: PermissionCell[] = [];
    for (let i = 0; i < 10; i++) {
      subjects.push({ id: `s${String(i)}`, label: `Subject ${String(i)}` });
    }
    for (let j = 0; j < 20; j++) {
      actions.push({ id: `a${String(j)}`, label: `Action ${String(j)}` });
    }
    for (let i = 0; i < 10; i++) {
      for (let j = 0; j < 20; j++) {
        cells.push({
          subjectId: `s${String(i)}`,
          actionId: `a${String(j)}`,
          state: (i + j) % 2 === 0 ? "granted" : "unset",
        });
      }
    }
    const t0 = performance.now();
    const { container } = render(
      <PermissionMatrix subjects={subjects} actions={actions} cells={cells} />,
    );
    const t1 = performance.now();
    const rendered = container.querySelectorAll("[data-permission-matrix-cell]");
    expect(rendered.length).toBe(200);
    expect(t1 - t0).toBeLessThan(5000);
  });

  it("renders a 25 × 25 grid (625 cells) without throwing", () => {
    const subjects: PermissionSubject[] = [];
    const actions: PermissionAction[] = [];
    for (let i = 0; i < 25; i++) {
      subjects.push({ id: `s${String(i)}`, label: `S${String(i)}` });
      actions.push({ id: `a${String(i)}`, label: `A${String(i)}` });
    }
    const { container } = render(
      <PermissionMatrix subjects={subjects} actions={actions} cells={[]} />,
    );
    expect(container.querySelectorAll("[data-permission-matrix-cell]").length).toBe(625);
  });
});
