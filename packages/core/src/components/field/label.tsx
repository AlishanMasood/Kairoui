import { createElement, forwardRef, useEffect } from "react";
import type { ReactNode, LabelHTMLAttributes } from "react";
import { useFieldContext } from "./field-context";

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  children?: ReactNode;
}

export const Label = forwardRef<HTMLLabelElement, LabelProps>(function Label(props, ref) {
  const { children, ...restProps } = props;
  const ctx = useFieldContext();

  useEffect(() => {
    if (!ctx) return;
    return ctx.registerLabel();
  }, [ctx]);

  return createElement(
    "label",
    {
      ...restProps,
      ref,
      id: ctx?.labelId,
      htmlFor: ctx?.fieldId,
      "data-kui-component": "Label",
      ...(ctx?.required ? { "data-required": "" } : undefined),
    },
    children,
  );
});
