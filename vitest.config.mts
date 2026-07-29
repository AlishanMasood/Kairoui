import { defineConfig } from "vitest/config";

/**
 * Root Vitest configuration — shared defaults for all packages.
 *
 * Individual packages can override settings via their own vitest.config.ts.
 * For example, packages with React components can set `environment: "jsdom"`.
 */
export default defineConfig({
  test: {
    // Test file patterns
    include: ["packages/*/src/**/*.{test,spec}.{ts,tsx}"],

    // Exclude non-test directories
    exclude: [
      "node_modules",
      "dist",
      "**/node_modules/**",
      "**/dist/**",
      "**/.{git,cache,output}/**",
    ],

    // Default environment — Node for utilities, tokens, etc.
    // Override to "jsdom" in packages that test DOM/React components.
    environment: "node",

    // Globals disabled — prefer explicit imports for clarity
    globals: false,

    // TypeScript/TSX handled natively by Vite's esbuild transform
    // No extra config needed for .ts/.tsx support

    // Coverage configuration
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "json-summary"],
      reportsDirectory: "./coverage",
      include: ["packages/*/src/**/*.{ts,tsx}"],
      exclude: [
        "**/*.{test,spec}.{ts,tsx}",
        "**/*.d.ts",
        "**/index.ts", // re-export barrels
        "**/dist/**",
        "**/node_modules/**",
        "**/__mocks__/**",
        "**/__fixtures__/**",
      ],
      // No thresholds yet — add once substantive code exists
    },

    // Reporter configuration
    reporters: process.env.CI ? ["default", "junit"] : ["default"],
    outputFile: process.env.CI ? { junit: "./test-results/junit.xml" } : undefined,

    // Performance
    pool: "forks",
    passWithNoTests: true,
  },
});
