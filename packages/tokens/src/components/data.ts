/**
 * Data Presentation Token Contracts
 *
 * Tokens for Table, DataTable, TreeView, Timeline, Calendar, and
 * supporting data display components.
 */

import { neutral, blue } from "../primitives/colors";
import { spacing } from "../primitives/spacing";
import { radius } from "../primitives/borders";
import { fontSize, fontWeight } from "../primitives/typography";
import { duration, easing } from "../primitives/motion";

// ─── Table ───────────────────────────────────────────────────────────

export interface TableContract {
  readonly headerBackground: string;
  readonly headerText: string;
  readonly headerFontSize: string;
  readonly headerFontWeight: string | number;
  readonly cellText: string;
  readonly cellFontSize: string;
  readonly cellPaddingX: string;
  readonly cellPaddingY: string;
  readonly borderColor: string;
  readonly stripedBackground: string;
  readonly hoverBackground: string;
  readonly selectedBackground: string;
  readonly selectedBorder: string;
  readonly radius: string;
}

export const tableTokens: TableContract = {
  headerBackground: neutral["50"],
  headerText: neutral["700"],
  headerFontSize: fontSize.xs,
  headerFontWeight: fontWeight.semibold,
  cellText: neutral["800"],
  cellFontSize: fontSize.sm,
  cellPaddingX: spacing["4"],
  cellPaddingY: spacing["3"],
  borderColor: neutral["200"],
  stripedBackground: neutral["50"],
  hoverBackground: neutral["50"],
  selectedBackground: blue["50"],
  selectedBorder: blue["200"],
  radius: radius.md,
} as const;

// ─── TreeView ────────────────────────────────────────────────────────

export interface TreeViewContract {
  readonly text: string;
  readonly textHover: string;
  readonly textSelected: string;
  readonly textDisabled: string;
  readonly background: string;
  readonly backgroundHover: string;
  readonly backgroundSelected: string;
  readonly indentSize: string;
  readonly itemPaddingY: string;
  readonly itemPaddingX: string;
  readonly itemRadius: string;
  readonly iconSize: string;
  readonly iconColor: string;
  readonly expandTransition: { readonly duration: string; readonly easing: string };
}

export const treeViewTokens: TreeViewContract = {
  text: neutral["800"],
  textHover: neutral["900"],
  textSelected: blue["700"],
  textDisabled: neutral["400"],
  background: "transparent",
  backgroundHover: neutral["100"],
  backgroundSelected: blue["50"],
  indentSize: spacing["5"],
  itemPaddingY: spacing["1.5"],
  itemPaddingX: spacing["2"],
  itemRadius: radius.sm,
  iconSize: "1rem",
  iconColor: neutral["500"],
  expandTransition: { duration: duration.fast, easing: easing.default },
} as const;

// ─── Timeline ────────────────────────────────────────────────────────

export interface TimelineContract {
  readonly connectorColor: string;
  readonly connectorWidth: string;
  readonly indicatorSize: string;
  readonly indicatorBackground: string;
  readonly indicatorBorder: string;
  readonly indicatorRadius: string;
  readonly titleFontSize: string;
  readonly titleFontWeight: string | number;
  readonly descriptionFontSize: string;
  readonly descriptionColor: string;
  readonly gap: string;
  readonly itemGap: string;
}

export const timelineTokens: TimelineContract = {
  connectorColor: neutral["200"],
  connectorWidth: "2px",
  indicatorSize: "2rem",
  indicatorBackground: neutral["100"],
  indicatorBorder: neutral["300"],
  indicatorRadius: radius.full,
  titleFontSize: fontSize.sm,
  titleFontWeight: fontWeight.medium,
  descriptionFontSize: fontSize.sm,
  descriptionColor: neutral["600"],
  gap: spacing["3"],
  itemGap: spacing["6"],
} as const;

// ─── Calendar ────────────────────────────────────────────────────────

export interface CalendarContract {
  readonly headerFontSize: string;
  readonly headerFontWeight: string | number;
  readonly daySize: string;
  readonly dayFontSize: string;
  readonly dayRadius: string;
  readonly dayText: string;
  readonly dayTextHover: string;
  readonly dayBackground: string;
  readonly dayBackgroundHover: string;
  readonly todayText: string;
  readonly todayBackground: string;
  readonly todayBorder: string;
  readonly selectedText: string;
  readonly selectedBackground: string;
  readonly outsideMonthText: string;
  readonly disabledText: string;
  readonly weekdayFontSize: string;
  readonly weekdayColor: string;
  readonly navButtonSize: string;
  readonly gap: string;
}

export const calendarTokens: CalendarContract = {
  headerFontSize: fontSize.sm,
  headerFontWeight: fontWeight.semibold,
  daySize: "2.25rem",
  dayFontSize: fontSize.sm,
  dayRadius: radius.full,
  dayText: neutral["800"],
  dayTextHover: neutral["900"],
  dayBackground: "transparent",
  dayBackgroundHover: neutral["100"],
  todayText: blue["700"],
  todayBackground: "transparent",
  todayBorder: blue["200"],
  selectedText: "#ffffff",
  selectedBackground: blue["600"],
  outsideMonthText: neutral["400"],
  disabledText: neutral["300"],
  weekdayFontSize: fontSize.xs,
  weekdayColor: neutral["500"],
  navButtonSize: "1.75rem",
  gap: spacing["1"],
} as const;

// ─── EmptyState ──────────────────────────────────────────────────────

export interface EmptyStateContract {
  readonly iconSize: string;
  readonly iconColor: string;
  readonly titleFontSize: string;
  readonly titleFontWeight: string | number;
  readonly titleColor: string;
  readonly descriptionFontSize: string;
  readonly descriptionColor: string;
  readonly gap: string;
  readonly padding: string;
}

export const emptyStateTokens: EmptyStateContract = {
  iconSize: "3rem",
  iconColor: neutral["400"],
  titleFontSize: fontSize.base,
  titleFontWeight: fontWeight.semibold,
  titleColor: neutral["800"],
  descriptionFontSize: fontSize.sm,
  descriptionColor: neutral["500"],
  gap: spacing["3"],
  padding: spacing["8"],
} as const;

// ─── DescriptionList ─────────────────────────────────────────────────

export interface DescriptionListContract {
  readonly termFontSize: string;
  readonly termFontWeight: string | number;
  readonly termColor: string;
  readonly detailsFontSize: string;
  readonly detailsColor: string;
  readonly gap: string;
  readonly itemGap: string;
}

export const descriptionListTokens: DescriptionListContract = {
  termFontSize: fontSize.sm,
  termFontWeight: fontWeight.medium,
  termColor: neutral["600"],
  detailsFontSize: fontSize.sm,
  detailsColor: neutral["900"],
  gap: spacing["1"],
  itemGap: spacing["4"],
} as const;

// ─── Combined ────────────────────────────────────────────────────────

export interface DataContracts {
  readonly table: TableContract;
  readonly treeView: TreeViewContract;
  readonly timeline: TimelineContract;
  readonly calendar: CalendarContract;
  readonly emptyState: EmptyStateContract;
  readonly descriptionList: DescriptionListContract;
}

export const dataTokens: DataContracts = {
  table: tableTokens,
  treeView: treeViewTokens,
  timeline: timelineTokens,
  calendar: calendarTokens,
  emptyState: emptyStateTokens,
  descriptionList: descriptionListTokens,
} as const;
