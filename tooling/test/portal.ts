import { afterEach } from "vitest";

const portalContainers: HTMLElement[] = [];

/**
 * Creates a DOM container for portal rendering in tests.
 * Automatically cleaned up after each test via `cleanupPortals()`.
 *
 * @param id - Optional ID for the container element.
 * @returns The container element appended to document.body.
 */
export function createPortalContainer(id?: string): HTMLElement {
  const container = document.createElement("div");
  if (id) {
    container.id = id;
  }
  container.setAttribute("data-testid", id ?? "portal-container");
  document.body.appendChild(container);
  portalContainers.push(container);
  return container;
}

/**
 * Removes all portal containers created during the current test.
 * Called automatically in setup-react.ts afterEach.
 */
export function cleanupPortals(): void {
  for (const container of portalContainers) {
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  }
  portalContainers.length = 0;
}

// Auto-cleanup portals after each test
afterEach(() => {
  cleanupPortals();
});
