import { describe, it, expect, vi } from "vitest";
import { composeEventHandlers } from "./events";
import type { ComposableEvent } from "./events";

function createEvent(defaultPrevented = false): ComposableEvent & { preventDefault: () => void } {
  const event = {
    defaultPrevented,
    preventDefault() {
      event.defaultPrevented = true;
    },
  };
  return event;
}

describe("composeEventHandlers", () => {
  describe("basic composition", () => {
    it("calls consumer handler first, then internal", () => {
      const order: string[] = [];
      const user = () => {
        order.push("user");
      };
      const internal = () => {
        order.push("internal");
      };
      const composed = composeEventHandlers(user, internal);
      composed(createEvent());
      expect(order).toEqual(["user", "internal"]);
    });

    it("passes event to both handlers", () => {
      const user = vi.fn();
      const internal = vi.fn();
      const event = createEvent();
      const composed = composeEventHandlers(user, internal);
      composed(event);
      expect(user).toHaveBeenCalledWith(event);
      expect(internal).toHaveBeenCalledWith(event);
    });
  });

  describe("defaultPrevented behavior", () => {
    it("skips internal handler when consumer calls preventDefault", () => {
      const internal = vi.fn();
      const user = (e: ComposableEvent & { preventDefault: () => void }) => {
        e.preventDefault();
      };
      const composed = composeEventHandlers(user, internal);
      composed(createEvent());
      expect(internal).not.toHaveBeenCalled();
    });

    it("skips internal handler when event is already defaultPrevented", () => {
      const internal = vi.fn();
      const composed = composeEventHandlers(null, internal);
      composed(createEvent(true));
      expect(internal).not.toHaveBeenCalled();
    });

    it("calls internal handler when defaultPrevented is false", () => {
      const internal = vi.fn();
      const composed = composeEventHandlers(null, internal);
      composed(createEvent(false));
      expect(internal).toHaveBeenCalled();
    });

    it("respects checkDefaultPrevented: false option", () => {
      const internal = vi.fn();
      const user = (e: ComposableEvent & { preventDefault: () => void }) => {
        e.preventDefault();
      };
      const composed = composeEventHandlers(user, internal, {
        checkDefaultPrevented: false,
      });
      composed(createEvent());
      expect(internal).toHaveBeenCalled();
    });
  });

  describe("null/undefined handlers", () => {
    it("handles null user handler", () => {
      const internal = vi.fn();
      const composed = composeEventHandlers(null, internal);
      composed(createEvent());
      expect(internal).toHaveBeenCalled();
    });

    it("handles undefined user handler", () => {
      const internal = vi.fn();
      const composed = composeEventHandlers(undefined, internal);
      composed(createEvent());
      expect(internal).toHaveBeenCalled();
    });

    it("handles null internal handler", () => {
      const user = vi.fn();
      const composed = composeEventHandlers(user, null);
      expect(() => {
        composed(createEvent());
      }).not.toThrow();
      expect(user).toHaveBeenCalled();
    });

    it("handles both null", () => {
      const composed = composeEventHandlers(null, null);
      expect(() => {
        composed(createEvent());
      }).not.toThrow();
    });

    it("handles both undefined", () => {
      const composed = composeEventHandlers(undefined, undefined);
      expect(() => {
        composed(createEvent());
      }).not.toThrow();
    });
  });

  describe("error propagation", () => {
    it("propagates error from user handler", () => {
      const user = () => {
        throw new Error("user error");
      };
      const internal = vi.fn();
      const composed = composeEventHandlers(user, internal);
      expect(() => {
        composed(createEvent());
      }).toThrow("user error");
      expect(internal).not.toHaveBeenCalled();
    });

    it("propagates error from internal handler", () => {
      const user = vi.fn();
      const internal = () => {
        throw new Error("internal error");
      };
      const composed = composeEventHandlers(user, internal);
      expect(() => {
        composed(createEvent());
      }).toThrow("internal error");
      expect(user).toHaveBeenCalled();
    });
  });

  describe("event type preservation", () => {
    it("works with extended event types", () => {
      interface ClickEvent extends ComposableEvent {
        clientX: number;
        clientY: number;
      }
      const user = vi.fn<(e: ClickEvent) => void>();
      const internal = vi.fn<(e: ClickEvent) => void>();
      const event: ClickEvent = { defaultPrevented: false, clientX: 10, clientY: 20 };
      const composed = composeEventHandlers<ClickEvent>(user, internal);
      composed(event);
      expect(user).toHaveBeenCalledWith(event);
      expect(internal).toHaveBeenCalledWith(event);
    });
  });
});
