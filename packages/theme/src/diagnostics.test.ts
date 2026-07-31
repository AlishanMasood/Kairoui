import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  devWarn,
  devWarnAlways,
  resetDevWarnings,
  warnInvalidThemeDefinition,
  warnUnknownOverrideKey,
  warnControlledUncontrolledSwitch,
  warnMissingProvider,
  warnInvalidPersistedData,
  warnUnsupportedStorage,
  warnInvalidTarget,
  warnDuplicateTarget,
  warnDomApplicationFailed,
  warnInvalidServerState,
  warnDeprecatedApi,
  warnInvalidNestedScope,
} from "./diagnostics";

describe("diagnostics", () => {
  beforeEach(() => {
    resetDevWarnings();
    vi.restoreAllMocks();
  });

  describe("devWarn", () => {
    it("emits a warning in development", () => {
      const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
      devWarn("test-key", "Test message");
      expect(spy).toHaveBeenCalledWith("[KairoUI] Test message");
    });

    it("deduplicates by key", () => {
      const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
      devWarn("dup-key", "First");
      devWarn("dup-key", "Second");
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it("allows different keys", () => {
      const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
      devWarn("key-a", "A");
      devWarn("key-b", "B");
      expect(spy).toHaveBeenCalledTimes(2);
    });
  });

  describe("devWarnAlways", () => {
    it("does not deduplicate", () => {
      const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
      devWarnAlways("Repeated warning");
      devWarnAlways("Repeated warning");
      expect(spy).toHaveBeenCalledTimes(2);
    });
  });

  describe("resetDevWarnings", () => {
    it("allows previously-deduplicated warnings to fire again", () => {
      const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
      devWarn("reset-test", "Message");
      expect(spy).toHaveBeenCalledTimes(1);

      resetDevWarnings();
      devWarn("reset-test", "Message");
      expect(spy).toHaveBeenCalledTimes(2);
    });
  });

  describe("specific diagnostics", () => {
    it("warnInvalidThemeDefinition", () => {
      const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
      warnInvalidThemeDefinition("acme", "missing base");
      expect(spy).toHaveBeenCalledWith(expect.stringContaining("acme"));
      expect(spy).toHaveBeenCalledWith(expect.stringContaining("missing base"));
    });

    it("warnUnknownOverrideKey", () => {
      const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
      warnUnknownOverrideKey("overrides.color.accent");
      expect(spy).toHaveBeenCalledWith(expect.stringContaining("overrides.color.accent"));
    });

    it("warnControlledUncontrolledSwitch", () => {
      const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
      warnControlledUncontrolledSwitch("mode");
      expect(spy).toHaveBeenCalledWith(expect.stringContaining("mode"));
      expect(spy).toHaveBeenCalledWith(expect.stringContaining("controlled"));
    });

    it("warnMissingProvider", () => {
      const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
      warnMissingProvider("useTheme");
      expect(spy).toHaveBeenCalledWith(expect.stringContaining("useTheme()"));
      expect(spy).toHaveBeenCalledWith(expect.stringContaining("KairoProvider"));
    });

    it("warnInvalidPersistedData", () => {
      const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
      warnInvalidPersistedData("kui-theme-preference", "invalid JSON");
      expect(spy).toHaveBeenCalledWith(expect.stringContaining("invalid JSON"));
    });

    it("warnUnsupportedStorage", () => {
      const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
      warnUnsupportedStorage("SecurityError");
      expect(spy).toHaveBeenCalledWith(expect.stringContaining("SecurityError"));
    });

    it("warnInvalidTarget", () => {
      const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
      warnInvalidTarget("received null");
      expect(spy).toHaveBeenCalledWith(expect.stringContaining("received null"));
    });

    it("warnDuplicateTarget", () => {
      const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
      warnDuplicateTarget("kairo-1");
      expect(spy).toHaveBeenCalledWith(expect.stringContaining("kairo-1"));
    });

    it("warnDomApplicationFailed", () => {
      const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
      warnDomApplicationFailed("element not found");
      expect(spy).toHaveBeenCalledWith(expect.stringContaining("element not found"));
    });

    it("warnInvalidServerState", () => {
      const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
      warnInvalidServerState("wrong version");
      expect(spy).toHaveBeenCalledWith(expect.stringContaining("wrong version"));
    });

    it("warnDeprecatedApi", () => {
      const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
      warnDeprecatedApi("oldApi", "newApi");
      expect(spy).toHaveBeenCalledWith(expect.stringContaining("oldApi"));
      expect(spy).toHaveBeenCalledWith(expect.stringContaining("newApi"));
    });

    it("warnInvalidNestedScope", () => {
      const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
      warnInvalidNestedScope("conflicting bases");
      expect(spy).toHaveBeenCalledWith(expect.stringContaining("conflicting bases"));
    });
  });

  describe("production mode", () => {
    it("devWarn is silent when NODE_ENV is production", () => {
      const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const originalEnv = process.env["NODE_ENV"];
      process.env["NODE_ENV"] = "production";

      devWarn("prod-test", "Should not appear");

      expect(spy).not.toHaveBeenCalled();
      process.env["NODE_ENV"] = originalEnv;
    });

    it("devWarnAlways is silent when NODE_ENV is production", () => {
      const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const originalEnv = process.env["NODE_ENV"];
      process.env["NODE_ENV"] = "production";

      devWarnAlways("Should not appear");

      expect(spy).not.toHaveBeenCalled();
      process.env["NODE_ENV"] = originalEnv;
    });
  });

  describe("message format", () => {
    it("all warnings include [KairoUI] prefix", () => {
      const spy = vi.spyOn(console, "warn").mockImplementation(() => {});

      warnInvalidThemeDefinition("test", "detail");
      warnMissingProvider("useTheme");

      for (const call of spy.mock.calls) {
        expect(call[0]).toMatch(/^\[KairoUI\]/);
      }
    });

    it("warnings do not contain full theme objects", () => {
      const spy = vi.spyOn(console, "warn").mockImplementation(() => {});

      warnInvalidThemeDefinition("test", "bad config");

      for (const call of spy.mock.calls) {
        const msg = String(call[0]);
        expect(msg).not.toContain("[object Object]");
      }
    });
  });
});
