import { createComponent } from "../composition/create-component";
import { componentClass } from "../composition/class-generation";
import { gridStyles } from "./grid.styles";
import type { FlexAlign, FlexJustify } from "./flex";

export interface GridProps {
  /** Number of columns, or a CSS grid-template-columns value. */
  columns?: number | string;
  /** CSS grid-template-rows value. */
  rows?: string;
  /** Gap between all grid items (CSS value or number in px). */
  gap?: string | number;
  /** Column gap (overrides `gap` for columns). */
  columnGap?: string | number;
  /** Row gap (overrides `gap` for rows). */
  rowGap?: string | number;
  /** Align items on the block axis. */
  align?: FlexAlign;
  /** Justify items on the inline axis. */
  justify?: FlexJustify;
  /** Display as inline-grid. */
  inline?: boolean;
}

const ALIGN_MAP: Record<string, string> = {
  start: "start",
  center: "center",
  end: "end",
  stretch: "stretch",
  baseline: "baseline",
};

const JUSTIFY_MAP: Record<string, string> = {
  start: "start",
  center: "center",
  end: "end",
  between: "space-between",
  around: "space-around",
  evenly: "space-evenly",
};

function resolveGap(value: string | number): string {
  return typeof value === "number" ? `${String(value)}px` : value;
}

const CONSUMED_PROPS: readonly string[] = [
  "columns",
  "rows",
  "gap",
  "columnGap",
  "rowGap",
  "align",
  "justify",
  "inline",
];

/**
 * Grid — CSS Grid layout primitive.
 *
 * A focused abstraction over CSS Grid for common grid patterns.
 * Use `columns` for simple equal-width columns or a full template string.
 */
export const Grid = createComponent<GridProps, "div">({
  displayName: "Grid",
  defaultElement: "div",
  useComponent: ({ props, ref }) => {
    const { columns, rows, gap, columnGap, rowGap, align, justify, inline } = props;

    const style: Record<string, string | number | undefined> = {};

    if (columns !== undefined) {
      style["gridTemplateColumns"] =
        typeof columns === "number" ? `repeat(${String(columns)}, 1fr)` : columns;
    }
    if (rows) style["gridTemplateRows"] = rows;
    if (gap !== undefined) style["gap"] = resolveGap(gap);
    if (columnGap !== undefined) style["columnGap"] = resolveGap(columnGap);
    if (rowGap !== undefined) style["rowGap"] = resolveGap(rowGap);
    if (align) style["alignItems"] = ALIGN_MAP[align] ?? align;
    if (justify) style["justifyContent"] = JUSTIFY_MAP[justify] ?? justify;
    if (inline) style["display"] = "inline-grid";

    return {
      rootProps: { ref, className: componentClass(gridStyles.name), style },
      consumedProps: CONSUMED_PROPS,
    };
  },
});
