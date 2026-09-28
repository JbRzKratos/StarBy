/**
 * Asset Manager for VirtualThreads 2D Mockup Editor
 * Caches decoded images, computes garment silhouette masks,
 * extracts macroscopic fold luminance for authentic fabric warping,
 * and manages progressive preloading for the 180-frame gobo lighting sequence.
 */

export interface GarmentAnalysis {
  img: HTMLImageElement;
  width: number;
  height: number;
  alphaMask: Uint8Array; // 0 or 255 for fabric silhouette
  luma: Float32Array; // Normalized luminance 0..1
  smoothLuma: Float32Array; // Macroscopic fold luminance for authentic shading
  gradX: Float32Array; // Horizontal fold gradient for physical displacement
  gradY: Float32Array; // Vertical fold gradient for physical displacement
  rawR: Float32Array; // Original photographic red channel 0..1
  rawG: Float32Array; // Original photographic green channel 0..1
  rawB: Float32Array; // Original photographic blue channel 0..1
  medianLuma: number; // Authentic median luminance of the garment body
}

export interface ProcessedShadow {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
}

class AssetManager {
  private imageCache = new Map<string, Promise<HTMLImageElement>>();
  private garmentCache = new Map<string, Promise<GarmentAnalysis>>();
  private shadowCache = new Map<string, Promise<ProcessedShadow>>();
  private goboFrameCache = new Map<number, HTMLImageElement>();
  private goboLoadingPromises = new Map<number, Promise<HTMLImageElement>>();
  private isPreloadingGobo = false;

