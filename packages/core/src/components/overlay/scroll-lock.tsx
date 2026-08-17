import { useEffect } from "react";
import type { ScrollLockProps } from "./overlay-types";

// ─── Reference-counted scroll lock ─────────────────────────────────

let lockCount = 0;
let savedStyles: { overflow: string; paddingRight: string } | undefined;

function lock(): void {
  lockCount++;
  if (lockCount !== 1) return;

  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

  savedStyles = {
    overflow: document.body.style.overflow,
    paddingRight: document.body.style.paddingRight,
  };

  document.body.style.overflow = "hidden";
  if (scrollbarWidth > 0) {
    document.body.style.paddingRight = `${scrollbarWidth}px`;
  }
}

function unlock(): void {
  lockCount--;
  if (lockCount !== 0) return;
  if (!savedStyles) return;

  document.body.style.overflow = savedStyles.overflow;
  document.body.style.paddingRight = savedStyles.paddingRight;
  savedStyles = undefined;
}

export function _resetScrollLock(): void {
  lockCount = 0;
  savedStyles = undefined;
}

// ─── Component ──────────────────────────────────────────────────────

export function useScrollLock(enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return;
    lock();
    return unlock;
  }, [enabled]);
}

export function ScrollLock(props: ScrollLockProps): null {
  const { enabled = true } = props;
  useScrollLock(enabled);
  return null;
}
