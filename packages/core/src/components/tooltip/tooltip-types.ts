import { createContext, useContext } from "react";
import type { Placement } from "../overlay/overlay-types";
import type { ArrowPosition } from "../overlay/floating-position";

export interface TooltipContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contentId: string;
  triggerId: string;
  setAnchorNode: (el: HTMLElement | null) => void;
  setFloating: (el: HTMLElement | null) => void;
  placement: Placement;
  arrowPosition: ArrowPosition;
  floatingX: number;
  floatingY: number;
  transformOrigin: string;
  handleTriggerEnter: () => void;
  handleTriggerLeave: () => void;
}

export const TooltipContext = createContext<TooltipContextValue | null>(null);
TooltipContext.displayName = "TooltipContext";

export function useTooltipContext(): TooltipContextValue {
  const ctx = useContext(TooltipContext);
  if (ctx === null) {
    throw new Error("Tooltip compound components must be used within <Tooltip>.");
  }
  return ctx;
}
