import { forwardRef, createElement } from "react";
import type { ReactNode, HTMLAttributes } from "react";

// ─── Types ──────────────────────────────────────────────────────────

export type AlertTone = "info" | "success" | "warning" | "danger";

export interface AlertProps {
  /** Visual tone. Defaults to "info". */
  tone?: AlertTone;
  /** Use role="alert" for live announcements. Defaults to false (static). */
  live?: boolean;
  children?: ReactNode;
  className?: string;
}

export interface AlertIconProps {
  children?: ReactNode;
  className?: string;
}

export interface AlertTitleProps {
  children?: ReactNode;
  className?: string;
}

export interface AlertDescriptionProps {
  children?: ReactNode;
  className?: string;
}

export interface AlertActionProps {
  children?: ReactNode;
  className?: string;
}

// ─── Alert (Root) ───────────────────────────────────────────────────

export const Alert = forwardRef<HTMLDivElement, AlertProps & HTMLAttributes<HTMLDivElement>>(
  function Alert(props, ref) {
    const { tone = "info", live = false, className, children, ...rest } = props;

    return createElement(
      "div",
      {
        ...rest,
        ref,
        role: live ? "alert" : "status",
        "data-tone": tone,
        "data-kui-component": "Alert",
        className,
      },
      children,
    );
  },
);

// ─── Alert.Icon ─────────────────────────────────────────────────────

export const AlertIcon = forwardRef<
  HTMLSpanElement,
  AlertIconProps & HTMLAttributes<HTMLSpanElement>
>(function AlertIcon(props, ref) {
  const { className, children, ...rest } = props;

  return createElement(
    "span",
    { ...rest, ref, "aria-hidden": "true", "data-kui-component": "AlertIcon", className },
    children,
  );
});

// ─── Alert.Title ────────────────────────────────────────────────────

export const AlertTitle = forwardRef<
  HTMLDivElement,
  AlertTitleProps & HTMLAttributes<HTMLDivElement>
>(function AlertTitle(props, ref) {
  const { className, children, ...rest } = props;

  return createElement(
    "div",
    { ...rest, ref, "data-kui-component": "AlertTitle", className },
    children,
  );
});

// ─── Alert.Description ──────────────────────────────────────────────

export const AlertDescription = forwardRef<
  HTMLDivElement,
  AlertDescriptionProps & HTMLAttributes<HTMLDivElement>
>(function AlertDescription(props, ref) {
  const { className, children, ...rest } = props;

  return createElement(
    "div",
    { ...rest, ref, "data-kui-component": "AlertDescription", className },
    children,
  );
});

// ─── Alert.Action ───────────────────────────────────────────────────

export const AlertAction = forwardRef<
  HTMLDivElement,
  AlertActionProps & HTMLAttributes<HTMLDivElement>
>(function AlertAction(props, ref) {
  const { className, children, ...rest } = props;

  return createElement(
    "div",
    { ...rest, ref, "data-kui-component": "AlertAction", className },
    children,
  );
});
