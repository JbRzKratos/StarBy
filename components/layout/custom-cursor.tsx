'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/lib/gsap-config';
import { useDevice } from '@/lib/providers/device-provider';

export function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const device = useDevice();

  useGSAP(
    () => {
      // Only initialize custom cursor on desktop
      if (device === 'mobile' || !cursorRef.current || !dotRef.current) return;

      const cursor = cursorRef.current;
      const dot = dotRef.current;

      // Set initial GSAP state
      gsap.set(cursor, { xPercent: -50, yPercent: -50 });
      gsap.set(dot, { xPercent: -50, yPercent: -50 });

      const xToCursor = gsap.quickTo(cursor, 'x', { duration: 0.1, ease: 'power3' });
      const yToCursor = gsap.quickTo(cursor, 'y', { duration: 0.1, ease: 'power3' });

      const xToDot = gsap.quickTo(dot, 'x', { duration: 0.1, ease: 'power3' });
      const yToDot = gsap.quickTo(dot, 'y', { duration: 0.1, ease: 'power3' });

      let isHovering = false;

      const onMouseMove = (e: MouseEvent) => {
        xToCursor(e.clientX);
        yToCursor(e.clientY);
        xToDot(e.clientX);
        yToDot(e.clientY);
      };

      const onMouseHover = (e: MouseEvent) => {
        const target = e.target as HTMLElement;

        // Check if we are hovering over an interactive element
        const isInteractive = target.closest('a, button, input, select, textarea, [role="button"]');

        if (isInteractive && !isHovering) {
          isHovering = true;
          gsap.to(cursor, {
            scale: 1.5,
            backgroundColor: 'rgba(245, 241, 234, 0.1)',
            borderColor: 'rgba(245, 241, 234, 0)',
            duration: 0.3,
          });
          gsap.to(dot, { scale: 0, duration: 0.3 });
        } else if (!isInteractive && isHovering) {
          isHovering = false;
          gsap.to(cursor, {
            scale: 1,
            backgroundColor: 'transparent',
            borderColor: 'rgba(245, 241, 234, 0.4)',
            duration: 0.3,
          });
          gsap.to(dot, { scale: 1, duration: 0.3 });
        }
      };

      const onMouseDown = () => {
        gsap.to(cursor, { scale: 0.8, duration: 0.1 });
      };

      const onMouseUp = () => {
        gsap.to(cursor, { scale: isHovering ? 1.5 : 1, duration: 0.1 });
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseover', onMouseHover);
      window.addEventListener('mousedown', onMouseDown);
      window.addEventListener('mouseup', onMouseUp);

      // Initial fade in
      gsap.to([cursor, dot], { opacity: 1, duration: 1, delay: 0.5 });

      return () => {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseover', onMouseHover);
        window.removeEventListener('mousedown', onMouseDown);
        window.removeEventListener('mouseup', onMouseUp);
      };
    },
    { dependencies: [device] },
  );

  if (device === 'mobile') return null;

  return (
    <>
      <div
        ref={cursorRef}
        className="fixed top-0 left-0 w-8 h-8 rounded-full border border-bone/40 pointer-events-none z-[9999] opacity-0"
      />
      <div
        ref={dotRef}
        className="fixed top-0 left-0 w-1.5 h-1.5 bg-bone rounded-full pointer-events-none z-[9999] opacity-0"
      />
    </>
  );
}
