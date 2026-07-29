# Development Setup

## Prerequisites

- **Node.js >= 20.0.0** — LTS versions recommended. CI runs on Node 22.
- **pnpm 9.15.4** — The exact version is declared in `package.json` via the `packageManager` field.
- **Git** — Any recent version.

## Installation

```bash
git clone <repository-url>
cd kairoui
pnpm install
```

`pnpm install` also runs the `prepare` script, which sets up [Husky](https://typicode.github.io/husky/) Git hooks automatically.

## Verify Your Setup

```bash
pnpm check
```

This runs the full validation suite: build, formatting, linting, type checking, and tests. If it passes, your environment is ready.

## IDE Configuration

### VS Code (Recommended)

The repository includes recommended settings in `.vscode/settings.json` and `.vscode/extensions.json` when present. Install the recommended extensions:

- **ESLint** (`dbaeumer.vscode-eslint`) — Inline lint feedback
- **Prettier** (`esbenp.prettier-vscode`) — Format on save
- **EditorConfig** (`editorconfig.editorconfig`) — Consistent whitespace

Recommended VS Code settings (add to your workspace or user settings):

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

### Other Editors

The `.editorconfig` file at the repository root provides baseline formatting rules (UTF-8, LF, 2-space indentation). Most editors support EditorConfig natively or via a plugin.

## Common Tasks

### Starting Development

```bash
# Start all packages in dev/watch mode
pnpm dev

# Start only Storybook
pnpm storybook

# Start only the docs site
pnpm docs:dev
```

### Running Checks

```bash
# Full check (what CI runs)
pnpm check

# Individual checks
pnpm lint
pnpm typecheck
pnpm test:run
pnpm format:check
```

### Building

```bash
# Build all packages (Turbo-cached — only rebuilds what changed)
pnpm build

# Clean all build outputs
pnpm clean
```

## Troubleshooting

### `pnpm install` fails

Ensure you are using exactly pnpm 9.15.4:

```bash
pnpm --version
# Should output: 9.15.4
```

### Git hooks not running

```bash
pnpm run prepare
```

On macOS/Linux, you may need to make hooks executable:

```bash
chmod +x .husky/pre-commit .husky/commit-msg
```

### TypeScript errors in IDE but not in terminal

Restart the TypeScript language server:

- VS Code: `Ctrl+Shift+P` → "TypeScript: Restart TS Server"
- Ensure `typescript.tsdk` points to `node_modules/typescript/lib`

### Windows line endings

Prettier enforces `lf` line endings. If Git is converting to CRLF, configure:

```bash
git config core.autocrlf input
```

Or set it globally:

```bash
git config --global core.autocrlf input
```

### Turbo cache issues

```bash
# Clear Turbo cache
pnpm clean
rm -rf .turbo
pnpm build
```
