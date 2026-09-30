// Pointer drag orchestration for Kanban cards. The hook installs
// window-level listeners on pointerdown so the pointer can leave the
// source element without breaking the drag session.

import { useCallback, useEffect, useRef } from "react";

export interface UseCardPointerDragOptions {
  readonly enabled: boolean;
  readonly activationDistance: number;
  readonly onBeginDrag: () => void;
  readonly onPointerMove: (clientX: number, clientY: number) => void;
  readonly onCommit: () => void;
  readonly onCancel: () => void;
}

export interface UseCardPointerDragReturn {
  readonly onPointerDown: (event: {
    readonly clientX: number;
    readonly clientY: number;
    readonly pointerId: number;
    readonly button?: number;
  }) => void;
}

interface DragSession {
  readonly pointerId: number;
  readonly originX: number;
  readonly originY: number;
  active: boolean;
}

/**
 * Owns a pointer-drag session for one draggable node. `onBeginDrag`
 * fires after the pointer travels `activationDistance` pixels;
 * subsequent moves forward `clientX`/`clientY`; `pointerup` commits
 * and `pointercancel` reverts.
 */
export function useCardPointerDrag(options: UseCardPointerDragOptions): UseCardPointerDragReturn {
  const sessionRef = useRef<DragSession | null>(null);
  const optionsRef = useRef(options);
  const handlersRef = useRef<{
    move: (e: PointerEvent) => void;
    up: (e: PointerEvent) => void;
    cancel: (e: PointerEvent) => void;
  } | null>(null);

  useEffect(() => {
    optionsRef.current = options;
  });

  const detach = useCallback(() => {
    const handlers = handlersRef.current;
    if (!handlers) return;
    window.removeEventListener("pointermove", handlers.move);
    window.removeEventListener("pointerup", handlers.up);
    window.removeEventListener("pointercancel", handlers.cancel);
    handlersRef.current = null;
  }, []);

  useEffect(() => {
    return detach;
  }, [detach]);

  const onPointerDown = useCallback<UseCardPointerDragReturn["onPointerDown"]>(
    (event) => {
      if (!optionsRef.current.enabled) return;
      if ((event.button ?? 0) !== 0) return;
      sessionRef.current = {
        pointerId: event.pointerId,
        originX: event.clientX,
        originY: event.clientY,
        active: false,
      };
      const move = (e: PointerEvent): void => {
        const session = sessionRef.current;
        if (!session || e.pointerId !== session.pointerId) return;
        const dx = e.clientX - session.originX;
        const dy = e.clientY - session.originY;
        if (!session.active) {
          if (Math.hypot(dx, dy) < optionsRef.current.activationDistance) return;
          session.active = true;
          optionsRef.current.onBeginDrag();
        }
        optionsRef.current.onPointerMove(e.clientX, e.clientY);
      };
      const up = (e: PointerEvent): void => {
        const session = sessionRef.current;
        if (!session || e.pointerId !== session.pointerId) return;
        const wasActive = session.active;
        sessionRef.current = null;
        detach();
        if (wasActive) optionsRef.current.onCommit();
      };
      const cancel = (e: PointerEvent): void => {
        const session = sessionRef.current;
        if (!session || e.pointerId !== session.pointerId) return;
        const wasActive = session.active;
        sessionRef.current = null;
        detach();
        if (wasActive) optionsRef.current.onCancel();
      };
      handlersRef.current = { move, up, cancel };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
      window.addEventListener("pointercancel", cancel);
    },
    [detach],
  );

  return { onPointerDown };
}
