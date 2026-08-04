import { describe, it, expect, vi } from "vitest";
import {
  isDefaultPrevented,
  isCancelable,
  preventDefaultIfNeeded,
  stopPropagationIfNeeded,
  cancelEvent,
} from "./cancel-event";
import type { CancelableEventLike } from "./cancel-event";

function mockEvent(overrides: Partial<CancelableEventLike> = {}): CancelableEventLike {
  return {
    defaultPrevented: false,
    cancelable: true,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
    stopImmediatePropagation: vi.fn(),
    ...overrides,
  };
}

describe("isDefaultPrevented", () => {
  it("returns true when defaultPrevented is true", () => {
    expect(isDefaultPrevented(mockEvent({ defaultPrevented: true }))).toBe(true);
  });

  it("returns false when defaultPrevented is false", () => {
    expect(isDefaultPrevented(mockEvent({ defaultPrevented: false }))).toBe(false);
  });
});

describe("isCancelable", () => {
  it("returns true when cancelable is true", () => {
    expect(isCancelable(mockEvent({ cancelable: true }))).toBe(true);
  });

  it("returns false when cancelable is false", () => {
    expect(isCancelable(mockEvent({ cancelable: false }))).toBe(false);
  });

  it("returns true when cancelable is undefined (default)", () => {
    expect(isCancelable(mockEvent({ cancelable: undefined }))).toBe(true);
  });
});

describe("preventDefaultIfNeeded", () => {
  it("calls preventDefault on cancelable event", () => {
    const event = mockEvent();
    const result = preventDefaultIfNeeded(event);
    expect(event.preventDefault).toHaveBeenCalled();
    expect(result).toBe(true);
  });

  it("does not call preventDefault when already prevented", () => {
    const event = mockEvent({ defaultPrevented: true });
    const result = preventDefaultIfNeeded(event);
    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(result).toBe(false);
  });

  it("does not call preventDefault on non-cancelable event", () => {
    const event = mockEvent({ cancelable: false });
    const result = preventDefaultIfNeeded(event);
    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(result).toBe(false);
  });

  it("handles event without preventDefault method", () => {
    const event = mockEvent({ preventDefault: undefined });
    const result = preventDefaultIfNeeded(event);
    expect(result).toBe(true);
  });
});

describe("stopPropagationIfNeeded", () => {
  it("calls stopPropagation when method exists", () => {
    const event = mockEvent();
    const result = stopPropagationIfNeeded(event);
    expect(event.stopPropagation).toHaveBeenCalled();
    expect(result).toBe(true);
  });

  it("returns false when stopPropagation is not available", () => {
    const event = mockEvent({ stopPropagation: undefined });
    const result = stopPropagationIfNeeded(event);
    expect(result).toBe(false);
  });
});

describe("cancelEvent", () => {
  it("calls both preventDefault and stopPropagation", () => {
    const event = mockEvent();
    cancelEvent(event);
    expect(event.preventDefault).toHaveBeenCalled();
    expect(event.stopPropagation).toHaveBeenCalled();
  });

  it("does not throw for non-cancelable event", () => {
    const event = mockEvent({ cancelable: false });
    expect(() => {
      cancelEvent(event);
    }).not.toThrow();
    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(event.stopPropagation).toHaveBeenCalled();
  });

  it("handles minimal event object", () => {
    const event: CancelableEventLike = { defaultPrevented: false };
    expect(() => {
      cancelEvent(event);
    }).not.toThrow();
  });
});
