import { describe, it, expect } from "vitest";
import { PROP_SOURCE_PRIORITY, DEFAULT_CATEGORY_STRATEGIES } from "./merge-types";
import type {
  MergeStrategy,
  PropSource,
  PropCategory,
  MergePlanEntry,
  MergePlan,
  PropSourceRecord,
  MergeDiagnostic,
  ProtectedPropDefinition,
} from "./merge-types";

describe("merge-types contracts", () => {
  describe("MergeStrategy type", () => {
    it("accepts all valid strategies", () => {
      const strategies: MergeStrategy[] = ["override", "merge", "compose", "reconcile", "protect"];
      expect(strategies).toHaveLength(5);
    });
  });

  describe("PropSource type", () => {
    it("PROP_SOURCE_PRIORITY contains all 9 sources in order", () => {
      expect(PROP_SOURCE_PRIORITY).toEqual([
        "componentDefault",
        "themeDefault",
        "internal",
        "accessibility",
        "state",
        "consumerRoot",
        "consumerSlot",
        "polymorphicTarget",
        "child",
      ]);
    });

    it("priority is from lowest to highest", () => {
      const lowest: PropSource = PROP_SOURCE_PRIORITY[0]!;
      const highest: PropSource = PROP_SOURCE_PRIORITY[PROP_SOURCE_PRIORITY.length - 1]!;
      expect(lowest).toBe("componentDefault");
      expect(highest).toBe("child");
    });
  });

  describe("PropCategory type and strategy mapping", () => {
    it("DEFAULT_CATEGORY_STRATEGIES covers all categories", () => {
      const categories: PropCategory[] = [
        "scalar",
        "className",
        "style",
        "eventHandler",
        "ref",
        "ariaRelationship",
        "ariaScalar",
        "dataAttribute",
        "disabledState",
        "id",
        "role",
        "tabIndex",
        "children",
      ];
      for (const cat of categories) {
        expect(DEFAULT_CATEGORY_STRATEGIES[cat]).toBeDefined();
      }
    });

    it("className uses merge strategy", () => {
      expect(DEFAULT_CATEGORY_STRATEGIES.className).toBe("merge");
    });

    it("eventHandler uses compose strategy", () => {
      expect(DEFAULT_CATEGORY_STRATEGIES.eventHandler).toBe("compose");
    });

    it("ref uses compose strategy", () => {
      expect(DEFAULT_CATEGORY_STRATEGIES.ref).toBe("compose");
    });

    it("ariaRelationship uses reconcile strategy", () => {
      expect(DEFAULT_CATEGORY_STRATEGIES.ariaRelationship).toBe("reconcile");
    });

    it("role uses protect strategy", () => {
      expect(DEFAULT_CATEGORY_STRATEGIES.role).toBe("protect");
    });

    it("scalar uses override strategy", () => {
      expect(DEFAULT_CATEGORY_STRATEGIES.scalar).toBe("override");
    });

    it("style uses merge strategy", () => {
      expect(DEFAULT_CATEGORY_STRATEGIES.style).toBe("merge");
    });

    it("dataAttribute uses merge strategy", () => {
      expect(DEFAULT_CATEGORY_STRATEGIES.dataAttribute).toBe("merge");
    });

    it("children uses override strategy", () => {
      expect(DEFAULT_CATEGORY_STRATEGIES.children).toBe("override");
    });
  });

  describe("MergePlanEntry contract shape", () => {
    it("accepts a valid entry", () => {
      const entry: MergePlanEntry = {
        prop: "onClick",
        category: "eventHandler",
        strategy: "compose",
      };
      expect(entry.prop).toBe("onClick");
      expect(entry.category).toBe("eventHandler");
    });

    it("accepts protected entry with warning", () => {
      const entry: MergePlanEntry = {
        prop: "role",
        category: "role",
        strategy: "protect",
        protected: true,
        warningKey: "role-override",
      };
      expect(entry.protected).toBe(true);
      expect(entry.warningKey).toBe("role-override");
    });
  });

  describe("MergePlan contract shape", () => {
    it("accepts a valid merge plan", () => {
      const plan: MergePlan = {
        entries: [
          { prop: "onClick", category: "eventHandler" },
          { prop: "className", category: "className" },
        ],
        protectedProps: new Set(["role"]),
      };
      expect(plan.entries).toHaveLength(2);
      expect(plan.protectedProps.has("role")).toBe(true);
    });
  });

  describe("PropSourceRecord contract shape", () => {
    it("accepts a valid source record", () => {
      const record: PropSourceRecord = {
        source: "consumerRoot",
        props: { onClick: () => {}, className: "custom" },
      };
      expect(record.source).toBe("consumerRoot");
    });
  });

  describe("MergeDiagnostic contract shape", () => {
    it("accepts a valid diagnostic", () => {
      const diag: MergeDiagnostic = {
        type: "warning",
        prop: "role",
        message: "Overriding role is not supported",
        source: "consumerRoot",
        component: "Button",
      };
      expect(diag.type).toBe("warning");
      expect(diag.component).toBe("Button");
    });
  });

  describe("ProtectedPropDefinition contract shape", () => {
    it("accepts a valid definition", () => {
      const def: ProtectedPropDefinition = {
        prop: "role",
        reason: "Changing role breaks ARIA pattern",
        warningMessage: "Button: Overriding role is not supported.",
      };
      expect(def.prop).toBe("role");
    });
  });
});
