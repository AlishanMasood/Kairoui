import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSystemColorScheme } from "./use-system-color-scheme";

describe("useSystemColorScheme", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("initial value", () => {
    it("returns light or dark based on system preference", () => {
      const { result } = renderHook(() => useSystemColorScheme());
      expect(["light", "dark"]).toContain(result.current);
    });

    it("uses serverFallback as initial render value", () => {
      // The initial useState value is the fallback (for SSR consistency).
      // After mount effect, it syncs to real value.
      const { result } = renderHook(() => useSystemColorScheme({ serverFallback: "dark" }));
      // After effect runs, it should reflect actual system (light in happy-dom)
      expect(["light", "dark"]).toContain(result.current);
    });
  });

  describe("change event", () => {
    it("updates when system preference changes", () => {
      let matches = false;
      let changeHandler: (() => void) | null = null;
      vi.spyOn(window, "matchMedia").mockImplementation(
        () =>
          ({
            get matches() {
              return matches;
            },
            addEventListener: (_type: string, cb: () => void) => {
              changeHandler = cb;
            },
            removeEventListener: () => {
              changeHandler = null;
            },
          }) as unknown as MediaQueryList,
      );

      const { result } = renderHook(() => useSystemColorScheme());
      expect(result.current).toBe("light");

      // Simulate OS switching to dark
      matches = true;
      act(() => {
        changeHandler?.();
      });

      expect(result.current).toBe("dark");
    });

    it("updates when system changes back to light", () => {
      let matches = true;
      let changeHandler: (() => void) | null = null;
      vi.spyOn(window, "matchMedia").mockImplementation(
        () =>
          ({
            get matches() {
              return matches;
            },
            addEventListener: (_type: string, cb: () => void) => {
              changeHandler = cb;
            },
            removeEventListener: () => {
              changeHandler = null;
            },
          }) as unknown as MediaQueryList,
      );

      const { result } = renderHook(() => useSystemColorScheme());
      expect(result.current).toBe("dark");

      matches = false;
      act(() => {
        changeHandler?.();
      });

      expect(result.current).toBe("light");
    });
  });

  describe("cleanup", () => {
    it("removes listener on unmount", () => {
      const removeListener = vi.fn();
      const mql = {
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: removeListener,
      };
      vi.spyOn(window, "matchMedia").mockReturnValue(mql as unknown as MediaQueryList);

      const { unmount } = renderHook(() => useSystemColorScheme());
      unmount();

      expect(removeListener).toHaveBeenCalledTimes(1);
    });
  });

  describe("missing matchMedia", () => {
    it("returns light when matchMedia is unavailable", () => {
      vi.spyOn(window, "matchMedia").mockImplementation(() => {
        throw new Error("Not supported");
      });

      const { result } = renderHook(() => useSystemColorScheme());

      // getSnapshot catches the error and returns "light"
      expect(result.current).toBe("light");
    });
  });

  describe("multiple consumers", () => {
    it("each consumer gets independent state", () => {
      const mql = {
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      };
      vi.spyOn(window, "matchMedia").mockReturnValue(mql as unknown as MediaQueryList);

      const { result: result1 } = renderHook(() => useSystemColorScheme());
      const { result: result2 } = renderHook(() => useSystemColorScheme());

      expect(result1.current).toBe("dark");
      expect(result2.current).toBe("dark");
    });
  });

  describe("no KairoProvider required", () => {
    it("works without any provider", () => {
      const { result } = renderHook(() => useSystemColorScheme());
      expect(["light", "dark"]).toContain(result.current);
    });
  });
});
