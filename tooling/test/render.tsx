import {
  render as rtlRender,
  type RenderOptions as RTLRenderOptions,
  type RenderResult as RTLRenderResult,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement, ReactNode } from "react";

export interface RenderOptions extends Omit<RTLRenderOptions, "wrapper"> {
  /**
   * Additional wrapper component. Will be composed with the default providers.
   * Use this for test-specific context (e.g., a router, specific theme variant).
   */
  wrapper?: React.ComponentType<{ children: ReactNode }>;
}

export interface RenderResult extends RTLRenderResult {
  /** Pre-configured user-event instance for this render. */
  user: ReturnType<typeof userEvent.setup>;
}

/**
 * Creates the default wrapper that wraps all rendered components.
 *
 * Extension point: once a real KairoProvider/ThemeProvider exists,
 * compose it here so every test automatically gets the provider context.
 */
function createWrapper(
  CustomWrapper?: React.ComponentType<{ children: ReactNode }>,
): React.ComponentType<{ children: ReactNode }> {
  return function TestWrapper({ children }: { children: ReactNode }) {
    // Future: wrap with <KairoProvider> here
    if (CustomWrapper) {
      return <CustomWrapper>{children}</CustomWrapper>;
    }
    return <>{children}</>;
  };
}

/**
 * Custom render function that wraps React Testing Library's `render` with:
 * - Default provider wrappers (extensible)
 * - A pre-configured `user-event` instance
 *
 * Prefer this over importing `render` from `@testing-library/react` directly.
 */
export function render(ui: ReactElement, options: RenderOptions = {}): RenderResult {
  const { wrapper: CustomWrapper, ...restOptions } = options;
  const Wrapper = createWrapper(CustomWrapper);

  const user = userEvent.setup();
  const result = rtlRender(ui, {
    wrapper: Wrapper,
    ...restOptions,
  });

  return {
    ...result,
    user,
  };
}
