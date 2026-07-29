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
