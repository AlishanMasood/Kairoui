import { createElement, forwardRef, useEffect } from "react";
import type { ReactNode, HTMLAttributes } from "react";
import { useFieldContext } from "./field-context";

export interface FieldErrorProps extends HTMLAttributes<HTMLSpanElement> {
  children?: ReactNode;
}

export const FieldError = forwardRef<HTMLSpanElement, FieldErrorProps>(
  function FieldError(props, ref) {
    const { children, ...restProps } = props;
    const ctx = useFieldContext();

    useEffect(() => {
      if (!ctx) return;
      return ctx.registerError();
    }, [ctx]);

    return createElement(
      "span",
      {
        ...restProps,
        ref,
        id: ctx?.errorId,
        role: "alert",
        "aria-live": "assertive",
        "data-kui-component": "FieldError",
      },
      children,
    );
  },
);
