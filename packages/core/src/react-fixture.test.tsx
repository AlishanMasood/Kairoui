import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, act, cleanup } from "@testing-library/react";
import { useState, useRef } from "react";
import {
  KairoProvider,
  KairoScopeProvider,
  useTheme,
  useThemeMode,
  useDensity,
  useResolvedTheme,
} from "./index";
import { createTheme } from "@kairoui/theme";
import type { ThemeMode, DensityMode } from "@kairoui/theme";

beforeEach(() => {
  document.documentElement.removeAttribute("data-kui-theme");
  document.documentElement.removeAttribute("data-kui-density");
  localStorage.clear();
});

afterEach(cleanup);

// ─── Helper Components ──────────────────────────────────────────────

function ThemeDisplay() {
  const { mode, resolvedMode, density, setMode, setDensity, themeName, isNested } = useTheme();
  return (
    <div>
      <span data-testid="mode">{mode}</span>
      <span data-testid="resolved-mode">{resolvedMode}</span>
      <span data-testid="density">{density}</span>
      <span data-testid="theme-name">{themeName}</span>
      <span data-testid="is-nested">{String(isNested)}</span>
      <button
        data-testid="set-dark"
        onClick={() => {
          setMode("dark");
        }}
      >
        Dark
      </button>
      <button
        data-testid="set-compact"
        onClick={() => {
          setDensity("compact");
        }}
      >
        Compact
      </button>
    </div>
  );
}

function ModeToggle() {
  const { mode, resolvedMode, toggleMode } = useThemeMode();
  return (
    <div>
      <span data-testid="mode-hook">{mode}</span>
      <span data-testid="resolved-hook">{resolvedMode}</span>
      <button data-testid="toggle" onClick={toggleMode}>
        Toggle
      </button>
    </div>
  );
}

function DensityDisplay() {
  const { density, setDensity } = useDensity();
  return (
    <div>
      <span data-testid="density-hook">{density}</span>
      <button
        data-testid="set-standard"
        onClick={() => {
          setDensity("standard");
        }}
      >
        Standard
      </button>
    </div>
  );
}

function ResolvedThemeDisplay() {
  const resolved = useResolvedTheme();
  return <span data-testid="resolved-theme">{resolved ? "resolved" : "pending"}</span>;
}

// ─── Fixtures ───────────────────────────────────────────────────────

