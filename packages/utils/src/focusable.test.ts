import { describe, it, expect } from "vitest";
import { isFocusable, isTabbable, getTabIndex } from "./focusable";
import type { FocusableElement } from "./focusable";

function el(overrides: Partial<FocusableElement> = {}): FocusableElement {
  return {
    tagName: "DIV",
    getAttribute: () => null,
    ...overrides,
  };
}

describe("getTabIndex", () => {
  it("returns 0 for natively focusable elements", () => {
    expect(getTabIndex(el({ tagName: "BUTTON" }))).toBe(0);
    expect(getTabIndex(el({ tagName: "INPUT" }))).toBe(0);
    expect(getTabIndex(el({ tagName: "SELECT" }))).toBe(0);
    expect(getTabIndex(el({ tagName: "TEXTAREA" }))).toBe(0);
  });

  it("returns -1 for non-focusable elements by default", () => {
    expect(getTabIndex(el({ tagName: "DIV" }))).toBe(-1);
    expect(getTabIndex(el({ tagName: "SPAN" }))).toBe(-1);
  });

  it("returns explicit tabIndex value", () => {
    expect(getTabIndex(el({ tagName: "DIV", tabIndex: 0 }))).toBe(0);
    expect(getTabIndex(el({ tagName: "DIV", tabIndex: 5 }))).toBe(5);
  });

  it("returns 0 for link with href", () => {
    expect(getTabIndex(el({ tagName: "A", href: "/link" }))).toBe(0);
  });

  it("returns -1 for link without href", () => {
    expect(getTabIndex(el({ tagName: "A" }))).toBe(-1);
  });

  it("reads tabindex attribute via getAttribute", () => {
    expect(
      getTabIndex(
        el({
          tagName: "DIV",
          tabIndex: -1,
          getAttribute: (name) => (name === "tabindex" ? "3" : null),
        }),
      ),
    ).toBe(3);
  });

  it("returns 0 for audio/video with controls", () => {
    expect(getTabIndex(el({ tagName: "VIDEO", controls: true }))).toBe(0);
    expect(getTabIndex(el({ tagName: "AUDIO", controls: true }))).toBe(0);
  });

  it("returns -1 for audio/video without controls", () => {
    expect(getTabIndex(el({ tagName: "VIDEO" }))).toBe(-1);
    expect(getTabIndex(el({ tagName: "AUDIO" }))).toBe(-1);
  });
});

describe("isFocusable", () => {
  describe("natively focusable elements", () => {
    it("button is focusable", () => {
      expect(isFocusable(el({ tagName: "BUTTON" }))).toBe(true);
    });

    it("input is focusable", () => {
      expect(isFocusable(el({ tagName: "INPUT" }))).toBe(true);
    });

    it("select is focusable", () => {
      expect(isFocusable(el({ tagName: "SELECT" }))).toBe(true);
    });

    it("textarea is focusable", () => {
      expect(isFocusable(el({ tagName: "TEXTAREA" }))).toBe(true);
    });

    it("link with href is focusable", () => {
      expect(isFocusable(el({ tagName: "A", href: "/" }))).toBe(true);
    });

    it("area with href is focusable", () => {
      expect(isFocusable(el({ tagName: "AREA", href: "/" }))).toBe(true);
    });
  });

  describe("non-focusable elements", () => {
    it("div is not focusable by default", () => {
      expect(isFocusable(el({ tagName: "DIV" }))).toBe(false);
    });

    it("span is not focusable by default", () => {
      expect(isFocusable(el({ tagName: "SPAN" }))).toBe(false);
    });

    it("link without href is not focusable", () => {
      expect(isFocusable(el({ tagName: "A" }))).toBe(false);
    });
  });

  describe("tabIndex makes elements focusable", () => {
    it("div with tabIndex=0 is focusable", () => {
      expect(isFocusable(el({ tagName: "DIV", tabIndex: 0 }))).toBe(true);
    });

    it("div with tabIndex=-1 is focusable (programmatically)", () => {
      expect(isFocusable(el({ tagName: "DIV", getAttribute: () => "-1" }))).toBe(true);
    });

    it("div with positive tabIndex is focusable", () => {
      expect(isFocusable(el({ tagName: "DIV", tabIndex: 1 }))).toBe(true);
    });
  });

  describe("disabled form controls", () => {
    it("disabled button is not focusable", () => {
      expect(isFocusable(el({ tagName: "BUTTON", disabled: true }))).toBe(false);
    });

    it("disabled input is not focusable", () => {
      expect(isFocusable(el({ tagName: "INPUT", disabled: true }))).toBe(false);
    });

    it("disabled select is not focusable", () => {
      expect(isFocusable(el({ tagName: "SELECT", disabled: true }))).toBe(false);
    });

    it("disabled div is still focusable (disabled only affects form controls)", () => {
      expect(isFocusable(el({ tagName: "DIV", disabled: true, tabIndex: 0 }))).toBe(true);
    });
  });

  describe("hidden elements", () => {
    it("hidden element is not focusable", () => {
      expect(isFocusable(el({ tagName: "BUTTON", hidden: true }))).toBe(false);
    });
  });

  describe("inert elements", () => {
    it("inert element is not focusable", () => {
      expect(isFocusable(el({ tagName: "BUTTON", inert: true }))).toBe(false);
    });

    it("inert div with tabIndex is not focusable", () => {
      expect(isFocusable(el({ tagName: "DIV", tabIndex: 0, inert: true }))).toBe(false);
    });
  });

  describe("input type=hidden", () => {
    it("is not focusable", () => {
      expect(isFocusable(el({ tagName: "INPUT", type: "hidden" }))).toBe(false);
    });
  });

  describe("contenteditable", () => {
    it("contenteditable=true is focusable", () => {
      expect(isFocusable(el({ tagName: "DIV", contentEditable: "true" }))).toBe(true);
    });

    it("contenteditable empty string is focusable", () => {
      expect(isFocusable(el({ tagName: "DIV", contentEditable: "" }))).toBe(true);
    });

    it("contenteditable=false is not focusable", () => {
      expect(isFocusable(el({ tagName: "DIV", contentEditable: "false" }))).toBe(false);
    });
  });

  describe("media controls", () => {
    it("video with controls is focusable", () => {
      expect(isFocusable(el({ tagName: "VIDEO", controls: true }))).toBe(true);
    });

    it("video without controls is not focusable", () => {
      expect(isFocusable(el({ tagName: "VIDEO" }))).toBe(false);
    });
  });
});

describe("isTabbable", () => {
  it("button is tabbable", () => {
    expect(isTabbable(el({ tagName: "BUTTON" }))).toBe(true);
  });

  it("div with tabIndex=0 is tabbable", () => {
    expect(isTabbable(el({ tagName: "DIV", tabIndex: 0 }))).toBe(true);
  });

  it("div with tabIndex=-1 is NOT tabbable (but is focusable)", () => {
    expect(isTabbable(el({ tagName: "DIV", getAttribute: () => "-1" }))).toBe(false);
  });

  it("disabled button is not tabbable", () => {
    expect(isTabbable(el({ tagName: "BUTTON", disabled: true }))).toBe(false);
  });

  it("hidden element is not tabbable", () => {
    expect(isTabbable(el({ tagName: "INPUT", hidden: true }))).toBe(false);
  });

  it("inert element is not tabbable", () => {
    expect(isTabbable(el({ tagName: "BUTTON", inert: true }))).toBe(false);
  });

  it("element with positive tabIndex is tabbable", () => {
    expect(isTabbable(el({ tagName: "DIV", tabIndex: 5 }))).toBe(true);
  });
});
