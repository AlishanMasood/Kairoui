# Testing

KairoUI uses [Vitest](https://vitest.dev/) with [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) for component testing.

## Running Tests

```bash
# Watch mode (during development)
pnpm test

# Single run (what CI uses)
pnpm test:run

# With coverage report
pnpm test:coverage
```

## Test Environments

Tests run in two separate Vitest projects configured in `vitest.config.mts`:

| Project | Environment | Packages             |
| ------- | ----------- | -------------------- |
| `react` | happy-dom   | core, hooks, icons   |
| `node`  | node        | utils, tokens, theme |

React packages use `happy-dom` for DOM simulation and have a setup file (`tooling/test/setup-react.ts`) that configures Testing Library matchers.

## Writing Tests

### File naming

Place test files alongside the source code:

```
src/
├── Button.tsx
├── Button.test.tsx
└── index.ts
```

Or use a `__tests__/` directory for larger test suites:

```
src/
├── Button.tsx
├── __tests__/
│   ├── Button.test.tsx
│   └── Button.integration.test.tsx
└── index.ts
```

### Basic test

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button } from "./Button";

describe("Button", () => {
  it("renders children", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button")).toHaveTextContent("Click me");
  });
});
```

### Testing hooks

```tsx
import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useToggle } from "./useToggle";

describe("useToggle", () => {
  it("toggles state", () => {
    const { result } = renderHook(() => useToggle(false));
    expect(result.current[0]).toBe(false);

    act(() => {
      result.current[1]();
    });

    expect(result.current[0]).toBe(true);
  });
});
```

### Pure utility test

```ts
import { describe, it, expect } from "vitest";
import { clamp } from "./clamp";

describe("clamp", () => {
  it("clamps value to range", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
  });
});
```

## Conventions

- **Explicit imports** — Always import `describe`, `it`, `expect` from `vitest`. Globals are disabled.
- **No `any` in tests** — The TypeScript suppression policy still applies. Use the relaxed test-file ESLint rules where needed, but prefer proper typing.
- **Prefix unused parameters** with `_` — e.g., `(_event) => {}`.
- **Test behavior, not implementation** — Focus on what the user sees and does, not internal state.
- **Use Testing Library queries by role** — Prefer `getByRole`, `getByLabelText` over `getByTestId`.

## Coverage

Coverage is collected with `@vitest/coverage-v8`. Run `pnpm test:coverage` to generate a report in `coverage/`.

Coverage is informational — there is no enforced threshold yet.
