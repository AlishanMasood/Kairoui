/**
 * @kairoui/test-utils — Shared testing utilities for KairoUI component tests.
 *
 * This module provides a custom `render` function with a composable wrapper,
 * user-event setup, focus/keyboard helpers, and portal container support.
 *
 * ## Usage
 *
 * ```tsx
 * import { render, user, screen } from "../../tooling/test";
 *
 * it("handles click", async () => {
 *   const { user } = render(<Button>Click</Button>);
 *   await user.click(screen.getByRole("button"));
 * });
 * ```
 *
 * ## Extending the wrapper
 *
 * Once a real KairoProvider exists, add it to `createWrapper()`:
 *
 * ```tsx
 * function createWrapper(options: RenderOptions["wrapper"]) {
 *   return ({ children }) => (
 *     <KairoProvider theme={options?.theme ?? defaultTheme}>
 *       {children}
 *     </KairoProvider>
 *   );
 * }
 * ```
 */

export { render } from "./render";
export type { RenderOptions, RenderResult } from "./render";
export { createUser } from "./user";
export { assertHasFocus, assertFocusOrder, tabTo, pressKey } from "./keyboard";
export { createPortalContainer, cleanupPortals } from "./portal";
export { axeCheck } from "./a11y";

// Re-export commonly used Testing Library APIs for convenience
export { screen, within, waitFor, act } from "@testing-library/react";
