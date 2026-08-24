import { forwardRef, createElement } from "react";
import type { HTMLAttributes, ReactNode, TimeHTMLAttributes } from "react";

// ─── Types ──────────────────────────────────────────────────────────

export interface TimelineRootProps {
  orientation?: "vertical";
  className?: string;
  children?: ReactNode;
}

export interface TimelineItemRootProps {
  className?: string;
  children?: ReactNode;
}

export interface TimelineIndicatorRootProps {
  className?: string;
  children?: ReactNode;
}

export interface TimelineConnectorRootProps {
  className?: string;
}

export interface TimelineContentRootProps {
  className?: string;
  children?: ReactNode;
}

export interface TimelineTitleRootProps {
  className?: string;
  children?: ReactNode;
}

export interface TimelineDescriptionRootProps {
  className?: string;
  children?: ReactNode;
}

export interface TimelineTimeRootProps {
  dateTime?: string;
  className?: string;
  children?: ReactNode;
}

// ─── Timeline (Root) ────────────────────────────────────────────────

export const Timeline = forwardRef<
  HTMLOListElement,
  TimelineRootProps & HTMLAttributes<HTMLOListElement>
>(function Timeline(props, ref) {
  const { orientation = "vertical", className, children, ...rest } = props;

  return createElement(
    "ol",
    {
      ...rest,
      ref,
      "data-orientation": orientation,
      "data-kui-component": "Timeline",
      className,
    },
    children,
  );
});

// ─── Timeline.Item ──────────────────────────────────────────────────

export const TimelineItem = forwardRef<
  HTMLLIElement,
  TimelineItemRootProps & HTMLAttributes<HTMLLIElement>
>(function TimelineItem(props, ref) {
  const { className, children, ...rest } = props;

  return createElement(
    "li",
    { ...rest, ref, "data-kui-component": "TimelineItem", className },
    children,
  );
});

// ─── Timeline.Indicator ─────────────────────────────────────────────

export const TimelineIndicator = forwardRef<
  HTMLDivElement,
  TimelineIndicatorRootProps & HTMLAttributes<HTMLDivElement>
>(function TimelineIndicator(props, ref) {
  const { className, children, ...rest } = props;

  return createElement(
    "div",
    { ...rest, ref, "aria-hidden": "true", "data-kui-component": "TimelineIndicator", className },
    children ?? createElement("span", { "data-kui-component": "TimelineIndicatorDot" }),
  );
});

// ─── Timeline.Connector ─────────────────────────────────────────────

export const TimelineConnector = forwardRef<
  HTMLDivElement,
  TimelineConnectorRootProps & HTMLAttributes<HTMLDivElement>
>(function TimelineConnector(props, ref) {
  const { className, ...rest } = props;

  return createElement("div", {
    ...rest,
    ref,
    "aria-hidden": "true",
    "data-kui-component": "TimelineConnector",
    className,
  });
});

// ─── Timeline.Content ───────────────────────────────────────────────

export const TimelineContent = forwardRef<
  HTMLDivElement,
  TimelineContentRootProps & HTMLAttributes<HTMLDivElement>
>(function TimelineContent(props, ref) {
  const { className, children, ...rest } = props;

  return createElement(
    "div",
    { ...rest, ref, "data-kui-component": "TimelineContent", className },
    children,
  );
});

// ─── Timeline.Title ─────────────────────────────────────────────────

export const TimelineTitle = forwardRef<
  HTMLParagraphElement,
  TimelineTitleRootProps & HTMLAttributes<HTMLParagraphElement>
>(function TimelineTitle(props, ref) {
  const { className, children, ...rest } = props;

  return createElement(
    "p",
    { ...rest, ref, "data-kui-component": "TimelineTitle", className },
    children,
  );
});

// ─── Timeline.Description ───────────────────────────────────────────

export const TimelineDescription = forwardRef<
  HTMLParagraphElement,
  TimelineDescriptionRootProps & HTMLAttributes<HTMLParagraphElement>
>(function TimelineDescription(props, ref) {
  const { className, children, ...rest } = props;

  return createElement(
    "p",
    { ...rest, ref, "data-kui-component": "TimelineDescription", className },
    children,
  );
});

// ─── Timeline.Time ──────────────────────────────────────────────────

export const TimelineTime = forwardRef<
  HTMLTimeElement,
  TimelineTimeRootProps & TimeHTMLAttributes<HTMLTimeElement>
>(function TimelineTime(props, ref) {
  const { dateTime, className, children, ...rest } = props;

  return createElement(
    "time",
    { ...rest, ref, dateTime, "data-kui-component": "TimelineTime", className },
    children,
  );
});
