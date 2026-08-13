import { createElement, forwardRef, useEffect } from "react";
import type { ReactNode, HTMLAttributes } from "react";
import { useFieldContext } from "./field-context";

export interface FieldDescriptionProps extends HTMLAttributes<HTMLSpanElement> {
  children?: ReactNode;
}

export const FieldDescription = forwardRef<HTMLSpanElement, FieldDescriptionProps>(
  function FieldDescription(props, ref) {
    const { children, id, ...restProps } = props;
    const ctx = useFieldContext();

    useEffect(() => {
      if (!ctx) return;
      return ctx.registerDescription();
    }, [ctx]);

    return createElement(
      "span",
      {
        ...restProps,
        ref,
        id: id ?? ctx?.descriptionId,
        "data-kui-component": "FieldDescription",
        ...(ctx?.disabled ? { "data-disabled": "" } : undefined),
      },
      children,
    );
  },
);
