/** Minimal pointer/mouse event shape — no React or DOM dependency. */
export interface PointerEventLike {
  button?: number;
  buttons?: number;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  pointerType?: string;
  clientX?: number;
  clientY?: number;
  pageX?: number;
  pageY?: number;
  detail?: number;
}

/** Pointer type values. */
export type PointerType = "mouse" | "touch" | "pen" | "unknown";

/** Returns true if the event is a primary (left) button click. */
export function isPrimaryPointer(event: PointerEventLike): boolean {
  return event.button === 0;
}

/** Returns true if the event is a left mouse button click (button 0). */
export function isLeftClick(event: PointerEventLike): boolean {
  return event.button === 0;
}

/** Returns true if the event is a right mouse button click (button 2). */
export function isRightClick(event: PointerEventLike): boolean {
  return event.button === 2;
}

/** Returns true if the event is a middle mouse button click (button 1). */
export function isMiddleClick(event: PointerEventLike): boolean {
  return event.button === 1;
}

/** Returns true if any modifier key was held during the click. */
export function isModifiedClick(event: PointerEventLike): boolean {
  return Boolean(event.ctrlKey || event.shiftKey || event.altKey || event.metaKey);
}

/** Returns true if the pointer type is touch. */
export function isTouchPointer(event: PointerEventLike): boolean {
  return event.pointerType === "touch";
}

/** Returns true if the pointer type is pen/stylus. */
export function isPenPointer(event: PointerEventLike): boolean {
  return event.pointerType === "pen";
}

/** Returns true if the pointer type is mouse. */
export function isMousePointer(event: PointerEventLike): boolean {
  return event.pointerType === "mouse";
}

/**
 * Returns true if the event appears to be a virtual/programmatic click.
 * Virtual clicks have detail === 0 and coordinates at 0,0 or undefined.
 */
export function isVirtualClick(event: PointerEventLike): boolean {
  if (event.detail !== 0) return false;
  return (
    (event.clientX === 0 && event.clientY === 0) ||
    (event.clientX === undefined && event.clientY === undefined)
  );
}

/** Extracts client coordinates from a pointer event. */
export function getPointerCoordinates(event: PointerEventLike): {
  clientX: number;
  clientY: number;
  pageX: number;
  pageY: number;
} {
  return {
    clientX: event.clientX ?? 0,
    clientY: event.clientY ?? 0,
    pageX: event.pageX ?? 0,
    pageY: event.pageY ?? 0,
  };
}

/** Normalizes the pointer type from an event into a known type. */
export function normalizePointerType(event: PointerEventLike): PointerType {
  switch (event.pointerType) {
    case "mouse":
      return "mouse";
    case "touch":
      return "touch";
    case "pen":
      return "pen";
    default:
      return "unknown";
  }
}
