import { createElement, forwardRef } from "react";
import type { ElementType, ReactNode } from "react";
import { mergeProps } from "../composition/merge-props";
import { componentClass } from "../composition/class-generation";
import { headingStyles } from "./heading.styles";

export interface HeadingProps {
  /** Semantic heading level (1–6). Controls the rendered element unless `as` is specified. */
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  as?: ElementType;
  asChild?: boolean;
  children?: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

type HeadingElement = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
const LEVELS: Record<number, HeadingElement> = {
  1: "h1",
  2: "h2",
  3: "h3",
  4: "h4",
  5: "h5",
  6: "h6",
};

/**
 * Heading — semantic heading primitive.
 *
 * Renders an h1–h6 element. Use `level` to set the heading depth (default: 2),
 * or `as` for full polymorphic control.
 */
export const Heading = forwardRef<HTMLHeadingElement, HeadingProps & Record<string, unknown>>(
  function Heading(props, ref) {
    const {
      level = 2,
      as: asProp,
      children,
      ...rest
    } = props as HeadingProps & {
      as?: ElementType;
      children?: ReactNode;
    } & Record<string, unknown>;
    const Element: ElementType = asProp ?? LEVELS[level as number] ?? "h2";

    const internalProps: Record<string, unknown> = {
      "data-kui-component": "Heading",
      className: componentClass(headingStyles.name),
      ref,
    };

    const merged = mergeProps(internalProps, rest as Record<string, unknown>);
    return createElement(Element, merged, children);
  },
) as React.ForwardRefExoticComponent<
  HeadingProps & Record<string, unknown> & React.RefAttributes<HTMLHeadingElement>
>;

(Heading as { displayName?: string }).displayName = "Heading";
