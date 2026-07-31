import { describe, it, expect } from "vitest";
import {
  getNoFlashScript,
  getNoFlashScriptReadable,
  serializeServerState,
  parseServerState,
  getServerHtmlAttributes,
} from "./server";
import { PREFERENCE_VERSION } from "./preference";

describe("SSR utilities — comprehensive", () => {
  // ─── Server Render With No Browser Globals ─────────────────────

  describe("no browser globals at import", () => {
    it("server module loads without accessing window", async () => {
      const mod = await import("./server");
      expect(mod.getNoFlashScript).toBeDefined();
      expect(mod.serializeServerState).toBeDefined();
      expect(mod.getServerHtmlAttributes).toBeDefined();
    });
  });

  // ─── Default Server State ──────────────────────────────────────

  describe("default server state", () => {
    it("serializes default state", () => {
      const json = serializeServerState();
      const parsed = parseServerState(json);
      expect(parsed?.mode).toBe("system");
      expect(parsed?.resolvedMode).toBe("light");
      expect(parsed?.density).toBe("comfortable");
      expect(parsed?.themeName).toBe("");
    });

    it("getServerHtmlAttributes returns defaults", () => {
      const attrs = getServerHtmlAttributes();
      expect(attrs["data-kui-theme"]).toBe("light");
      expect(attrs["data-kui-density"]).toBe("comfortable");
    });
  });

  // ─── Serialized Initial State ──────────────────────────────────

  describe("serialized initial state", () => {
    it("serializes dark mode", () => {
      const json = serializeServerState({ mode: "dark", resolvedMode: "dark", density: "compact" });
      const parsed = parseServerState(json);
      expect(parsed?.mode).toBe("dark");
      expect(parsed?.resolvedMode).toBe("dark");
      expect(parsed?.density).toBe("compact");
    });

    it("serializes system mode with light resolution", () => {
      const json = serializeServerState({ mode: "system", resolvedMode: "light" });
      const parsed = parseServerState(json);
      expect(parsed?.mode).toBe("system");
      expect(parsed?.resolvedMode).toBe("light");
    });

    it("includes version", () => {
      const json = serializeServerState();
      const parsed = parseServerState(json);
      expect(parsed?.v).toBe(PREFERENCE_VERSION);
    });
  });

  // ─── Safe Parsing ──────────────────────────────────────────────

  describe("safe parsing", () => {
    it("returns null for invalid JSON", () => {
      expect(parseServerState("not-json")).toBeNull();
    });

    it("returns null for non-object", () => {
      expect(parseServerState('"string"')).toBeNull();
      expect(parseServerState("42")).toBeNull();
    });

    it("returns null for wrong version", () => {
      expect(
        parseServerState(
          JSON.stringify({
            v: 99,
            mode: "dark",
            resolvedMode: "dark",
            density: "compact",
            themeName: "",
          }),
        ),
      ).toBeNull();
    });

    it("returns null for invalid mode", () => {
      expect(
        parseServerState(
          JSON.stringify({
            v: 1,
            mode: "auto",
            resolvedMode: "dark",
            density: "compact",
            themeName: "",
          }),
        ),
      ).toBeNull();
    });

    it("returns null for invalid density", () => {
      expect(
        parseServerState(
          JSON.stringify({
            v: 1,
            mode: "dark",
            resolvedMode: "dark",
            density: "huge",
            themeName: "",
          }),
        ),
      ).toBeNull();
    });

    it("rejects __proto__ key", () => {
      const malicious =
        '{"v":1,"mode":"dark","resolvedMode":"dark","density":"compact","themeName":"","__proto__":{"admin":true}}';
      expect(parseServerState(malicious)).toBeNull();
    });

    it("rejects constructor key", () => {
      const malicious =
        '{"v":1,"mode":"dark","resolvedMode":"dark","density":"compact","themeName":"","constructor":{}}';
      expect(parseServerState(malicious)).toBeNull();
    });
  });

  // ─── No-Flash Script Generation ────────────────────────────────

  describe("no-flash script", () => {
    it("generates a non-empty script", () => {
      const script = getNoFlashScript();
      expect(script.length).toBeGreaterThan(100);
    });

    it("is a self-executing function", () => {
      expect(getNoFlashScript()).toMatch(/^\(function\(\)/);
    });

    it("contains no eval", () => {
      expect(getNoFlashScript()).not.toContain("eval");
    });

    it("contains no fetch/network calls", () => {
      const s = getNoFlashScript();
      expect(s).not.toContain("fetch");
      expect(s).not.toContain("XMLHttpRequest");
    });

    it("contains no import/require", () => {
      const s = getNoFlashScript();
      expect(s).not.toContain("import");
      expect(s).not.toContain("require");
    });

    it("supports custom storage key", () => {
      const s = getNoFlashScript({ storageKey: "my-key" });
      expect(s).toContain("my-key");
    });

    it("supports custom default mode", () => {
      const s = getNoFlashScript({ defaultMode: "dark" });
      expect(s).toContain('"dark"');
    });

    it("supports custom default density", () => {
      const s = getNoFlashScript({ defaultDensity: "standard" });
      expect(s).toContain('"standard"');
    });

    it("readable version is equivalent", () => {
      const minified = getNoFlashScript();
      const readable = getNoFlashScriptReadable();
      // Both should contain the key logic
      expect(readable).toContain("localStorage");
      expect(readable).toContain("matchMedia");
      expect(readable.length).toBeGreaterThan(minified.length);
    });

    it("is reasonably small", () => {
      expect(getNoFlashScript().length).toBeLessThan(800);
    });
  });

  // ─── HTML Escaping ─────────────────────────────────────────────

  describe("serialization escaping", () => {
    it("escapes < for HTML safety", () => {
      const json = serializeServerState({ themeName: "<script>alert(1)</script>" });
      expect(json).not.toContain("<");
    });

    it("escapes > for HTML safety", () => {
      const json = serializeServerState({ themeName: "<b>" });
      expect(json).not.toContain(">");
    });

    it("round-trips special characters", () => {
      const json = serializeServerState({ themeName: '<script>alert("xss")</script>' });
      const parsed = parseServerState(json);
      expect(parsed?.themeName).toBe('<script>alert("xss")</script>');
    });
  });

  // ─── CSP Nonce Integration ─────────────────────────────────────

  describe("CSP nonce integration surface", () => {
    it("script is a plain string suitable for dangerouslySetInnerHTML", () => {
      const script = getNoFlashScript();
      // Should be a complete JS expression, not an HTML tag
      expect(script).not.toContain("<script");
      expect(script).not.toContain("</script");
      // Consumers inject it via: <script nonce={nonce} dangerouslySetInnerHTML={{ __html: script }} />
    });
  });

  // ─── Server Attributes ─────────────────────────────────────────

  describe("server HTML attributes", () => {
    it("dark resolved mode", () => {
      const attrs = getServerHtmlAttributes({ resolvedMode: "dark" });
      expect(attrs["data-kui-theme"]).toBe("dark");
    });

    it("compact density", () => {
      const attrs = getServerHtmlAttributes({ density: "compact" });
      expect(attrs["data-kui-density"]).toBe("compact");
    });

    it("falls back for invalid values", () => {
      const attrs = getServerHtmlAttributes({
        resolvedMode: "system" as "light",
        density: "huge" as "compact",
      });
      expect(attrs["data-kui-theme"]).toBe("light");
      expect(attrs["data-kui-density"]).toBe("comfortable");
    });
  });
});
