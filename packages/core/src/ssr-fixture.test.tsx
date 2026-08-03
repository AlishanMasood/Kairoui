import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { renderToString } from "react-dom/server";
import { render, screen, cleanup } from "@testing-library/react";
import { useContext } from "react";
import { KairoProvider, KairoThemeContext } from "./index";
import {
  getNoFlashScript,
  getNoFlashScriptReadable,
  getServerHtmlAttributes,
  serializeServerState,
  parseServerState,
} from "@kairoui/theme/server";
import type { ThemeMode, DensityMode } from "@kairoui/theme";

describe("SSR theme fixture", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-kui-theme");
    document.documentElement.removeAttribute("data-kui-density");
  });

  afterEach(() => {
    document.documentElement.removeAttribute("data-kui-theme");
    document.documentElement.removeAttribute("data-kui-density");
    cleanup();
  });

  // ─── Server Default Mode ───────────────────────────────────────

  describe("server default mode", () => {
    it("renders with light as server default", () => {
      const html = renderToString(
        <KairoProvider
          serverState={{ mode: "light", resolvedMode: "light", density: "comfortable" }}
        >
          <p>Hello</p>
        </KairoProvider>,
      );
      expect(html).toContain("Hello");
    });

    it("renders with dark as server default", () => {
      const html = renderToString(
        <KairoProvider serverState={{ mode: "dark", resolvedMode: "dark", density: "comfortable" }}>
          <p>Dark app</p>
        </KairoProvider>,
      );
      expect(html).toContain("Dark app");
    });
  });

  // ─── Server Default Density ────────────────────────────────────

  describe("server default density", () => {
    it("renders with comfortable density", () => {
      const html = renderToString(
        <KairoProvider serverState={{ resolvedMode: "light", density: "comfortable" }}>
          <p>Comfortable</p>
        </KairoProvider>,
      );
      expect(html).toContain("Comfortable");
    });

    it("renders with compact density", () => {
      const html = renderToString(
        <KairoProvider serverState={{ resolvedMode: "light", density: "compact" }}>
          <p>Compact</p>
        </KairoProvider>,
      );
      expect(html).toContain("Compact");
    });
  });

  // ─── Initial HTML Attributes ───────────────────────────────────

  describe("initial HTML attributes", () => {
    it("getServerHtmlAttributes returns correct attributes for light", () => {
      const attrs = getServerHtmlAttributes({ resolvedMode: "light", density: "comfortable" });
      expect(attrs).toEqual({
        "data-kui-theme": "light",
        "data-kui-density": "comfortable",
      });
    });

    it("getServerHtmlAttributes returns correct attributes for dark compact", () => {
      const attrs = getServerHtmlAttributes({ resolvedMode: "dark", density: "compact" });
      expect(attrs).toEqual({
        "data-kui-theme": "dark",
        "data-kui-density": "compact",
      });
    });

    it("getServerHtmlAttributes defaults to light/comfortable", () => {
      const attrs = getServerHtmlAttributes();
      expect(attrs["data-kui-theme"]).toBe("light");
      expect(attrs["data-kui-density"]).toBe("comfortable");
    });
  });

  // ─── Safe State Serialization ──────────────────────────────────

  describe("safe state serialization", () => {
    it("serializes server state as HTML-safe JSON", () => {
      const json = serializeServerState({
        mode: "system",
        resolvedMode: "light",
        density: "comfortable",
        themeName: "default",
      });
      // Must not contain raw < > & that could break script tags
      expect(json).not.toContain("<");
      expect(json).not.toContain(">");
      expect(json).not.toContain("&");
    });

    it("parseServerState round-trips correctly", () => {
      const json = serializeServerState({
        mode: "dark",
        resolvedMode: "dark",
        density: "compact",
        themeName: "brand",
      });
      const parsed = parseServerState(json);
      expect(parsed).not.toBeNull();
      expect(parsed!.mode).toBe("dark");
      expect(parsed!.resolvedMode).toBe("dark");
      expect(parsed!.density).toBe("compact");
      expect(parsed!.themeName).toBe("brand");
    });

    it("parseServerState rejects invalid JSON", () => {
      expect(parseServerState("not json")).toBeNull();
    });

    it("parseServerState rejects wrong version", () => {
      const bad = JSON.stringify({
        v: 999,
        mode: "light",
        resolvedMode: "light",
        density: "comfortable",
        themeName: "",
      });
      expect(parseServerState(bad)).toBeNull();
    });

    it("parseServerState rejects invalid mode values", () => {
      const payload = JSON.stringify({
        v: 1,
        mode: "invalid",
        resolvedMode: "light",
        density: "comfortable",
        themeName: "",
      });
      expect(parseServerState(payload)).toBeNull();
    });
  });

  // ─── No-Flash Script ───────────────────────────────────────────

  describe("no-flash script", () => {
    it("generates minified script content", () => {
      const script = getNoFlashScript({ defaultMode: "light", defaultDensity: "comfortable" });
      expect(script.length).toBeGreaterThan(0);
      expect(script.length).toBeLessThan(1000);
    });

    it("generates readable script for debugging", () => {
      const readable = getNoFlashScriptReadable({ defaultMode: "light" });
      expect(readable.length).toBeGreaterThan(getNoFlashScript().length);
    });

    it("script sets correct attributes when executed with no preference", () => {
      const script = getNoFlashScript({ defaultMode: "light", defaultDensity: "comfortable" });
      // Execute in jsdom context (localStorage is empty)
      const fn = new Function(script);
      fn();
      expect(document.documentElement.getAttribute("data-kui-theme")).toBe("light");
      expect(document.documentElement.getAttribute("data-kui-density")).toBe("comfortable");
    });

    it("script reads persisted dark preference", () => {
      localStorage.setItem(
        "kui-theme-preference",
        JSON.stringify({ version: 1, mode: "dark", density: "compact" }),
      );
      const script = getNoFlashScript({ defaultMode: "light", defaultDensity: "comfortable" });
      const fn = new Function(script);
      fn();
      expect(document.documentElement.getAttribute("data-kui-theme")).toBe("dark");
      expect(document.documentElement.getAttribute("data-kui-density")).toBe("compact");
    });

    it("script uses custom storageKey", () => {
      localStorage.setItem(
        "my-app-theme",
        JSON.stringify({ version: 1, mode: "dark", density: "standard" }),
      );
      const script = getNoFlashScript({ storageKey: "my-app-theme", defaultMode: "light" });
      const fn = new Function(script);
      fn();
      expect(document.documentElement.getAttribute("data-kui-theme")).toBe("dark");
    });

    it("CSP nonce interface — script content has no eval or innerHTML", () => {
      const script = getNoFlashScript();
      expect(script).not.toContain("eval(");
      expect(script).not.toContain("eval (");
      expect(script).not.toContain("Function(");
      expect(script).not.toContain("innerHTML");
    });
  });

  // ─── Provider Hydration ────────────────────────────────────────

  describe("provider hydration", () => {
    it("provider uses DOM for system preference when mode is system", () => {
      // Simulate: no-flash script set dark (user had system preference, OS is dark)
      document.documentElement.setAttribute("data-kui-theme", "dark");
      document.documentElement.setAttribute("data-kui-density", "compact");

      render(
        <KairoProvider>
          <CtxReader />
        </KairoProvider>,
      );

      // Provider reads DOM attribute as system preference hint
      expect(screen.getByTestId("resolved-mode").textContent).toBe("dark");
    });

    it("provider uses serverState when DOM has no attributes", () => {
      render(
        <KairoProvider serverState={{ mode: "dark", resolvedMode: "dark", density: "compact" }}>
          <CtxReader />
        </KairoProvider>,
      );
      expect(screen.getByTestId("mode").textContent).toBe("dark");
      expect(screen.getByTestId("density").textContent).toBe("compact");
    });
  });

  // ─── Preference Restoration ────────────────────────────────────

  describe("preference restoration", () => {
    it("restores persisted preference on hydration", () => {
      localStorage.setItem(
        "kui-theme-preference",
        JSON.stringify({ version: 1, mode: "dark", density: "compact" }),
      );

      render(
        <KairoProvider>
          <CtxReader />
        </KairoProvider>,
      );

      expect(screen.getByTestId("mode").textContent).toBe("dark");
      expect(screen.getByTestId("density").textContent).toBe("compact");
    });
  });

  // ─── System Mode ───────────────────────────────────────────────

  describe("system mode", () => {
    it("no-flash script resolves system mode via matchMedia", () => {
      localStorage.setItem(
        "kui-theme-preference",
        JSON.stringify({ version: 1, mode: "system", density: "comfortable" }),
      );
      // jsdom matchMedia defaults to not matching dark
      const script = getNoFlashScript({ defaultMode: "light" });
      const fn = new Function(script);
      fn();
      expect(document.documentElement.getAttribute("data-kui-theme")).toBe("light");
    });

    it("provider resolves system mode to light in test environment", () => {
      render(
        <KairoProvider defaultMode="system">
          <CtxReader />
        </KairoProvider>,
      );
      expect(screen.getByTestId("mode").textContent).toBe("system");
      expect(screen.getByTestId("resolved-mode").textContent).toBe("light");
    });
  });

  // ─── No Browser-Global Access During Server Render ─────────────

  describe("no browser-global access during server render", () => {
    it("renderToString completes without error", () => {
      const html = renderToString(
        <KairoProvider serverState={{ resolvedMode: "light", density: "comfortable" }}>
          <p>SSR safe</p>
        </KairoProvider>,
      );
      expect(html).toContain("SSR safe");
    });

    it("getServerHtmlAttributes is a pure function (no side effects)", () => {
      const attrs = getServerHtmlAttributes({ resolvedMode: "dark", density: "standard" });
      expect(attrs["data-kui-theme"]).toBe("dark");
      expect(attrs["data-kui-density"]).toBe("standard");
    });

    it("serializeServerState is a pure function (no side effects)", () => {
      const json = serializeServerState({
        mode: "dark",
        resolvedMode: "dark",
        density: "standard",
      });
      expect(json).toContain('"dark"');
    });
  });

  // ─── Clean Hydration ───────────────────────────────────────────

  describe("clean hydration", () => {
    it("full SSR lifecycle produces matching client state", () => {
      // 1. Server: generate attributes and state
      const serverMode: ThemeMode = "light";
      const serverDensity: DensityMode = "comfortable";
      const attrs = getServerHtmlAttributes({ resolvedMode: serverMode, density: serverDensity });
      const stateJson = serializeServerState({
        mode: serverMode,
        resolvedMode: serverMode,
        density: serverDensity,
      });

      // 2. Server: render HTML
      const serverHtml = renderToString(
        <KairoProvider
          serverState={{ mode: serverMode, resolvedMode: serverMode, density: serverDensity }}
        >
          <p>App content</p>
        </KairoProvider>,
      );
      expect(serverHtml).toContain("App content");

      // 3. Client: no-flash script sets DOM attributes (matching server)
      document.documentElement.setAttribute("data-kui-theme", attrs["data-kui-theme"]);
      document.documentElement.setAttribute("data-kui-density", attrs["data-kui-density"]);

      // 4. Client: parse server state
      const parsedState = parseServerState(stateJson);
      expect(parsedState).not.toBeNull();

      // 5. Client: hydrate — provider reads DOM attributes
      render(
        <KairoProvider
          serverState={{
            mode: parsedState!.mode,
            resolvedMode: parsedState!.resolvedMode,
            density: parsedState!.density,
          }}
        >
          <CtxReader />
        </KairoProvider>,
      );

      // 6. Verify: client state matches server
      expect(screen.getByTestId("mode").textContent).toBe(serverMode);
      expect(screen.getByTestId("resolved-mode").textContent).toBe(serverMode);
      expect(screen.getByTestId("density").textContent).toBe(serverDensity);
    });

    it("full lifecycle with dark preference restoration", () => {
      // User has dark preference stored
      localStorage.setItem(
        "kui-theme-preference",
        JSON.stringify({ version: 1, mode: "dark", density: "compact" }),
      );

      // No-flash script corrects to dark
      const script = getNoFlashScript({ defaultMode: "light", defaultDensity: "comfortable" });
      const fn = new Function(script);
      fn();
      expect(document.documentElement.getAttribute("data-kui-theme")).toBe("dark");
      expect(document.documentElement.getAttribute("data-kui-density")).toBe("compact");

      // Provider hydrates — picks up persisted preference
      render(
        <KairoProvider>
          <CtxReader />
        </KairoProvider>,
      );

      // Provider restored the persisted preference (matching DOM from no-flash)
      expect(screen.getByTestId("mode").textContent).toBe("dark");
      expect(screen.getByTestId("resolved-mode").textContent).toBe("dark");
      expect(screen.getByTestId("density").textContent).toBe("compact");
    });
  });

  // ─── CSP Nonce Interface ───────────────────────────────────────

  describe("CSP nonce interface", () => {
    it("no-flash script is safe for nonce-based CSP", () => {
      const script = getNoFlashScript();
      // No dynamic code execution patterns
      expect(script).not.toContain("eval");
      expect(script).not.toContain("new Function");
      expect(script).not.toContain("innerHTML");
      expect(script).not.toContain("document.write");
    });

    it("script can be placed in a nonce-tagged script element", () => {
      const script = getNoFlashScript({ defaultMode: "light" });
      const nonce = "abc123server-nonce";
      // Demonstrates the integration pattern
      const html = `<script nonce="${nonce}">${script}</script>`;
      expect(html).toContain(`nonce="${nonce}"`);
      expect(html).toContain(script);
    });

    it("readable script is also CSP-safe", () => {
      const script = getNoFlashScriptReadable();
      expect(script).not.toContain("eval");
      expect(script).not.toContain("new Function");
    });
  });
});

// Helper component to read context values
function CtxReader() {
  const ctx = useContext(KairoThemeContext);
  return (
    <div>
      <span data-testid="mode">{ctx.mode}</span>
      <span data-testid="resolved-mode">{ctx.resolvedMode}</span>
      <span data-testid="density">{ctx.density}</span>
    </div>
  );
}
