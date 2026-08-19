import { describe, it, expect, afterEach, vi, beforeEach } from "vitest";
import { createElement, StrictMode } from "react";
import { render, cleanup, screen, fireEvent, act, renderHook } from "@testing-library/react";
import { renderToString } from "react-dom/server";

import { ToastProvider, ToastViewport, ToastAction, _resetToastCounter } from "./toast";
import { useToastState } from "./toast-types";

beforeEach(() => {
  vi.useFakeTimers();
  _resetToastCounter();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  _resetToastCounter();
});

function wrapper({ children }: { children: React.ReactNode }) {
  return createElement(
    ToastProvider,
    null,
    children,
    createElement(ToastViewport, { "data-testid": "viewport" } as never),
  );
}

// ─── Provider + imperative API ──────────────────────────────────────

describe("Toast: provider and state", () => {
  it("useToastState provides add/dismiss", () => {
    const { result } = renderHook(() => useToastState(), { wrapper });
    expect(result.current.toasts).toEqual([]);
    expect(typeof result.current.add).toBe("function");
    expect(typeof result.current.dismiss).toBe("function");
  });

  it("add() creates a toast and returns id", () => {
    const { result } = renderHook(() => useToastState(), { wrapper });
    let id: string = "";
    act(() => {
      id = result.current.add({ title: "Hello" });
    });
    expect(id).toBeTruthy();
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0]?.title).toBe("Hello");
  });

  it("dismiss() removes a toast", () => {
    const { result } = renderHook(() => useToastState(), { wrapper });
    let id: string = "";
    act(() => {
      id = result.current.add({ title: "Test", duration: 0 });
    });
    expect(result.current.toasts).toHaveLength(1);
    act(() => {
      result.current.dismiss(id);
    });
    expect(result.current.toasts).toHaveLength(0);
  });

  it("dismissAll() removes all toasts", () => {
    const { result } = renderHook(() => useToastState(), { wrapper });
    act(() => {
      result.current.add({ title: "A", duration: 0 });
      result.current.add({ title: "B", duration: 0 });
    });
    expect(result.current.toasts).toHaveLength(2);
    act(() => {
      result.current.dismissAll();
    });
    expect(result.current.toasts).toHaveLength(0);
  });

  it("update() modifies a toast", () => {
    const { result } = renderHook(() => useToastState(), { wrapper });
    let id: string = "";
    act(() => {
      id = result.current.add({ title: "Old", duration: 0 });
    });
    act(() => {
      result.current.update(id, { title: "New" });
    });
    expect(result.current.toasts[0]?.title).toBe("New");
  });
});

// ─── Auto-dismiss ───────────────────────────────────────────────────

describe("Toast: auto-dismiss", () => {
  it("auto-dismisses after duration", () => {
    const { result } = renderHook(() => useToastState(), { wrapper });
    act(() => {
      result.current.add({ title: "Bye", duration: 3000 });
    });
    expect(result.current.toasts).toHaveLength(1);

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(result.current.toasts).toHaveLength(0);
  });

  it("persistent toast (duration=0) does not auto-dismiss", () => {
    const { result } = renderHook(() => useToastState(), { wrapper });
    act(() => {
      result.current.add({ title: "Stay", duration: 0 });
    });
    act(() => {
      vi.advanceTimersByTime(60000);
    });
    expect(result.current.toasts).toHaveLength(1);
  });

  it("calls onDismiss when auto-dismissed", () => {
    const onDismiss = vi.fn();
    const { result } = renderHook(() => useToastState(), { wrapper });
    act(() => {
      result.current.add({ title: "Cb", duration: 1000, onDismiss });
    });
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});

// ─── Pause/resume ───────────────────────────────────────────────────

describe("Toast: pause/resume", () => {
  it("pauseAll stops timers, resumeAll restarts them", () => {
    const { result } = renderHook(() => useToastState(), { wrapper });
    act(() => {
      result.current.add({ title: "Pausable", duration: 2000 });
    });

    // Advance half
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.toasts).toHaveLength(1);

    // Pause
    act(() => {
      result.current.pauseAll();
    });
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(result.current.toasts).toHaveLength(1);

    // Resume
    act(() => {
      result.current.resumeAll();
    });
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.toasts).toHaveLength(0);
  });
});

// ─── Viewport rendering ─────────────────────────────────────────────

