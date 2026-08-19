import { createContext, useContext } from "react";
import type { RefObject } from "react";

export interface AlertDialogContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  titleId: string;
  descriptionId: string;
  contentId: string;
  triggerId: string;
  cancelRef: RefObject<HTMLButtonElement | null>;
  setCancelNode: (node: HTMLButtonElement | null) => void;
}

export const AlertDialogContext = createContext<AlertDialogContextValue | null>(null);
AlertDialogContext.displayName = "AlertDialogContext";

export function useAlertDialogContext(): AlertDialogContextValue {
  const ctx = useContext(AlertDialogContext);
  if (ctx === null) {
    throw new Error("AlertDialog compound components must be used within <AlertDialog>.");
  }
  return ctx;
}
