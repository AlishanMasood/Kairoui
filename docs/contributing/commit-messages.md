# Commit Messages

KairoUI uses a custom commit message format enforced by [commitlint](https://commitlint.js.org/).

## Format

```
KairoUI - Task <TASK-ID>: <Description>
```

### Examples

```
KairoUI - Task KUI-INFRA-013: Configure commit message validation
KairoUI - Task KUI-COMP-001: Add Button component
KairoUI - Task KUI-TOKENS-003: Define color palette tokens
```

### Task ID Format

```
KUI-<AREA>-<NUMBER>
```

| Area     | Scope                          |
| -------- | ------------------------------ |
| `INFRA`  | Infrastructure, tooling, CI/CD |
| `COMP`   | Components                     |
| `TOKENS` | Design tokens                  |
| `THEME`  | Theme engine                   |
| `HOOKS`  | React hooks                    |
| `ICONS`  | Icon system                    |
| `UTILS`  | Utilities                      |
| `DOCS`   | Documentation                  |

### Rules

- Maximum header length: **120 characters**.
- The description should be concise and specific.
- Use imperative mood ("Add Button component", not "Added Button component").

## Exceptions

The following commit formats are always allowed:

- **Merge commits:** `Merge branch 'main' into feature/x`
- **Revert commits:** `Revert "KairoUI - Task ..."`
- **Changesets releases:** `Version Packages`

## Enforcement

- **Locally:** The `commit-msg` Git hook runs `commitlint` on every commit.
- **Bypass:** `git commit --no-verify -m "..."` skips the hook (CI will still validate).

## Tips

If your commit is rejected, check the format exactly — the prefix `KairoUI - Task ` (with spaces and dash) is required. Copy-paste from a previous commit if unsure.
