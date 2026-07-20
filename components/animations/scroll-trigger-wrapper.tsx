'use client';

import { useRef, type ReactNode } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/lib/gsap-config';

interface ScrollTriggerWrapperProps {
  children: ReactNode;
  /** CSS class for the wrapper div. */
  className?: string;
  /** ScrollTrigger configuration overrides. */
  triggerConfig?: ScrollTrigger.Vars;
  /** Animation to apply when the trigger fires. */
  animation?: gsap.TweenVars;
}

/**
 * Declarative ScrollTrigger wrapper component.
 * Automatically creates and cleans up a ScrollTrigger instance.
 *
 * @example
 * ```tsx
 * <ScrollTriggerWrapper
 *   animation={{ y: 0, opacity: 1 }}
 *   triggerConfig={{ start: 'top 80%' }}
 * >
 *   <div className="opacity-0 translate-y-8">Reveal me</div>
 * </ScrollTriggerWrapper>
 * ```
 */
export function ScrollTriggerWrapper({
  children,
  className,
  triggerConfig,
  animation,
}: ScrollTriggerWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!containerRef.current) return;

      gsap.to(containerRef.current, {
        ...animation,
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 85%',
          end: 'bottom 15%',
          toggleActions: 'play none none reverse',
          ...triggerConfig,
        },
      });
    },
    { scope: containerRef },
  );

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
}
