'use client';

import { useRef, type RefObject } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/lib/gsap-config';

type AnimationCallback = (ctx: gsap.Context) => void;

interface UseGsapAnimationOptions {
  /** Scope element ref — all GSAP selectors are scoped to this element. */
  scope?: RefObject<HTMLElement>;
  /** Dependencies array — re-runs the animation when these change. */
  dependencies?: unknown[];
}

/**
 * Wrapper around @gsap/react's useGSAP hook.
 * Enforces the scope/context pattern for proper cleanup on route changes.
 *
 * @example
 * ```tsx
 * const containerRef = useRef<HTMLDivElement>(null);
 * useGsapAnimation((ctx) => {
 *   gsap.from('.card', { y: 40, opacity: 0, stagger: 0.1 });
 * }, { scope: containerRef });
 * ```
 */
export function useGsapAnimation(
  callback: AnimationCallback,
  options: UseGsapAnimationOptions = {},
) {
  const fallbackRef = useRef<HTMLDivElement>(null);
  const scopeRef = options.scope ?? fallbackRef;

  useGSAP(
    () => {
      const ctx = gsap.context(() => {
        callback(ctx);
      }, scopeRef);

      return () => ctx.revert();
    },
    { scope: scopeRef, dependencies: options.dependencies ?? [] },
  );

  return scopeRef;
}
