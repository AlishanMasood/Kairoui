import { describe, it, expect } from "vitest";
import {
  validateMode,
  validateDensity,
  validateResolvedMode,
  isValidPreference,
  parsePreference,
  parseVersionedPreference,
  toVersionedPreference,
  coercePreference,
  DEFAULT_PREFERENCE,
  PREFERENCE_VERSION,
} from "./preference";

describe("validateMode", () => {
  it("accepts light", () => {
    expect(validateMode("light")).toBe("light");
  });
  it("accepts dark", () => {
    expect(validateMode("dark")).toBe("dark");
  });
  it("accepts system", () => {
    expect(validateMode("system")).toBe("system");
  });
  it("rejects empty string", () => {
    expect(validateMode("")).toBeNull();
  });
  it("rejects number", () => {
    expect(validateMode(42)).toBeNull();
  });
  it("rejects null", () => {
    expect(validateMode(null)).toBeNull();
  });
  it("rejects undefined", () => {
    expect(validateMode(undefined)).toBeNull();
  });
  it("rejects arbitrary string", () => {
    expect(validateMode("auto")).toBeNull();
  });
});

describe("validateDensity", () => {
  it("accepts comfortable", () => {
    expect(validateDensity("comfortable")).toBe("comfortable");
  });
  it("accepts standard", () => {
    expect(validateDensity("standard")).toBe("standard");
  });
  it("accepts compact", () => {
    expect(validateDensity("compact")).toBe("compact");
  });
  it("rejects empty string", () => {
    expect(validateDensity("")).toBeNull();
  });
  it("rejects number", () => {
    expect(validateDensity(1)).toBeNull();
  });
  it("rejects arbitrary string", () => {
    expect(validateDensity("dense")).toBeNull();
  });
});

describe("validateResolvedMode", () => {
  it("accepts light", () => {
    expect(validateResolvedMode("light")).toBe("light");
  });
  it("accepts dark", () => {
    expect(validateResolvedMode("dark")).toBe("dark");
  });
  it("rejects system", () => {
    expect(validateResolvedMode("system")).toBeNull();
  });
  it("rejects arbitrary", () => {
    expect(validateResolvedMode("auto")).toBeNull();
  });
});

describe("isValidPreference", () => {
  it("validates correct preference", () => {
    expect(isValidPreference({ mode: "light", density: "comfortable" })).toBe(true);
  });

  it("validates all mode/density combinations", () => {
    expect(isValidPreference({ mode: "dark", density: "compact" })).toBe(true);
    expect(isValidPreference({ mode: "system", density: "standard" })).toBe(true);
  });

  it("rejects null", () => {
    expect(isValidPreference(null)).toBe(false);
  });
  it("rejects string", () => {
    expect(isValidPreference("light")).toBe(false);
  });
  it("rejects empty object", () => {
    expect(isValidPreference({})).toBe(false);
  });
  it("rejects missing mode", () => {
    expect(isValidPreference({ density: "comfortable" })).toBe(false);
  });
  it("rejects missing density", () => {
    expect(isValidPreference({ mode: "light" })).toBe(false);
  });
  it("rejects invalid mode", () => {
    expect(isValidPreference({ mode: "auto", density: "comfortable" })).toBe(false);
  });
  it("rejects invalid density", () => {
    expect(isValidPreference({ mode: "light", density: "tiny" })).toBe(false);
  });
});

describe("parsePreference", () => {
  it("parses valid preference", () => {
    const result = parsePreference({ mode: "dark", density: "compact" });
    expect(result).toEqual({ mode: "dark", density: "compact" });
  });

  it("returns null for invalid input", () => {
    expect(parsePreference(null)).toBeNull();
    expect(parsePreference({ mode: "invalid" })).toBeNull();
  });

  it("strips extra properties", () => {
    const result = parsePreference({ mode: "light", density: "comfortable", extra: "ignored" });
    expect(result).toEqual({ mode: "light", density: "comfortable" });
  });
});

describe("parseVersionedPreference", () => {
  it("parses versioned preference", () => {
    const result = parseVersionedPreference({
      version: PREFERENCE_VERSION,
      mode: "dark",
      density: "standard",
    });
    expect(result).toEqual({ mode: "dark", density: "standard" });
  });

  it("rejects wrong version", () => {
    expect(
      parseVersionedPreference({ version: 999, mode: "dark", density: "standard" }),
    ).toBeNull();
  });

  it("rejects missing version", () => {
    expect(parseVersionedPreference({ mode: "dark", density: "standard" })).toBeNull();
  });

  it("rejects invalid mode in versioned", () => {
    expect(parseVersionedPreference({ version: 1, mode: "auto", density: "standard" })).toBeNull();
  });
});

describe("toVersionedPreference", () => {
  it("creates versioned preference", () => {
    const result = toVersionedPreference({ mode: "system", density: "comfortable" });
    expect(result.version).toBe(PREFERENCE_VERSION);
    expect(result.mode).toBe("system");
    expect(result.density).toBe("comfortable");
    expect(result.themeName).toBeUndefined();
  });

  it("includes theme name when provided", () => {
    const result = toVersionedPreference({ mode: "light", density: "compact" }, "acme");
    expect(result.themeName).toBe("acme");
  });
});

describe("coercePreference", () => {
  it("returns valid preference unchanged", () => {
    const result = coercePreference({ mode: "dark", density: "compact" });
    expect(result).toEqual({ mode: "dark", density: "compact" });
  });

  it("falls back to defaults for null", () => {
    expect(coercePreference(null)).toEqual(DEFAULT_PREFERENCE);
  });

  it("falls back to defaults for undefined", () => {
    expect(coercePreference(undefined)).toEqual(DEFAULT_PREFERENCE);
  });

  it("uses default mode for invalid mode", () => {
    const result = coercePreference({ mode: "bogus", density: "compact" });
    expect(result.mode).toBe("system");
    expect(result.density).toBe("compact");
  });

  it("uses default density for invalid density", () => {
    const result = coercePreference({ mode: "dark", density: "huge" });
    expect(result.mode).toBe("dark");
    expect(result.density).toBe("comfortable");
  });

  it("uses both defaults for empty object", () => {
    expect(coercePreference({})).toEqual(DEFAULT_PREFERENCE);
  });
});

describe("DEFAULT_PREFERENCE", () => {
  it("is system mode + comfortable density", () => {
    expect(DEFAULT_PREFERENCE.mode).toBe("system");
    expect(DEFAULT_PREFERENCE.density).toBe("comfortable");
  });

  it("is frozen", () => {
    expect(Object.isFrozen(DEFAULT_PREFERENCE)).toBe(true);
  });
});

describe("PREFERENCE_VERSION", () => {
  it("is 1", () => {
    expect(PREFERENCE_VERSION).toBe(1);
  });
});
