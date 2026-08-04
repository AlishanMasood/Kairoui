import { describe, it, expect } from "vitest";
import {
  Keys,
  isEnterKey,
  isSpaceKey,
  isEscapeKey,
  isArrowKey,
  isActivationKey,
  hasModifier,
  isCtrlOrMeta,
  isPrintableKey,
  isNavigationKey,
} from "./keyboard";
import type { KeyboardEventLike } from "./keyboard";

function key(k: string, mods: Partial<KeyboardEventLike> = {}): KeyboardEventLike {
  return { key: k, ...mods };
}

describe("Keys constants", () => {
  it("defines expected key values", () => {
    expect(Keys.Enter).toBe("Enter");
    expect(Keys.Space).toBe(" ");
    expect(Keys.Escape).toBe("Escape");
    expect(Keys.ArrowUp).toBe("ArrowUp");
    expect(Keys.ArrowDown).toBe("ArrowDown");
    expect(Keys.ArrowLeft).toBe("ArrowLeft");
    expect(Keys.ArrowRight).toBe("ArrowRight");
    expect(Keys.Home).toBe("Home");
    expect(Keys.End).toBe("End");
    expect(Keys.PageUp).toBe("PageUp");
    expect(Keys.PageDown).toBe("PageDown");
    expect(Keys.Tab).toBe("Tab");
  });
});

describe("isEnterKey", () => {
  it("returns true for Enter", () => {
    expect(isEnterKey(key("Enter"))).toBe(true);
  });

  it("returns false for other keys", () => {
    expect(isEnterKey(key(" "))).toBe(false);
    expect(isEnterKey(key("a"))).toBe(false);
  });
});

describe("isSpaceKey", () => {
  it("returns true for Space", () => {
    expect(isSpaceKey(key(" "))).toBe(true);
  });

  it("returns false for other keys", () => {
    expect(isSpaceKey(key("Enter"))).toBe(false);
    expect(isSpaceKey(key("Space"))).toBe(false);
  });
});

describe("isEscapeKey", () => {
  it("returns true for Escape", () => {
    expect(isEscapeKey(key("Escape"))).toBe(true);
  });

  it("returns true for legacy Esc", () => {
    expect(isEscapeKey(key("Esc"))).toBe(true);
  });

  it("returns false for other keys", () => {
    expect(isEscapeKey(key("Enter"))).toBe(false);
  });
});

describe("isArrowKey", () => {
  it("returns true for all arrow keys", () => {
    expect(isArrowKey(key("ArrowUp"))).toBe(true);
    expect(isArrowKey(key("ArrowDown"))).toBe(true);
    expect(isArrowKey(key("ArrowLeft"))).toBe(true);
    expect(isArrowKey(key("ArrowRight"))).toBe(true);
  });

  it("returns false for non-arrow keys", () => {
    expect(isArrowKey(key("Enter"))).toBe(false);
    expect(isArrowKey(key("Home"))).toBe(false);
  });
});

describe("isActivationKey", () => {
  it("returns true for Enter and Space", () => {
    expect(isActivationKey(key("Enter"))).toBe(true);
    expect(isActivationKey(key(" "))).toBe(true);
  });

  it("returns false for other keys", () => {
    expect(isActivationKey(key("Escape"))).toBe(false);
    expect(isActivationKey(key("a"))).toBe(false);
  });
});

describe("hasModifier", () => {
  it("returns true when ctrlKey is pressed", () => {
    expect(hasModifier(key("a", { ctrlKey: true }))).toBe(true);
  });

  it("returns true when shiftKey is pressed", () => {
    expect(hasModifier(key("a", { shiftKey: true }))).toBe(true);
  });

  it("returns true when altKey is pressed", () => {
    expect(hasModifier(key("a", { altKey: true }))).toBe(true);
  });

  it("returns true when metaKey is pressed", () => {
    expect(hasModifier(key("a", { metaKey: true }))).toBe(true);
  });

  it("returns false when no modifiers", () => {
    expect(hasModifier(key("a"))).toBe(false);
  });

  it("returns true for multiple modifiers", () => {
    expect(hasModifier(key("a", { ctrlKey: true, shiftKey: true }))).toBe(true);
  });
});

describe("isCtrlOrMeta", () => {
  it("returns true for ctrlKey", () => {
    expect(isCtrlOrMeta(key("c", { ctrlKey: true }))).toBe(true);
  });

  it("returns true for metaKey", () => {
    expect(isCtrlOrMeta(key("c", { metaKey: true }))).toBe(true);
  });

  it("returns false without ctrl or meta", () => {
    expect(isCtrlOrMeta(key("c", { shiftKey: true }))).toBe(false);
    expect(isCtrlOrMeta(key("c"))).toBe(false);
  });
});

describe("isPrintableKey", () => {
  it("returns true for normal characters", () => {
    expect(isPrintableKey(key("a"))).toBe(true);
    expect(isPrintableKey(key("Z"))).toBe(true);
    expect(isPrintableKey(key("1"))).toBe(true);
    expect(isPrintableKey(key("!"))).toBe(true);
    expect(isPrintableKey(key(" "))).toBe(true);
  });

  it("returns true for unicode characters", () => {
    expect(isPrintableKey(key("ñ"))).toBe(true);
    expect(isPrintableKey(key("ü"))).toBe(true);
    expect(isPrintableKey(key("é"))).toBe(true);
  });

  it("returns false for multi-char key names", () => {
    expect(isPrintableKey(key("Enter"))).toBe(false);
    expect(isPrintableKey(key("Shift"))).toBe(false);
    expect(isPrintableKey(key("ArrowUp"))).toBe(false);
  });

  it("returns false when ctrl is held", () => {
    expect(isPrintableKey(key("a", { ctrlKey: true }))).toBe(false);
  });

  it("returns false when meta is held", () => {
    expect(isPrintableKey(key("a", { metaKey: true }))).toBe(false);
  });

  it("returns true when shift is held (uppercase)", () => {
    expect(isPrintableKey(key("A", { shiftKey: true }))).toBe(true);
  });

  it("returns true when alt is held (special chars on some layouts)", () => {
    expect(isPrintableKey(key("@", { altKey: true }))).toBe(true);
  });
});

describe("isNavigationKey", () => {
  it("returns true for arrow keys", () => {
    expect(isNavigationKey(key("ArrowUp"))).toBe(true);
    expect(isNavigationKey(key("ArrowDown"))).toBe(true);
  });

  it("returns true for Home and End", () => {
    expect(isNavigationKey(key("Home"))).toBe(true);
    expect(isNavigationKey(key("End"))).toBe(true);
  });

  it("returns true for PageUp and PageDown", () => {
    expect(isNavigationKey(key("PageUp"))).toBe(true);
    expect(isNavigationKey(key("PageDown"))).toBe(true);
  });

  it("returns false for non-navigation keys", () => {
    expect(isNavigationKey(key("Enter"))).toBe(false);
    expect(isNavigationKey(key("Tab"))).toBe(false);
    expect(isNavigationKey(key("a"))).toBe(false);
  });
});
