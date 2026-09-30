// Pointer-driven drag and resize orchestration for Scheduler events.
// These hooks are strictly interaction primitives — they own no
// visible layout; the view components read the returned `ghost` state
// and apply CSS transforms to render the provisional geometry.
//
// The Scheduler never mutates events. On `pointerup` a callback fires
// with the snapped final range; the consumer updates their own event
// store and the new event data flows back through the `events` prop.

import { useCallback, useEffect, useRef, useState } from "react";
import { addMinutes, snapDateToInterval } from "./time-utils";
import type { SchedulerEvent, VisibleRange } from "./scheduler-types";

// ─── Ghost state ──────────────────────────────────────────────────

export interface EventGhost {
  readonly eventId: string;
  readonly kind: "move" | "resize-start" | "resize-end";
  readonly start: Date;
  readonly end: Date;
  readonly resourceId?: string;
}

// ─── Drag ──────────────────────────────────────────────────────────

export interface UseDragScheduleOptions<TEvent extends SchedulerEvent> {
  readonly range: VisibleRange;
  readonly snapDuration: number;
  readonly minDuration: number;
  readonly maxDuration: number | null;
  readonly dragBoundary: "view" | "day" | "resource" | "none";
  readonly pxPerMinute: number;
  readonly axis: "vertical" | "horizontal";
  readonly onMoveEvent:
    | ((payload: {
        readonly event: TEvent;
        readonly start: Date;
        readonly end: Date;
        readonly resourceId?: string;
      }) => void | Promise<void>)
    | null;
  readonly enabled: boolean;
}

export interface UseDragScheduleReturn {
  readonly ghost: EventGhost | null;
  readonly beginDrag: (
    event: SchedulerEvent,
    kind: "move" | "resize-start" | "resize-end",
    pointerId: number,
    clientPosition: number,
  ) => void;
  readonly updateDrag: (clientPosition: number) => void;
  readonly endDrag: (commit: boolean) => void;
  readonly cancelDrag: () => void;
}

interface DragSession {
  readonly eventId: string;
  readonly resourceId: string | undefined;
  readonly kind: "move" | "resize-start" | "resize-end";
  readonly initialStart: Date;
  readonly initialEnd: Date;
  readonly anchor: number;
  readonly pointerId: number;
}

/**
 * Pointer-driven drag/resize orchestration. `beginDrag` seeds a
 * session on `pointerdown`; `updateDrag` runs on `pointermove` and
 * produces a `ghost` for the provisional geometry; `endDrag(true)`
 * commits via the consumer callback; `endDrag(false)` /
 * `cancelDrag` revert.
 *
 * The Scheduler assumes the caller applies `axis`-aware clamping
 * (view for vertical, day for horizontal) — the boundary is enforced
 * here via `range` + `dragBoundary`.
 */
