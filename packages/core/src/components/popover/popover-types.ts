import { createContext, useContext } from "react";
import type { RefObject } from "react";
import type { Placement } from "../overlay/overlay-types";
import type { ArrowPosition } from "../overlay/floating-position";

export interface PopoverContextValue {
  open: boolean;
  modal: boolean;
  onOpenChange: (open: boolean) => void;
  titleId: string;
  descriptionId: string;
  contentId: string;
  triggerId: string;
  anchorRef: RefObject<HTMLElement | null>;
  setAnchorNode: (el: HTMLElement | null) => void;
  placement: Placement;
  arrowPosition: ArrowPosition;
  setFloating: (el: HTMLElement | null) => void;
  floatingX: number;
  floatingY: number;
  transformOrigin: string;
}

export const PopoverContext = createContext<PopoverContextValue | null>(null);
PopoverContext.displayName = "PopoverContext";

export function usePopoverContext(): PopoverContextValue {
  const ctx = useContext(PopoverContext);
  if (ctx === null) {
    throw new Error("Popover compound components must be used within <Popover>.");
  }
  return ctx;
}
