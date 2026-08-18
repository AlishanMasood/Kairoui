import { useRef, useEffect, useCallback, createElement } from "react";
import type { ReactNode } from "react";
import { useEventCallback } from "@kairoui/hooks";
import { isTabbable } from "@kairoui/utils/dom";
import type { FocusScopeProps } from "./overlay-types";

// ─── Tabbable element utilities ─────────────────────────────────────

function getTabbableElements(container: HTMLElement): HTMLElement[] {
  const elements: HTMLElement[] = [];
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_ELEMENT, {
    acceptNode(node) {
      if ((node as HTMLElement).inert) return NodeFilter.FILTER_REJECT;
      if (isTabbable(node as HTMLElement)) return NodeFilter.FILTER_ACCEPT;
      return NodeFilter.FILTER_SKIP;
    },
  });
  let current = walker.nextNode();
  while (current) {
    elements.push(current as HTMLElement);
    current = walker.nextNode();
  }
  return elements;
}

// ─── Module-level scope stack for nesting ───────────────────────────

const scopeStack: HTMLElement[] = [];

function isActiveScope(element: HTMLElement): boolean {
  if (scopeStack.length === 0) return false;
  // The active scope is the innermost (leaf) — no other scope is its descendant
  const leaves = scopeStack.filter(
    (el) => !scopeStack.some((other) => other !== el && el.contains(other)),
  );
  return leaves[leaves.length - 1] === element;
}

export function _resetScopeStack(): void {
  scopeStack.length = 0;
}

// ─── Component ──────────────────────────────────────────────────────

export function FocusScope(props: FocusScopeProps): ReactNode {
  const {
    trapped = false,
    enabled = true,
    restoreFocus = false,
    autoFocus = trapped,
    initialFocusRef,
    children,
  } = props;

  const nodeRef = useRef<HTMLElement | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  const trappedRef = useRef(trapped);
  const enabledRef = useRef(enabled);
  useEffect(() => {
    trappedRef.current = trapped;
    enabledRef.current = enabled;
  });

  const focusFirst = useEventCallback(() => {
    const node = nodeRef.current;
    if (!node) return;

    const initial = initialFocusRef?.current;
    if (initial) {
      initial.focus();
      return;
    }

    const tabbable = getTabbableElements(node);
    const first = tabbable[0];
    if (first) {
      first.focus();
    }
  });

  // Capture previously focused element and manage initial focus
  useEffect(() => {
    if (!enabled) return;

    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;

    if (autoFocus) {
      // Defer to allow DOM to settle after mount
      const id = requestAnimationFrame(() => {
        focusFirst();
      });
      return () => {
        cancelAnimationFrame(id);
      };
    }
    return undefined;
  }, [enabled, autoFocus, focusFirst]);

  // Register in scope stack for nesting
  useEffect(() => {
    if (!enabled || !trapped) return;
    const node = nodeRef.current;
    if (!node) return;
    scopeStack.push(node);
    return () => {
      const idx = scopeStack.indexOf(node);
      if (idx !== -1) scopeStack.splice(idx, 1);
    };
  }, [enabled, trapped]);

  // Focus trapping via keydown
  useEffect(() => {
    if (!enabled || !trapped) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const node = nodeRef.current;
      if (!node || !isActiveScope(node)) return;

      const tabbable = getTabbableElements(node);
      if (tabbable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = tabbable[0];
      const last = tabbable[tabbable.length - 1];
      if (!first || !last) return;
      const active = document.activeElement;

      if (event.shiftKey) {
        if (active === first || !node.contains(active)) {
          event.preventDefault();
          last.focus();
        }
      } else {
        if (active === last || !node.contains(active)) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);
    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [enabled, trapped]);

  // Guard against focus escaping (e.g. programmatic focus changes)
  useEffect(() => {
    if (!enabled || !trapped) return;

    const handleFocusIn = (event: FocusEvent) => {
      const node = nodeRef.current;
      if (!node || !isActiveScope(node)) return;
      const target = event.target as Node | null;
      if (target && !node.contains(target)) {
        const tabbable = getTabbableElements(node);
        const first = tabbable[0];
        if (first) {
          first.focus();
        }
      }
    };

    document.addEventListener("focusin", handleFocusIn);
    return () => {
      document.removeEventListener("focusin", handleFocusIn);
    };
  }, [enabled, trapped]);

  // Restore focus on unmount
  useEffect(() => {
    if (!enabled || !restoreFocus) return;
    return () => {
      const el = previouslyFocusedRef.current;
      if (el && typeof el.focus === "function") {
        el.focus();
      }
    };
  }, [enabled, restoreFocus]);

  const setRef = useCallback((node: HTMLElement | null) => {
    nodeRef.current = node;
  }, []);

  /* eslint-disable react-hooks/refs -- setRef is a stable callback ref for DOM attachment */
  return createElement(
    "div",
    { ref: setRef, "data-focus-scope": "", style: { display: "contents" } },
    children,
  );
  /* eslint-enable react-hooks/refs */
}
