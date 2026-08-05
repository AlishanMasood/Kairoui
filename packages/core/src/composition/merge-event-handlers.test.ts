import { describe, it, expect, vi } from "vitest";
import { mergeEventHandlers, composeHandlers } from "./merge-event-handlers";
import type { ComposableEvent } from "@kairoui/utils/events";

function createEvent(defaultPrevented = false): ComposableEvent & { preventDefault: () => void } {
  const event = {
    defaultPrevented,
    preventDefault() {
      event.defaultPrevented = true;
    },
  };
  return event;
}

describe("mergeEventHandlers", () => {
  describe("execution order", () => {
    it("executes in order: consumer → slot → accessibility → internal → child", () => {
      const order: string[] = [];
      const handler = mergeEventHandlers({
        consumer: () => {
          order.push("consumer");
        },
        slot: () => {
          order.push("slot");
        },
        accessibility: () => {
          order.push("accessibility");
        },
        internal: () => {
          order.push("internal");
        },
        child: () => {
          order.push("child");
        },
      });
      handler!(createEvent());
      expect(order).toEqual(["consumer", "slot", "accessibility", "internal", "child"]);
    });

    it("consumer runs before internal", () => {
      const order: string[] = [];
      const handler = mergeEventHandlers({
        consumer: () => {
          order.push("consumer");
        },
        internal: () => {
          order.push("internal");
        },
      });
      handler!(createEvent());
      expect(order).toEqual(["consumer", "internal"]);
    });
  });

  describe("defaultPrevented cancellation", () => {
    it("skips remaining handlers when consumer calls preventDefault", () => {
      const internal = vi.fn();
      const handler = mergeEventHandlers({
        consumer: (e) => {
          (e as { preventDefault: () => void }).preventDefault();
        },
        internal,
      });
      handler!(createEvent());
      expect(internal).not.toHaveBeenCalled();
    });

    it("skips remaining handlers when slot calls preventDefault", () => {
      const internal = vi.fn();
      const handler = mergeEventHandlers({
        slot: (e) => {
          (e as { preventDefault: () => void }).preventDefault();
        },
        internal,
      });
      handler!(createEvent());
      expect(internal).not.toHaveBeenCalled();
    });

    it("skips internal when event is already prevented (consumer still runs)", () => {
      const consumer = vi.fn();
      const internal = vi.fn();
      const handler = mergeEventHandlers({ consumer, internal });
      handler!(createEvent(true));
      // Phase 4 composeEventHandlers: consumer runs first, internal skipped if prevented
      expect(consumer).toHaveBeenCalled();
      expect(internal).not.toHaveBeenCalled();
    });

    it("does not skip when checkDefaultPrevented is false", () => {
      const internal = vi.fn();
      const handler = mergeEventHandlers(
        {
          consumer: (e) => {
            (e as { preventDefault: () => void }).preventDefault();
          },
          internal,
        },
        { checkDefaultPrevented: false },
      );
      handler!(createEvent());
      expect(internal).toHaveBeenCalled();
    });

    it("return false is NOT treated as cancellation", () => {
      const internal = vi.fn();
      const handler = mergeEventHandlers({
        consumer: () => {
          return false as unknown;
        },
        internal,
      });
      handler!(createEvent());
      expect(internal).toHaveBeenCalled();
    });
  });

  describe("missing handlers", () => {
    it("returns undefined when all handlers are undefined", () => {
      expect(mergeEventHandlers({})).toBeUndefined();
    });

    it("returns undefined for all null handlers", () => {
      expect(mergeEventHandlers({ consumer: null, internal: null })).toBeUndefined();
    });

    it("returns single handler directly when only one exists", () => {
      const fn = vi.fn();
      const handler = mergeEventHandlers({ internal: fn });
      expect(handler).toBe(fn);
    });

    it("skips undefined slots in the chain", () => {
      const order: string[] = [];
      const handler = mergeEventHandlers({
        consumer: () => {
          order.push("consumer");
        },
        slot: undefined,
        accessibility: undefined,
        internal: () => {
          order.push("internal");
        },
      });
      handler!(createEvent());
      expect(order).toEqual(["consumer", "internal"]);
    });
  });

  describe("error propagation", () => {
    it("propagates consumer errors", () => {
      const handler = mergeEventHandlers({
        consumer: () => {
          throw new Error("consumer error");
        },
        internal: vi.fn(),
      });
      expect(() => {
        handler!(createEvent());
      }).toThrow("consumer error");
    });

    it("propagates internal errors", () => {
      const handler = mergeEventHandlers({
        consumer: vi.fn(),
        internal: () => {
          throw new Error("internal error");
        },
      });
      expect(() => {
        handler!(createEvent());
      }).toThrow("internal error");
    });

    it("stops execution after error (subsequent handlers not called)", () => {
      const child = vi.fn();
      const handler = mergeEventHandlers({
        consumer: () => {
          throw new Error("fail");
        },
        child,
      });
      expect(() => {
        handler!(createEvent());
      }).toThrow();
      expect(child).not.toHaveBeenCalled();
    });
  });

  describe("event typing", () => {
    it("passes event to all handlers", () => {
      const consumer = vi.fn();
      const internal = vi.fn();
      const event = createEvent();
      const handler = mergeEventHandlers({ consumer, internal });
      handler!(event);
      expect(consumer).toHaveBeenCalledWith(event);
      expect(internal).toHaveBeenCalledWith(event);
    });
  });
});

describe("composeHandlers", () => {
  it("returns undefined when both are null", () => {
    expect(composeHandlers(null, null)).toBeUndefined();
  });

  it("returns consumer when internal is null", () => {
    const fn = vi.fn();
    expect(composeHandlers(fn, null)).toBe(fn);
  });

  it("returns internal when consumer is null", () => {
    const fn = vi.fn();
    expect(composeHandlers(null, fn)).toBe(fn);
  });

  it("composes both with defaultPrevented check", () => {
    const internal = vi.fn();
    const handler = composeHandlers((e) => {
      (e as { preventDefault: () => void }).preventDefault();
    }, internal);
    handler!(createEvent());
    expect(internal).not.toHaveBeenCalled();
  });
});
