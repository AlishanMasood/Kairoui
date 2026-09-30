import { describe, expectTypeOf, it } from "vitest";
import type {
  PermissionAction,
  PermissionCell,
  PermissionCellChange,
  PermissionCellState,
  PermissionMatrixBulkChangePayload,
  PermissionMatrixBulkSource,
  PermissionMatrixCellChangePayload,
  PermissionMatrixCellClickPayload,
  PermissionMatrixRootProps,
  PermissionMatrixSelection,
  PermissionMatrixState,
  PermissionMatrixMode,
  PermissionMatrixToggleMode,
  PermissionSubject,
} from "./permission-matrix-types";

describe("Data shape", () => {
  it("PermissionSubject / PermissionAction require id + label", () => {
    const s: PermissionSubject = { id: "s1", label: "Admin" };
    const a: PermissionAction = { id: "read", label: "Read" };
    expectTypeOf(s).toEqualTypeOf<PermissionSubject>();
    expectTypeOf(a).toEqualTypeOf<PermissionAction>();
  });

  it("PermissionCell requires subjectId + actionId + state", () => {
    const c: PermissionCell = { subjectId: "s1", actionId: "a1", state: "granted" };
    expectTypeOf(c).toEqualTypeOf<PermissionCell>();
  });

  it("PermissionCellState is a union of the five canonical values", () => {
    const state: PermissionCellState[] = [
      "granted",
      "denied",
      "unset",
      "inherited",
      "indeterminate",
    ];
    expectTypeOf(state[0]!).toEqualTypeOf<PermissionCellState>();
  });
});

describe("Presentation modes", () => {
  it("PermissionMatrixMode is role-permission or resource-action", () => {
    const modes: PermissionMatrixMode[] = ["role-permission", "resource-action"];
    expectTypeOf(modes[0]!).toEqualTypeOf<PermissionMatrixMode>();
  });

  it("PermissionMatrixToggleMode has three variants", () => {
    const modes: PermissionMatrixToggleMode[] = ["grant-only", "grant-deny", "grant-deny-only"];
    expectTypeOf(modes[0]!).toEqualTypeOf<PermissionMatrixToggleMode>();
  });
});

describe("Selection + state", () => {
  it("PermissionMatrixSelection is a discriminated union", () => {
    const selections: PermissionMatrixSelection[] = [
      { kind: "none" },
      { kind: "cell", subjectId: "s1", actionId: "a1" },
      { kind: "row", subjectId: "s1" },
      { kind: "column", actionId: "a1" },
      { kind: "all" },
    ];
    expectTypeOf(selections[0]!.kind).toEqualTypeOf<"none" | "cell" | "row" | "column" | "all">();
  });

  it("PermissionMatrixState carries selection + focus + search", () => {
    const state: PermissionMatrixState = {
      selection: { kind: "none" },
      focusedSubjectId: null,
      focusedActionId: null,
      search: "",
    };
    expectTypeOf(state.search).toBeString();
  });
});

describe("Callback payloads", () => {
  it("PermissionMatrixCellClickPayload carries subject + action + cell + nativeEvent", () => {
    const p: PermissionMatrixCellClickPayload = {
      subject: { id: "s1", label: "A" },
      action: { id: "a1", label: "read" },
      cell: { subjectId: "s1", actionId: "a1", state: "granted" },
      nativeEvent: new MouseEvent("click"),
    };
    expectTypeOf(p.cell.state).toEqualTypeOf<PermissionCellState>();
  });

  it("PermissionMatrixCellChangePayload carries from/to states", () => {
    const p: PermissionMatrixCellChangePayload = {
      subject: { id: "s1", label: "A" },
      action: { id: "a1", label: "read" },
      fromState: "unset",
      toState: "granted",
    };
    expectTypeOf(p.toState).toEqualTypeOf<PermissionCellState>();
  });

  it("PermissionMatrixBulkChangePayload carries changes + source + targetState", () => {
    const source: PermissionMatrixBulkSource = { kind: "all" };
    const changes: readonly PermissionCellChange[] = [
      {
        subjectId: "s1",
        actionId: "a1",
        fromState: "unset",
        toState: "granted",
      },
    ];
    const p: PermissionMatrixBulkChangePayload = {
      changes,
      source,
      targetState: "granted",
    };
    expectTypeOf(p.changes).toEqualTypeOf<readonly PermissionCellChange[]>();
    expectTypeOf(p.source).toEqualTypeOf<PermissionMatrixBulkSource>();
  });
});

describe("PermissionMatrixRootProps", () => {
  it("only requires subjects, actions, cells", () => {
    const minimal: PermissionMatrixRootProps = { subjects: [], actions: [], cells: [] };
    expectTypeOf(minimal).toExtend<PermissionMatrixRootProps>();
  });
});
