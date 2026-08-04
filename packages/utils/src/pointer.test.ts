import { describe, it, expect } from "vitest";
import {
  isPrimaryPointer,
  isLeftClick,
  isRightClick,
  isMiddleClick,
  isModifiedClick,
  isTouchPointer,
  isPenPointer,
  isMousePointer,
  isVirtualClick,
  getPointerCoordinates,
  normalizePointerType,
} from "./pointer";
import type { PointerEventLike } from "./pointer";

function ptr(overrides: Partial<PointerEventLike> = {}): PointerEventLike {
  return { button: 0, clientX: 100, clientY: 200, detail: 1, ...overrides };
}

describe("isPrimaryPointer", () => {
  it("returns true for button 0", () => {
    expect(isPrimaryPointer(ptr({ button: 0 }))).toBe(true);
  });

  it("returns false for button 2", () => {
    expect(isPrimaryPointer(ptr({ button: 2 }))).toBe(false);
  });
});

describe("isLeftClick", () => {
  it("returns true for button 0", () => {
    expect(isLeftClick(ptr({ button: 0 }))).toBe(true);
  });

  it("returns false for other buttons", () => {
    expect(isLeftClick(ptr({ button: 1 }))).toBe(false);
    expect(isLeftClick(ptr({ button: 2 }))).toBe(false);
  });
});

describe("isRightClick", () => {
  it("returns true for button 2", () => {
    expect(isRightClick(ptr({ button: 2 }))).toBe(true);
  });

  it("returns false for button 0", () => {
    expect(isRightClick(ptr({ button: 0 }))).toBe(false);
  });
});

describe("isMiddleClick", () => {
  it("returns true for button 1", () => {
    expect(isMiddleClick(ptr({ button: 1 }))).toBe(true);
  });

  it("returns false for button 0", () => {
    expect(isMiddleClick(ptr({ button: 0 }))).toBe(false);
  });
});

describe("isModifiedClick", () => {
  it("returns true when ctrlKey is pressed", () => {
    expect(isModifiedClick(ptr({ ctrlKey: true }))).toBe(true);
  });

  it("returns true when shiftKey is pressed", () => {
    expect(isModifiedClick(ptr({ shiftKey: true }))).toBe(true);
  });

  it("returns true when altKey is pressed", () => {
    expect(isModifiedClick(ptr({ altKey: true }))).toBe(true);
  });

  it("returns true when metaKey is pressed", () => {
    expect(isModifiedClick(ptr({ metaKey: true }))).toBe(true);
  });

  it("returns false when no modifiers", () => {
    expect(isModifiedClick(ptr())).toBe(false);
  });
});

describe("isTouchPointer", () => {
  it("returns true for touch", () => {
    expect(isTouchPointer(ptr({ pointerType: "touch" }))).toBe(true);
  });

  it("returns false for mouse", () => {
    expect(isTouchPointer(ptr({ pointerType: "mouse" }))).toBe(false);
  });
});

describe("isPenPointer", () => {
  it("returns true for pen", () => {
    expect(isPenPointer(ptr({ pointerType: "pen" }))).toBe(true);
  });

  it("returns false for touch", () => {
    expect(isPenPointer(ptr({ pointerType: "touch" }))).toBe(false);
  });
});

describe("isMousePointer", () => {
  it("returns true for mouse", () => {
    expect(isMousePointer(ptr({ pointerType: "mouse" }))).toBe(true);
  });

  it("returns false for touch", () => {
    expect(isMousePointer(ptr({ pointerType: "touch" }))).toBe(false);
  });
});

describe("isVirtualClick", () => {
  it("returns true when detail=0 and coordinates at 0,0", () => {
    expect(isVirtualClick(ptr({ detail: 0, clientX: 0, clientY: 0 }))).toBe(true);
  });

  it("returns true when detail=0 and coordinates undefined", () => {
    expect(isVirtualClick({ detail: 0 })).toBe(true);
  });

  it("returns false when detail > 0", () => {
    expect(isVirtualClick(ptr({ detail: 1, clientX: 0, clientY: 0 }))).toBe(false);
  });

  it("returns false for real click with coordinates", () => {
    expect(isVirtualClick(ptr({ detail: 1, clientX: 100, clientY: 200 }))).toBe(false);
  });

  it("returns false when detail=0 but has real coordinates", () => {
    expect(isVirtualClick(ptr({ detail: 0, clientX: 50, clientY: 50 }))).toBe(false);
  });
});

describe("getPointerCoordinates", () => {
  it("extracts all coordinates", () => {
    expect(getPointerCoordinates(ptr({ clientX: 10, clientY: 20, pageX: 30, pageY: 40 }))).toEqual({
      clientX: 10,
      clientY: 20,
      pageX: 30,
      pageY: 40,
    });
  });

  it("defaults missing coordinates to 0", () => {
    expect(getPointerCoordinates({})).toEqual({ clientX: 0, clientY: 0, pageX: 0, pageY: 0 });
  });
});

describe("normalizePointerType", () => {
  it("returns mouse for mouse", () => {
    expect(normalizePointerType(ptr({ pointerType: "mouse" }))).toBe("mouse");
  });

  it("returns touch for touch", () => {
    expect(normalizePointerType(ptr({ pointerType: "touch" }))).toBe("touch");
  });

  it("returns pen for pen", () => {
    expect(normalizePointerType(ptr({ pointerType: "pen" }))).toBe("pen");
  });

  it("returns unknown for undefined", () => {
    expect(normalizePointerType(ptr())).toBe("unknown");
  });

  it("returns unknown for empty string", () => {
    expect(normalizePointerType(ptr({ pointerType: "" }))).toBe("unknown");
  });
});
