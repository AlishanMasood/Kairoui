import { useRef, useEffect, useCallback, createElement } from "react";
import type { ReactNode } from "react";
import { useEventCallback } from "@kairoui/hooks";
import { isEscapeKey } from "@kairoui/utils/events";
import { isEventOutside } from "@kairoui/utils/dom";
import type { OutsideEventLike, NodeLike } from "@kairoui/utils/dom";
import type { DismissableLayerProps } from "./overlay-types";

// ─── Module-level layer stack ───────────────────────────────────────

const layerStack: HTMLElement[] = [];
let modalCount = 0;
let originalBodyPointerEvents: string | undefined;

function registerLayer(element: HTMLElement, modal: boolean): () => void {
  layerStack.push(element);

  if (modal) {
    modalCount++;
    if (modalCount === 1) {
      originalBodyPointerEvents = document.body.style.pointerEvents;
      document.body.style.pointerEvents = "none";
    }
  }

  return () => {
    const index = layerStack.indexOf(element);
    if (index !== -1) layerStack.splice(index, 1);

    if (modal) {
      modalCount--;
      if (modalCount === 0) {
        document.body.style.pointerEvents = originalBodyPointerEvents ?? "";
        originalBodyPointerEvents = undefined;
      }
    }
  };
}

/** A layer is topmost if no other registered layer is its DOM descendant. */
function isTopmost(element: HTMLElement): boolean {
  const leaves = layerStack.filter(
    (el) => !layerStack.some((other) => other !== el && el.contains(other)),
  );
  return leaves[leaves.length - 1] === element;
}

/**
 * Returns layers "above" the given element:
 * - DOM descendants (nested child layers)
 * - Peer layers registered after it (portaled siblings opened later)
 */
function getLayersAbove(element: HTMLElement): HTMLElement[] {
  return layerStack.filter((other) => {
    if (other === element) return false;
    if (element.contains(other)) return true;
    if (!other.contains(element)) {
      return layerStack.indexOf(other) > layerStack.indexOf(element);
    }
    return false;
  });
}

// Exposed for testing cleanup
export function _resetLayerStack(): void {
  layerStack.length = 0;
  modalCount = 0;
  originalBodyPointerEvents = undefined;
}

// ─── Component ──────────────────────────────────────────────────────

export function DismissableLayer(props: DismissableLayerProps): ReactNode {
  const {
    onDismiss,
    onEscapeKeyDown,
    onPointerDownOutside,
    onFocusOutside,
    disableEscapeKeyDown = false,
    disableOutsidePointerEvents = false,
    branches,
    children,
  } = props;

  const nodeRef = useRef<HTMLElement | null>(null);
  const branchesRef = useRef(branches);
  const onDismissStable = useEventCallback(onDismiss);
  const onEscapeKeyDownStable = useEventCallback(onEscapeKeyDown);
  const onPointerDownOutsideStable = useEventCallback(onPointerDownOutside);
  const onFocusOutsideStable = useEventCallback(onFocusOutside);

  useEffect(() => {
    branchesRef.current = branches;
  });

  // Register in layer stack
  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return;
    return registerLayer(node, disableOutsidePointerEvents);
  }, [disableOutsidePointerEvents]);

  // Escape key
  useEffect(() => {
    if (disableEscapeKeyDown) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isEscapeKey(event)) return;
      const node = nodeRef.current;
      if (!node || !isTopmost(node)) return;

      onEscapeKeyDownStable(event);
      if (!event.defaultPrevented) {
        onDismissStable();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [disableEscapeKeyDown, onEscapeKeyDownStable, onDismissStable]);

  // Pointer-down outside
  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const node = nodeRef.current;
      if (!node) return;

      const above = getLayersAbove(node);
      const branchEls = (branchesRef.current ?? []).filter((el): el is HTMLElement => el != null);
      const insideElements = [node, ...above, ...branchEls] as readonly NodeLike[];

      if (!isEventOutside(event as unknown as OutsideEventLike, { insideElements })) return;

      onPointerDownOutsideStable(event);
      if (!event.defaultPrevented) {
        onDismissStable();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [onPointerDownOutsideStable, onDismissStable]);

  // Focus outside (focusin is not natively cancelable, so we use a custom event for cancellation)
  useEffect(() => {
    const handleFocusIn = (event: FocusEvent) => {
      const node = nodeRef.current;
      if (!node) return;

      const target = event.target;
      if (target == null || !(target instanceof Node)) return;

      const above = getLayersAbove(node);
      const branchEls = (branchesRef.current ?? []).filter((el): el is HTMLElement => el != null);
      const allInside = [node, ...above, ...branchEls];

      for (const el of allInside) {
        if (el === target || el.contains(target)) return;
      }

      const cancelableEvent = new Event("kui.focusoutside", { cancelable: true });
      onFocusOutsideStable(cancelableEvent as unknown as FocusEvent);
      if (!cancelableEvent.defaultPrevented) {
        onDismissStable();
      }
    };

    document.addEventListener("focusin", handleFocusIn);
    return () => {
      document.removeEventListener("focusin", handleFocusIn);
    };
  }, [onFocusOutsideStable, onDismissStable]);

  const setRef = useCallback((node: HTMLElement | null) => {
    nodeRef.current = node;
  }, []);

  /* eslint-disable react-hooks/refs -- setRef is a stable callback ref for DOM attachment, not read during render */
  return createElement(
    "div",
    {
      ref: setRef,
      "data-dismissable-layer": "",
      style: disableOutsidePointerEvents
        ? { display: "contents", pointerEvents: "auto" as const }
        : { display: "contents" },
    },
    children,
  );
  /* eslint-enable react-hooks/refs */
}
