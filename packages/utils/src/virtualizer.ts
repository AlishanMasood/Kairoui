/**
 * Fixed-size virtualization — framework-independent math for computing the
 * visible slice of an ordered collection given a viewport size, scroll offset,
 * item count, and per-item height.
 *
 * The API is intentionally small: one predicate + a few helpers. Everything is
 * pure — no DOM, no React, no side effects — so it can run identically on the
 * server, in a Web Worker, or as part of a larger scheduler.
 *
 * Fixed-size only in v1. Variable-size support is deferred to a later phase;
 * see the KUI-ADV-013 architecture document for the migration path.
 */

// ─── Types ─────────────────────────────────────────────────────────

export interface VirtualizerConfig {
  /** Total number of items in the underlying collection. Must be `>= 0`. */
  readonly count: number;
  /** Fixed row height in CSS pixels. Must be `> 0`. */
  readonly rowHeight: number;
  /** Extra rows to render above and below the strict visible range. Default `3`. */
  readonly overscan?: number;
  /** Current scroll parent inner height in CSS pixels. */
  readonly viewportHeight: number;
  /** Current scroll offset in CSS pixels. */
  readonly scrollTop: number;
}

export interface VirtualizedRange {
  /** Inclusive index of the first rendered row. */
  readonly startIndex: number;
  /** Half-open exclusive end: renders `items.slice(startIndex, endIndex)`. */
  readonly endIndex: number;
  /** CSS pixels of empty space above the rendered slice. */
  readonly paddingTop: number;
  /** CSS pixels of empty space below the rendered slice. */
  readonly paddingBottom: number;
  /** Total virtual scroll height in CSS pixels (`count * rowHeight`). */
  readonly totalHeight: number;
}

// ─── Compute range ─────────────────────────────────────────────────

/**
 * Compute the visible slice of an ordered fixed-size collection.
 *
 * Invariants (verified in tests):
 *
 * - `0 <= startIndex <= endIndex <= count`
 * - `paddingTop + (endIndex - startIndex) * rowHeight + paddingBottom === totalHeight`
 * - Pure — same inputs always produce the same output.
 *
 * Elastic overscroll (negative `scrollTop`) is clamped to `0`. When
 * `scrollTop >= totalHeight`, the slice sticks to the tail. When the viewport
 * is at least as tall as the total content, every row is included.
 */
export function computeVirtualizedRange(config: VirtualizerConfig): VirtualizedRange {
  const count = Math.max(0, Math.floor(config.count));
  const rowHeight = config.rowHeight;
  const overscan = Math.max(0, Math.floor(config.overscan ?? 3));
  const viewportHeight = Math.max(0, config.viewportHeight);
  const scrollTop = Math.max(0, config.scrollTop);

  if (rowHeight <= 0 || !Number.isFinite(rowHeight)) {
    throw new RangeError("computeVirtualizedRange: rowHeight must be a positive finite number.");
  }

  const totalHeight = count * rowHeight;

  if (count === 0 || viewportHeight === 0) {
    return {
      startIndex: 0,
      endIndex: 0,
      paddingTop: 0,
      paddingBottom: 0,
      totalHeight,
    };
  }

  // Whole collection fits — no windowing.
  if (viewportHeight >= totalHeight) {
    return {
      startIndex: 0,
      endIndex: count,
      paddingTop: 0,
      paddingBottom: 0,
      totalHeight,
    };
  }

  const visibleStart = Math.floor(scrollTop / rowHeight);
  const visibleEnd = Math.ceil((scrollTop + viewportHeight) / rowHeight);

  const startIndex = Math.max(0, visibleStart - overscan);
  const endIndex = Math.min(count, visibleEnd + overscan);

  const renderedCount = endIndex - startIndex;
  const paddingTop = startIndex * rowHeight;
  const paddingBottom = totalHeight - paddingTop - renderedCount * rowHeight;

  return { startIndex, endIndex, paddingTop, paddingBottom, totalHeight };
}

