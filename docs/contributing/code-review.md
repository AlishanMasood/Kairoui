# Code Review

## Reviewer Responsibilities

- **Correctness** — Does the code do what it claims? Are edge cases handled?
- **Architecture** — Does this fit KairoUI's package boundaries and design patterns?
- **Public API** — Are new exports simple, consistent, and documented? Once published, they are contracts.
- **Accessibility** — Do components meet WCAG 2.1 AA? Are ARIA attributes correct?
- **Performance** — Any unnecessary re-renders, bundle size concerns, or runtime overhead?
- **Testing** — Are new behaviors covered by tests? Do tests describe behavior, not implementation?
- **Types** — Are types accurate and user-friendly? Avoid complex generics in public APIs.

## Author Responsibilities

- Respond to all review comments — resolve or explain why you disagree.
- Don't force-push during active review without notifying reviewers.
- Keep the PR updated with `main` (rebase or merge).

## Review Etiquette

- **Be specific** — "This could cause a re-render on every keystroke because X" is better than "This seems slow."
- **Suggest, don't demand** — Use "Consider..." or "What do you think about..." for non-blocking suggestions.
- **Distinguish blocking from non-blocking** — Prefix non-blocking comments with "nit:" or "optional:".
- **Approve with comments** if only nits remain — don't block on style preferences.

## What to Look For

### Must block

- Security vulnerabilities (XSS, injection, unsafe `dangerouslySetInnerHTML`)
- Breaking changes without a major version bump
- `any` types or `@ts-ignore` without justification
- Missing accessibility attributes on interactive elements
- Importing another package's internal files

### Should comment but not necessarily block

- Naming improvements
- Minor performance optimizations
- Additional test cases
- Documentation improvements
