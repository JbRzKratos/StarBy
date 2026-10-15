/**
 * Artwork validation utilities
 * Detects opaque PNGs, checks effective print resolution, and validates file formats.
 */

export interface ValidationResult {
  valid: boolean;
  error?: string;
  isOpaque?: boolean;
  warning?: string;
}

export async function validateArtworkFile(file: File): Promise<ValidationResult> {
  const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
  if (!validTypes.includes(file.type) && !file.name.match(/\.(png|jpe?g|webp|svg)$/i)) {
    return {
      valid: false,
      error: 'Please upload a PNG, JPG, WebP, or SVG file.',
    };
  }

  // Max 25 MB
  if (file.size > 25 * 1024 * 1024) {
    return {
      valid: false,
      error: 'File size exceeds 25MB limit. Please upload an optimized file.',
    };
  }

  // For PNG/WebP files, inspect actual pixel alpha values to detect opaque images
  if (file.type === 'image/png' || file.name.toLowerCase().endsWith('.png')) {
    try {
      const isOpaque = await checkImageOpacity(file);
      if (isOpaque) {
        return {
          valid: true,
          isOpaque: true,
          warning: 'This PNG has an opaque background (no transparency). For best results, use artwork with a transparent background.',
        };
      }
    } catch (e) {
      console.warn('Opacity inspection error:', e);
    }
  }

  return { valid: true, isOpaque: false };
}

/**
 * Checks whether an image file has any transparent pixels
 */
async function checkImageOpacity(file: File): Promise<boolean> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = url;
    });

    const canvas = document.createElement('canvas');
    // Sample thumbnail size for fast check
    const sampleW = Math.min(256, img.width);
    const sampleH = Math.min(256, img.height);
    canvas.width = sampleW;
    canvas.height = sampleH;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return false;

    ctx.drawImage(img, 0, 0, sampleW, sampleH);
    const imgData = ctx.getImageData(0, 0, sampleW, sampleH);
    const data = imgData.data;

    let hasAnyTransparency = false;
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] < 250) {
        hasAnyTransparency = true;
        break;
      }
    }

    // If no transparent pixels found in the entire image, it is fully opaque
    return !hasAnyTransparency;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Check effective resolution of placed layer on 2048x2048 garment canvas
 */
export function checkEffectiveResolution(
  naturalWidth: number,
  naturalHeight: number,
  displayWidth: number,
  displayHeight: number
): { dpiQuality: 'high' | 'good' | 'low'; warning?: string } {
  // If the artwork is scaled up beyond 1.5x its native resolution:
  const scale = Math.max(displayWidth / naturalWidth, displayHeight / naturalHeight);
  if (scale > 2.0) {
    return {
      dpiQuality: 'low',
      warning: `Artwork is enlarged ${scale.toFixed(1)}× above native size. It may appear pixelated when printed.`,
    };
  } else if (scale > 1.3) {
    return {
      dpiQuality: 'good',
    };
  }
  return {
    dpiQuality: 'high',
  };
}

/**
 * Reads an image file and safely scales it if larger than maxDimension (default 1600),
 * keeping payload sizes manageable and preventing WebGL memory issues and storage quotas.
 */
export async function readOptimizedImageDataUrl(
  file: File,
  maxDimension = 1600
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const rawDataUrl = e.target?.result as string;
      if (!rawDataUrl) return reject(new Error('Failed to read image file'));

      // If it's an SVG, preserve original SVG vector string
      if (file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg')) {
        return resolve(rawDataUrl);
      }

      const img = new Image();
      img.onload = () => {
        const { width, height } = img;
        // If image is already within bounds and small enough, use original
        if (width <= maxDimension && height <= maxDimension && file.size < 1.5 * 1024 * 1024) {
          return resolve(rawDataUrl);
        }

        // Downscale proportionally
        let targetW = width;
        let targetH = height;
        if (targetW > targetH) {
          if (targetW > maxDimension) {
            targetH = Math.round((targetH * maxDimension) / targetW);
            targetW = maxDimension;
          }
        } else {
          if (targetH > maxDimension) {
            targetW = Math.round((targetW * maxDimension) / targetH);
            targetH = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(rawDataUrl);

        ctx.drawImage(img, 0, 0, targetW, targetH);
        const isPng = file.type === 'image/png' || file.name.toLowerCase().endsWith('.png');
        resolve(canvas.toDataURL(isPng ? 'image/png' : 'image/jpeg', 0.90));
      };
      img.onerror = () => resolve(rawDataUrl);
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  });
}

