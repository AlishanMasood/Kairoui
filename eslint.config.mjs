// @ts-check
import { defineConfig } from "eslint/config";
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import jsxA11yPlugin from "eslint-plugin-jsx-a11y";
import importXPlugin from "eslint-plugin-import-x";
import prettierConfig from "eslint-config-prettier";
import globals from "globals";

export default defineConfig(
  // ─── Global ignores ───────────────────────────────────────────────
  {
    ignores: [
      "**/dist/**",
      "**/build/**",
      "**/coverage/**",
      "**/node_modules/**",
      "**/*.d.ts",
      "**/storybook-static/**",
      "**/.turbo/**",
      "**/.vite/**",
      "**/.docusaurus/**",
      ".size-baseline/**",
    ],
  },

  // ─── Base: all JS/TS files ────────────────────────────────────────
  js.configs.recommended,

  // ─── TypeScript (type-aware) ──────────────────────────────────────
  ...tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: [
            "*.config.*js",
            "*.config.*ts",
            "packages/*/tsup.config.ts",
            "packages/*/scripts/*.ts",
            "scripts/*.ts",
            "tooling/tsup/config.ts",
          ],
          maximumDefaultProjectFileMatchCount_THIS_WILL_SLOW_DOWN_LINTING: 16,
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Relax rules that are overly noisy for library code
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/restrict-template-expressions": [
        "error",
        { allowNumber: true, allowBoolean: true },
      ],
      // Unused vars: allow underscore-prefixed
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },

  // ─── React ────────────────────────────────────────────────────────
  {
    files: ["packages/*/src/**/*.{ts,tsx}", "apps/*/src/**/*.{ts,tsx}"],
    plugins: {
      react: reactPlugin,
      // @ts-expect-error -- plugin types not fully compatible with flat config typings
      "react-hooks": reactHooksPlugin,
      "jsx-a11y": jsxA11yPlugin,
    },
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
    settings: {
      react: {
        version: "19",
      },
    },
    rules: {
      // React
      ...reactPlugin.configs.flat.recommended.rules,
      ...reactPlugin.configs.flat["jsx-runtime"].rules,
      "react/prop-types": "off",
      "react/no-unknown-property": "error",

      // React Hooks
      ...reactHooksPlugin.configs["recommended-latest"].rules,

      // JSX Accessibility
      ...jsxA11yPlugin.flatConfigs.strict.rules,
    },
  },

  // ─── Import rules ─────────────────────────────────────────────────
  {
    plugins: {
      "import-x": importXPlugin,
    },
    rules: {
      "import-x/no-duplicates": "error",
      "import-x/no-self-import": "error",
      "import-x/no-cycle": ["error", { maxDepth: 3 }],
      "import-x/first": "error",
      "import-x/newline-after-import": "error",
      "import-x/no-useless-path-segments": "error",

      // Prevent importing from another package's internals
      "import-x/no-internal-modules": [
        "error",
        {
          allow: [
            "@kairoui/*/package.json",
            "@kairoui/tsconfig/*.json",
            "@kairoui/theme/server",
            "@kairoui/theme/dom",
            "@kairoui/utils/dom",
            "@kairoui/utils/events",
            "@kairoui/core/composition",
            "@kairoui/core/primitives",
            "@kairoui/core/components",
            "@testing-library/*/**",
            "react-dom/server",
            "eslint/config",
            "vitest/*",
          ],
        },
      ],
    },
  },

  // ─── Test files ───────────────────────────────────────────────────
  {
    files: ["**/*.test.{ts,tsx}", "**/*.spec.{ts,tsx}", "**/__tests__/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-implied-eval": "off",
      "@typescript-eslint/no-unsafe-call": "off",
    },
  },

  // ─── Storybook files ──────────────────────────────────────────────
  {
    files: ["**/*.stories.{ts,tsx}", "**/.storybook/**/*.{ts,tsx}"],
    rules: {
      "import-x/no-default-export": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
    },
  },

  // ─── Node config/script files ─────────────────────────────────────
  {
    files: [
      "*.config.{js,ts,mjs,mts,cjs}",
      "tooling/**/*.{js,ts,mjs,mts}",
      "scripts/**/*.{js,ts,mjs,mts}",
    ],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      // Config files often have untyped plugin imports
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
    },
  },

  // ─── Package boundary: @kairoui/utils must not import React ───────
  {
    files: ["packages/utils/src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            { name: "react", message: "@kairoui/utils must be framework-independent." },
            { name: "react-dom", message: "@kairoui/utils must be framework-independent." },
            {
              name: "react/jsx-runtime",
              message: "@kairoui/utils must be framework-independent.",
            },
          ],
          patterns: [
            {
              group: ["@kairoui/theme", "@kairoui/theme/*"],
              message: "utils must not depend on theme.",
            },
            {
              group: ["@kairoui/core", "@kairoui/core/*"],
              message: "utils must not depend on core.",
            },
            {
              group: ["@kairoui/hooks", "@kairoui/hooks/*"],
              message: "utils must not depend on hooks.",
            },
          ],
        },
      ],
    },
  },

  // ─── Package boundary: @kairoui/hooks must not import theme/core ──
  {
    files: ["packages/hooks/src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@kairoui/theme", "@kairoui/theme/*"],
              message: "hooks must not depend on theme.",
            },
            {
              group: ["@kairoui/core", "@kairoui/core/*"],
              message: "hooks must not depend on core.",
            },
            {
              group: ["@kairoui/tokens", "@kairoui/tokens/*"],
              message: "hooks must not depend on tokens.",
            },
          ],
        },
      ],
    },
  },

  // ─── Package boundary: production packages must not import @kairoui/docs ──
  {
    files: [
      "packages/core/src/**/*.{ts,tsx}",
      "packages/utils/src/**/*.{ts,tsx}",
      "packages/tokens/src/**/*.{ts,tsx}",
      "packages/theme/src/**/*.{ts,tsx}",
      "packages/hooks/src/**/*.{ts,tsx}",
      "packages/icons/src/**/*.{ts,tsx}",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@kairoui/docs", "@kairoui/docs/*"],
              message: "Production packages must not depend on @kairoui/docs.",
            },
          ],
        },
      ],
    },
  },

  // ─── Prettier compat (must be last) ──────────────────────────────
  prettierConfig,
);