export function useDragSchedule<TEvent extends SchedulerEvent>(
  options: UseDragScheduleOptions<TEvent>,
): UseDragScheduleReturn {
  const [ghost, setGhost] = useState<EventGhost | null>(null);
  const sessionRef = useRef<DragSession | null>(null);
  const optionsRef = useRef(options);

  useEffect(() => {
    optionsRef.current = options;
  });

  const beginDrag = useCallback(
    (
      event: SchedulerEvent,
      kind: "move" | "resize-start" | "resize-end",
      pointerId: number,
      clientPosition: number,
    ): void => {
      if (!optionsRef.current.enabled) return;
      sessionRef.current = {
        eventId: event.id,
        resourceId: event.resourceId,
        kind,
        initialStart: new Date(event.start.getTime()),
        initialEnd: new Date(event.end.getTime()),
        anchor: clientPosition,
        pointerId,
      };
      setGhost({
        eventId: event.id,
        kind,
        start: new Date(event.start.getTime()),
        end: new Date(event.end.getTime()),
        ...(event.resourceId !== undefined ? { resourceId: event.resourceId } : {}),
      });
    },
    [],
  );

  const updateDrag = useCallback((clientPosition: number): void => {
    const session = sessionRef.current;
    if (!session) return;
    const opts = optionsRef.current;
    if (opts.pxPerMinute <= 0) return;

    const deltaPx = clientPosition - session.anchor;
    const deltaMinutes = deltaPx / opts.pxPerMinute;
    const snappedMinutes =
      opts.snapDuration > 0
        ? Math.round(deltaMinutes / opts.snapDuration) * opts.snapDuration
        : deltaMinutes;

    let nextStart = new Date(session.initialStart.getTime());
    let nextEnd = new Date(session.initialEnd.getTime());
    if (session.kind === "move") {
      nextStart = addMinutes(session.initialStart, snappedMinutes);
      nextEnd = addMinutes(session.initialEnd, snappedMinutes);
    } else if (session.kind === "resize-start") {
      nextStart = addMinutes(session.initialStart, snappedMinutes);
    } else {
      nextEnd = addMinutes(session.initialEnd, snappedMinutes);
    }

    // ── Duration bounds
    const durationMinutes = (nextEnd.getTime() - nextStart.getTime()) / 60_000;
    if (durationMinutes < opts.minDuration) {
      if (session.kind === "resize-start") {
        nextStart = addMinutes(nextEnd, -opts.minDuration);
      } else if (session.kind === "resize-end") {
        nextEnd = addMinutes(nextStart, opts.minDuration);
      }
    }
    if (opts.maxDuration !== null && durationMinutes > opts.maxDuration) {
      if (session.kind === "resize-start") {
        nextStart = addMinutes(nextEnd, -opts.maxDuration);
      } else if (session.kind === "resize-end") {
        nextEnd = addMinutes(nextStart, opts.maxDuration);
      }
    }

    // ── Range boundaries
    if (opts.dragBoundary === "view") {
      const rs = opts.range.start.getTime();
      const re = opts.range.end.getTime();
      if (nextStart.getTime() < rs) {
        const shift = rs - nextStart.getTime();
        nextStart = new Date(nextStart.getTime() + shift);
        if (session.kind === "move") nextEnd = new Date(nextEnd.getTime() + shift);
      }
      if (nextEnd.getTime() > re) {
        const shift = nextEnd.getTime() - re;
        nextEnd = new Date(nextEnd.getTime() - shift);
        if (session.kind === "move") nextStart = new Date(nextStart.getTime() - shift);
      }
    } else if (opts.dragBoundary === "day") {
      const dayStart = new Date(session.initialStart.getTime());
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart.getTime());
      dayEnd.setHours(23, 59, 59, 999);
      if (nextStart < dayStart) nextStart = new Date(dayStart.getTime());
      if (nextEnd > dayEnd) nextEnd = new Date(dayEnd.getTime());
    }

    setGhost({
      eventId: session.eventId,
      kind: session.kind,
      start: nextStart,
      end: nextEnd,
      ...(session.resourceId !== undefined ? { resourceId: session.resourceId } : {}),
    });
  }, []);

  const endDrag = useCallback((commit: boolean): void => {
    const session = sessionRef.current;
    sessionRef.current = null;
    setGhost((prev) => {
      if (!commit || !prev || !session) return null;
      const opts = optionsRef.current;
      const snappedStart =
        opts.snapDuration > 0
          ? snapDateToInterval(prev.start, opts.snapDuration, opts.range.start)
          : prev.start;
      const snappedEnd =
        opts.snapDuration > 0
          ? snapDateToInterval(prev.end, opts.snapDuration, opts.range.start)
          : prev.end;
      const cb = opts.onMoveEvent;
      if (cb) {
        void cb({
          event: {
            id: session.eventId,
            start: session.initialStart,
            end: session.initialEnd,
            allDay: false,
            title: "",
            ...(session.resourceId !== undefined ? { resourceId: session.resourceId } : {}),
          } as unknown as TEvent,
          start: snappedStart,
          end: snappedEnd,
          ...(session.resourceId !== undefined ? { resourceId: session.resourceId } : {}),
        });
      }
      return null;
    });
  }, []);

  const cancelDrag = useCallback((): void => {
    sessionRef.current = null;
    setGhost(null);
  }, []);

  return { ghost, beginDrag, updateDrag, endDrag, cancelDrag };
}
