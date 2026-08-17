import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTypeahead } from "./use-typeahead";
import type { RegisteredItem } from "./use-collection";

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

const items: RegisteredItem[] = [
  { value: "apple", label: "Apple", id: "id-apple" },
  { value: "apricot", label: "Apricot", id: "id-apricot" },
  { value: "banana", label: "Banana", id: "id-banana", disabled: true },
  { value: "blueberry", label: "Blueberry", id: "id-blueberry" },
  { value: "cherry", label: "Cherry", id: "id-cherry" },
  { value: "date", label: "Date", id: "id-date" },
];

// ─── Basic prefix matching ──────────────────────────────────────────

describe("useTypeahead: prefix matching", () => {
  it("matches first item starting with character", () => {
    const { result } = renderHook(() => useTypeahead({ items }));
    let match: string | undefined;
    act(() => {
      match = result.current.search("a");
    });
    expect(match).toBe("apple");
  });

  it("accumulates characters for multi-char prefix", () => {
    const { result } = renderHook(() => useTypeahead({ items }));
    let match: string | undefined;
    act(() => {
      result.current.search("a");
    });
    act(() => {
      match = result.current.search("p");
    });
    // "ap" matches both Apple and Apricot — first wins
    expect(match).toBe("apple");
  });

  it("narrows to longer prefix", () => {
    const { result } = renderHook(() => useTypeahead({ items }));
    let match: string | undefined;
    act(() => {
      result.current.search("a");
    });
    act(() => {
      result.current.search("p");
    });
    act(() => {
      match = result.current.search("r");
    });
    // "apr" matches Apricot
    expect(match).toBe("apricot");
  });

  it("returns undefined for no match", () => {
    const { result } = renderHook(() => useTypeahead({ items }));
    let match: string | undefined;
    act(() => {
      match = result.current.search("z");
    });
    expect(match).toBeUndefined();
  });
});

// ─── Case insensitivity ─────────────────────────────────────────────

describe("useTypeahead: case insensitive", () => {
  it("matches regardless of input case", () => {
    const { result } = renderHook(() => useTypeahead({ items }));
    let match: string | undefined;
    act(() => {
      match = result.current.search("C");
    });
    expect(match).toBe("cherry");
  });

  it("matches regardless of label case", () => {
    const upperItems: RegisteredItem[] = [{ value: "FOO", label: "FOO BAR", id: "id-foo" }];
    const { result } = renderHook(() => useTypeahead({ items: upperItems }));
    let match: string | undefined;
    act(() => {
      match = result.current.search("f");
    });
    expect(match).toBe("FOO");
  });
});

// ─── Disabled-item skipping ─────────────────────────────────────────

describe("useTypeahead: disabled items", () => {
  it("skips disabled items", () => {
    const { result } = renderHook(() => useTypeahead({ items }));
    let match: string | undefined;
    act(() => {
      match = result.current.search("b");
    });
    // Banana is disabled, should match Blueberry
    expect(match).toBe("blueberry");
  });
});

// ─── Timeout reset ──────────────────────────────────────────────────

describe("useTypeahead: timeout", () => {
  it("resets buffer after timeout", () => {
    const { result } = renderHook(() => useTypeahead({ items, timeout: 500 }));
    let match: string | undefined;
    act(() => {
      result.current.search("a");
    });
    act(() => {
      vi.advanceTimersByTime(600);
    });
    act(() => {
      match = result.current.search("c");
    });
    // After reset, "c" should match Cherry (not "ac")
    expect(match).toBe("cherry");
  });

  it("does not reset before timeout", () => {
    const { result } = renderHook(() => useTypeahead({ items, timeout: 500 }));
    let match: string | undefined;
    act(() => {
      result.current.search("a");
    });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    act(() => {
      match = result.current.search("p");
    });
    // Buffer is "ap" — matches Apple
    expect(match).toBe("apple");
  });
});

// ─── Repeated-character cycling ─────────────────────────────────────

describe("useTypeahead: repeated character cycling", () => {
  it("cycles through items starting with same character", () => {
    const { result } = renderHook(() => useTypeahead({ items }));
    let match1: string | undefined;
    let match2: string | undefined;
    let match3: string | undefined;
    act(() => {
      match1 = result.current.search("a");
    });
    act(() => {
      match2 = result.current.search("a");
    });
    act(() => {
      match3 = result.current.search("a");
    });
    // First: Apple, Second: Apricot, Third: wraps back to Apple
    expect(match1).toBe("apple");
    expect(match2).toBe("apricot");
    expect(match3).toBe("apple");
  });

  it("cycling skips disabled items", () => {
    // All "b" items: Banana (disabled), Blueberry
    const { result } = renderHook(() => useTypeahead({ items }));
    let match1: string | undefined;
    let match2: string | undefined;
    act(() => {
      match1 = result.current.search("b");
    });
    act(() => {
      match2 = result.current.search("b");
    });
    // Only Blueberry is enabled — cycles to itself
    expect(match1).toBe("blueberry");
    expect(match2).toBe("blueberry");
  });
});

// ─── onMatch callback ───────────────────────────────────────────────

describe("useTypeahead: onMatch", () => {
  it("calls onMatch when a match is found", () => {
    const onMatch = vi.fn();
    const { result } = renderHook(() => useTypeahead({ items, onMatch }));
    act(() => {
      result.current.search("d");
    });
    expect(onMatch).toHaveBeenCalledWith("date");
  });

  it("does not call onMatch when no match", () => {
    const onMatch = vi.fn();
    const { result } = renderHook(() => useTypeahead({ items, onMatch }));
    act(() => {
      result.current.search("z");
    });
    expect(onMatch).not.toHaveBeenCalled();
  });
});

// ─── Manual reset ───────────────────────────────────────────────────

describe("useTypeahead: reset", () => {
  it("reset clears buffer", () => {
    const { result } = renderHook(() => useTypeahead({ items }));
    let match: string | undefined;
    act(() => {
      result.current.search("a");
    });
    act(() => {
      result.current.reset();
    });
    act(() => {
      match = result.current.search("c");
    });
    expect(match).toBe("cherry");
  });
});

// ─── Fallback to single character ───────────────────────────────────

describe("useTypeahead: fallback", () => {
  it("falls back to single char when accumulated buffer has no match", () => {
    const { result } = renderHook(() => useTypeahead({ items }));
    let match: string | undefined;
    act(() => {
      result.current.search("a");
    }); // "a" → apple
    act(() => {
      match = result.current.search("d");
    }); // "ad" → no match → "d" → date
    expect(match).toBe("date");
  });
});
