import { describe, it, expect } from "vitest";
import {
  THEME_ATTRIBUTE,
  DENSITY_ATTRIBUTE,
  THEME_DATASET_KEY,
  DENSITY_DATASET_KEY,
  themeSelector,
  densitySelector,
  ROOT_THEME_SELECTOR,
  DARK_THEME_SELECTOR,
  VALID_THEME_VALUES,
  VALID_DENSITY_VALUES,
} from "./selectors";

describe("selector constants", () => {
  it("THEME_ATTRIBUTE is data-kui-theme", () => {
    expect(THEME_ATTRIBUTE).toBe("data-kui-theme");
  });

  it("DENSITY_ATTRIBUTE is data-kui-density", () => {
    expect(DENSITY_ATTRIBUTE).toBe("data-kui-density");
  });

  it("THEME_DATASET_KEY matches attribute name", () => {
    expect(THEME_DATASET_KEY).toBe("kuiTheme");
  });

  it("DENSITY_DATASET_KEY matches attribute name", () => {
    expect(DENSITY_DATASET_KEY).toBe("kuiDensity");
  });

  it("ROOT_THEME_SELECTOR is :root", () => {
    expect(ROOT_THEME_SELECTOR).toBe(":root");
  });

  it("DARK_THEME_SELECTOR uses the correct attribute", () => {
    expect(DARK_THEME_SELECTOR).toBe('[data-kui-theme="dark"]');
  });
});

describe("themeSelector", () => {
  it("generates light selector", () => {
    expect(themeSelector("light")).toBe('[data-kui-theme="light"]');
  });

  it("generates dark selector", () => {
    expect(themeSelector("dark")).toBe('[data-kui-theme="dark"]');
  });
});

describe("densitySelector", () => {
  it("generates comfortable selector", () => {
    expect(densitySelector("comfortable")).toBe('[data-kui-density="comfortable"]');
  });

  it("generates standard selector", () => {
    expect(densitySelector("standard")).toBe('[data-kui-density="standard"]');
  });

  it("generates compact selector", () => {
    expect(densitySelector("compact")).toBe('[data-kui-density="compact"]');
  });
});

describe("valid values", () => {
  it("VALID_THEME_VALUES contains light and dark only", () => {
    expect(VALID_THEME_VALUES).toEqual(["light", "dark"]);
    expect(VALID_THEME_VALUES).not.toContain("system");
  });

  it("VALID_DENSITY_VALUES contains all three densities", () => {
    expect(VALID_DENSITY_VALUES).toEqual(["comfortable", "standard", "compact"]);
  });
});

describe("selector consistency with generated CSS", () => {
  it("theme selectors match the format used in tokens CSS output", () => {
    // The tokens package generates: [data-kui-theme="dark"] { ... }
    // This must match our selector helpers exactly.
    expect(themeSelector("dark")).toMatch(/^\[data-kui-theme="dark"\]$/);
  });

  it("density selectors match the format used in tokens CSS output", () => {
    // The tokens package generates: [data-kui-density="compact"] { ... }
    expect(densitySelector("compact")).toMatch(/^\[data-kui-density="compact"\]$/);
  });
});