  /**
   * Load any image with browser cache and promise deduplication
   */
  async loadImage(src: string): Promise<HTMLImageElement> {
    if (this.imageCache.has(src)) {
      return this.imageCache.get(src)!;
    }

    const promise = new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = (err) => reject(new Error(`Failed to load image: ${src} - ${err}`));
      img.src = src;
    });

    this.imageCache.set(src, promise);
    return promise;
  }

  /**
   * Load and analyze garment image:
   * Extracts photographic channels, computes silhouette alpha,
   * derives macroscopic fold wrinkles using multi-pass Gaussian-equivalent blur (radius ~28px),
   * and calculates physical fold gradients.
   */
  async loadGarment(url: string): Promise<GarmentAnalysis> {
    if (this.garmentCache.has(url)) {
      return this.garmentCache.get(url)!;
    }

    const promise = (async () => {
      const img = await this.loadImage(url);
      const width = img.naturalWidth || img.width;
      const height = img.naturalHeight || img.height;

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) throw new Error('Could not get 2D context');

      ctx.drawImage(img, 0, 0);
      const imgData = ctx.getImageData(0, 0, width, height);
      const data = imgData.data;

      const totalPixels = width * height;
      const alphaMask = new Uint8Array(totalPixels);
      const luma = new Float32Array(totalPixels);
      const rawR = new Float32Array(totalPixels);
      const rawG = new Float32Array(totalPixels);
      const rawB = new Float32Array(totalPixels);
      const smoothLuma = new Float32Array(totalPixels);
      const gradX = new Float32Array(totalPixels);
      const gradY = new Float32Array(totalPixels);

      // Pass 1: Extract alpha mask, photographic RGB and Rec. 601 luminance
      for (let i = 0; i < totalPixels; i++) {
        const idx = i * 4;
        const a = data[idx + 3];
        const r = data[idx] / 255.0;
        const g = data[idx + 1] / 255.0;
        const b = data[idx + 2] / 255.0;

        rawR[i] = r;
        rawG[i] = g;
        rawB[i] = b;

        if (a > 10) {
          alphaMask[i] = 255;
          luma[i] = 0.299 * r + 0.587 * g + 0.114 * b;
        } else {
          alphaMask[i] = 0;
          luma[i] = 0.54; // default neutral midtone
        }
      }

      // Pass 1b: Compute authentic median luminance of garment body
      const hist = new Int32Array(256);
      let garmentPixelCount = 0;
      for (let i = 0; i < totalPixels; i++) {
        if (alphaMask[i] > 0) {
          const bin = Math.max(0, Math.min(255, Math.round(luma[i] * 255.0)));
          hist[bin]++;
          garmentPixelCount++;
        }
      }
      let medianLuma = 0.55;
      if (garmentPixelCount > 0) {
        const half = garmentPixelCount / 2;
        let cumulative = 0;
        for (let b = 0; b < 256; b++) {
          cumulative += hist[b];
          if (cumulative >= half) {
            medianLuma = b / 255.0;
            break;
          }
        }
      }

      // Pass 2: 3-pass box blur to approximate Gaussian blur (radius ~14px on 2048x2048)
      // This separates broad physical garment wrinkles from high-frequency cotton weave noise.
      const radius = Math.max(7, Math.round(width / 150)); // ~14 for 2048
      const tempBlur = new Float32Array(totalPixels);

      // Copy luma to smoothLuma for pass 1
      for (let i = 0; i < totalPixels; i++) {
        smoothLuma[i] = luma[i];
      }

      // 3 iterations of horizontal + vertical box blur gives smooth Gaussian fold profile
      for (let iter = 0; iter < 3; iter++) {
        // Horizontal blur
        for (let y = 0; y < height; y++) {
          const rowOffset = y * width;
          let sum = 0;
          let count = 0;
          // Pre-fill window
          for (let k = -radius; k <= radius; k++) {
            const px = Math.max(0, Math.min(width - 1, k));
            sum += smoothLuma[rowOffset + px];
            count++;
          }
          tempBlur[rowOffset] = sum / count;

          for (let x = 1; x < width; x++) {
            const addX = Math.min(width - 1, x + radius);
            const subX = Math.max(0, x - radius - 1);
            sum += smoothLuma[rowOffset + addX] - smoothLuma[rowOffset + subX];
            tempBlur[rowOffset + x] = sum / count;
          }
        }

        // Vertical blur
        for (let x = 0; x < width; x++) {
          let sum = 0;
          let count = 0;
          for (let k = -radius; k <= radius; k++) {
            const py = Math.max(0, Math.min(height - 1, k));
            sum += tempBlur[py * width + x];
            count++;
          }
          smoothLuma[x] = sum / count;

          for (let y = 1; y < height; y++) {
            const addY = Math.min(height - 1, y + radius);
            const subY = Math.max(0, y - radius - 1);
            sum += tempBlur[addY * width + x] - tempBlur[subY * width + x];
            smoothLuma[y * width + x] = sum / count;
          }
        }
      }

      // Pass 3: Central difference fold gradients (step = 8px)
      // Produces physically scaled gradient values without high-frequency fabric noise
      const step = Math.max(4, Math.round(width / 256)); // 8 for 2048
      for (let y = 0; y < height; y++) {
        const row = y * width;
        const topRow = Math.max(0, y - step) * width;
        const btmRow = Math.min(height - 1, y + step) * width;

        for (let x = 0; x < width; x++) {
          if (alphaMask[row + x] === 0) continue;

          const leftX = Math.max(0, x - step);
          const rightX = Math.min(width - 1, x + step);

          // Central difference gradient across 16px span
          gradX[row + x] = (smoothLuma[row + rightX] - smoothLuma[row + leftX]);
          gradY[row + x] = (smoothLuma[btmRow + x] - smoothLuma[topRow + x]);
        }
      }

      return {
        img,
        width,
        height,
        alphaMask,
        luma,
        smoothLuma,
        gradX,
        gradY,
        rawR,
        rawG,
        rawB,
        medianLuma,
      };
    })();

    this.garmentCache.set(url, promise);
    return promise;
  }

  /**
   * Load and process shadow image:
   * Converts light background to transparent alpha and scales dark shadow.
   */
  async loadShadow(url: string): Promise<ProcessedShadow> {
    if (this.shadowCache.has(url)) {
      return this.shadowCache.get(url)!;
    }

    const promise = (async () => {
      const img = await this.loadImage(url);
      const width = img.naturalWidth || img.width;
      const height = img.naturalHeight || img.height;

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) throw new Error('Could not get 2D context');

      ctx.drawImage(img, 0, 0);
      const imgData = ctx.getImageData(0, 0, width, height);
      const data = imgData.data;

      // Convert shadow luminance to alpha
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const luma = 0.299 * r + 0.587 * g + 0.114 * b;

        if (luma >= 250) {
          data[i + 3] = 0;
        } else {
          const alpha = 255 * (1 - Math.pow(luma / 250.0, 0.5));
          data[i] = Math.round(0.4 * r);
          data[i + 1] = Math.round(0.4 * g);
          data[i + 2] = Math.round(0.4 * b);
          data[i + 3] = Math.round(Math.min(255, Math.max(0, alpha)));
        }
      }

      ctx.putImageData(imgData, 0, 0);
      return { canvas, width, height };
    })();

    this.shadowCache.set(url, promise);
    return promise;
  }

  /**
   * Synchronously retrieve a gobo frame if already loaded/cached
   */
  getGoboFrameSync(frameIndex: number): HTMLImageElement | null {
    const frame = Math.max(0, Math.min(179, Math.round(frameIndex)));
    return this.goboFrameCache.get(frame) || this.goboFrameCache.get(0) || null;
  }

  /**
   * Load a specific gobo frame asynchronously with memoization
   */
  async loadGoboFrame(frameIndex: number): Promise<HTMLImageElement> {
    const frame = Math.max(0, Math.min(179, Math.round(frameIndex)));

    if (this.goboFrameCache.has(frame)) {
      return this.goboFrameCache.get(frame)!;
    }

    if (this.goboLoadingPromises.has(frame)) {
      return this.goboLoadingPromises.get(frame)!;
    }

    const frameStr = frame.toString().padStart(3, '0');
    const url = `/gobo/GSG_GC002_A012_TreeLoop08_${frameStr}.jpg`;

    const promise = this.loadImage(url).then((img) => {
      this.goboFrameCache.set(frame, img);
      this.goboLoadingPromises.delete(frame);
      return img;
    });

    this.goboLoadingPromises.set(frame, promise);
    return promise;
  }

  /**
   * Start background progressive preloading of all 180 gobo frames in batches.
   * Keeps playback completely smooth without blocking initial startup.
   */
  startGoboPreloader(): void {
    if (this.isPreloadingGobo) return;
    this.isPreloadingGobo = true;

    // Load first 10 frames with priority, then progressively load the rest
    const loadBatch = async (startIdx: number, batchSize: number) => {
      const promises: Promise<any>[] = [];
      for (let i = startIdx; i < Math.min(180, startIdx + batchSize); i++) {
        if (!this.goboFrameCache.has(i)) {
          promises.push(this.loadGoboFrame(i).catch(() => null));
        }
      }
      await Promise.all(promises);

      if (startIdx + batchSize < 180) {
        // Yield to browser thread before loading next batch
        setTimeout(() => loadBatch(startIdx + batchSize, batchSize), 60);
      }
    };

    // Load initial 15 frames immediately
    loadBatch(0, 15);
  }
}

export const assetManager = new AssetManager();
