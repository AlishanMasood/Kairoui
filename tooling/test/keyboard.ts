import { expect } from "vitest";
import { createUser } from "./user";

/**
 * Asserts that the given element currently has focus.
 */
export function assertHasFocus(element: HTMLElement): void {
  expect(element).toHaveFocus();
}

/**
 * Asserts that pressing Tab moves focus through elements in the given order.
 * Starts from the currently focused element (or document.body).
 *
 * @param elements - Elements in expected tab order.
 * @param options - Optional user instance; creates one if not provided.
 */
export async function assertFocusOrder(
  elements: HTMLElement[],
  options?: { user?: ReturnType<typeof createUser> },
): Promise<void> {
  const user = options?.user ?? createUser();

  for (const element of elements) {
    await user.tab();
    expect(element).toHaveFocus();
  }
}

/**
 * Presses Tab the specified number of times (default: 1).
 * Returns the element that has focus after tabbing.
 */
export async function tabTo(
  options: {
    times?: number;
    shift?: boolean;
    user?: ReturnType<typeof createUser>;
  } = {},
): Promise<Element | null> {
  const { times = 1, shift = false, user: providedUser } = options;
  const user = providedUser ?? createUser();

  for (let i = 0; i < times; i++) {
    await user.tab({ shift });
  }

  return document.activeElement;
}

/**
 * Simulates pressing a key or key combination.
 * Uses user-event's keyboard API for realistic key events.
 *
 * @example
 * await pressKey("{Enter}");
 * await pressKey("{Escape}");
 * await pressKey("{ArrowDown}");
 */
export async function pressKey(
  key: string,
  options?: { user?: ReturnType<typeof createUser> },
): Promise<void> {
  const user = options?.user ?? createUser();
  await user.keyboard(key);
}
