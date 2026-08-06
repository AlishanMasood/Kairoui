import { describe, it, expect } from "vitest";
import { mergeDataAttributes } from "./merge-data-attributes";

describe("mergeDataAttributes", () => {
  describe("basic merging", () => {
    it("merges state attributes", () => {
      expect(
        mergeDataAttributes({ state: { "data-disabled": true, "data-loading": true } }),
      ).toEqual({ "data-disabled": "", "data-loading": "" });
    });

    it("merges consumer attributes", () => {
      expect(mergeDataAttributes({ consumer: { "data-testid": "my-button" } })).toEqual({
        "data-testid": "my-button",
      });
    });

    it("combines state and consumer", () => {
      expect(
        mergeDataAttributes({
          state: { "data-disabled": true },
          consumer: { "data-testid": "btn" },
        }),
      ).toEqual({ "data-disabled": "", "data-testid": "btn" });
    });
  });

  describe("precedence", () => {
    it("consumer overrides state for non-protected keys", () => {
      expect(
        mergeDataAttributes({
          state: { "data-state": "closed" },
          consumer: { "data-state": "custom" },
        }),
      ).toEqual({ "data-state": "custom" });
    });

    it("slot overrides consumer", () => {
      expect(
        mergeDataAttributes({
          consumer: { "data-x": "consumer" },
          slot: { "data-x": "slot" },
        }),
      ).toEqual({ "data-x": "slot" });
    });
  });

  describe("protected metadata", () => {
    it("preserves data-kui-component from metadata", () => {
      expect(
        mergeDataAttributes({
          metadata: { "data-kui-component": "Button" },
          consumer: { "data-kui-component": "Override" },
        }),
      ).toEqual({ "data-kui-component": "Button" });
    });

    it("preserves data-kui-slot from metadata", () => {
      expect(
        mergeDataAttributes({
          metadata: { "data-kui-slot": "trigger" },
          consumer: { "data-kui-slot": "hacked" },
        }),
      ).toEqual({ "data-kui-slot": "trigger" });
    });

    it("consumer cannot override any data-kui-* attribute", () => {
      expect(
        mergeDataAttributes({
          metadata: { "data-kui-version": "1" },
          consumer: { "data-kui-version": "2" },
        }),
      ).toEqual({ "data-kui-version": "1" });
    });

    it("slot cannot override data-kui-* attributes", () => {
      expect(
        mergeDataAttributes({
          metadata: { "data-kui-component": "Dialog" },
          slot: { "data-kui-component": "Evil" },
        }),
      ).toEqual({ "data-kui-component": "Dialog" });
    });
  });

  describe("value resolution", () => {
    it("boolean true produces empty string (presence attribute)", () => {
      expect(mergeDataAttributes({ state: { "data-active": true } })).toEqual({
        "data-active": "",
      });
    });

    it("boolean false removes the attribute", () => {
      expect(
        mergeDataAttributes({
          state: { "data-disabled": true, "data-active": false },
        }),
      ).toEqual({ "data-disabled": "" });
    });

    it("undefined values are omitted", () => {
      expect(mergeDataAttributes({ consumer: { "data-x": undefined, "data-y": "val" } })).toEqual({
        "data-y": "val",
      });
    });

    it("null values are omitted", () => {
      expect(mergeDataAttributes({ consumer: { "data-x": null, "data-y": "val" } })).toEqual({
        "data-y": "val",
      });
    });

    it("numbers are stringified", () => {
      expect(mergeDataAttributes({ consumer: { "data-count": 5 } })).toEqual({
        "data-count": "5",
      });
    });

    it("string values are preserved", () => {
      expect(mergeDataAttributes({ state: { "data-state": "open" } })).toEqual({
        "data-state": "open",
      });
    });
  });

  describe("empty and invalid", () => {
    it("returns empty object for no sources", () => {
      expect(mergeDataAttributes({})).toEqual({});
    });

    it("returns empty object for all-undefined values", () => {
      expect(
        mergeDataAttributes({ state: { "data-x": undefined }, consumer: { "data-y": null } }),
      ).toEqual({});
    });

    it("consumer false removes a state attribute", () => {
      expect(
        mergeDataAttributes({
          state: { "data-selected": true },
          consumer: { "data-selected": false },
        }),
      ).toEqual({});
    });
  });

  describe("immutability", () => {
    it("does not mutate input objects", () => {
      const state = { "data-x": "a" };
      const consumer = { "data-y": "b" };
      const stateCopy = { ...state };
      const consumerCopy = { ...consumer };
      mergeDataAttributes({ state, consumer });
      expect(state).toEqual(stateCopy);
      expect(consumer).toEqual(consumerCopy);
    });
  });

  describe("comprehensive scenarios", () => {
    it("full composition with all sources", () => {
      expect(
        mergeDataAttributes({
          metadata: { "data-kui-component": "Input" },
          state: { "data-disabled": true, "data-invalid": true },
          consumer: { "data-testid": "email-input", "data-invalid": false },
          slot: { "data-slot": "root" },
        }),
      ).toEqual({
        "data-kui-component": "Input",
        "data-disabled": "",
        "data-testid": "email-input",
        "data-slot": "root",
      });
    });
  });
});
