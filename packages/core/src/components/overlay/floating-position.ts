import type {
  Placement,
  Side,
  Alignment,
  FloatingPositionOptions,
  FloatingPositionResult,
} from "./overlay-types";
import type { DOMRectLike } from "@kairoui/utils/dom";

// ─── Helpers ────────────────────────────────────────────────────────

function parsePlacement(placement: Placement): { side: Side; alignment: Alignment } {
  const parts = placement.split("-");
  return { side: parts[0] as Side, alignment: (parts[1] as Alignment | undefined) ?? "center" };
}

function getOppositeSide(side: Side): Side {
  const map: Record<Side, Side> = { top: "bottom", bottom: "top", left: "right", right: "left" };
  return map[side];
}

function buildPlacement(side: Side, alignment: Alignment): Placement {
  return alignment === "center" ? side : (`${side}-${alignment}` as Placement);
}

function getTransformOrigin(placement: Placement): string {
  const { side, alignment } = parsePlacement(placement);
  const align = alignment === "start" ? "left" : alignment === "end" ? "right" : "center";
  const verticalAlign = alignment === "start" ? "top" : alignment === "end" ? "bottom" : "center";

  switch (side) {
    case "top":
      return `${align} bottom`;
    case "bottom":
      return `${align} top`;
    case "left":
      return `right ${verticalAlign}`;
    case "right":
      return `left ${verticalAlign}`;
  }
}

// ─── Core positioning ───────────────────────────────────────────────

export interface ComputePositionInput {
  anchorRect: DOMRectLike;
  floatingRect: { width: number; height: number };
  viewportRect: DOMRectLike;
  options: FloatingPositionOptions;
  isRtl?: boolean;
}

function computeCoords(
  anchorRect: DOMRectLike,
  floatingSize: { width: number; height: number },
  side: Side,
  alignment: Alignment,
  offset: number,
  isRtl: boolean,
): { x: number; y: number } {
  let x = 0;
  let y = 0;

  switch (side) {
    case "top":
      x = anchorRect.left + anchorRect.width / 2 - floatingSize.width / 2;
      y = anchorRect.top - floatingSize.height - offset;
      break;
    case "bottom":
      x = anchorRect.left + anchorRect.width / 2 - floatingSize.width / 2;
      y = anchorRect.bottom + offset;
      break;
    case "left":
      x = anchorRect.left - floatingSize.width - offset;
      y = anchorRect.top + anchorRect.height / 2 - floatingSize.height / 2;
      break;
    case "right":
      x = anchorRect.right + offset;
      y = anchorRect.top + anchorRect.height / 2 - floatingSize.height / 2;
      break;
  }

  // Apply alignment
  if (side === "top" || side === "bottom") {
    const effectiveAlignment = isRtl
      ? alignment === "start"
        ? "end"
        : alignment === "end"
          ? "start"
          : "center"
      : alignment;
    if (effectiveAlignment === "start") {
      x = anchorRect.left;
    } else if (effectiveAlignment === "end") {
      x = anchorRect.right - floatingSize.width;
    }
  } else {
    if (alignment === "start") {
      y = anchorRect.top;
    } else if (alignment === "end") {
      y = anchorRect.bottom - floatingSize.height;
    }
  }

  return { x, y };
}

function wouldOverflow(
  x: number,
  y: number,
  floatingSize: { width: number; height: number },
  viewportRect: DOMRectLike,
  padding: number,
): { top: boolean; bottom: boolean; left: boolean; right: boolean } {
  return {
    top: y < viewportRect.top + padding,
    bottom: y + floatingSize.height > viewportRect.bottom - padding,
    left: x < viewportRect.left + padding,
    right: x + floatingSize.width > viewportRect.right - padding,
  };
}

export function computePosition(input: ComputePositionInput): FloatingPositionResult {
  const { anchorRect, floatingRect, viewportRect, options, isRtl = false } = input;
  const {
    placement: desiredPlacement = "bottom",
    offset = 0,
    flip: shouldFlip = true,
    shift: shouldShift = true,
    collisionPadding = 0,
  } = options;

  let { side } = parsePlacement(desiredPlacement);
  const { alignment } = parsePlacement(desiredPlacement);

  // Compute initial position
  let { x, y } = computeCoords(anchorRect, floatingRect, side, alignment, offset, isRtl);

  // Flip: try opposite side if overflowing on the main axis
  if (shouldFlip) {
    const overflow = wouldOverflow(x, y, floatingRect, viewportRect, collisionPadding);
    const needsFlip =
      (side === "top" && overflow.top) ||
      (side === "bottom" && overflow.bottom) ||
      (side === "left" && overflow.left) ||
      (side === "right" && overflow.right);

    if (needsFlip) {
      const flippedSide = getOppositeSide(side);
      const flipped = computeCoords(
        anchorRect,
        floatingRect,
        flippedSide,
        alignment,
        offset,
        isRtl,
      );
      const flippedOverflow = wouldOverflow(
        flipped.x,
        flipped.y,
        floatingRect,
        viewportRect,
        collisionPadding,
      );
      const flippedOverflows =
        (flippedSide === "top" && flippedOverflow.top) ||
        (flippedSide === "bottom" && flippedOverflow.bottom) ||
        (flippedSide === "left" && flippedOverflow.left) ||
        (flippedSide === "right" && flippedOverflow.right);

      if (!flippedOverflows) {
        side = flippedSide;
        x = flipped.x;
        y = flipped.y;
      }
    }
  }

  // Shift: clamp along the cross axis
  if (shouldShift) {
    if (side === "top" || side === "bottom") {
      const minX = viewportRect.left + collisionPadding;
      const maxX = viewportRect.right - collisionPadding - floatingRect.width;
      x = Math.max(minX, Math.min(x, maxX));
    } else {
      const minY = viewportRect.top + collisionPadding;
      const maxY = viewportRect.bottom - collisionPadding - floatingRect.height;
      y = Math.max(minY, Math.min(y, maxY));
    }
  }

  const resolvedPlacement = buildPlacement(side, alignment);

  return {
    x: Math.round(x),
    y: Math.round(y),
    placement: resolvedPlacement,
    transformOrigin: getTransformOrigin(resolvedPlacement),
  };
}

// ─── Arrow coordinates ──────────────────────────────────────────────

export interface ArrowPositionInput {
  anchorRect: DOMRectLike;
  floatingX: number;
  floatingY: number;
  floatingSize: { width: number; height: number };
  arrowSize: number;
  placement: Placement;
  collisionPadding?: number;
}

export interface ArrowPosition {
  x: number | undefined;
  y: number | undefined;
}

export function computeArrowPosition(input: ArrowPositionInput): ArrowPosition {
  const {
    anchorRect,
    floatingX,
    floatingY,
    floatingSize,
    arrowSize,
    placement,
    collisionPadding = 0,
  } = input;
  const { side } = parsePlacement(placement);
  const half = arrowSize / 2;
  const minPad = collisionPadding + half;

  if (side === "top" || side === "bottom") {
    const anchorCenter = anchorRect.left + anchorRect.width / 2;
    let arrowX = anchorCenter - floatingX - half;
    arrowX = Math.max(minPad, Math.min(arrowX, floatingSize.width - minPad - arrowSize));
    return { x: Math.round(arrowX), y: undefined };
  }

  const anchorCenter = anchorRect.top + anchorRect.height / 2;
  let arrowY = anchorCenter - floatingY - half;
  arrowY = Math.max(minPad, Math.min(arrowY, floatingSize.height - minPad - arrowSize));
  return { x: undefined, y: Math.round(arrowY) };
}
