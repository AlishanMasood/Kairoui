# Pull Requests

## Before Opening a PR

1. **Run `pnpm check`** — This is what CI runs. Fix all failures locally.
2. **Create a changeset** if you modified a publishable package (`pnpm changeset`).
3. **Keep PRs focused** — One task, one PR. Avoid mixing unrelated changes.
4. **Follow the commit message format** — See [Commit Messages](commit-messages.md).

## PR Description

Include:

- **Task reference** — e.g., `KUI-COMP-001`
- **What changed** — Brief summary of the implementation.
- **Why** — Context for the approach taken, if it isn't obvious.
- **Testing** — How you verified the change works (tests, Storybook, manual).
- **Screenshots** — For visual changes, include before/after screenshots.

## Review Criteria

A PR should pass these checks before merge:

| Check                         | Automated? | Details                                                |
| ----------------------------- | ---------- | ------------------------------------------------------ |
| CI passes                     | Yes        | Build, lint, format, typecheck, tests, Storybook build |
| No lint warnings              | Yes        | `--max-warnings 0` in CI                               |
| Formatting correct            | Yes        | Prettier check                                         |
| Types correct                 | Yes        | `tsc --build`                                          |
| Tests pass                    | Yes        | Vitest                                                 |
| Changeset present (if needed) | Manual     | Required for publishable package changes               |
| Code review approved          | Manual     | At least one maintainer approval                       |
| No unresolved conversations   | Manual     | All review comments addressed                          |

## Merge Strategy

- PRs are **squash-merged** to keep `main` history clean.
- The squash commit message should follow the [commit message format](commit-messages.md).

## Draft PRs

Open a draft PR if you want early feedback on an approach before completing the implementation. Clearly state what is ready for review and what is still in progress.
