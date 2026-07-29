/**
 * Accessibility testing integration extension point.
 *
 * This provides a placeholder for axe-core integration.
 * Once `@axe-core/react` or `vitest-axe` is added, replace the
 * implementation with actual automated accessibility checks.
 */

/**
 * Runs automated accessibility checks on the given container.
 *
 * Currently a no-op extension point. Will be implemented when
 * axe-core is added as a dependency.
 *
 * @param container - The DOM element to check (defaults to document.body).
 * @returns A promise that resolves when checks pass.
 *
 * @example
 * ```tsx
 * const { container } = render(<Button>Click</Button>);
 * await axeCheck(container);
 * ```
 */
export function axeCheck(_container?: HTMLElement): Promise<{ violations: never[] }> {
  // Extension point: replace with actual axe-core integration
  // e.g.: const results = await axe(container ?? document.body);
  //       expect(results.violations).toHaveLength(0);
  return Promise.resolve({ violations: [] });
}
