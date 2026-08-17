import { useState, useCallback, useRef, useEffect } from "react";
import type { ReactNode } from "react";

export interface PresenceProps {
  /** Whether the content should be present (visible). */
  present: boolean;
  children:
    | ReactNode
    | ((props: { present: boolean; ref: (node: HTMLElement | null) => void }) => ReactNode);
}

/**
 * Presence — manages mount/unmount lifecycle for animated components.
 *
 * - When `present` transitions true→false, defers unmount until CSS animations/transitions end
 * - Respects prefers-reduced-motion (unmounts immediately)
 * - Render prop variant provides a ref for animation-end detection
 * - SSR-safe: renders based on initial `present` value
 * - Strict Mode safe
 */
export function Presence(props: PresenceProps): ReactNode {
  const { present, children } = props;

  const [shouldRender, setShouldRender] = useState(present);
  const nodeRef = useRef<HTMLElement | null>(null);

  // Mount immediately when present becomes true (React's derived-state-during-render pattern)
  if (present && !shouldRender) {
    setShouldRender(true);
  }

  // Handle exit lifecycle — defers unmount until animations/transitions complete
  useEffect(() => {
    if (present || !shouldRender) return;

    const node = nodeRef.current;
    if (!node) {
      setShouldRender(false);
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Lifecycle sync: respect reduced-motion preference
      setShouldRender(false);
      return;
    }

    const styles = getComputedStyle(node);
    const hasAnimation = styles.animationName !== "none" && styles.animationName !== "";
    const hasTransition =
      styles.transitionProperty !== "none" &&
      styles.transitionProperty !== "" &&
      styles.transitionProperty !== "all";

    if (!hasAnimation && !hasTransition) {
      setShouldRender(false);
      return;
    }

    const onEnd = () => {
      setShouldRender(false);
    };

    node.addEventListener("animationend", onEnd, { once: true });
    node.addEventListener("transitionend", onEnd, { once: true });

    return () => {
      node.removeEventListener("animationend", onEnd);
      node.removeEventListener("transitionend", onEnd);
    };
  }, [present, shouldRender]);

  const setRef = useCallback((node: HTMLElement | null) => {
    nodeRef.current = node;
  }, []);

  if (!shouldRender) {
    return null;
  }

  if (typeof children === "function") {
    // eslint-disable-next-line react-hooks/refs -- setRef is a stable callback ref for DOM attachment, not read during render
    return children({ present, ref: setRef });
  }

  return children;
}
