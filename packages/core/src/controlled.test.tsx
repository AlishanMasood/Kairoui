import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, act, renderHook } from "@testing-library/react";
import { useState, useContext } from "react";
import { KairoProvider } from "./kairo-provider";
import { KairoThemeContext } from "./theme-context";
import type { ThemeMode } from "@kairoui/theme";

function useThemeCtx() {
  return useContext(KairoThemeContext);
}

describe("controlled mode", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-kui-theme");
    document.documentElement.removeAttribute("data-kui-density");
  });

  afterEach(() => {
    document.documentElement.removeAttribute("data-kui-theme");
    document.documentElement.removeAttribute("data-kui-density");
  });

  it("uses controlled mode value", () => {
    const { result } = renderHook(useThemeCtx, {
      wrapper: ({ children }) => <KairoProvider mode="dark">{children}</KairoProvider>,
    });
    expect(result.current.mode).toBe("dark");
    expect(result.current.resolvedMode).toBe("dark");
  });

  it("updates when controlled mode prop changes", () => {
    function Wrapper({ children }: { children: React.ReactNode }) {
      const [mode, setMode] = useState<ThemeMode>("light");
      return (
        <KairoProvider mode={mode} onModeChange={setMode}>
          <button
            data-testid="toggle"
            onClick={() => {
              setMode("dark");
            }}
          />
          {children}
        </KairoProvider>
      );
    }

    const { result } = renderHook(useThemeCtx, { wrapper: Wrapper });
    expect(result.current.mode).toBe("light");
  });

  it("calls onModeChange when setMode is called", () => {
    const onModeChange = vi.fn();
    const { result } = renderHook(useThemeCtx, {
      wrapper: ({ children }) => (
        <KairoProvider mode="light" onModeChange={onModeChange}>
          {children}
        </KairoProvider>
      ),
    });

    act(() => {
      result.current.setMode("dark");
    });

    expect(onModeChange).toHaveBeenCalledWith("dark");
  });

  it("does not persist controlled mode changes", () => {
    const onModeChange = vi.fn();
    const { result } = renderHook(useThemeCtx, {
      wrapper: ({ children }) => (
        <KairoProvider mode="light" onModeChange={onModeChange}>
          {children}
        </KairoProvider>
      ),
    });

    act(() => {
      result.current.setMode("dark");
    });

    // Controlled mode should delegate to callback, not persist internally
    const stored = localStorage.getItem("kui-theme-preference");
    expect(stored).toBeNull();
  });

  it("does not mutate internal state when controlled", () => {
    const { result } = renderHook(useThemeCtx, {
      wrapper: ({ children }) => <KairoProvider mode="light">{children}</KairoProvider>,
    });

    act(() => {
      result.current.setMode("dark");
    });

    // Mode should still be light since it's controlled and no onModeChange was provided
    expect(result.current.mode).toBe("light");
  });

  it("applies controlled mode to DOM", () => {
    render(
      <KairoProvider mode="dark">
        <div />
      </KairoProvider>,
    );
    expect(document.documentElement.getAttribute("data-kui-theme")).toBe("dark");
  });

  it("resolves controlled system mode", () => {
    const { result } = renderHook(useThemeCtx, {
      wrapper: ({ children }) => <KairoProvider mode="system">{children}</KairoProvider>,
    });
    expect(result.current.mode).toBe("system");
    expect(["light", "dark"]).toContain(result.current.resolvedMode);
  });
});

describe("controlled density", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-kui-theme");
    document.documentElement.removeAttribute("data-kui-density");
  });

  afterEach(() => {
    document.documentElement.removeAttribute("data-kui-theme");
    document.documentElement.removeAttribute("data-kui-density");
  });

  it("uses controlled density value", () => {
    const { result } = renderHook(useThemeCtx, {
      wrapper: ({ children }) => <KairoProvider density="compact">{children}</KairoProvider>,
    });
    expect(result.current.density).toBe("compact");
  });

  it("calls onDensityChange when setDensity is called", () => {
    const onDensityChange = vi.fn();
    const { result } = renderHook(useThemeCtx, {
      wrapper: ({ children }) => (
        <KairoProvider density="comfortable" onDensityChange={onDensityChange}>
          {children}
        </KairoProvider>
      ),
    });

    act(() => {
      result.current.setDensity("compact");
    });

    expect(onDensityChange).toHaveBeenCalledWith("compact");
  });

  it("does not mutate internal state when controlled", () => {
    const { result } = renderHook(useThemeCtx, {
      wrapper: ({ children }) => <KairoProvider density="comfortable">{children}</KairoProvider>,
    });

    act(() => {
      result.current.setDensity("compact");
    });

    // Density should still be comfortable since controlled without callback
    expect(result.current.density).toBe("comfortable");
  });

  it("applies controlled density to DOM", () => {
    render(
      <KairoProvider density="compact">
        <div />
      </KairoProvider>,
    );
    expect(document.documentElement.getAttribute("data-kui-density")).toBe("compact");
  });

  it("does not persist controlled density", () => {
    const onDensityChange = vi.fn();
    const { result } = renderHook(useThemeCtx, {
      wrapper: ({ children }) => (
        <KairoProvider density="comfortable" onDensityChange={onDensityChange}>
          {children}
        </KairoProvider>
      ),
    });

    act(() => {
      result.current.setDensity("compact");
    });

    const stored = localStorage.getItem("kui-theme-preference");
    expect(stored).toBeNull();
  });
});

