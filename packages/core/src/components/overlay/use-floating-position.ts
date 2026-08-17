import { useState, useCallback, useEffect, useRef } from "react";
import { useIsomorphicLayoutEffect } from "@kairoui/hooks";
import { getElementRect, getViewportRect } from "@kairoui/utils/dom";
import type { FloatingPositionOptions, FloatingPositionResult, Placement } from "./overlay-types";
import { computePosition, computeArrowPosition } from "./floating-position";
import type { ArrowPosition } from "./floating-position";

export interface UseFloatingPositionOptions extends FloatingPositionOptions {
  enabled?: boolean;
  isRtl?: boolean;
  arrowSize?: number;
}

export interface UseFloatingPositionReturn {
  x: number;
  y: number;
  placement: Placement;
  transformOrigin: string;
  arrowPosition: ArrowPosition;
  refs: {
    setAnchor: (el: HTMLElement | null) => void;
    setFloating: (el: HTMLElement | null) => void;
  };
  update: () => void;
}

const INITIAL: FloatingPositionResult = {
  x: 0,
  y: 0,
  placement: "bottom",
  transformOrigin: "center top",
};

export function useFloatingPosition(
  options: UseFloatingPositionOptions = {},
): UseFloatingPositionReturn {
  const { enabled = true, isRtl = false, arrowSize = 0, ...positionOptions } = options;

  const anchorRef = useRef<HTMLElement | null>(null);
  const floatingRef = useRef<HTMLElement | null>(null);
  const [result, setResult] = useState<FloatingPositionResult>(INITIAL);
  const [arrow, setArrow] = useState<ArrowPosition>({ x: undefined, y: undefined });

  const optionsRef = useRef(positionOptions);
  const isRtlRef = useRef(isRtl);
  const arrowSizeRef = useRef(arrowSize);
  useEffect(() => {
    optionsRef.current = positionOptions;
    isRtlRef.current = isRtl;
    arrowSizeRef.current = arrowSize;
  });

  const update = useCallback(() => {
    const anchor = anchorRef.current;
    const floating = floatingRef.current;
    if (!anchor || !floating) return;

    const anchorRect = getElementRect(anchor);
    const floatingRect = { width: floating.offsetWidth, height: floating.offsetHeight };
    const viewportRect = getViewportRect(
      window as unknown as Parameters<typeof getViewportRect>[0],
    );

    const pos = computePosition({
      anchorRect,
      floatingRect,
      viewportRect,
      options: optionsRef.current,
      isRtl: isRtlRef.current,
    });

    setResult(pos);

    if (arrowSizeRef.current > 0) {
      setArrow(
        computeArrowPosition({
          anchorRect,
          floatingX: pos.x,
          floatingY: pos.y,
          floatingSize: floatingRect,
          arrowSize: arrowSizeRef.current,
          placement: pos.placement,
          ...(optionsRef.current.collisionPadding != null
            ? { collisionPadding: optionsRef.current.collisionPadding }
            : undefined),
        }),
      );
    }
  }, []);

  const setAnchor = useCallback((el: HTMLElement | null) => {
    anchorRef.current = el;
  }, []);

  const setFloating = useCallback(
    (el: HTMLElement | null) => {
      floatingRef.current = el;
      if (el && enabled) update();
    },
    [enabled, update],
  );

  // Reposition on scroll/resize
  useEffect(() => {
    if (!enabled) return;

    const handleUpdate = () => {
      update();
    };
    window.addEventListener("scroll", handleUpdate, true);
    window.addEventListener("resize", handleUpdate);
    return () => {
      window.removeEventListener("scroll", handleUpdate, true);
      window.removeEventListener("resize", handleUpdate);
    };
  }, [enabled, update]);

  // Initial position after layout
  useIsomorphicLayoutEffect(() => {
    if (enabled) update();
  }, [enabled, update]);

  return {
    x: result.x,
    y: result.y,
    placement: result.placement,
    transformOrigin: result.transformOrigin,
    arrowPosition: arrow,
    refs: { setAnchor, setFloating },
    update,
  };
}
