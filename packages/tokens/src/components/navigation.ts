/**
 * Navigation and Status Token Contracts
 *
 * Includes the Kairo Active Rail — a signature active-state indicator
 * for navigation components. Not all navigation uses the rail; it's
 * applied only where it enhances clarity (tabs, sidebar nav).
 */

import { neutral, blue, green, red, orange, teal } from "../primitives/colors";
import { spacing } from "../primitives/spacing";
import { radius } from "../primitives/borders";
import { fontSize, fontWeight } from "../primitives/typography";
import { duration, easing } from "../primitives/motion";
import { sharedControlTokens } from "../controls";

// ─── Kairo Active Rail ───────────────────────────────────────────────

/** The signature active-state indicator for KairoUI navigation */
export interface ActiveRailContract {
  readonly thickness: string;
  readonly color: string;
  readonly radius: string;
  readonly offset: string;
  readonly transition: { readonly duration: string; readonly easing: string };
}

export const activeRail: ActiveRailContract = {
  thickness: "2px",
  color: blue["600"],
  radius: radius.full,
  offset: "0",
  transition: { duration: duration.normal, easing: easing.out },
} as const;

// ─── Tabs ────────────────────────────────────────────────────────────

export interface TabsContract {
  readonly text: string;
  readonly textHover: string;
  readonly textActive: string;
  readonly textDisabled: string;
  readonly background: string;
  readonly backgroundHover: string;
  readonly padding: string;
  readonly gap: string;
  readonly fontSize: string;
  readonly fontWeight: string | number;
  readonly rail: ActiveRailContract;
  readonly focusRing: { readonly width: string; readonly offset: string; readonly color: string };
  readonly transition: { readonly duration: string; readonly easing: string };
}

export const tabsTokens: TabsContract = {
  text: neutral["600"],
  textHover: neutral["800"],
  textActive: blue["600"],
  textDisabled: neutral["400"],
  background: "transparent",
  backgroundHover: neutral["50"],
  padding: spacing["3"],
  gap: spacing["1"],
  fontSize: fontSize.sm,
  fontWeight: fontWeight.medium,
  rail: activeRail,
  focusRing: {
    width: sharedControlTokens.focus.ringWidth,
    offset: sharedControlTokens.focus.ringOffset,
    color: sharedControlTokens.focus.ringColor,
  },
  transition: { duration: duration.fast, easing: easing.default },
} as const;

// ─── Breadcrumbs ─────────────────────────────────────────────────────

export interface BreadcrumbsContract {
  readonly text: string;
  readonly textCurrent: string;
  readonly textHover: string;
  readonly separator: { readonly color: string; readonly gap: string };
  readonly fontSize: string;
}

export const breadcrumbsTokens: BreadcrumbsContract = {
  text: neutral["500"],
  textCurrent: neutral["900"],
  textHover: blue["600"],
  separator: { color: neutral["300"], gap: spacing["1.5"] },
  fontSize: fontSize.sm,
} as const;

// ─── Pagination ──────────────────────────────────────────────────────

export interface PaginationContract {
  readonly text: string;
  readonly textActive: string;
  readonly background: string;
  readonly backgroundHover: string;
  readonly backgroundActive: string;
  readonly border: string;
  readonly borderActive: string;
  readonly size: string;
  readonly radius: string;
  readonly gap: string;
  readonly fontSize: string;
  readonly disabledOpacity: string;
}

export const paginationTokens: PaginationContract = {
  text: neutral["700"],
  textActive: blue["700"],
  background: "transparent",
  backgroundHover: neutral["100"],
  backgroundActive: blue["50"],
  border: "transparent",
  borderActive: blue["200"],
  size: sharedControlTokens.size.sm.height,
  radius: radius.md,
  gap: spacing["0.5"],
  fontSize: fontSize.sm,
  disabledOpacity: "0.4",
} as const;

// ─── Menu Item ───────────────────────────────────────────────────────

export interface MenuItemContract {
  readonly text: string;
  readonly textHover: string;
  readonly textDisabled: string;
  readonly icon: string;
  readonly iconHover: string;
  readonly background: string;
  readonly backgroundHover: string;
  readonly backgroundActive: string;
  readonly padding: string;
  readonly radius: string;
  readonly gap: string;
  readonly fontSize: string;
  readonly shortcutColor: string;
  readonly destructiveText: string;
  readonly destructiveIcon: string;
}

export const menuItemTokens: MenuItemContract = {
  text: neutral["800"],
  textHover: neutral["900"],
  textDisabled: neutral["400"],
  icon: neutral["500"],
  iconHover: neutral["700"],
  background: "transparent",
  backgroundHover: neutral["100"],
  backgroundActive: neutral["200"],
  padding: spacing["2"],
  radius: radius.sm,
  gap: spacing["2"],
  fontSize: fontSize.base,
  shortcutColor: neutral["400"],
  destructiveText: red["600"],
  destructiveIcon: red["500"],
} as const;

// ─── Badge ───────────────────────────────────────────────────────────

