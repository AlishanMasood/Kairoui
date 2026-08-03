import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { KairoProvider } from "./kairo-provider";
import { useTheme } from "./use-theme";
import { useThemeMode } from "./use-theme-mode";
import { useDensity } from "./use-density";
import {
  getNoFlashScript,
  getServerHtmlAttributes,
  serializeServerState,
  parseServerState,
} from "@kairoui/theme/server";

// Simulate what a Next.js root layout would do on the server
function simulateServerRender() {
  const attrs = getServerHtmlAttributes({ resolvedMode: "light", density: "comfortable" });
  const noFlashScript = getNoFlashScript();
  const serverState = serializeServerState({
    mode: "system",
    resolvedMode: "light",
    density: "comfortable",
  });
  return { attrs, noFlashScript, serverState };
}

// Client-side wrapper (like app/theme-provider.tsx "use client")
function ThemeProviderWrapper({
  children,
  serverResolvedMode = "light",
  serverDensity = "comfortable",
}: {
  children: ReactNode;
  serverResolvedMode?: "light" | "dark";
  serverDensity?: "comfortable" | "standard" | "compact";
}) {
  return (
    <KairoProvider serverState={{ resolvedMode: serverResolvedMode, density: serverDensity }}>
      {children}
    </KairoProvider>
  );
}

const ScriptRunner = Function;

describe("Next.js integration pattern", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-kui-theme");
    document.documentElement.removeAttribute("data-kui-density");
  });

  afterEach(() => {
    document.documentElement.removeAttribute("data-kui-theme");
    document.documentElement.removeAttribute("data-kui-density");
  });

  describe("server render utilities", () => {
    it("getServerHtmlAttributes returns valid attributes", () => {
      const { attrs } = simulateServerRender();
      expect(attrs["data-kui-theme"]).toBe("light");
      expect(attrs["data-kui-density"]).toBe("comfortable");
    });

    it("getNoFlashScript returns a non-empty script", () => {
      const { noFlashScript } = simulateServerRender();
      expect(noFlashScript.length).toBeGreaterThan(100);
    });

    it("serializeServerState round-trips via parseServerState", () => {
      const { serverState } = simulateServerRender();
      const parsed = parseServerState(serverState);
      expect(parsed).not.toBeNull();
      expect(parsed?.mode).toBe("system");
      expect(parsed?.resolvedMode).toBe("light");
    });
  });

  describe("hydration flow", () => {
    it("provider matches server-rendered light theme", () => {
      document.documentElement.setAttribute("data-kui-theme", "light");
      document.documentElement.setAttribute("data-kui-density", "comfortable");

      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }) => <ThemeProviderWrapper>{children}</ThemeProviderWrapper>,
      });

      expect(result.current.resolvedMode).toBe("light");
      expect(result.current.density).toBe("comfortable");
    });

    it("provider matches server-rendered dark theme", () => {
      document.documentElement.setAttribute("data-kui-theme", "dark");

      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }) => (
          <ThemeProviderWrapper serverResolvedMode="dark">{children}</ThemeProviderWrapper>
        ),
      });

      expect(result.current.resolvedMode).toBe("dark");
    });
  });

  describe("no-flash script → provider handoff", () => {
    it("provider reads attributes set by no-flash script", () => {
      // Simulate: user has dark preference stored
      localStorage.setItem(
        "kui-theme-preference",
        JSON.stringify({ version: 1, mode: "dark", density: "compact" }),
      );

      // Simulate: no-flash script runs before React
      const script = getNoFlashScript();

      new ScriptRunner(script)();

      expect(document.documentElement.getAttribute("data-kui-theme")).toBe("dark");
      expect(document.documentElement.getAttribute("data-kui-density")).toBe("compact");

      // Simulate: React hydrates with provider
      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }) => <ThemeProviderWrapper>{children}</ThemeProviderWrapper>,
      });

      // Provider should match the no-flash script's result
      expect(result.current.resolvedMode).toBe("dark");
      expect(result.current.mode).toBe("dark");
      expect(result.current.density).toBe("compact");
    });
  });

  describe("hooks work after hydration", () => {
    it("useThemeMode provides toggle", () => {
      const { result } = renderHook(() => useThemeMode(), {
        wrapper: ({ children }) => <ThemeProviderWrapper>{children}</ThemeProviderWrapper>,
      });
      expect(typeof result.current.toggleMode).toBe("function");
    });

    it("useDensity provides setter", () => {
      const { result } = renderHook(() => useDensity(), {
        wrapper: ({ children }) => <ThemeProviderWrapper>{children}</ThemeProviderWrapper>,
      });
      expect(typeof result.current.setDensity).toBe("function");
    });
  });
});
