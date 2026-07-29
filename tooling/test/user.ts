import userEvent from "@testing-library/user-event";

/**
 * Creates a new user-event instance with default options.
 * Use this when you need a standalone user without calling `render`.
 *
 * For most tests, prefer the `user` returned by the custom `render()`.
 */
export function createUser(
  options?: Parameters<typeof userEvent.setup>[0],
): ReturnType<typeof userEvent.setup> {
  return userEvent.setup(options);
}
