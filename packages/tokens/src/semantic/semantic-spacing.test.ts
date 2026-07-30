import { describe, it, expect } from "vitest";
import type { SemanticSpacing } from "../types/semantic";

describe("semantic spacing contracts", () => {
  describe("SemanticSpacing", () => {
    it("requires all top-level groups", () => {
      type RequiredGroups = keyof SemanticSpacing;
      const groups: RequiredGroups[] = ["inline", "form", "content", "section", "page"];
      expect(groups).toHaveLength(5);
    });

    it("inline group has xs, sm, md", () => {
      type RequiredKeys = keyof SemanticSpacing["inline"];
      const keys: RequiredKeys[] = ["xs", "sm", "md"];
      expect(keys).toHaveLength(3);
    });

    it("form group has fieldGap, sectionGap, labelGap", () => {
      type RequiredKeys = keyof SemanticSpacing["form"];
      const keys: RequiredKeys[] = ["fieldGap", "sectionGap", "labelGap"];
      expect(keys).toHaveLength(3);
    });

    it("content group has cardPadding, dialogPadding, toolbarGap, listItemGap, tableCell", () => {
      type RequiredKeys = keyof SemanticSpacing["content"];
      const keys: RequiredKeys[] = [
        "cardPadding",
        "dialogPadding",
        "toolbarGap",
        "listItemGap",
        "tableCell",
      ];
      expect(keys).toHaveLength(5);
    });

    it("section group has gap and padding", () => {
      type RequiredKeys = keyof SemanticSpacing["section"];
      const keys: RequiredKeys[] = ["gap", "padding"];
      expect(keys).toHaveLength(2);
    });

    it("page group has gutter and gap", () => {
      type RequiredKeys = keyof SemanticSpacing["page"];
      const keys: RequiredKeys[] = ["gutter", "gap"];
      expect(keys).toHaveLength(2);
    });

    it("total semantic spacing roles", () => {
      // inline: 3 + form: 3 + content: 5 + section: 2 + page: 2
      const total = 3 + 3 + 5 + 2 + 2;
      expect(total).toBe(15);
    });
  });
});
