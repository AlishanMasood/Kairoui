import { describe, expect, it } from "vitest";
import {
  UNSET_STATE,
  computeBulkChanges,
  filterAxis,
  resolveCell,
  resolveToggleTarget,
  toggleCell,
} from "./cell-state";
import type {
  PermissionAction,
  PermissionCell,
  PermissionSubject,
} from "./permission-matrix-types";

describe("UNSET_STATE", () => {
  it("is the string 'unset'", () => {
    expect(UNSET_STATE).toBe("unset");
  });
});

describe("resolveCell", () => {
  it("returns the stored cell when present", () => {
    const cell: PermissionCell = { subjectId: "s1", actionId: "a1", state: "granted" };
    expect(resolveCell([cell], "s1", "a1")).toBe(cell);
  });

  it("returns a synthetic unset cell when missing", () => {
    const result = resolveCell([], "s1", "a1");
    expect(result.state).toBe("unset");
    expect(result.subjectId).toBe("s1");
    expect(result.actionId).toBe("a1");
  });
});

describe("toggleCell", () => {
  it("grant-only cycles unset ↔ granted", () => {
    expect(toggleCell("unset", "grant-only")).toBe("granted");
    expect(toggleCell("granted", "grant-only")).toBe("unset");
  });

  it("grant-only ignores denied by treating it as unset", () => {
    expect(toggleCell("denied", "grant-only")).toBe("granted");
  });

  it("grant-deny cycles unset → granted → denied → unset", () => {
    expect(toggleCell("unset", "grant-deny")).toBe("granted");
    expect(toggleCell("granted", "grant-deny")).toBe("denied");
    expect(toggleCell("denied", "grant-deny")).toBe("unset");
  });

  it("grant-deny-only cycles granted ↔ denied without ever unsetting", () => {
    expect(toggleCell("granted", "grant-deny-only")).toBe("denied");
    expect(toggleCell("denied", "grant-deny-only")).toBe("granted");
    expect(toggleCell("unset", "grant-deny-only")).toBe("granted");
  });

  it("treats inherited / indeterminate as unset for the base transition", () => {
    expect(toggleCell("inherited", "grant-deny")).toBe("granted");
    expect(toggleCell("indeterminate", "grant-deny")).toBe("granted");
  });
});

describe("resolveToggleTarget", () => {
  it("returns null for inherited when override is off", () => {
    expect(resolveToggleTarget("inherited", "grant-only", false)).toBeNull();
    expect(resolveToggleTarget("indeterminate", "grant-only", false)).toBeNull();
  });

  it("allows override when the consumer opts in", () => {
    expect(resolveToggleTarget("inherited", "grant-only", true)).toBe("granted");
    expect(resolveToggleTarget("indeterminate", "grant-deny", true)).toBe("granted");
  });

  it("delegates to toggleCell for base states", () => {
    expect(resolveToggleTarget("granted", "grant-only", false)).toBe("unset");
    expect(resolveToggleTarget("unset", "grant-deny", false)).toBe("granted");
  });
});

describe("computeBulkChanges", () => {
  const subjects: readonly PermissionSubject[] = [
    { id: "s1", label: "A" },
    { id: "s2", label: "B" },
  ];
  const actions: readonly PermissionAction[] = [
    { id: "read", label: "Read" },
    { id: "write", label: "Write" },
  ];

  it("returns changes for cells that don't already match the target state", () => {
    const cells: readonly PermissionCell[] = [
      { subjectId: "s1", actionId: "read", state: "unset" },
      { subjectId: "s1", actionId: "write", state: "granted" },
      { subjectId: "s2", actionId: "read", state: "denied" },
    ];
    const changes = computeBulkChanges({
      subjects,
      actions,
      cells,
      targetState: "granted",
    });
    // s1/read (unset→granted) + s2/read (denied→granted) + s2/write missing (unset→granted).
    expect(changes.length).toBe(3);
  });

  it("scopes to a single row when rowSubjectId is provided", () => {
    const cells: readonly PermissionCell[] = [
      { subjectId: "s1", actionId: "read", state: "unset" },
      { subjectId: "s2", actionId: "read", state: "unset" },
    ];
    const changes = computeBulkChanges({
      subjects,
      actions,
      cells,
      targetState: "granted",
      rowSubjectId: "s1",
    });
    for (const change of changes) {
      expect(change.subjectId).toBe("s1");
    }
  });

  it("scopes to a single column when columnActionId is provided", () => {
    const cells: readonly PermissionCell[] = [];
    const changes = computeBulkChanges({
      subjects,
      actions,
      cells,
      targetState: "granted",
      columnActionId: "read",
    });
    for (const change of changes) {
      expect(change.actionId).toBe("read");
    }
  });

  it("excludes disabled and read-only cells", () => {
    const cells: readonly PermissionCell[] = [
      { subjectId: "s1", actionId: "read", state: "unset", disabled: true },
      { subjectId: "s1", actionId: "write", state: "unset", readOnly: true },
      { subjectId: "s2", actionId: "read", state: "unset" },
    ];
    const changes = computeBulkChanges({
      subjects,
      actions,
      cells,
      targetState: "granted",
    });
    // Only s2/read + s2/write (missing → unset → granted).
    for (const change of changes) {
      expect(change.subjectId).toBe("s2");
    }
  });

  it("returns empty when every cell already matches the target", () => {
    const cells: readonly PermissionCell[] = [
      { subjectId: "s1", actionId: "read", state: "granted" },
      { subjectId: "s1", actionId: "write", state: "granted" },
      { subjectId: "s2", actionId: "read", state: "granted" },
      { subjectId: "s2", actionId: "write", state: "granted" },
    ];
    const changes = computeBulkChanges({
      subjects,
      actions,
      cells,
      targetState: "granted",
    });
    expect(changes.length).toBe(0);
  });
});

describe("filterAxis", () => {
  const items: readonly PermissionSubject[] = [
    { id: "admin", label: "Admin" },
    { id: "member", label: "Member" },
    { id: "guest", label: "Guest" },
  ];

  it("returns everything when query is empty and no filterFn", () => {
    expect(filterAxis(items, "").length).toBe(3);
  });

  it("case-insensitively matches label", () => {
    expect(filterAxis(items, "ADM").map((s) => s.id)).toEqual(["admin"]);
  });

  it("case-insensitively matches id", () => {
    expect(filterAxis(items, "guest").map((s) => s.id)).toEqual(["guest"]);
  });

  it("consumer filterFn overrides", () => {
    const result = filterAxis(items, "", ({ subject }) => subject?.id === "member", "subject");
    expect(result.map((s) => s.id)).toEqual(["member"]);
  });
});
