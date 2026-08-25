'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { createPortal } from 'react-dom';

interface Panel {
  width: string;
  height: string;
  bgPosition: string;
  bgSize: string;
  gradient: string;
  imageSrc?: string | null;
  gridCol?: number;
  gridRow?: number;
}

interface ArRoomPreviewProps {
  panels: Panel[];
  isOpen: boolean;
  onClose: () => void;
}

const WebXRPreview = dynamic(() => import('./webxr-preview').then((m) => m.WebXRPreview), {
  ssr: false,
});

const ThreeRoomFallback = dynamic(
  () => import('./three-room-fallback').then((m) => m.ThreeRoomFallback),
  {
    ssr: false,
  },
);

export function ArRoomPreview(props: ArRoomPreviewProps) {
  const [xrSupported, setXrSupported] = useState<boolean | null>(null);
  const [isIOS, setIsIOS] = useState<boolean | null>(null);
  const [mounted, setMounted] = useState(false);
  const [generatingUSDZ, setGeneratingUSDZ] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check for iOS Safari/Chrome
    const isIOSDevice =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.userAgent.includes('Mac') && 'ontouchend' in document);
    setIsIOS(isIOSDevice);

    const win = window as unknown as {
      Tawk_API?: { hideWidget?: () => void; showWidget?: () => void };
    };

    if (props.isOpen) {
      document.body.classList.add('ar-active');
      try {
        win?.Tawk_API?.hideWidget?.();
      } catch {
        // Ignore
      }

      if (isIOSDevice) {
        // Handle iOS natively via Quick Look
        generateAndLaunchUSDZ();
      }
    } else {
      document.body.classList.remove('ar-active');
      try {
        win?.Tawk_API?.showWidget?.();
      } catch {
        // Ignore
      }
    }

    if (!props.isOpen || isIOSDevice) return;

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
      try {
        win?.Tawk_API?.showWidget?.();
      } catch {
        // Ignore
      }
    };

    // We explicitly want to use generatingUSDZ state only when opening
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.isOpen]);

  const generateAndLaunchUSDZ = async () => {
    setGeneratingUSDZ(true);
    try {
      const { generatePosterUSDZ } = await import('@/lib/utils/usdz-exporter');
      const usdzUrl = await generatePosterUSDZ(props.panels);

      const anchor = document.createElement('a');
      anchor.rel = 'ar';
      anchor.href = usdzUrl;
      const img = document.createElement('img');
      anchor.appendChild(img);
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);

      // Close the preview overlay since AR Quick Look opens over the app natively
      setTimeout(() => props.onClose(), 500);
    } catch (e) {
      console.error('Failed to generate USDZ', e);
      // Fallback if Quick Look fails
      setIsIOS(false);
      setXrSupported(false);
    } finally {
      setGeneratingUSDZ(false);
    }
  };

  if (!mounted || !props.isOpen) return null;

  let content;

  if (isIOS || generatingUSDZ) {
    // Show a loading screen while generating the USDZ for iOS
    content = (
      <div className="fixed inset-0 z-[200] bg-charcoal flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-2 border-smoke border-t-cobalt rounded-full animate-spin mb-4" />
        <p className="font-mono text-sm text-bone">Preparing AR Experience...</p>
        <p className="font-mono text-xs text-ash mt-2">This may take a few seconds.</p>
      </div>
    );
  } else if (xrSupported === null) {
    content = (
      <div className="fixed inset-0 z-[200] bg-charcoal flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-smoke border-t-cobalt rounded-full animate-spin" />
      </div>
    );
  } else if (xrSupported) {
    content = <WebXRPreview {...props} />;
  } else {
    content = <ThreeRoomFallback {...props} />;
  }

  return createPortal(content, document.body);
}
