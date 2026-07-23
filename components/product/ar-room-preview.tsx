'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { createPortal } from 'react-dom';

interface Panel {
  width: string;
  height: string;
  bgPosition: string;
  bgSize: string;
  gradient: string;
  imageSrc?: string | null;
}

interface ArRoomPreviewProps {
  panels: Panel[];
  isOpen: boolean;
  onClose: () => void;
}

const WebXRPreview = dynamic(() => import('./webxr-preview').then((m) => m.WebXRPreview), {
  ssr: false,
});

export function ArRoomPreview(props: ArRoomPreviewProps) {
  const [xrSupported, setXrSupported] = useState<boolean | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (props.isOpen) {
      document.body.classList.add('ar-active');
    } else {
      document.body.classList.remove('ar-active');
    }

    if (!props.isOpen) return;

    if (navigator?.xr?.isSessionSupported) {
      navigator.xr
        .isSessionSupported('immersive-ar')
        .then((supported) => setXrSupported(supported))
        .catch(() => setXrSupported(false));
    } else {
      setXrSupported(false);
    }

    return () => {
      document.body.classList.remove('ar-active');
    };
  }, [props.isOpen]);

  if (!mounted || !props.isOpen) return null;

  let content;
  if (xrSupported === null) {
    content = (
      <div className="fixed inset-0 z-[200] bg-charcoal flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-smoke border-t-cobalt rounded-full animate-spin" />
      </div>
    );
  } else if (xrSupported) {
    content = <WebXRPreview {...props} />;
  } else {
    content = <FallbackARPreview {...props} />;
  }

  // Render via portal so the AR view sits completely outside the <main> element.
  // This prevents `body.ar-active main { visibility: hidden }` from hiding the AR UI!
  return createPortal(content, document.body);
}

function FallbackARPreview({ panels, isOpen, onClose }: ArRoomPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [placeholderPos, setPlaceholderPos] = useState({ x: 50, y: 40 });
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, px: 0, py: 0 });

  useEffect(() => {
    if (!isOpen) return;

    setCameraError(null);
    setCameraReady(false);

    const tryCamera = async (constraints: MediaStreamConstraints) => {
      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error('Camera API not available');
      }
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    };

    const startCamera = async () => {
      try {
        await tryCamera({ video: { facingMode: 'environment' } });
        setCameraReady(true);
      } catch {
        try {
          await tryCamera({ video: true });
          setCameraReady(true);
        } catch {
          setCameraError('Camera access was denied or unavailable. Please check permissions.');
        }
      }
    };

    startCamera();

    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setCameraReady(false);
    };
  }, [isOpen]);

  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, px: placeholderPos.x, py: placeholderPos.y };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const dx = ((e.clientX - dragStart.current.x) / rect.width) * 100;
    const dy = ((e.clientY - dragStart.current.y) / rect.height) * 100;
    setPlaceholderPos({
      x: Math.max(5, Math.min(95, dragStart.current.px + dx)),
      y: Math.max(5, Math.min(90, dragStart.current.py + dy)),
    });
  };

  const onPointerUp = () => setIsDragging(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-charcoal flex flex-col">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-5 py-4 bg-gradient-to-b from-charcoal/80 to-transparent pointer-events-none">
        <div>
          <p className="font-mono text-[10px] text-pearl uppercase tracking-widest">AR Preview</p>
          <p className="font-display text-bone text-lg">View in Your Room</p>
        </div>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-graphite border border-smoke flex items-center justify-center text-pearl hover:text-bone transition-colors pointer-events-auto"
          aria-label="Close AR preview"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Camera / Error */}
      <div ref={containerRef} className="flex-1 relative overflow-hidden select-none">
        {cameraError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-graphite gap-4 px-8 text-center">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-ash"
            >
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            <p className="font-mono text-caption text-pearl">{cameraError}</p>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
              style={{ opacity: cameraReady ? 1 : 0, transition: 'opacity 0.5s' }}
            />

            {!cameraReady && (
              <div className="absolute inset-0 bg-graphite flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-smoke border-t-cobalt rounded-full animate-spin" />
              </div>
            )}

            {cameraReady && (
              <div
                className="absolute"
                style={{
                  left: `${placeholderPos.x}%`,
                  top: `${placeholderPos.y}%`,
                  transform: `translate(-50%, -50%) scale(${scale})`,
                  cursor: isDragging ? 'grabbing' : 'grab',
                  filter: 'drop-shadow(0 20px 60px rgba(0,0,0,0.7))',
                  touchAction: 'none',
                }}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
              >
                <div style={{ display: 'flex', gap: '4px' }}>
                  {panels.map((panel, i) => (
                    <div
                      key={i}
                      style={{
                        width: '60px',
                        height: '90px',
                        backgroundImage: panel.imageSrc ? `url(${panel.imageSrc})` : panel.gradient,
                        backgroundPosition: panel.bgPosition,
                        backgroundSize: panel.bgSize,
                        borderRadius: '2px',
                        flexShrink: 0,
                      }}
                    />
                  ))}
                </div>

                {/* Scale controls */}
                <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2">
                  <button
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={() => setScale((s) => Math.max(0.4, +(s - 0.15).toFixed(2)))}
                    className="w-7 h-7 rounded-full bg-charcoal/80 text-bone flex items-center justify-center border border-smoke text-base leading-none"
                    aria-label="Shrink"
                  >
                    −
                  </button>
                  <button
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={() => setScale((s) => Math.min(4, +(s + 0.15).toFixed(2)))}
                    className="w-7 h-7 rounded-full bg-charcoal/80 text-bone flex items-center justify-center border border-smoke text-base leading-none"
                    aria-label="Grow"
                  >
                    +
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom hint */}
      <div className="absolute bottom-0 left-0 right-0 px-5 py-6 bg-gradient-to-t from-charcoal/90 to-transparent flex flex-col items-center gap-1 pointer-events-none">
        <p className="font-mono text-[10px] text-pearl/70 uppercase tracking-widest text-center">
          Drag to reposition · + / − to resize
        </p>
      </div>
    </div>
  );
}
