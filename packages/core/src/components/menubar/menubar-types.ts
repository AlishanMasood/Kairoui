import { createContext, useContext } from "react";
import type { ReactNode, RefObject } from "react";

// ─── Menubar Root Props ─────────────────────────────────────────────

export interface MenubarRootProps {
  /** Currently open menu value. */
  value?: string;
  /** Called when open menu changes. Empty string when all closed. */
  onValueChange?: (value: string) => void;
  /** Text direction. */
  dir?: "ltr" | "rtl";
  /** Loop trigger navigation. Defaults to true. */
  loop?: boolean;
  children?: ReactNode;
  className?: string;
}

// ─── Menubar Menu Props ─────────────────────────────────────────────

export interface MenubarMenuProps {
  /** Unique value identifying this menu. */
  value: string;
  children?: ReactNode;
}

// ─── Menubar Trigger Props ──────────────────────────────────────────

export interface MenubarTriggerProps {
  disabled?: boolean;
  className?: string;
  children?: ReactNode;
}

// ─── Menubar Content Props ──────────────────────────────────────────

export interface MenubarContentProps {
  /** Loop item navigation. */
  loop?: boolean;
  /** Called on Escape. */
  onEscapeKeyDown?: (event: KeyboardEvent) => void;
  className?: string;
  children?: ReactNode;
}

// ─── Menubar Context ────────────────────────────────────────────────

export interface MenubarContextValue {
  /** Currently open menu value (empty = all closed). */
  value: string;
  onValueChange: (value: string) => void;
  dir: "ltr" | "rtl";
  loop: boolean;
  /** Whether any menu is open (enables pointer-hover switching). */
  hasOpenMenu: boolean;
  triggerRefs: RefObject<Map<string, HTMLElement>>;
  registerTrigger: (value: string, element: HTMLElement) => () => void;
  /** Value of the trigger that currently owns tabIndex=0. */
  rovingValue: string;
  setRovingValue: (value: string) => void;
}

export const MenubarContext = createContext<MenubarContextValue | null>(null);
MenubarContext.displayName = "MenubarContext";

export function useMenubarContext(): MenubarContextValue {
  const ctx = useContext(MenubarContext);
  if (ctx === null) {
    throw new Error("Menubar compound components must be used within <Menubar>.");
  }
  return ctx;
}

// ─── Menubar Menu Context ───────────────────────────────────────────

export interface MenubarMenuContextValue {
  value: string;
  open: boolean;
  triggerId: string;
  contentId: string;
}

export const MenubarMenuContext = createContext<MenubarMenuContextValue | null>(null);
MenubarMenuContext.displayName = "MenubarMenuContext";

export function useMenubarMenuContext(): MenubarMenuContextValue {
  const ctx = useContext(MenubarMenuContext);
  if (ctx === null) {
    throw new Error("MenubarTrigger/Content must be used within <MenubarMenu>.");
  }
  return ctx;
}
