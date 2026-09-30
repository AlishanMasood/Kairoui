import { describe, expect, it } from "vitest";
import {
  assertValidPermissionAction,
  assertValidPermissionCell,
  assertValidPermissionInput,
  assertValidPermissionSubject,
} from "./identity";
import type {
  PermissionAction,
  PermissionCell,
  PermissionSubject,
} from "./permission-matrix-types";

describe("assertValidPermissionSubject", () => {
  it("accepts a valid subject", () => {
    expect(() => {
      assertValidPermissionSubject({ id: "s1", label: "Admin" });
    }).not.toThrow();
  });

  it("rejects an empty id", () => {
    expect(() => {
      assertValidPermissionSubject({ id: "", label: "x" });
    }).toThrow(TypeError);
  });

  it("rejects a non-string label", () => {
    expect(() => {
      assertValidPermissionSubject({ id: "s1", label: 1 as unknown as string });
    }).toThrow(TypeError);
  });
});

describe("assertValidPermissionAction", () => {
  it("accepts a valid action", () => {
    expect(() => {
      assertValidPermissionAction({ id: "a1", label: "read" });
    }).not.toThrow();
  });

  it("rejects an empty id", () => {
    expect(() => {
      assertValidPermissionAction({ id: "", label: "x" });
    }).toThrow(TypeError);
  });
});

describe("assertValidPermissionCell", () => {
  it("accepts every canonical state", () => {
    for (const state of ["granted", "denied", "unset", "inherited", "indeterminate"] as const) {
      expect(() => {
        assertValidPermissionCell({ subjectId: "s1", actionId: "a1", state });
      }).not.toThrow();
    }
  });

  it("rejects an unknown state", () => {
    expect(() => {
      assertValidPermissionCell({
        subjectId: "s1",
        actionId: "a1",
        state: "bogus" as unknown as "granted",
      });
    }).toThrow(TypeError);
  });
});

describe("assertValidPermissionInput", () => {
  const subjects: readonly PermissionSubject[] = [
    { id: "s1", label: "Admin" },
    { id: "s2", label: "Member" },
  ];
  const actions: readonly PermissionAction[] = [
    { id: "read", label: "Read" },
    { id: "write", label: "Write" },
  ];

  it("accepts a well-formed input", () => {
    const cells: readonly PermissionCell[] = [
      { subjectId: "s1", actionId: "read", state: "granted" },
      { subjectId: "s2", actionId: "read", state: "granted" },
    ];
    expect(() => {
      assertValidPermissionInput(subjects, actions, cells);
    }).not.toThrow();
  });

  it("rejects duplicate subject ids", () => {
    expect(() => {
      assertValidPermissionInput(
        [
          { id: "s1", label: "A" },
          { id: "s1", label: "B" },
        ],
        actions,
        [],
      );
    }).toThrow(RangeError);
  });

  it("rejects duplicate action ids", () => {
    expect(() => {
      assertValidPermissionInput(
        subjects,
        [
          { id: "read", label: "A" },
          { id: "read", label: "B" },
        ],
        [],
      );
    }).toThrow(RangeError);
  });

  it("rejects duplicate cell coordinates", () => {
    const cells: readonly PermissionCell[] = [
      { subjectId: "s1", actionId: "read", state: "granted" },
      { subjectId: "s1", actionId: "read", state: "denied" },
    ];
    expect(() => {
      assertValidPermissionInput(subjects, actions, cells);
    }).toThrow(RangeError);
  });

  it("rejects cells referencing unknown subjects", () => {
    const cells: readonly PermissionCell[] = [
      { subjectId: "ghost", actionId: "read", state: "granted" },
    ];
    expect(() => {
      assertValidPermissionInput(subjects, actions, cells);
    }).toThrow(RangeError);
  });

  it("rejects cells referencing unknown actions", () => {
    const cells: readonly PermissionCell[] = [
      { subjectId: "s1", actionId: "ghost", state: "granted" },
    ];
    expect(() => {
      assertValidPermissionInput(subjects, actions, cells);
    }).toThrow(RangeError);
  });

  it("accepts empty inputs", () => {
    expect(() => {
      assertValidPermissionInput([], [], []);
    }).not.toThrow();
  });
});