export interface BadgeContract {
  readonly background: string;
  readonly text: string;
  readonly border: string;
  readonly radius: string;
  readonly paddingX: string;
  readonly paddingY: string;
  readonly fontSize: string;
  readonly fontWeight: string | number;
}

export interface BadgeVariants {
  readonly default: BadgeContract;
  readonly outline: BadgeContract;
}

export const badgeTokens: BadgeVariants = {
  default: {
    background: neutral["100"],
    text: neutral["800"],
    border: "transparent",
    radius: radius.full,
    paddingX: spacing["2"],
    paddingY: spacing["0.5"],
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  outline: {
    background: "transparent",
    text: neutral["700"],
    border: neutral["300"],
    radius: radius.full,
    paddingX: spacing["2"],
    paddingY: spacing["0.5"],
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
} as const;

// ─── Status Badge ────────────────────────────────────────────────────

/** Status indicator combining color + shape (dot/icon) — never color alone */
export interface StatusBadgeContract {
  readonly dot: { readonly size: string; readonly radius: string };
  readonly text: { readonly fontSize: string; readonly fontWeight: string | number };
  readonly gap: string;
  readonly variants: {
    readonly success: {
      readonly dotColor: string;
      readonly textColor: string;
      readonly background: string;
      readonly border: string;
    };
    readonly warning: {
      readonly dotColor: string;
      readonly textColor: string;
      readonly background: string;
      readonly border: string;
    };
    readonly error: {
      readonly dotColor: string;
      readonly textColor: string;
      readonly background: string;
      readonly border: string;
    };
    readonly info: {
      readonly dotColor: string;
      readonly textColor: string;
      readonly background: string;
      readonly border: string;
    };
    readonly neutral: {
      readonly dotColor: string;
      readonly textColor: string;
      readonly background: string;
      readonly border: string;
    };
  };
}

export const statusBadgeTokens: StatusBadgeContract = {
  dot: { size: "0.5rem", radius: radius.full },
  text: { fontSize: fontSize.xs, fontWeight: fontWeight.medium },
  gap: spacing["1.5"],
  variants: {
    success: {
      dotColor: green["500"],
      textColor: green["700"],
      background: green["50"],
      border: green["200"],
    },
    warning: {
      dotColor: orange["500"],
      textColor: orange["700"],
      background: orange["50"],
      border: orange["200"],
    },
    error: {
      dotColor: red["500"],
      textColor: red["700"],
      background: red["50"],
      border: red["200"],
    },
    info: {
      dotColor: teal["500"],
      textColor: teal["700"],
      background: teal["50"],
      border: teal["200"],
    },
    neutral: {
      dotColor: neutral["400"],
      textColor: neutral["700"],
      background: neutral["50"],
      border: neutral["200"],
    },
  },
} as const;

// ─── Alert ───────────────────────────────────────────────────────────

export interface AlertContract {
  readonly padding: string;
  readonly gap: string;
  readonly radius: string;
  readonly border: string;
  readonly fontSize: string;
  readonly titleFontWeight: string | number;
  readonly iconSize: string;
  readonly variants: {
    readonly success: {
      readonly background: string;
      readonly text: string;
      readonly border: string;
      readonly icon: string;
    };
    readonly warning: {
      readonly background: string;
      readonly text: string;
      readonly border: string;
      readonly icon: string;
    };
    readonly error: {
      readonly background: string;
      readonly text: string;
      readonly border: string;
      readonly icon: string;
    };
    readonly info: {
      readonly background: string;
      readonly text: string;
      readonly border: string;
      readonly icon: string;
    };
  };
}

export const alertTokens: AlertContract = {
  padding: spacing["4"],
  gap: spacing["3"],
  radius: radius.md,
  border: "1px solid",
  fontSize: fontSize.sm,
  titleFontWeight: fontWeight.semibold,
  iconSize: "1.25rem",
  variants: {
    success: {
      background: green["50"],
      text: green["800"],
      border: green["200"],
      icon: green["500"],
    },
    warning: {
      background: orange["50"],
      text: orange["800"],
      border: orange["200"],
      icon: orange["500"],
    },
    error: { background: red["50"], text: red["800"], border: red["200"], icon: red["500"] },
    info: { background: teal["50"], text: teal["800"], border: teal["200"], icon: teal["500"] },
  },
} as const;

// ─── Combined ────────────────────────────────────────────────────────

export interface NavigationContracts {
  readonly activeRail: ActiveRailContract;
  readonly tabs: TabsContract;
  readonly breadcrumbs: BreadcrumbsContract;
  readonly pagination: PaginationContract;
  readonly menuItem: MenuItemContract;
  readonly badge: BadgeVariants;
  readonly statusBadge: StatusBadgeContract;
  readonly alert: AlertContract;
}

export const navigationTokens: NavigationContracts = {
  activeRail,
  tabs: tabsTokens,
  breadcrumbs: breadcrumbsTokens,
  pagination: paginationTokens,
  menuItem: menuItemTokens,
  badge: badgeTokens,
  statusBadge: statusBadgeTokens,
  alert: alertTokens,
} as const;