describe("React theme fixture", () => {
  describe("KairoProvider — uncontrolled mode", () => {
    it("renders with default system mode and comfortable density", () => {
      render(
        <KairoProvider>
          <ThemeDisplay />
        </KairoProvider>,
      );
      expect(screen.getByTestId("mode").textContent).toBe("system");
      expect(screen.getByTestId("density").textContent).toBe("comfortable");
    });

    it("renders with defaultMode light", () => {
      render(
        <KairoProvider defaultMode="light">
          <ThemeDisplay />
        </KairoProvider>,
      );
      expect(screen.getByTestId("mode").textContent).toBe("light");
      expect(screen.getByTestId("resolved-mode").textContent).toBe("light");
    });

    it("renders with defaultMode dark", () => {
      render(
        <KairoProvider defaultMode="dark">
          <ThemeDisplay />
        </KairoProvider>,
      );
      expect(screen.getByTestId("mode").textContent).toBe("dark");
      expect(screen.getByTestId("resolved-mode").textContent).toBe("dark");
    });

    it("supports mode switching via useTheme", () => {
      render(
        <KairoProvider defaultMode="light">
          <ThemeDisplay />
        </KairoProvider>,
      );
      expect(screen.getByTestId("resolved-mode").textContent).toBe("light");
      act(() => {
        screen.getByTestId("set-dark").click();
      });
      expect(screen.getByTestId("resolved-mode").textContent).toBe("dark");
    });

    it("supports density switching via useTheme", () => {
      render(
        <KairoProvider defaultDensity="comfortable">
          <ThemeDisplay />
        </KairoProvider>,
      );
      expect(screen.getByTestId("density").textContent).toBe("comfortable");
      act(() => {
        screen.getByTestId("set-compact").click();
      });
      expect(screen.getByTestId("density").textContent).toBe("compact");
    });
  });

  describe("useThemeMode hook", () => {
    it("provides mode and toggle", () => {
      render(
        <KairoProvider defaultMode="light">
          <ModeToggle />
        </KairoProvider>,
      );
      expect(screen.getByTestId("mode-hook").textContent).toBe("light");
      act(() => {
        screen.getByTestId("toggle").click();
      });
      expect(screen.getByTestId("mode-hook").textContent).toBe("dark");
    });
  });

  describe("useDensity hook", () => {
    it("provides density and setter", () => {
      render(
        <KairoProvider defaultDensity="comfortable">
          <DensityDisplay />
        </KairoProvider>,
      );
      expect(screen.getByTestId("density-hook").textContent).toBe("comfortable");
      act(() => {
        screen.getByTestId("set-standard").click();
      });
      expect(screen.getByTestId("density-hook").textContent).toBe("standard");
    });
  });

  describe("useResolvedTheme hook", () => {
    it("returns resolved theme object", async () => {
      render(
        <KairoProvider defaultMode="light">
          <ResolvedThemeDisplay />
        </KairoProvider>,
      );
      // Initially may be pending, then resolved
      await vi.waitFor(() => {
        expect(screen.getByTestId("resolved-theme").textContent).toBe("resolved");
      });
    });
  });

  describe("system mode", () => {
    it("defaults to system mode which resolves to light (test env)", () => {
      render(
        <KairoProvider>
          <ThemeDisplay />
        </KairoProvider>,
      );
      expect(screen.getByTestId("mode").textContent).toBe("system");
      // In test env matchMedia returns light
      expect(screen.getByTestId("resolved-mode").textContent).toBe("light");
    });
  });

  describe("controlled mode", () => {
    function ControlledFixture() {
      const [mode, setMode] = useState<ThemeMode>("light");
      const [density, setDensity] = useState<DensityMode>("comfortable");
      return (
        <div>
          <KairoProvider
            mode={mode}
            onModeChange={setMode}
            density={density}
            onDensityChange={setDensity}
          >
            <ThemeDisplay />
          </KairoProvider>
          <button
            data-testid="external-dark"
            onClick={() => {
              setMode("dark");
            }}
          >
            External Dark
          </button>
          <button
            data-testid="external-compact"
            onClick={() => {
              setDensity("compact");
            }}
          >
            External Compact
          </button>
        </div>
      );
    }

    it("uses external state for mode", () => {
      render(<ControlledFixture />);
      expect(screen.getByTestId("mode").textContent).toBe("light");
      act(() => {
        screen.getByTestId("external-dark").click();
      });
      expect(screen.getByTestId("mode").textContent).toBe("dark");
    });

    it("uses external state for density", () => {
      render(<ControlledFixture />);
      expect(screen.getByTestId("density").textContent).toBe("comfortable");
      act(() => {
        screen.getByTestId("external-compact").click();
      });
      expect(screen.getByTestId("density").textContent).toBe("compact");
    });

    it("propagates changes from hooks to onModeChange", () => {
      render(<ControlledFixture />);
      act(() => {
        screen.getByTestId("set-dark").click();
      });
      expect(screen.getByTestId("mode").textContent).toBe("dark");
    });
  });

  describe("persisted preference", () => {
    it("persists mode to localStorage in uncontrolled mode", () => {
      render(
        <KairoProvider defaultMode="light">
          <ThemeDisplay />
        </KairoProvider>,
      );
      act(() => {
        screen.getByTestId("set-dark").click();
      });
      const stored = localStorage.getItem("kui-theme-preference");
      expect(stored).not.toBeNull();
      const parsed = JSON.parse(stored!);
      expect(parsed.mode).toBe("dark");
    });

    it("restores persisted preference on mount", () => {
      localStorage.setItem(
        "kui-theme-preference",
        JSON.stringify({ version: 1, mode: "dark", density: "compact" }),
      );
      render(
        <KairoProvider>
          <ThemeDisplay />
        </KairoProvider>,
      );
      expect(screen.getByTestId("mode").textContent).toBe("dark");
      expect(screen.getByTestId("density").textContent).toBe("compact");
    });
  });

  describe("scoped provider", () => {
    it("creates nested scope with overridden mode", () => {
      render(
        <KairoProvider defaultMode="light">
          <ThemeDisplay />
          <KairoScopeProvider mode="dark">
            <ThemeDisplay />
          </KairoScopeProvider>
        </KairoProvider>,
      );
      const modes = screen.getAllByTestId("resolved-mode");
      expect(modes[0]!.textContent).toBe("light");
      expect(modes[1]!.textContent).toBe("dark");
    });

    it("marks nested scope with isNested=true", () => {
      render(
        <KairoProvider defaultMode="light">
          <ThemeDisplay />
          <KairoScopeProvider mode="dark">
            <ThemeDisplay />
          </KairoScopeProvider>
        </KairoProvider>,
      );
      const nested = screen.getAllByTestId("is-nested");
      expect(nested[0]!.textContent).toBe("false");
      expect(nested[1]!.textContent).toBe("true");
    });

    it("inherits density from parent when not overridden", () => {
      render(
        <KairoProvider defaultMode="light" defaultDensity="standard">
          <KairoScopeProvider mode="dark">
            <ThemeDisplay />
          </KairoScopeProvider>
        </KairoProvider>,
      );
      expect(screen.getByTestId("density").textContent).toBe("standard");
    });
  });

  describe("custom target", () => {
    function CustomTargetFixture() {
      const ref = useRef<HTMLDivElement>(null);
      return (
        <div>
          <div ref={ref} data-testid="custom-target" />
          <KairoProvider target={ref} defaultMode="dark" defaultDensity="compact">
            <ThemeDisplay />
          </KairoProvider>
        </div>
      );
    }

    it("applies attributes to custom target element", () => {
      render(<CustomTargetFixture />);
      const target = screen.getByTestId("custom-target");
      expect(target.getAttribute("data-kui-theme")).toBe("dark");
      expect(target.getAttribute("data-kui-density")).toBe("compact");
    });
  });

  describe("custom theme", () => {
    const brandTheme = createTheme({
      name: "brand",
      base: "light",
      overrides: {
        color: {
          interactive: { default: "#7c3aed" },
        },
      },
    });

    it("passes custom theme definition to provider", () => {
      render(
        <KairoProvider theme={brandTheme} defaultMode="light">
          <ThemeDisplay />
        </KairoProvider>,
      );
      expect(screen.getByTestId("theme-name").textContent).toBe("brand");
    });
  });

  describe("nested density", () => {
    it("allows different densities at different nesting levels", () => {
      render(
        <KairoProvider defaultMode="light" defaultDensity="comfortable">
          <DensityDisplay />
          <KairoScopeProvider density="compact">
            <DensityDisplay />
          </KairoScopeProvider>
        </KairoProvider>,
      );
      const densities = screen.getAllByTestId("density-hook");
      expect(densities[0]!.textContent).toBe("comfortable");
      expect(densities[1]!.textContent).toBe("compact");
    });
  });
});