// ─── Item positioning ─────────────────────────────────────────────

/** CSS-pixel offset of the top of `index` from the start of the collection. */
export function getItemOffset(index: number, rowHeight: number): number {
  if (rowHeight <= 0 || !Number.isFinite(rowHeight)) {
    throw new RangeError("getItemOffset: rowHeight must be a positive finite number.");
  }
  return Math.max(0, Math.floor(index)) * rowHeight;
}

/** CSS-pixel size of `[startIndex, endIndex)`. */
export function getRangeSize(startIndex: number, endIndex: number, rowHeight: number): number {
  const start = Math.max(0, Math.floor(startIndex));
  const end = Math.max(start, Math.floor(endIndex));
  return (end - start) * rowHeight;
}

/** Index of the item at CSS-pixel `offset` from the collection start. */
export function getIndexAtOffset(offset: number, rowHeight: number, count: number): number {
  if (rowHeight <= 0 || !Number.isFinite(rowHeight)) {
    throw new RangeError("getIndexAtOffset: rowHeight must be a positive finite number.");
  }
  const safeCount = Math.max(0, Math.floor(count));
  if (safeCount === 0) return 0;
  const raw = Math.floor(Math.max(0, offset) / rowHeight);
  return Math.min(safeCount - 1, raw);
}

// ─── Scroll-to-index ───────────────────────────────────────────────

/** Where to place `index` within the viewport when scrolling to it. */
export type ScrollAlignment = "start" | "center" | "end" | "auto";

export interface ScrollToIndexOptions {
  readonly index: number;
  readonly rowHeight: number;
  readonly count: number;
  readonly viewportHeight: number;
  /** Current scroll offset, required only when `align === "auto"`. */
  readonly currentScrollTop?: number;
  readonly align?: ScrollAlignment;
}

/**
 * Compute the target `scrollTop` needed to reveal `index`. Pure — no DOM
 * access, no side effects. The consumer applies the returned value to their
 * scroll parent via `scrollTop = target`.
 *
 * Alignment semantics:
 *
 * - `"start"`  — `index` sits at the top of the viewport.
 * - `"end"`    — `index` sits at the bottom of the viewport.
 * - `"center"` — `index` sits vertically centered.
 * - `"auto"`   — if `index` is already fully visible, returns
 *   `currentScrollTop`; otherwise chooses `"start"` or `"end"` to minimize
 *   scroll distance.
 */
export function computeScrollToIndex(options: ScrollToIndexOptions): number {
  const {
    index,
    rowHeight,
    count,
    viewportHeight,
    currentScrollTop = 0,
    align = "start",
  } = options;

  if (rowHeight <= 0 || !Number.isFinite(rowHeight)) {
    throw new RangeError("computeScrollToIndex: rowHeight must be a positive finite number.");
  }

  const safeCount = Math.max(0, Math.floor(count));
  if (safeCount === 0) return 0;

  const clampedIndex = Math.min(safeCount - 1, Math.max(0, Math.floor(index)));
  const itemTop = clampedIndex * rowHeight;
  const itemBottom = itemTop + rowHeight;
  const totalHeight = safeCount * rowHeight;
  const maxScroll = Math.max(0, totalHeight - viewportHeight);

  const clamp = (v: number): number => Math.max(0, Math.min(maxScroll, v));

  if (align === "start") return clamp(itemTop);
  if (align === "end") return clamp(itemBottom - viewportHeight);
  if (align === "center") return clamp(itemTop - (viewportHeight - rowHeight) / 2);

  // "auto"
  const viewportBottom = currentScrollTop + viewportHeight;
  if (itemTop >= currentScrollTop && itemBottom <= viewportBottom) {
    return clamp(currentScrollTop);
  }
  if (itemTop < currentScrollTop) return clamp(itemTop);
  return clamp(itemBottom - viewportHeight);
}
