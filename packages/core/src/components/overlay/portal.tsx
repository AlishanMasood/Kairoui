import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import type { ReactNode } from "react";

export interface PortalProps {
  /** Target container element. Defaults to document.body when available. */
  container?: HTMLElement | null;
  /** Render children in-place instead of portaling. */
  disabled?: boolean;
  children?: ReactNode;
}

const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

/**
 * Portal — renders children into a DOM node outside the parent hierarchy.
 *
 * - SSR-safe: renders nothing on the server (portals require a DOM target)
 * - Hydration-safe: uses useSyncExternalStore to detect client
 * - Supports custom containers
 * - `disabled` renders children in-place (no portal)
 */
export function Portal(props: PortalProps): ReactNode {
  const { container, disabled = false, children } = props;

  const isClient = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (disabled) {
    return children;
  }

  if (!isClient) {
    return null;
  }

  const target = container ?? document.body;

  return createPortal(children, target);
}
