'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/lib/gsap-config';

interface ImageGalleryProps {
  colorHex: string;
  productName: string;
  images?: string[] | undefined;
}

export function ImageGallery({ colorHex, productName, images }: ImageGalleryProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Rotation state managed as a ref to avoid re-render on every frame
  const rotationRef = useRef(0);
  const velocityRef = useRef(0);
  const lastXRef = useRef(0);
  const lastTimeRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const isMouseDownRef = useRef(false);

  useGSAP(
    () => {
      if (!mainRef.current) return;
      gsap.fromTo(
        mainRef.current,
        { scale: 0.95, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.7, ease: 'power3.out' },
      );
    },
    { scope: mainRef },
  );

  const applyRotation = useCallback((deg: number) => {
    if (!mainRef.current) return;
    // Keep between -70 and 70 degrees for a realistic "turn" feel (not full 360 on a flat img)
    const clamped = Math.max(-70, Math.min(70, deg));
    rotationRef.current = clamped;
    mainRef.current.style.transform = `perspective(1200px) rotateY(${clamped}deg)`;
  }, []);

  const momentumLoop = useCallback(() => {
    velocityRef.current *= 0.88; // friction
    if (Math.abs(velocityRef.current) < 0.1) {
      velocityRef.current = 0;
      rafRef.current = null;
      setIsDragging(false);
      // Smoothly snap back to 0
      if (mainRef.current) {
        mainRef.current.style.transition = 'transform 0.5s cubic-bezier(0.25,0.46,0.45,0.94)';
        mainRef.current.style.transform = 'perspective(1200px) rotateY(0deg)';
        rotationRef.current = 0;
      }
      return;
    }
    applyRotation(rotationRef.current + velocityRef.current);
    rafRef.current = requestAnimationFrame(momentumLoop);
  }, [applyRotation]);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    isMouseDownRef.current = true;
    lastXRef.current = e.clientX;
    lastTimeRef.current = Date.now();
    velocityRef.current = 0;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (mainRef.current) mainRef.current.style.transition = 'none';
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isMouseDownRef.current) return;
    const now = Date.now();
    const dt = Math.max(1, now - lastTimeRef.current);
    const dx = e.clientX - lastXRef.current;
    // ~350px drag = 70° of rotation
    const deltaDeg = (dx / 350) * 70;
    velocityRef.current = deltaDeg / dt * 16; // normalize to ~60fps
    applyRotation(rotationRef.current + deltaDeg);
    lastXRef.current = e.clientX;
    lastTimeRef.current = now;
    setIsDragging(true);
  }, [applyRotation]);

  const onPointerUp = useCallback(() => {
    if (!isMouseDownRef.current) return;
    isMouseDownRef.current = false;
    rafRef.current = requestAnimationFrame(momentumLoop);
  }, [momentumLoop]);

  // Touch equivalents via pointer events (already handled above via setPointerCapture)

  // Auto-hint rotation on hover (one slow idle pass)
  const hintTween = useRef<gsap.core.Tween | null>(null);
  const onMouseEnter = useCallback(() => {
    if (isMouseDownRef.current || (rafRef.current !== null)) return;
    if (!mainRef.current) return;
    hintTween.current = gsap.to(mainRef.current, {
      rotateY: 15,
      duration: 1.2,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: 1,
      onComplete: () => {
        if (mainRef.current) {
          mainRef.current.style.transition = '';
          gsap.set(mainRef.current, { rotateY: 0 });
          rotationRef.current = 0;
        }
      },
    });
  }, []);

  const onMouseLeave = useCallback(() => {
    if (hintTween.current) {
      hintTween.current.kill();
      hintTween.current = null;
    }
    if (!isMouseDownRef.current) {
      if (mainRef.current) {
        mainRef.current.style.transition = 'transform 0.4s ease';
        mainRef.current.style.transform = 'perspective(1200px) rotateY(0deg)';
        rotationRef.current = 0;
      }
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const hasMultipleImages = images && images.length > 1;

  return (
    <div className="flex flex-col gap-3">
      {/* Main image */}
      <div className="relative" ref={wrapperRef}>
        <div
          ref={mainRef}
          className="w-full aspect-[3/4] rounded-lg overflow-hidden relative select-none"
          style={{
            background: `linear-gradient(145deg, ${colorHex}66, ${colorHex})`,
            cursor: isDragging ? 'grabbing' : 'grab',
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
        >
          {images?.[activeIndex] ? (
            <Image
              src={images[activeIndex] ?? ''}
              alt={productName}
              fill
              className="object-contain pointer-events-none"
              sizes="(max-width: 768px) 100vw, 50vw"
              draggable={false}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-display text-display-lg text-bone/10 font-bold select-none text-center px-4">
                {productName}
              </span>
            </div>
          )}
        </div>

        {/* 360° Drag hint badge */}
        <div
          aria-hidden="true"
          className="absolute bottom-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono text-[10px] uppercase tracking-widest bg-charcoal/70 border border-smoke text-pearl pointer-events-none"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={isDragging ? 'animate-spin' : ''}
          >
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38" />
          </svg>
          {isDragging ? 'Spinning' : 'Drag to Spin'}
        </div>
      </div>

      {/* Thumbnail strip */}
      {hasMultipleImages && (
        <div className="flex gap-2">
          {images.map((src, i) => (
            <button
              key={i}
              aria-label={`View ${productName} image ${i + 1}`}
              aria-pressed={i === activeIndex}
              onClick={() => setActiveIndex(i)}
              className={`flex-1 aspect-square rounded overflow-hidden border-2 transition-colors relative ${
                i === activeIndex ? 'border-cobalt' : 'border-smoke hover:border-pearl'
              }`}
              style={{ background: `linear-gradient(145deg, ${colorHex}44, ${colorHex})` }}
            >
              <Image
                src={src}
                alt={`${productName} view ${i + 1}`}
                fill
                className="object-cover"
                sizes="25vw"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
