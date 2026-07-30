/**
 * Surface and Overlay Token Contracts
 *
 * Design decisions for surfaces (card, dialog, drawer, etc.) without
 * implementing components. References semantic elevation, border, motion,
 * and z-index tokens.
 *
 * Not every surface is elevated — cards use borders by default.
 */

import { neutral } from "../primitives/colors";
import { spacing } from "../primitives/spacing";
import { radius } from "../primitives/borders";
import { shadow } from "../primitives/shadows";
import { zIndex } from "../primitives/layering";
import { duration, easing } from "../primitives/motion";

// ─── Types ───────────────────────────────────────────────────────────

export interface SurfaceTokens {
  readonly background: string;
  readonly text: string;
  readonly border: string;
  readonly radius: string;
  readonly shadow: string;
  readonly padding: string;
}

export interface CardContract {
  readonly background: string;
  readonly text: string;
  readonly border: string;
  readonly radius: string;
  readonly shadow: string;
  readonly padding: string;
  readonly gap: string;
  readonly headerBorder: string;
  readonly footerBorder: string;
}

export interface DialogContract {
  readonly background: string;
  readonly text: string;
  readonly border: string;
  readonly radius: string;
  readonly shadow: string;
  readonly padding: string;
  readonly gap: string;
  readonly maxWidth: string;
  readonly maxHeight: string;
  readonly backdrop: string;
  readonly zIndex: number;
  readonly headerBorder: string;
  readonly footerBorder: string;
  readonly transition: { readonly duration: string; readonly easing: string };
}

export interface DrawerContract {
  readonly background: string;
  readonly text: string;
  readonly border: string;
  readonly shadow: string;
  readonly padding: string;
  readonly gap: string;
  readonly maxWidth: string;
  readonly backdrop: string;
  readonly zIndex: number;
  readonly headerBorder: string;
  readonly transition: { readonly duration: string; readonly easing: string };
}

export interface MenuContract {
  readonly background: string;
  readonly text: string;
  readonly border: string;
  readonly radius: string;
  readonly shadow: string;
  readonly padding: string;
  readonly itemGap: string;
  readonly itemPadding: string;
  readonly itemRadius: string;
  readonly itemHoverBackground: string;
  readonly maxHeight: string;
  readonly zIndex: number;
  readonly transition: { readonly duration: string; readonly easing: string };
}

export interface PopoverContract {
  readonly background: string;
  readonly text: string;
  readonly border: string;
  readonly radius: string;
  readonly shadow: string;
  readonly padding: string;
  readonly maxWidth: string;
  readonly zIndex: number;
  readonly transition: { readonly duration: string; readonly easing: string };
}

export interface TooltipContract {
  readonly background: string;
  readonly text: string;
  readonly radius: string;
  readonly padding: string;
  readonly maxWidth: string;
  readonly zIndex: number;
  readonly transition: { readonly duration: string; readonly easing: string };
}

export interface ToastContract {
  readonly background: string;
  readonly text: string;
  readonly border: string;
  readonly radius: string;
  readonly shadow: string;
  readonly padding: string;
  readonly gap: string;
  readonly maxWidth: string;
  readonly zIndex: number;
  readonly transition: { readonly duration: string; readonly easing: string };
}

export interface SurfaceContracts {
  readonly card: CardContract;
  readonly dialog: DialogContract;
  readonly drawer: DrawerContract;
  readonly menu: MenuContract;
  readonly popover: PopoverContract;
  readonly tooltip: TooltipContract;
  readonly toast: ToastContract;
}

// ─── Default Values ──────────────────────────────────────────────────

export const surfaceTokens: SurfaceContracts = {
  card: {
    background: "#ffffff",
    text: neutral["900"],
    border: neutral["200"],
    radius: radius.lg,
    shadow: shadow.none,
    padding: spacing["5"],
    gap: spacing["4"],
    headerBorder: neutral["100"],
    footerBorder: neutral["100"],
  },
  dialog: {
    background: "#ffffff",
    text: neutral["900"],
    border: neutral["200"],
    radius: radius.xl,
    shadow: shadow.lg,
    padding: spacing["6"],
    gap: spacing["4"],
    maxWidth: "32rem",
    maxHeight: "85vh",
    backdrop: "rgba(19, 24, 34, 0.6)",
    zIndex: zIndex.modal,
    headerBorder: neutral["100"],
    footerBorder: neutral["100"],
    transition: { duration: duration.slow, easing: easing.out },
  },
  drawer: {
    background: "#ffffff",
    text: neutral["900"],
    border: neutral["200"],
    shadow: shadow.xl,
    padding: spacing["6"],
    gap: spacing["4"],
    maxWidth: "24rem",
    backdrop: "rgba(19, 24, 34, 0.6)",
    zIndex: zIndex.overlay,
    headerBorder: neutral["100"],
    transition: { duration: duration.slow, easing: easing.out },
  },
  menu: {
    background: "#ffffff",
    text: neutral["900"],
    border: neutral["200"],
    radius: radius.lg,
    shadow: shadow.md,
    padding: spacing["1"],
    itemGap: spacing["0.5"],
    itemPadding: spacing["2"],
    itemRadius: radius.sm,
    itemHoverBackground: neutral["100"],
    maxHeight: "20rem",
    zIndex: zIndex.dropdown,
    transition: { duration: duration.normal, easing: easing.out },
  },
  popover: {
    background: "#ffffff",
    text: neutral["900"],
    border: neutral["200"],
    radius: radius.lg,
    shadow: shadow.md,
    padding: spacing["4"],
    maxWidth: "20rem",
    zIndex: zIndex.dropdown,
    transition: { duration: duration.normal, easing: easing.out },
  },
  tooltip: {
    background: neutral["900"],
    text: "#ffffff",
    radius: radius.sm,
    padding: spacing["1.5"],
    maxWidth: "16rem",
    zIndex: zIndex.dropdown,
    transition: { duration: duration.fast, easing: easing.out },
  },
  toast: {
    background: "#ffffff",
    text: neutral["900"],
    border: neutral["200"],
    radius: radius.lg,
    shadow: shadow.lg,
    padding: spacing["4"],
    gap: spacing["3"],
    maxWidth: "24rem",
    zIndex: zIndex.toast,
    transition: { duration: duration.normal, easing: easing.out },
  },
} as const;
