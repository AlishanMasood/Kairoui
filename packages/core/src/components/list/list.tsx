import { forwardRef, createElement } from "react";
import type { HTMLAttributes, ReactNode, OlHTMLAttributes } from "react";

// ─── Types ──────────────────────────────────────────────────────────

export interface ListRootProps {
  variant?: "unordered" | "ordered";
  className?: string;
  children?: ReactNode;
}

export interface ListItemProps {
  className?: string;
  children?: ReactNode;
}

// ─── List (Root) ────────────────────────────────────────────────────

type UnorderedListAttrs = HTMLAttributes<HTMLUListElement>;
type OrderedListAttrs = OlHTMLAttributes<HTMLOListElement>;
type ListAttrs = UnorderedListAttrs & OrderedListAttrs;

export const List = forwardRef<HTMLUListElement | HTMLOListElement, ListRootProps & ListAttrs>(
  function List(props, ref) {
    const { variant = "unordered", className, children, ...rest } = props;
    const tag = variant === "ordered" ? "ol" : "ul";

    return createElement(
      tag,
      {
        ...rest,
        ref,
        "data-kui-component": "List",
        "data-variant": variant,
        className,
      },
      children,
    );
  },
);

// ─── List.Item ──────────────────────────────────────────────────────

export const ListItem = forwardRef<HTMLLIElement, ListItemProps & HTMLAttributes<HTMLLIElement>>(
  function ListItem(props, ref) {
    const { className, children, ...rest } = props;

    return createElement(
      "li",
      { ...rest, ref, "data-kui-component": "ListItem", className },
      children,
    );
  },
);
