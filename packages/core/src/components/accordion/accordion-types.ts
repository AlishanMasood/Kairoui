import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import type { Orientation } from "../navigation/navigation-types";

// ─── Accordion Root Props ───────────────────────────────────────────

export interface AccordionRootSingleProps {
  type: "single";
  /** Controlled open item value. */
  value?: string;
  /** Initial open item for uncontrolled mode. */
  defaultValue?: string;
  /** Called when open item changes. Empty string when collapsed. */
  onValueChange?: (value: string) => void;
  /** Allow closing all items (only for single type). Defaults to false. */
  collapsible?: boolean;
  /** Keyboard orientation. Defaults to "vertical". */
  orientation?: Orientation;
  dir?: "ltr" | "rtl";
  /** Disable all items. */
  disabled?: boolean;
  className?: string;
  children?: ReactNode;
}

export interface AccordionRootMultipleProps {
  type: "multiple";
  /** Controlled open items. */
  value?: string[];
  /** Initial open items for uncontrolled mode. */
  defaultValue?: string[];
  /** Called when open items change. */
  onValueChange?: (value: string[]) => void;
  /** Keyboard orientation. Defaults to "vertical". */
  orientation?: Orientation;
  dir?: "ltr" | "rtl";
  /** Disable all items. */
  disabled?: boolean;
  className?: string;
  children?: ReactNode;
}

export type AccordionRootProps = AccordionRootSingleProps | AccordionRootMultipleProps;

// ─── Accordion Item Props ───────────────────────────────────────────

export interface AccordionItemRootProps {
  /** Unique value identifying this item. */
  value: string;
  /** Disable this item. */
  disabled?: boolean;
  className?: string;
  children?: ReactNode;
}

// ─── Accordion Header Props ─────────────────────────────────────────

export interface AccordionHeaderProps {
  /** Heading level (h1-h6). Defaults to h3. */
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  className?: string;
  children?: ReactNode;
}

// ─── Accordion Trigger Props ────────────────────────────────────────

export interface AccordionTriggerRootProps {
  className?: string;
  children?: ReactNode;
}

// ─── Accordion Content Props ────────────────────────────────────────

export interface AccordionContentRootProps {
  /** Force mount (useful for CSS animations). Defaults to false. */
  forceMount?: boolean;
  className?: string;
  children?: ReactNode;
}

// ─── Accordion Context ──────────────────────────────────────────────

export interface AccordionInternalContextValue {
  type: "single" | "multiple";
  value: string[];
  onItemToggle: (itemValue: string) => void;
  collapsible: boolean;
  orientation: Orientation;
  dir: "ltr" | "rtl";
  disabled: boolean;
  baseId: string;
}

export const AccordionInternalContext = createContext<AccordionInternalContextValue | null>(null);
AccordionInternalContext.displayName = "AccordionInternalContext";

export function useAccordionInternalContext(): AccordionInternalContextValue {
  const ctx = useContext(AccordionInternalContext);
  if (ctx === null) {
    throw new Error("Accordion compound components must be used within <Accordion>.");
  }
  return ctx;
}

// ─── Accordion Item Context ─────────────────────────────────────────

export interface AccordionItemInternalContextValue {
  value: string;
  open: boolean;
  disabled: boolean;
  triggerId: string;
  contentId: string;
}

export const AccordionItemInternalContext = createContext<AccordionItemInternalContextValue | null>(
  null,
);
AccordionItemInternalContext.displayName = "AccordionItemInternalContext";

export function useAccordionItemInternalContext(): AccordionItemInternalContextValue {
  const ctx = useContext(AccordionItemInternalContext);
  if (ctx === null) {
    throw new Error("AccordionTrigger/Header/Content must be used within <AccordionItem>.");
  }
  return ctx;
}

// ─── ID generation helpers ──────────────────────────────────────────

export function getAccordionTriggerId(baseId: string, value: string): string {
  return `${baseId}-trigger-${value}`;
}

export function getAccordionContentId(baseId: string, value: string): string {
  return `${baseId}-content-${value}`;
}
