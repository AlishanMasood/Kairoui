import { createContext, useContext } from "react";

export interface DialogContextValue {
  open: boolean;
  modal: boolean;
  onOpenChange: (open: boolean) => void;
  titleId: string;
  descriptionId: string;
  contentId: string;
  triggerId: string;
}

export const DialogContext = createContext<DialogContextValue | null>(null);
DialogContext.displayName = "DialogContext";

export function useDialogContext(): DialogContextValue {
  const ctx = useContext(DialogContext);
  if (ctx === null) {
    throw new Error("Dialog compound components must be used within <Dialog>.");
  }
  return ctx;
}
