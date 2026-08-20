import { forwardRef, createElement } from "react";
import type { HTMLAttributes, ReactNode } from "react";

// ─── Types ──────────────────────────────────────────────────────────

export interface DescriptionListRootProps {
  layout?: "vertical" | "horizontal";
  className?: string;
  children?: ReactNode;
}

export interface DescriptionTermRootProps {
  className?: string;
  children?: ReactNode;
}

export interface DescriptionDetailsRootProps {
  className?: string;
  children?: ReactNode;
}

// ─── DescriptionList (Root) ─────────────────────────────────────────

export const DescriptionList = forwardRef<
  HTMLDListElement,
  DescriptionListRootProps & HTMLAttributes<HTMLDListElement>
>(function DescriptionList(props, ref) {
  const { layout = "vertical", className, children, ...rest } = props;

  return createElement(
    "dl",
    {
      ...rest,
      ref,
      "data-kui-component": "DescriptionList",
      "data-layout": layout,
      className,
    },
    children,
  );
});

// ─── DescriptionList.Term ───────────────────────────────────────────

export const DescriptionTerm = forwardRef<
  HTMLElement,
  DescriptionTermRootProps & HTMLAttributes<HTMLElement>
>(function DescriptionTerm(props, ref) {
  const { className, children, ...rest } = props;

  return createElement(
    "dt",
    { ...rest, ref, "data-kui-component": "DescriptionTerm", className },
    children,
  );
});

// ─── DescriptionList.Details ────────────────────────────────────────

export const DescriptionDetails = forwardRef<
  HTMLElement,
  DescriptionDetailsRootProps & HTMLAttributes<HTMLElement>
>(function DescriptionDetails(props, ref) {
  const { className, children, ...rest } = props;

  return createElement(
    "dd",
    { ...rest, ref, "data-kui-component": "DescriptionDetails", className },
    children,
  );
});
