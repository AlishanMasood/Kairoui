import { defineConfig } from "vitest/config";

/**
 * Root Vitest configuration — shared defaults for all packages.
 *
 * Uses Vitest "projects" to separate environments:
 * - React packages (core, hooks, icons) → happy-dom + RTL setup
 * - Non-DOM packages (utils, tokens, theme) → node environment
 */
export default defineConfig({
  test: {
    // Workspace projects with different environments
    projects: [
      {
        test: {
          name: "react",
          include: [
            "packages/core/src/**/*.{test,spec}.{ts,tsx}",
            "packages/hooks/src/**/*.{test,spec}.{ts,tsx}",
            "packages/icons/src/**/*.{test,spec}.{ts,tsx}",
            "tooling/test/**/*.{test,spec}.{ts,tsx}",
          ],
          environment: "happy-dom",
          setupFiles: ["./tooling/test/setup-react.ts"],
        },
      },
      {
        test: {
          name: "node",
          include: [
            "packages/utils/src/**/*.{test,spec}.{ts,tsx}",
            "packages/tokens/src/**/*.{test,spec}.{ts,tsx}",
            "packages/theme/src/**/*.{test,spec}.{ts,tsx}",
          ],
          environment: "node",
        },
      },
    ],

    // Exclude non-test directories
    exclude: [
      "node_modules",
      "dist",
      "**/node_modules/**",
      "**/dist/**",
      "**/.{git,cache,output}/**",
    ],

    // Globals disabled — prefer explicit imports for clarity
    globals: false,

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

    // Reporter configuration // take this is scripts/check inn package.json pnpm format:check &&
    reporters: process.env.CI ? ["default", "junit"] : ["default"],
    outputFile: process.env.CI ? { junit: "./test-results/junit.xml" } : undefined,

    // Performance
    pool: "forks",
    passWithNoTests: true,
  },
});
