import { forwardRef, createElement } from "react";
import type { HTMLAttributes, ReactNode } from "react";

// ─── Types ──────────────────────────────────────────────────────────

export interface EmptyStateRootProps {
  className?: string;
  children?: ReactNode;
}

export interface EmptyStateIconRootProps {
  className?: string;
  children?: ReactNode;
}

export interface EmptyStateTitleRootProps {
  className?: string;
  children?: ReactNode;
}

export interface EmptyStateDescriptionRootProps {
  className?: string;
  children?: ReactNode;
}

export interface EmptyStateActionsRootProps {
  className?: string;
  children?: ReactNode;
}

// ─── EmptyState (Root) ──────────────────────────────────────────────

export const EmptyState = forwardRef<
  HTMLDivElement,
  EmptyStateRootProps & HTMLAttributes<HTMLDivElement>
>(function EmptyState(props, ref) {
  const { className, children, ...rest } = props;

  return createElement(
    "div",
    { ...rest, ref, role: "status", "data-kui-component": "EmptyState", className },
    children,
  );
});

// ─── EmptyState.Icon ────────────────────────────────────────────────

export const EmptyStateIcon = forwardRef<
  HTMLDivElement,
  EmptyStateIconRootProps & HTMLAttributes<HTMLDivElement>
>(function EmptyStateIcon(props, ref) {
  const { className, children, ...rest } = props;

  return createElement(
    "div",
    { ...rest, ref, "aria-hidden": "true", "data-kui-component": "EmptyStateIcon", className },
    children,
  );
});

// ─── EmptyState.Title ───────────────────────────────────────────────

export const EmptyStateTitle = forwardRef<
  HTMLHeadingElement,
  EmptyStateTitleRootProps & HTMLAttributes<HTMLHeadingElement>
>(function EmptyStateTitle(props, ref) {
  const { className, children, ...rest } = props;

  return createElement(
    "h3",
    { ...rest, ref, "data-kui-component": "EmptyStateTitle", className },
    children,
  );
});

// ─── EmptyState.Description ─────────────────────────────────────────

export const EmptyStateDescription = forwardRef<
  HTMLParagraphElement,
  EmptyStateDescriptionRootProps & HTMLAttributes<HTMLParagraphElement>
>(function EmptyStateDescription(props, ref) {
  const { className, children, ...rest } = props;

  return createElement(
    "p",
    { ...rest, ref, "data-kui-component": "EmptyStateDescription", className },
    children,
  );
});

// ─── EmptyState.Actions ─────────────────────────────────────────────

export const EmptyStateActions = forwardRef<
  HTMLDivElement,
  EmptyStateActionsRootProps & HTMLAttributes<HTMLDivElement>
>(function EmptyStateActions(props, ref) {
  const { className, children, ...rest } = props;

  return createElement(
    "div",
    { ...rest, ref, "data-kui-component": "EmptyStateActions", className },
    children,
  );
});
