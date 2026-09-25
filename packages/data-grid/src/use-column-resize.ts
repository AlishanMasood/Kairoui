import type { KeyboardEvent, PointerEvent } from "react";
import { useCallback, useMemo, useRef, useState } from "react";
import { useEventCallback } from "@kairoui/hooks";
import type { DataGridColumnDef } from "./column-types";
import { clampColumnWidth } from "./column-model";

// ─── Options ───────────────────────────────────────────────────────

export interface UseColumnResizeOptions<TRow> {
  readonly columnId: string;
  readonly columns: readonly DataGridColumnDef<TRow>[];
  /** Current width the grid renders for this column (from ColumnState.sizing). */
  readonly currentWidth: number;
  /** Called with the next width after clamping. Never called with a non-finite number. */
  readonly onResize: (columnId: string, width: number) => void;
  /** Direction — inverts pointer delta and Arrow keys when `"rtl"`. */
  readonly dir?: "ltr" | "rtl";
  /** Keyboard step in CSS pixels. Default 8. Larger step (Shift+Arrow) = 4× this. */
  readonly step?: number;
  /**
   * Disables the interaction entirely. When `resizable === false` on the
   * column def, or the consumer wants to opt out at runtime.
   */
  readonly disabled?: boolean;
  /** Localizable label for the resize handle. */
  readonly ariaLabel?: string;
}

// ─── Return ────────────────────────────────────────────────────────

export interface ResizeHandleProps {
  readonly role: "separator";
  readonly "aria-orientation": "vertical";
  readonly "aria-label": string;
  readonly "aria-valuenow": number;
  readonly "aria-valuemin": number | undefined;
  readonly "aria-valuemax": number | undefined;
  readonly tabIndex: number;
  readonly "data-resizing": "true" | "false";
  readonly "data-column-id": string;
  readonly "data-disabled": "true" | "false";
  readonly onPointerDown: (event: PointerEvent<HTMLElement>) => void;
  readonly onPointerMove: (event: PointerEvent<HTMLElement>) => void;
  readonly onPointerUp: (event: PointerEvent<HTMLElement>) => void;
  readonly onPointerCancel: (event: PointerEvent<HTMLElement>) => void;
  readonly onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
}

export interface UseColumnResizeReturn {
  readonly isResizing: boolean;
  readonly resizeHandleProps: ResizeHandleProps;
}

interface DragSession {
  readonly pointerId: number;
  readonly startX: number;
  readonly startWidth: number;
}

/**
 * Pointer + keyboard bindings for a single column's resize handle.
 *
 * ## Pointer model
 *
 * On `pointerdown`, captures the pointer on the handle element so the drag
 * survives fast pointer movement outside the handle bounds. Each
 * `pointermove` computes `deltaX = clientX − startX` (inverted in RTL) and
 * calls `onResize` with `clamp(startWidth + delta)` where clamping honors
 * the column def's `minWidth` / `maxWidth`. Release / cancel ends the
 * session.
 *
 * ## Keyboard model
 *
 * The handle is a WAI-ARIA `separator` with `tabIndex={0}`.
 * - `ArrowLeft` / `ArrowRight`: ±step (inverted in RTL)
 * - `Shift+Arrow`: ±4× step
 * - `Home` / `End`: snap to min / max
 * - `Enter` / `Space`: no-op (no commit needed — resize is direct)
 *
 * Disabled columns receive `data-disabled="true"` and `tabIndex={-1}`; all
 * event handlers become no-ops.
 */
export function useColumnResize<TRow>(
  options: UseColumnResizeOptions<TRow>,
): UseColumnResizeReturn {
  const {
    columnId,
    columns,
    currentWidth,
    onResize,
    dir = "ltr",
    step = 8,
    disabled = false,
    ariaLabel = "Resize column",
  } = options;

  const column: DataGridColumnDef<TRow> | undefined = useMemo(
    () => columns.find((c) => c.id === columnId),
    [columns, columnId],
  );
  const columnDisabled = disabled || column === undefined || column.resizable === false;

  const sessionRef = useRef<DragSession | null>(null);
  const [isResizing, setIsResizing] = useState(false);

  const onResizeStable = useEventCallback(onResize);

  const commit = useCallback(
    (nextWidth: number) => {
      if (!column) return;
      if (!Number.isFinite(nextWidth)) return;
      const clamped = clampColumnWidth(column, nextWidth);
      onResizeStable(columnId, clamped);
    },
    [column, columnId, onResizeStable],
  );

  const rtlSign = dir === "rtl" ? -1 : 1;

  const onPointerDown = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      if (columnDisabled) return;
      if (event.button !== 0) return;
      event.preventDefault();
      const target = event.currentTarget;
      try {
        target.setPointerCapture(event.pointerId);
      } catch {
        // Pointer capture may fail in synthetic tests; drag still works via
        // subsequent onPointerMove events on the same element.
      }
      sessionRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startWidth: currentWidth,
      };
      setIsResizing(true);
    },
    [columnDisabled, currentWidth],
  );

  const endSession = useCallback((target: HTMLElement, pointerId: number) => {
    if (target.hasPointerCapture(pointerId)) {
      try {
        target.releasePointerCapture(pointerId);
      } catch {
        // Ignore — capture may already be released.
      }
    }
    sessionRef.current = null;
    setIsResizing(false);
  }, []);

  const onPointerMove = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      const session = sessionRef.current;
      if (!session || session.pointerId !== event.pointerId) return;
      const delta = (event.clientX - session.startX) * rtlSign;
      commit(session.startWidth + delta);
    },
    [commit, rtlSign],
  );

  const onPointerUp = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      const session = sessionRef.current;
      if (!session || session.pointerId !== event.pointerId) return;
      endSession(event.currentTarget, event.pointerId);
    },
    [endSession],
  );

  const onPointerCancel = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      const session = sessionRef.current;
      if (!session || session.pointerId !== event.pointerId) return;
      endSession(event.currentTarget, event.pointerId);
    },
    [endSession],
  );

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      if (columnDisabled) return;
      const nudge = event.shiftKey ? step * 4 : step;
      switch (event.key) {
        case "ArrowLeft": {
          event.preventDefault();
          commit(currentWidth - nudge * rtlSign);
          return;
        }
        case "ArrowRight": {
          event.preventDefault();
          commit(currentWidth + nudge * rtlSign);
          return;
        }
        case "Home": {
          event.preventDefault();
          const min = typeof column.minWidth === "number" ? column.minWidth : 1;
          commit(min);
          return;
        }
        case "End": {
          event.preventDefault();
          const max =
            typeof column.maxWidth === "number" ? column.maxWidth : Number.MAX_SAFE_INTEGER;
          commit(max);
          return;
        }
        default:
          return;
      }
    },
    [column, columnDisabled, commit, currentWidth, rtlSign, step],
  );

  const resizeHandleProps: ResizeHandleProps = {
    role: "separator",
    "aria-orientation": "vertical",
    "aria-label": ariaLabel,
    "aria-valuenow": currentWidth,
    "aria-valuemin": column?.minWidth,
    "aria-valuemax": column?.maxWidth,
    tabIndex: columnDisabled ? -1 : 0,
    "data-resizing": isResizing ? "true" : "false",
    "data-column-id": columnId,
    "data-disabled": columnDisabled ? "true" : "false",
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    onKeyDown,
  };

  return { isResizing, resizeHandleProps };
}
