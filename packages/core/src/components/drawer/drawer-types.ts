import { createContext, useContext } from "react";

export type DrawerSide = "left" | "right" | "top" | "bottom";

export interface DrawerContextValue {
  open: boolean;
  side: DrawerSide;
  onOpenChange: (open: boolean) => void;
  titleId: string;
  descriptionId: string;
  contentId: string;
  triggerId: string;
}

export const DrawerContext = createContext<DrawerContextValue | null>(null);
DrawerContext.displayName = "DrawerContext";

export function useDrawerContext(): DrawerContextValue {
  const ctx = useContext(DrawerContext);
  if (ctx === null) {
    throw new Error("Drawer compound components must be used within <Drawer>.");
  }
  return ctx;
}
