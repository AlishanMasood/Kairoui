import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
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
  { subjectId: "member", actionId: "write", state: "denied" },
];

describe("Permission Matrix SSR", () => {
  it("renders to a static string without throwing", () => {
    const html = renderToString(
      <PermissionMatrix subjects={SUBJECTS} actions={ACTIONS} cells={CELLS} />,
    );
    expect(html).toContain("kui-permission-matrix");
    expect(html).toContain('role="application"');
    expect(html).toContain('role="grid"');
  });

  it("renders cells during SSR", () => {
    const html = renderToString(
      <PermissionMatrix subjects={SUBJECTS} actions={ACTIONS} cells={CELLS} />,
    );
    expect(html).toContain('data-state="granted"');
    expect(html).toContain('data-state="denied"');
  });

  it("renders dir=rtl during SSR", () => {
    const html = renderToString(
      <PermissionMatrix subjects={SUBJECTS} actions={ACTIONS} cells={CELLS} dir="rtl" />,
    );
    expect(html).toContain('dir="rtl"');
  });

  it("renders the empty placeholder during SSR when subjects is empty", () => {
    const html = renderToString(<PermissionMatrix subjects={[]} actions={ACTIONS} cells={[]} />);
    expect(html).toContain("data-permission-matrix-empty");
  });
});