describe("mixed controlled/uncontrolled", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-kui-theme");
    document.documentElement.removeAttribute("data-kui-density");
  });

  afterEach(() => {
    document.documentElement.removeAttribute("data-kui-theme");
    document.documentElement.removeAttribute("data-kui-density");
  });

  it("controlled mode + uncontrolled density", () => {
    const { result } = renderHook(useThemeCtx, {
      wrapper: ({ children }) => (
        <KairoProvider mode="dark" defaultDensity="standard">
          {children}
        </KairoProvider>
      ),
    });

    expect(result.current.mode).toBe("dark");
    expect(result.current.density).toBe("standard");

    // Density can be changed internally
    act(() => {
      result.current.setDensity("compact");
    });
    expect(result.current.density).toBe("compact");
  });

  it("uncontrolled mode + controlled density", () => {
    const onDensityChange = vi.fn();
    const { result } = renderHook(useThemeCtx, {
      wrapper: ({ children }) => (
        <KairoProvider defaultMode="light" density="compact" onDensityChange={onDensityChange}>
          {children}
        </KairoProvider>
      ),
    });

    expect(result.current.mode).toBe("light");
    expect(result.current.density).toBe("compact");

    // Mode can be changed internally
    act(() => {
      result.current.setMode("dark");
    });
    expect(result.current.mode).toBe("dark");
  });
});

describe("development warnings", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-kui-theme");
    document.documentElement.removeAttribute("data-kui-density");
  });

  afterEach(() => {
    document.documentElement.removeAttribute("data-kui-theme");
    document.documentElement.removeAttribute("data-kui-density");
  });

  it("warns when mode and defaultMode both provided", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(
      <KairoProvider mode="dark" defaultMode="light">
        <div />
      </KairoProvider>,
    );
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("both `mode` and `defaultMode`"));
    spy.mockRestore();
  });

  it("warns when density and defaultDensity both provided", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(
      <KairoProvider density="compact" defaultDensity="comfortable">
        <div />
      </KairoProvider>,
    );
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining("both `density` and `defaultDensity`"),
    );
    spy.mockRestore();
  });
});

describe("uncontrolled persistence", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-kui-theme");
    document.documentElement.removeAttribute("data-kui-density");
  });

  afterEach(() => {
    document.documentElement.removeAttribute("data-kui-theme");
    document.documentElement.removeAttribute("data-kui-density");
  });

  it("persists uncontrolled mode changes", () => {
    const { result } = renderHook(useThemeCtx, {
      wrapper: ({ children }) => <KairoProvider defaultMode="light">{children}</KairoProvider>,
    });

    act(() => {
      result.current.setMode("dark");
    });

    const stored = localStorage.getItem("kui-theme-preference");
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!) as Record<string, unknown>;
    expect(parsed["mode"]).toBe("dark");
  });

  it("persists uncontrolled density changes", () => {
    const { result } = renderHook(useThemeCtx, {
      wrapper: ({ children }) => (
        <KairoProvider defaultDensity="comfortable">{children}</KairoProvider>
      ),
    });

    act(() => {
      result.current.setDensity("compact");
    });

    const stored = localStorage.getItem("kui-theme-preference");
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!) as Record<string, unknown>;
    expect(parsed["density"]).toBe("compact");
  });

  it("density change does not reset mode", () => {
    const { result } = renderHook(useThemeCtx, {
      wrapper: ({ children }) => (
        <KairoProvider defaultMode="dark" defaultDensity="comfortable">
          {children}
        </KairoProvider>
      ),
    });

    act(() => {
      result.current.setDensity("compact");
    });

    expect(result.current.mode).toBe("dark");
    expect(result.current.density).toBe("compact");
  });
});
