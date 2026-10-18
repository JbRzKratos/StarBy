'use client';

import { useEffect, useState, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * TopProgressBar — Instant tactile visual feedback on all page navigations.
 *
 * Appears the exact millisecond a user clicks any link or navigates,
 * eliminating the "frozen" feeling during network transfers and route compilation.
 */
export function TopProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const crawlRef = useRef<NodeJS.Timeout | null>(null);

  // Complete and hide progress bar whenever pathname or search params change
  useEffect(() => {
    if (visible) {
      setProgress(100);
      const hideTimer = setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 250);
      return () => clearTimeout(hideTimer);
    }
  }, [pathname, searchParams]);

  // Global link click listener to start progress bar immediately (0ms delay)
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      // Ignore modified clicks (new tab, right click)
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;

      const target = (e.target as HTMLElement)?.closest('a');
      if (!target || !target.href) return;

      // Ignore external links, targets with _blank, download links, or mailto/tel
      if (target.target === '_blank' || target.hasAttribute('download')) return;
      if (target.href.startsWith('mailto:') || target.href.startsWith('tel:')) return;

      try {
        const url = new URL(target.href);
        const current = new URL(window.location.href);

        // Ignore clicks to other origins
        if (url.origin !== current.origin) return;

        // Ignore hash jumps on the same page
        if (url.pathname === current.pathname && url.search === current.search && url.hash !== current.hash) {
          return;
        }

        // Ignore clicking current exact page without params
        if (url.pathname === current.pathname && url.search === current.search) {
          return;
        }

        // Valid internal navigation — start progress immediately
        if (timerRef.current) clearTimeout(timerRef.current);
        if (crawlRef.current) clearInterval(crawlRef.current);

        setVisible(true);
        setProgress(28);

        // Steadily crawl forward to 85% until route transition completes
        let currentProgress = 28;
        crawlRef.current = setInterval(() => {
          if (currentProgress < 75) {
            currentProgress += Math.random() * 12 + 4;
            setProgress(Math.min(currentProgress, 75));
          } else if (currentProgress < 88) {
            currentProgress += Math.random() * 3 + 1;
            setProgress(Math.min(currentProgress, 88));
          }
        }, 180);

        // Fallback safety timeout if user stays on page or aborts
        timerRef.current = setTimeout(() => {
          if (crawlRef.current) clearInterval(crawlRef.current);
          setProgress(100);
          setTimeout(() => {
            setVisible(false);
            setProgress(0);
          }, 300);
        }, 6000);
      } catch {
        /* invalid url, ignore */
      }
    };

    const handlePopState = () => {
      setVisible(true);
      setProgress(70);
    };

    document.addEventListener('click', handleDocumentClick, { capture: true });
    window.addEventListener('popstate', handlePopState);

    return () => {
      document.removeEventListener('click', handleDocumentClick, { capture: true });
      window.removeEventListener('popstate', handlePopState);
      if (timerRef.current) clearTimeout(timerRef.current);
      if (crawlRef.current) clearInterval(crawlRef.current);
    };
  }, []);

  if (!visible && progress === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 z-[9999999] pointer-events-none transition-opacity duration-300"
      style={{
        opacity: visible ? 1 : 0,
        height: '3px',
      }}
    >
      <div
        className="h-full bg-gradient-to-r from-[#0057FF] via-[#3B82F6] to-[#ED9518]"
        style={{
          width: `${progress}%`,
          transition: progress === 100 ? 'width 0.15s ease-out' : 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '0 0 12px rgba(0, 87, 255, 0.9), 0 0 6px rgba(237, 149, 24, 0.7)',
        }}
      />
    </div>
  );
}
