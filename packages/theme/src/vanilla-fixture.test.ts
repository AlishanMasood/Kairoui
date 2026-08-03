import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const FIXTURE_PATH = join(import.meta.dirname, "../../../fixtures/vanilla-theme.html");

describe("vanilla-theme fixture", () => {
  const html = readFileSync(FIXTURE_PATH, "utf-8");

  it("exists and is valid HTML", () => {
    expect(html).toContain("<!doctype html>");
    expect(html).toContain("</html>");
  });

  it("imports from dist/dom.js not source", () => {
    expect(html).toContain("../packages/theme/dist/dom.js");
    expect(html).not.toContain("from './src/");
    expect(html).not.toContain('from "../src/');
  });

  it("uses token CSS from dist", () => {
    expect(html).toContain("../packages/tokens/dist/tokens.css");
    expect(html).toContain("../packages/tokens/dist/density/comfortable.css");
    expect(html).toContain("../packages/tokens/dist/density/standard.css");
    expect(html).toContain("../packages/tokens/dist/density/compact.css");
  });

  it("imports only exported DOM functions", () => {
    expect(html).toContain("applyTheme");
    expect(html).toContain("removeTheme");
    expect(html).toContain("applyScopedTheme");
    expect(html).toContain("removeScopedTheme");
    expect(html).toContain("getSystemColorScheme");
    expect(html).toContain("subscribeToColorScheme");
  });

  it("does not import React", () => {
    expect(html).not.toContain("from 'react'");
    expect(html).not.toContain('from "react"');
    expect(html).not.toContain("@kairoui/core");
  });

  it("demonstrates all required features", () => {
    expect(html).toContain("btn-light");
    expect(html).toContain("btn-dark");
    expect(html).toContain("btn-system");
    expect(html).toContain("btn-comfortable");
    expect(html).toContain("btn-standard");
    expect(html).toContain("btn-compact");
    expect(html).toContain("scoped-dark");
    expect(html).toContain("scoped-compact");
    expect(html).toContain("btn-cleanup");
    expect(html).toContain("btn-reapply");
    expect(html).toContain("localStorage");
    expect(html).toContain("subscribeToColorScheme");
  });

  it("uses focus-visible for keyboard accessibility", () => {
    expect(html).toContain("focus-visible");
  });

  it("sets initial HTML attributes for valid starting state", () => {
    expect(html).toContain('data-kui-theme="light"');
    expect(html).toContain('data-kui-density="comfortable"');
  });
});
