import type { PrintStyle } from '@/store/customizer';

interface ShareConfig {
  splitStyle: 'classic' | 'stepped' | 'grid';
  splitOrientation: 'horizontal' | 'vertical';
  splitPanels: number;
  splitGridCols: number;
  splitGridRows: number;
  printStyle: PrintStyle;
}

/**
 * Encodes the current customizer config into a base64 URL hash.
 * Note: We do NOT include the image (too large for a URL).
 */
export function encodeShareHash(config: ShareConfig): string {
  return btoa(JSON.stringify(config));
}

/**
 * Builds a full shareable URL for the current page with the config as a hash.
 */
export function buildShareUrl(config: ShareConfig): string {
  if (typeof window === 'undefined') return '';
  const hash = encodeShareHash(config);
  return `${window.location.origin}${window.location.pathname}#${hash}`;
}

/**
 * Copies the share URL to clipboard and returns true if successful.
 */
export async function copyShareUrl(config: ShareConfig): Promise<boolean> {
  const url = buildShareUrl(config);
  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch {
    // Fallback for older browsers / HTTP
    const ta = document.createElement('textarea');
    ta.value = url;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const success = document.execCommand('copy');
    document.body.removeChild(ta);
    return success;
  }
}
