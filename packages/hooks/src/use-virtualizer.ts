import { useCallback, useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import { canUseDOM, computeVirtualizedRange } from "@kairoui/utils";
import type { VirtualizedRange } from "@kairoui/utils";
import { useIsomorphicLayoutEffect } from "./use-isomorphic-layout-effect";

export interface UseVirtualizerOptions {
  readonly count: number;
  readonly rowHeight: number;
  readonly overscan?: number;
  /**
   * Ref to the scroll parent. If the ref is `null` when the hook mounts, the
   * hook stays in its SSR-safe fallback and does not subscribe to any events.
   */
  readonly scrollParentRef: RefObject<HTMLElement | null>;
  /**
   * Viewport height to use on the server and during the first client render.
   * When omitted, the hook renders every row until the client observes real
   * dimensions — this is the safe default for hydration correctness.
   */
  readonly initialViewportHeight?: number;
}

export interface UseVirtualizerReturn extends VirtualizedRange {
  /** True once the client has observed real scroll parent dimensions. */
  readonly ready: boolean;
}

interface Dimensions {
  readonly scrollTop: number;
  readonly viewportHeight: number;
  readonly ready: boolean;
}

/**
 * React adapter binding `computeVirtualizedRange` to a scroll parent.
 *
 * Behavior:
 *
 * - Server / first client render: uses `initialViewportHeight` (or renders
 *   every row) so the SSR and hydration output match.
 * - After mount: reads the real `clientHeight` and `scrollTop`, subscribes a
 *   `passive: true` scroll listener, and coalesces recomputation with
 *   `requestAnimationFrame`.
 * - `ready` starts `false` and flips to `true` on the second render, once the
 *   scroll parent has been observed. Consumers gate hydration-sensitive UI
 *   on `ready`.
 * - Unmount removes the scroll listener and cancels any pending RAF.
 *
 * The hook never subscribes a `ResizeObserver` — v1 is fixed-size only. If
 * the scroll parent resizes, a re-render (triggered by any means) will pick
 * up the new dimensions.
 */
export function useVirtualizer(options: UseVirtualizerOptions): UseVirtualizerReturn {
  const { count, rowHeight, overscan, scrollParentRef, initialViewportHeight } = options;

  const [dims, setDims] = useState<Dimensions | null>(() => {
    if (initialViewportHeight !== undefined) {
      return {
        scrollTop: 0,
        viewportHeight: Math.max(0, initialViewportHeight),
        ready: false,
      };
    }
    return null;
  });

  const rafRef = useRef<number | null>(null);

  const readDimensions = useCallback((): Dimensions | null => {
    const el = scrollParentRef.current;
    if (el === null) return null;
    return { scrollTop: el.scrollTop, viewportHeight: el.clientHeight, ready: true };
  }, [scrollParentRef]);

  useIsomorphicLayoutEffect(() => {
    if (!canUseDOM()) return;
    const el = scrollParentRef.current;
    if (el === null) return;

    const initial = readDimensions();
    if (initial) setDims(initial);

    const scheduleUpdate = (): void => {
      if (rafRef.current !== null) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        const next = readDimensions();
        if (next) setDims(next);
      });
    };

    el.addEventListener("scroll", scheduleUpdate, { passive: true });

    return () => {
      el.removeEventListener("scroll", scheduleUpdate);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [scrollParentRef, readDimensions]);

  // Silences the exhaustive-deps rule when count / rowHeight change; the
  // pure math on the next render is enough — no side effect required.
  useEffect(() => undefined, [count, rowHeight]);

  const ready = dims?.ready ?? false;
  const effectiveViewport = dims?.viewportHeight ?? Number.POSITIVE_INFINITY;
  const effectiveScroll = dims?.scrollTop ?? 0;

  const range = computeVirtualizedRange({
    count,
    rowHeight,
    viewportHeight: effectiveViewport,
    scrollTop: effectiveScroll,
    ...(overscan !== undefined ? { overscan } : undefined),
  });

  return { ...range, ready };
}
