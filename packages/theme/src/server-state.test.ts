import { describe, it, expect } from "vitest";
import { serializeServerState, parseServerState, getServerHtmlAttributes } from "./server-state";
import { PREFERENCE_VERSION } from "./preference";

describe("serializeServerState", () => {
  describe("normal state", () => {
    it("serializes default state", () => {
      const json = serializeServerState();
      const parsed = JSON.parse(json) as Record<string, unknown>;
      expect(parsed["v"]).toBe(PREFERENCE_VERSION);
      expect(parsed["mode"]).toBe("system");
      expect(parsed["resolvedMode"]).toBe("light");
      expect(parsed["density"]).toBe("comfortable");
      expect(parsed["themeName"]).toBe("");
    });

    it("serializes configured state", () => {
      const json = serializeServerState({
        mode: "dark",
        resolvedMode: "dark",
        density: "compact",
        themeName: "acme",
      });
      const parsed = JSON.parse(json) as Record<string, unknown>;
      expect(parsed["mode"]).toBe("dark");
      expect(parsed["resolvedMode"]).toBe("dark");
      expect(parsed["density"]).toBe("compact");
      expect(parsed["themeName"]).toBe("acme");
    });

    it("serializes system mode with light resolution", () => {
      const json = serializeServerState({
        mode: "system",
        resolvedMode: "light",
      });
      const parsed = JSON.parse(json) as Record<string, unknown>;
      expect(parsed["mode"]).toBe("system");
      expect(parsed["resolvedMode"]).toBe("light");
    });
  });

  describe("special characters", () => {
    it("escapes < and > for HTML safety", () => {
      const json = serializeServerState({ themeName: "<script>alert(1)</script>" });
      expect(json).not.toContain("<");
      expect(json).not.toContain(">");
      expect(json).toContain("\\u003c");
      expect(json).toContain("\\u003e");
    });

    it("escapes & for HTML safety", () => {
      const json = serializeServerState({ themeName: "a&b" });
      expect(json).not.toContain("&");
      expect(json).toContain("\\u0026");
    });

    it("round-trips special characters", () => {
      const json = serializeServerState({ themeName: '<script>alert("xss")</script>' });
      const parsed = parseServerState(json);
      expect(parsed?.themeName).toBe('<script>alert("xss")</script>');
    });
  });

  describe("invalid input", () => {
    it("falls back for invalid mode", () => {
      const json = serializeServerState({ mode: "invalid" as "light" });
      const parsed = JSON.parse(json) as Record<string, unknown>;
      expect(parsed["mode"]).toBe("system");
    });

    it("falls back for invalid density", () => {
      const json = serializeServerState({ density: "huge" as "compact" });
      const parsed = JSON.parse(json) as Record<string, unknown>;
      expect(parsed["density"]).toBe("comfortable");
    });

    it("falls back for invalid resolvedMode", () => {
      const json = serializeServerState({ resolvedMode: "system" as "light" });
      const parsed = JSON.parse(json) as Record<string, unknown>;
      expect(parsed["resolvedMode"]).toBe("light");
    });
  });

  describe("missing optional fields", () => {
    it("uses defaults for all missing fields", () => {
      const json = serializeServerState({});
      const parsed = JSON.parse(json) as Record<string, unknown>;
      expect(parsed["mode"]).toBe("system");
      expect(parsed["resolvedMode"]).toBe("light");
      expect(parsed["density"]).toBe("comfortable");
      expect(parsed["themeName"]).toBe("");
    });
  });
});

describe("parseServerState", () => {
  describe("round trip", () => {
    it("parses serialized state", () => {
      const json = serializeServerState({
        mode: "dark",
        resolvedMode: "dark",
        density: "compact",
        themeName: "brand",
      });
      const parsed = parseServerState(json);
      expect(parsed).not.toBeNull();
      expect(parsed?.mode).toBe("dark");
      expect(parsed?.resolvedMode).toBe("dark");
      expect(parsed?.density).toBe("compact");
      expect(parsed?.themeName).toBe("brand");
    });
  });

  describe("invalid input", () => {
    it("returns null for invalid JSON", () => {
      expect(parseServerState("not-json")).toBeNull();
    });

    it("returns null for non-object", () => {
      expect(parseServerState('"string"')).toBeNull();
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
            mode: "bad",
            resolvedMode: "dark",
            density: "compact",
            themeName: "",
          }),
        ),
      ).toBeNull();
    });

    it("returns null for invalid resolvedMode", () => {
      expect(
        parseServerState(
          JSON.stringify({
            v: 1,
            mode: "dark",
            resolvedMode: "system",
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

    it("returns null for non-string themeName", () => {
      expect(
        parseServerState(
          JSON.stringify({
            v: 1,
            mode: "dark",
            resolvedMode: "dark",
            density: "compact",
            themeName: 42,
          }),
        ),
      ).toBeNull();
    });
  });

  describe("script-injection attempts", () => {
    it("parses theme name with script tags safely", () => {
      const json = serializeServerState({ themeName: "<script>alert(1)</script>" });
      const parsed = parseServerState(json);
      expect(parsed?.themeName).toBe("<script>alert(1)</script>");
    });

    it("rejects prototype pollution via __proto__", () => {
      const malicious =
        '{"v":1,"mode":"dark","resolvedMode":"dark","density":"compact","themeName":"","__proto__":{"admin":true}}';
      expect(parseServerState(malicious)).toBeNull();
    });

    it("rejects prototype pollution via constructor", () => {
      const malicious =
        '{"v":1,"mode":"dark","resolvedMode":"dark","density":"compact","themeName":"","constructor":{"prototype":{"admin":true}}}';
      expect(parseServerState(malicious)).toBeNull();
    });
  });

  describe("version mismatch", () => {
    it("rejects version 0", () => {
      expect(
        parseServerState(
          JSON.stringify({
            v: 0,
            mode: "dark",
            resolvedMode: "dark",
            density: "compact",
            themeName: "",
          }),
        ),
      ).toBeNull();
    });

    it("rejects version 2", () => {
      expect(
        parseServerState(
          JSON.stringify({
            v: 2,
            mode: "dark",
            resolvedMode: "dark",
            density: "compact",
            themeName: "",
          }),
        ),
      ).toBeNull();
    });

    it("rejects missing version", () => {
      expect(
        parseServerState(
          JSON.stringify({ mode: "dark", resolvedMode: "dark", density: "compact", themeName: "" }),
        ),
      ).toBeNull();
    });
  });
});

describe("getServerHtmlAttributes", () => {
  it("returns default attributes", () => {
    const attrs = getServerHtmlAttributes();
    expect(attrs["data-kui-theme"]).toBe("light");
    expect(attrs["data-kui-density"]).toBe("comfortable");
  });

  it("returns configured attributes", () => {
    const attrs = getServerHtmlAttributes({
      resolvedMode: "dark",
      density: "compact",
    });
    expect(attrs["data-kui-theme"]).toBe("dark");
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
