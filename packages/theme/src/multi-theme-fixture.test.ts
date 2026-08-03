import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const FIXTURE_PATH = join(import.meta.dirname, "../../../fixtures/multi-theme.html");

describe("multi-theme fixture", () => {
  const html = readFileSync(FIXTURE_PATH, "utf-8");

  it("exists and is valid HTML", () => {
    expect(html).toContain("<!doctype html>");
    expect(html).toContain("</html>");
  });

  it("imports from dist files not source", () => {
    expect(html).toContain("../packages/theme/dist/dom.js");
    expect(html).toContain("../packages/theme/dist/index.js");
    expect(html).not.toContain("from './src/");
    expect(html).not.toContain('from "../src/');
  });

  it("uses token CSS from dist", () => {
    expect(html).toContain("../packages/tokens/dist/tokens.css");
  });

  it("does not import React", () => {
    expect(html).not.toContain("from 'react'");
    expect(html).not.toContain('from "react"');
    expect(html).not.toContain("@kairoui/core");
  });

  it("demonstrates createTheme for default and org themes", () => {
    expect(html).toContain("createTheme");
    expect(html).toContain('"kairo-default"');
    expect(html).toContain('"acme-org"');
  });

  it("demonstrates composeThemes for product and app layers", () => {
    expect(html).toContain("composeThemes");
    expect(html).toContain('"acme-dashboard"');
    expect(html).toContain('"acme-dashboard-v2"');
  });

  it("demonstrates inspectTheme for theme inspection output", () => {
    expect(html).toContain("inspectTheme");
    expect(html).toContain("inspection-output");
  });

  it("demonstrates scoped dark region", () => {
    expect(html).toContain("scope-dark");
    expect(html).toContain('mode: "dark"');
  });

  it("demonstrates compact density region", () => {
    expect(html).toContain("scope-compact");
    expect(html).toContain('density: "compact"');
  });

  it("demonstrates nested providers (outer dark, inner compact)", () => {
    expect(html).toContain("scope-nested-outer");
    expect(html).toContain("scope-nested-inner");
  });

  it("demonstrates multiple sibling scopes", () => {
    expect(html).toContain("sibling-row");
    expect(html).toContain("scope-dark");
    expect(html).toContain("scope-compact");
  });

  it("demonstrates runtime switching between theme layers", () => {
    expect(html).toContain("btn-default");
    expect(html).toContain("btn-org");
    expect(html).toContain("btn-product");
    expect(html).toContain("btn-app");
    expect(html).toContain("btn-light");
    expect(html).toContain("btn-dark");
  });

  it("demonstrates independent cleanup and reapplication", () => {
    expect(html).toContain("btn-cleanup");
    expect(html).toContain("btn-reapply");
    expect(html).toContain("cleanupScopedRegions");
    expect(html).toContain("applyScopedRegions");
  });

  it("uses only public DOM exports", () => {
    expect(html).toContain("applyTheme");
    expect(html).toContain("applyScopedTheme");
    expect(html).toContain("removeScopedTheme");
    expect(html).toContain("cleanupTheme");
    expect(html).toContain("hasThemeState");
  });

  it("uses focus-visible for keyboard accessibility", () => {
    expect(html).toContain("focus-visible");
  });
});
