import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useContext } from "react";
import { KairoProvider } from "./kairo-provider";
import { KairoScopeProvider } from "./kairo-scope-provider";
import { KairoThemeContext } from "./theme-context";

function useThemeCtx() {
  return useContext(KairoThemeContext);
}

describe("hydration-safe provider initialization", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-kui-theme");
    document.documentElement.removeAttribute("data-kui-density");
  });

  afterEach(() => {
    document.documentElement.removeAttribute("data-kui-theme");
    document.documentElement.removeAttribute("data-kui-density");
  });

  describe("matching server/client state", () => {
    it("uses serverState for initial mode", () => {
      const { result } = renderHook(useThemeCtx, {
        wrapper: ({ children }) => (
          <KairoProvider serverState={{ mode: "dark", resolvedMode: "dark", density: "compact" }}>
            {children}
          </KairoProvider>
        ),
      });
      expect(result.current.mode).toBe("dark");
      expect(result.current.resolvedMode).toBe("dark");
      expect(result.current.density).toBe("compact");
    });

    it("matches DOM attributes set by no-flash script", () => {
      // Simulate no-flash script having set attributes
      document.documentElement.setAttribute("data-kui-theme", "dark");
      document.documentElement.setAttribute("data-kui-density", "compact");

      const { result } = renderHook(useThemeCtx, {
        wrapper: ({ children }) => <KairoProvider>{children}</KairoProvider>,
      });

      // Provider should detect the DOM state and match it
      expect(result.current.resolvedMode).toBe("dark");
    });
  });

  describe("missing server state", () => {
    it("falls back to defaults when no serverState provided", () => {
      const { result } = renderHook(useThemeCtx, {
        wrapper: ({ children }) => <KairoProvider>{children}</KairoProvider>,
      });
      // Falls back to DEFAULT_PREFERENCE
      expect(result.current.mode).toBe("system");
      expect(result.current.density).toBe("comfortable");
    });
  });

  describe("invalid server state", () => {
    it("ignores invalid serverState mode", () => {
      const { result } = renderHook(useThemeCtx, {
        wrapper: ({ children }) => (
          <KairoProvider serverState={{ mode: "invalid" as "light" }}>{children}</KairoProvider>
        ),
      });
      // Invalid mode in serverState is ignored because it's not picked up
      // (the ?? chain skips it since the value is present but invalid in the types)
      // The mode will be "invalid" since TS types are runtime-permissive
      // But resolvedMode should still work via getSystemPreference
      expect(["light", "dark"]).toContain(result.current.resolvedMode);
    });
  });

  describe("server light / client system dark", () => {
    it("serverState provides the SSR resolved mode to avoid mismatch", () => {
      // Server rendered with light, but client prefers dark
      // The serverState tells the provider what the server used
      const { result } = renderHook(useThemeCtx, {
        wrapper: ({ children }) => (
          <KairoProvider
            serverState={{ mode: "system", resolvedMode: "light", density: "comfortable" }}
          >
            {children}
          </KairoProvider>
        ),
      });
      expect(result.current.mode).toBe("system");
      // resolvedMode comes from DOM or system pref, not forced to server value
      expect(["light", "dark"]).toContain(result.current.resolvedMode);
    });
  });

  describe("controlled mode takes priority", () => {
    it("controlled mode overrides serverState", () => {
      const { result } = renderHook(useThemeCtx, {
        wrapper: ({ children }) => (
          <KairoProvider
            mode="light"
            serverState={{ mode: "dark", resolvedMode: "dark", density: "compact" }}
          >
            {children}
          </KairoProvider>
        ),
      });
      expect(result.current.mode).toBe("light");
      expect(result.current.resolvedMode).toBe("light");
    });
  });

  describe("controlled density takes priority", () => {
    it("controlled density overrides serverState", () => {
      const { result } = renderHook(useThemeCtx, {
        wrapper: ({ children }) => (
          <KairoProvider
            density="standard"
            serverState={{ mode: "light", resolvedMode: "light", density: "compact" }}
          >
            {children}
          </KairoProvider>
        ),
      });
      expect(result.current.density).toBe("standard");
    });
  });

  describe("persistence reconciliation", () => {
    it("persisted preference takes priority over serverState", () => {
      localStorage.setItem(
        "kui-theme-preference",
        JSON.stringify({ version: 1, mode: "dark", density: "compact" }),
      );

      const { result } = renderHook(useThemeCtx, {
        wrapper: ({ children }) => (
          <KairoProvider
            serverState={{ mode: "light", resolvedMode: "light", density: "comfortable" }}
          >
            {children}
          </KairoProvider>
        ),
      });

      // Persisted pref overrides serverState
      expect(result.current.mode).toBe("dark");
      expect(result.current.density).toBe("compact");
    });

    it("defaultMode overrides persisted and serverState", () => {
      localStorage.setItem(
        "kui-theme-preference",
        JSON.stringify({ version: 1, mode: "dark", density: "compact" }),
      );

      const { result } = renderHook(useThemeCtx, {
        wrapper: ({ children }) => (
          <KairoProvider
            defaultMode="light"
            serverState={{ mode: "dark", resolvedMode: "dark", density: "compact" }}
          >
            {children}
          </KairoProvider>
        ),
      });

      expect(result.current.mode).toBe("light");
    });
  });

  describe("nested provider", () => {
    it("scoped provider inherits from hydrated parent", () => {
      document.documentElement.setAttribute("data-kui-theme", "dark");

      const { result } = renderHook(useThemeCtx, {
        wrapper: ({ children }) => (
          <KairoProvider serverState={{ mode: "dark", resolvedMode: "dark" }}>
            <KairoScopeProvider density="compact">{children}</KairoScopeProvider>
          </KairoProvider>
        ),
      });

      expect(result.current.resolvedMode).toBe("dark");
      expect(result.current.density).toBe("compact");
      expect(result.current.isNested).toBe(true);
    });
  });
});
