// @kairoui/utils/dom — DOM-specific utilities
// Utilities that interact with browser APIs at runtime (guarded by canUseDOM).

export { isEventOutside, isNodeOutside } from "./outside";
export type { NodeLike, OutsideEventLike, IsOutsideOptions } from "./outside";

export { getOwnerDocument, getOwnerWindow } from "./owner";
export type { OwnerNode, OwnerDocument, OwnerWindow } from "./owner";

export {
  isNode,
  isElement,
  isHTMLElement,
  isSVGElement,
  isDocument,
  isWindow,
  isShadowRoot,
} from "./dom-guards";

export { isFocusable, isTabbable, getTabIndex } from "./focusable";
export type { FocusableElement } from "./focusable";

export {
  getActiveElement,
  getDeepActiveElement,
  containsActiveElement,
  hasFocusWithin,
} from "./active-element";
export type { ActiveElementDocument, ActiveElementNode } from "./active-element";
