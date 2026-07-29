import { defineConfig, type Options } from "tsup";

/**
 * Shared tsup configuration factory for KairoUI library packages.
 *
 * Usage in each package's tsup.config.ts:
 *
 * ```ts
 * import { createConfig } from "../../tooling/tsup/config";
 * export default createConfig();
 * ```
 *
 * ## Build decisions
 *
 * **Why tsup over Vite library mode:**
 * - Purpose-built for library packaging (Vite's lib mode is secondary)
 * - Built-in DTS generation without extra plugins
 * - Simpler per-package config (one file vs Vite + separate tsc step)
 * - esbuild-based: faster builds
 * - Less maintenance burden per package
 *
 * **Output format:** ESM only. No CJS — consumers use modern bundlers.
 * **Declarations:** Generated via tsup's DTS support (rollup-plugin-dts).
 * **Externals:** React, React DOM, and all @kairoui/* workspace packages.
 */
export function createConfig(overrides: Partial<Options> = {}): Options {
  return defineConfig({
    entry: ["src/index.ts"],
    format: ["esm"],
    dts: true,
    sourcemap: true,
    clean: true,
    splitting: false,
    treeshake: true,
    external: ["react", "react-dom", "react/jsx-runtime", /^@kairoui\//],
    outDir: "dist",
    ...overrides,
  }) as Options;
}
