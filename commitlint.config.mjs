/**
 * Commitlint configuration for KairoUI.
 *
 * Enforces the project commit convention:
 *   KairoUI - Task <TASK-ID>: <Description>
 *
 * Examples of valid messages:
 *   KairoUI - Task KUI-INFRA-013: Configure commit message validation
 *   KairoUI - Task KUI-COMP-001: Add Button component
 *
 * Exceptions (always allowed):
 *   - Merge commits (e.g., "Merge branch 'main' into feature/x")
 *   - Revert commits (e.g., "Revert \"KairoUI - Task ...\"")
 *   - Changesets release commits (e.g., "Version Packages")
 */

/** @type {import('@commitlint/types').UserConfig} */
export default {
  rules: {
    // Disable all conventional-commits rules — we use a custom format
    "type-enum": [0],
    "type-empty": [0],
    "subject-empty": [0],
    "scope-enum": [0],
    "header-max-length": [2, "always", 120],

    // Custom rule: validate KairoUI commit format
    "kairoui-format": [2, "always"],
  },
  plugins: [
    {
      rules: {
        "kairoui-format": ({ header }) => {
          // Allow merge commits
          if (/^Merge\s/.test(header)) {
            return [true, ""];
          }

          // Allow revert commits
          if (/^Revert\s/.test(header)) {
            return [true, ""];
          }

          // Allow Changesets version commits
          if (/^Version Packages/.test(header)) {
            return [true, ""];
          }

          // Enforce: KairoUI - Task <ID>: <Description>
          // Task ID format: KUI-<AREA>-<NUMBER> (e.g., KUI-INFRA-013, KUI-COMP-001)
          const pattern = /^KairoUI - Task [A-Z]+-[A-Z]+-\d{3,}: .{3,}$/;

          if (!pattern.test(header)) {
            return [
              false,
              `Commit message must match: "KairoUI - Task <ID>: <Description>"\n` +
                `  Task ID format: KUI-<AREA>-<NNN> (e.g., KUI-INFRA-013)\n` +
                `  Description must be at least 3 characters.\n` +
                `  Example: "KairoUI - Task KUI-INFRA-013: Configure commit message validation"`,
            ];
          }

          return [true, ""];
        },
      },
    },
  ],
};
