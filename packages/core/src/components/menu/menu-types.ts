import { createContext, useContext } from "react";
import type { ReactNode, RefObject } from "react";
import type { Placement } from "../overlay/overlay-types";

// ─── Menu Item Model ────────────────────────────────────────────────

export interface MenuItemData {
  value: string;
  label: string;
  disabled?: boolean;
  textContent?: string;
}

// ─── Root ───────────────────────────────────────────────────────────

export interface MenuRootProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Direction for RTL-aware sub-menu opening. */
  dir?: "ltr" | "rtl";
  children?: ReactNode;
}

// ─── Trigger ────────────────────────────────────────────────────────

export interface MenuTriggerProps {
  children?: ReactNode;
  className?: string;
  /** When true, prevents default and opens on context-menu event. */
  asContextTrigger?: boolean;
}

// ─── Content ────────────────────────────────────────────────────────

export interface MenuContentProps {
  /** Preferred placement relative to trigger. */
  placement?: Placement;
  /** Offset from anchor in px. */
  offset?: number;
  /** Flip when overflowing viewport. */
  flip?: boolean;
  /** Shift along cross axis to stay in viewport. */
  shift?: boolean;
  /** Collision padding from viewport edges. */
  collisionPadding?: number;
  /** Called on Escape key. */
  onEscapeKeyDown?: (event: KeyboardEvent) => void;
  /** Called on pointer-down outside. */
  onPointerDownOutside?: (event: PointerEvent) => void;
  /** Loop keyboard navigation. */
  loop?: boolean;
  className?: string;
  children?: ReactNode;
}

// ─── Item ───────────────────────────────────────────────────────────

export interface MenuItemProps {
  /** Called when item is activated (click or Enter/Space). */
  onSelect?: () => void;
  disabled?: boolean;
  /** Value for typeahead matching. Falls back to text content. */
  textValue?: string;
  children?: ReactNode;
  className?: string;
}

// ─── Checkbox Item ──────────────────────────────────────────────────

export interface MenuCheckboxItemProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  onSelect?: () => void;
  disabled?: boolean;
  textValue?: string;
  children?: ReactNode;
  className?: string;
}

// ─── Radio Group ────────────────────────────────────────────────────

export interface MenuRadioGroupProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  children?: ReactNode;
}

// ─── Radio Item ─────────────────────────────────────────────────────

export interface MenuRadioItemProps {
  value: string;
  onSelect?: () => void;
  disabled?: boolean;
  textValue?: string;
  children?: ReactNode;
  className?: string;
}

// ─── Item Indicator ─────────────────────────────────────────────────

export interface MenuItemIndicatorProps {
  children?: ReactNode;
  className?: string;
}

// ─── Group / Label / Separator ──────────────────────────────────────

export interface MenuGroupProps {
  children?: ReactNode;
  className?: string;
}

export interface MenuLabelProps {
  children?: ReactNode;
  className?: string;
}

export interface MenuSeparatorProps {
  className?: string;
}

// ─── Sub ────────────────────────────────────────────────────────────

export interface MenuSubProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: ReactNode;
}

export interface MenuSubTriggerProps {
  disabled?: boolean;
  textValue?: string;
  children?: ReactNode;
  className?: string;
}

export interface MenuSubContentProps {
  /** Offset from parent menu. */
  offset?: number;
  /** Called on Escape. */
  onEscapeKeyDown?: (event: KeyboardEvent) => void;
  loop?: boolean;
  className?: string;
  children?: ReactNode;
}

// ─── Arrow ──────────────────────────────────────────────────────────

export interface MenuArrowProps {
  width?: number;
  height?: number;
  className?: string;
}

// ─── Context (shared between DropdownMenu and ContextMenu) ──────────

export interface MenuContextValue {
  open: boolean;
  dir: "ltr" | "rtl";
  highlightedValue: string | undefined;
  onOpenChange: (open: boolean) => void;
  setHighlightedValue: (value: string | undefined) => void;
  onItemSelect: (value: string) => void;
  triggerId: string;
  contentId: string;
  triggerRef: RefObject<HTMLElement | null>;
  contentRef: RefObject<HTMLElement | null>;
  setTriggerNode: (node: HTMLElement | null) => void;
  setContentNode: (node: HTMLElement | null) => void;
}

export const MenuContext = createContext<MenuContextValue | null>(null);
MenuContext.displayName = "MenuContext";

export function useMenuContext(): MenuContextValue {
  const ctx = useContext(MenuContext);
  if (ctx === null) {
    throw new Error("Menu compound components must be used within a Menu root.");
  }
  return ctx;
}

// ─── Radio Group Context ────────────────────────────────────────────

export interface MenuRadioGroupContextValue {
  value: string | undefined;
  onValueChange: (value: string) => void;
}

export const MenuRadioGroupContext = createContext<MenuRadioGroupContextValue | null>(null);
MenuRadioGroupContext.displayName = "MenuRadioGroupContext";

export function useMenuRadioGroupContext(): MenuRadioGroupContextValue | null {
  return useContext(MenuRadioGroupContext);
}

// ─── Sub Menu Context ───────────────────────────────────────────────

export interface MenuSubContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  triggerId: string;
  contentId: string;
  triggerRef: RefObject<HTMLElement | null>;
}

export const MenuSubContext = createContext<MenuSubContextValue | null>(null);
MenuSubContext.displayName = "MenuSubContext";

export function useMenuSubContext(): MenuSubContextValue | null {
  return useContext(MenuSubContext);
}
