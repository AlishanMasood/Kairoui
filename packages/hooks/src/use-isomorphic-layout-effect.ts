import { useEffect, useLayoutEffect } from "react";
import { canUseDOM } from "@kairoui/utils";

/**
 * SSR-safe layout effect.
 *
 * - In the browser: uses `useLayoutEffect` (fires synchronously after DOM mutations).
 * - On the server: uses `useEffect` (avoids React's SSR warning about useLayoutEffect).
 *
 * Use this ONLY for hooks that genuinely need layout timing (measuring DOM,
 * preventing visual flicker). Do not use it as a default replacement for useEffect.
 *
 * Static selection at module level is safe because:
 * - `canUseDOM()` checks `typeof globalThis.document` without accessing browser APIs.
 * - The selection is stable for the lifetime of the module (environment doesn't change).
 * - No runtime branching per call — same hook identity throughout the component lifecycle.
 */
export const useIsomorphicLayoutEffect = canUseDOM() ? useLayoutEffect : useEffect;
