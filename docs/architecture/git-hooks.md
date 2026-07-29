# Git Hooks with Husky

## Overview

KairoUI uses [Husky](https://typicode.github.io/husky/) to manage Git hooks locally. Hooks provide fast feedback **before** code reaches CI, but they are **not** the authoritative enforcement mechanism — CI pipelines remain the single source of truth.

## How It Works

1. **Installation**: Running `pnpm install` triggers the `prepare` script, which runs `husky` to set up `.husky/` hooks in your local Git config.
2. **Pre-commit**: The `.husky/pre-commit` hook runs `pnpm lint-staged`, which applies linting and formatting **only to staged files**.
3. **Cross-platform**: Hooks are plain shell scripts executed by Git's built-in hook runner — works on Windows (Git Bash), macOS, and Linux.

## Hooks vs CI

| Aspect      | Git Hooks (local)          | CI Pipeline (remote)         |
| ----------- | -------------------------- | ---------------------------- |
| Scope       | Staged files only          | Full repository              |
| Speed       | Seconds                    | Minutes                      |
| Enforcement | Advisory — can be bypassed | Authoritative — blocks merge |
| Purpose     | Fast feedback loop         | Correctness guarantee        |

**Important**: Git hooks can always be skipped with `git commit --no-verify`. This is by design — CI catches anything hooks miss.

## Troubleshooting

### Hooks not running

```bash
# Re-install hooks
pnpm run prepare
```

### Permission denied (macOS/Linux)

```bash
chmod +x .husky/pre-commit
```

### Bypassing hooks temporarily

```bash
git commit --no-verify -m "WIP: work in progress"
```

### lint-staged fails

Run lint-staged manually to see detailed output:

```bash
pnpm lint-staged --debug
```

## What Runs During Pre-commit

When you `git commit`, the pre-commit hook triggers `pnpm lint-staged`, which runs **only on staged files**:

| File pattern                    | Commands                                                | Purpose                  |
| ------------------------------- | ------------------------------------------------------- | ------------------------ |
| `*.{js,jsx,mjs,cjs,ts,tsx}`     | `eslint --fix --max-warnings 0` then `prettier --write` | Lint + auto-fix + format |
| `*.{json,md,yml,yaml,css,html}` | `prettier --write`                                      | Format only              |

**What is NOT run in pre-commit:**

- Full type checking (`tsc --build`) — too slow for staged-only checks; runs in CI
- Full repository lint — only staged files are checked
- Tests — reserved for CI

**Behavior:**

- ESLint applies safe auto-fixes (`--fix`) and fails on any remaining error or warning (`--max-warnings 0`)
- Prettier reformats files in-place; the formatted result is what gets committed
- If any command fails, the commit is blocked and staged files are reverted to their original state
- Unstaged changes in partially staged files are safely stashed and restored

## Configuration

- **Husky**: `.husky/pre-commit` — the hook script
- **lint-staged**: `lint-staged` key in root `package.json` — defines what commands run on which file patterns

## Adding New Hooks

Create a new file in `.husky/` named after the Git hook (e.g., `commit-msg`):

```bash
# .husky/commit-msg
pnpm commitlint --edit $1
```

Keep hooks lightweight. Never run the full CI pipeline (`pnpm check`) in a hook.