describe("Toast: viewport", () => {
  it("renders viewport with role=region", () => {
    render(
      createElement(
        ToastProvider,
        null,
        createElement(ToastViewport, { "data-testid": "vp" } as never),
      ),
    );
    const vp = document.querySelector("[data-kui-component='ToastViewport']");
    expect(vp).not.toBeNull();
    expect(vp?.getAttribute("role")).toBe("region");
    expect(vp?.getAttribute("aria-live")).toBe("polite");
    expect(vp?.getAttribute("aria-label")).toBe("Notifications");
  });

  it("renders toasts in viewport", () => {
    function App() {
      const state = useToastState();
      return createElement(
        "div",
        null,
        createElement("button", {
          "data-testid": "add",
          onClick: () => state.add({ title: "Hello World", duration: 0 }),
        }),
        createElement(ToastViewport),
      );
    }
    App.displayName = "App";

    render(createElement(ToastProvider, null, createElement(App)));
    fireEvent.click(screen.getByTestId("add"));

    const toast = document.querySelector("[data-kui-component='Toast']");
    expect(toast).not.toBeNull();
    expect(toast?.getAttribute("role")).toBe("status");
    expect(toast?.textContent).toContain("Hello World");
  });
});

// ─── Toast close button ─────────────────────────────────────────────

describe("Toast: close button", () => {
  it("clicking close dismisses the toast", () => {
    function App() {
      const state = useToastState();
      return createElement(
        "div",
        null,
        createElement("button", {
          "data-testid": "add",
          onClick: () => state.add({ title: "Closable", duration: 0 }),
        }),
        createElement(ToastViewport),
      );
    }
    App.displayName = "App";

    render(createElement(ToastProvider, null, createElement(App)));
    fireEvent.click(screen.getByTestId("add"));

    const closeBtn = document.querySelector("[data-kui-component='ToastClose']") as HTMLElement;
    expect(closeBtn).not.toBeNull();
    fireEvent.click(closeBtn);

    expect(document.querySelector("[data-kui-component='Toast']")).toBeNull();
  });
});

// ─── Toast action ───────────────────────────────────────────────────

describe("Toast: action", () => {
  it("renders action with aria-label", () => {
    function App() {
      const state = useToastState();
      return createElement(
        "div",
        null,
        createElement("button", {
          "data-testid": "add",
          onClick: () =>
            state.add({
              title: "Update",
              duration: 0,
              action: createElement(ToastAction, { altText: "Undo the action" }, "Undo"),
            }),
        }),
        createElement(ToastViewport),
      );
    }
    App.displayName = "App";

    render(createElement(ToastProvider, null, createElement(App)));
    fireEvent.click(screen.getByTestId("add"));

    const action = document.querySelector("[data-kui-component='ToastAction']") as HTMLElement;
    expect(action).not.toBeNull();
    expect(action.getAttribute("aria-label")).toBe("Undo the action");
    expect(action.textContent).toBe("Undo");
  });
});

// ─── Hover pause ────────────────────────────────────────────────────

describe("Toast: hover pause", () => {
  it("pauses on pointer enter, resumes on pointer leave", () => {
    function App() {
      const state = useToastState();
      return createElement(
        "div",
        null,
        createElement("button", {
          "data-testid": "add",
          onClick: () => state.add({ title: "Hover", duration: 2000 }),
        }),
        createElement(ToastViewport),
      );
    }
    App.displayName = "App";

    render(createElement(ToastProvider, null, createElement(App)));
    fireEvent.click(screen.getByTestId("add"));

    const toast = document.querySelector("[data-kui-component='Toast']") as HTMLElement;
    expect(toast).not.toBeNull();

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    fireEvent.pointerEnter(toast);
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(document.querySelector("[data-kui-component='Toast']")).not.toBeNull();

    fireEvent.pointerLeave(toast);
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(document.querySelector("[data-kui-component='Toast']")).toBeNull();
  });
});

// ─── SSR ────────────────────────────────────────────────────────────

describe("Toast: SSR", () => {
  it("renders provider without error on server", () => {
    vi.useRealTimers();
    const html = renderToString(
      createElement(ToastProvider, null, createElement("div", null, "app")),
    );
    expect(html).toContain("app");
  });
});

// ─── Strict Mode ────────────────────────────────────────────────────

describe("Toast: Strict Mode", () => {
  it("works in StrictMode", () => {
    function App() {
      const state = useToastState();
      return createElement(
        "div",
        null,
        createElement("button", {
          "data-testid": "add",
          onClick: () => state.add({ title: "Strict", duration: 0 }),
        }),
        createElement(ToastViewport),
      );
    }
    App.displayName = "App";

    render(createElement(StrictMode, null, createElement(ToastProvider, null, createElement(App))));
    fireEvent.click(screen.getByTestId("add"));
    expect(document.querySelector("[data-kui-component='Toast']")).not.toBeNull();
    expect(document.querySelector("[data-kui-component='Toast']")?.textContent).toContain("Strict");
  });
});
