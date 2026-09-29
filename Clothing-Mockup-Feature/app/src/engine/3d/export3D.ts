import * as THREE from 'three';
import type { SceneManager3D } from './sceneManager';
import type { TextureCompositor3D } from './textureCompositor';

export type ExportResolutionPreset = 'standard' | 'high';

export interface ExportStillOptions {
  view: 'current' | 'front' | 'back';
  transparent: boolean;
  resolution?: ExportResolutionPreset; // 'standard' = 2048px, 'high' = 4096px
  width?: number;   // explicit override (ignored if resolution is set)
  height?: number;  // explicit override (ignored if resolution is set)
  filename?: string;
}

export interface ExportVideoOptions {
  durationSeconds: number;
  fps: number;
  filename?: string;
  onProgress?: (progress: number) => void;
}

/** Maximum texture dimension safely supported by most devices. */
const MAX_SAFE_TEXTURE = 4096;

function resolveExportDimensions(
  options: ExportStillOptions,
  renderer: THREE.WebGLRenderer
): { exportW: number; exportH: number } {
  // Determine the long-edge target from preset
  const longEdge =
    options.resolution === 'high'
      ? 4096
      : options.resolution === 'standard'
      ? 2048
      : options.width ?? 2048;

  // Clamp to GPU limit
  const maxDim = Math.min(
    longEdge,
    MAX_SAFE_TEXTURE,
    renderer.capabilities.maxTextureSize || MAX_SAFE_TEXTURE
  );

  // Preserve the current viewport aspect ratio
  const vp = renderer.getSize(new THREE.Vector2());
  const aspect = vp.x > 0 && vp.y > 0 ? vp.x / vp.y : 1;

  let exportW: number;
  let exportH: number;

  if (aspect >= 1) {
    exportW = maxDim;
    exportH = Math.round(maxDim / aspect);
  } else {
    exportH = maxDim;
    exportW = Math.round(maxDim * aspect);
  }

  // Ensure both dims are even (required by some encoders)
  exportW = exportW % 2 === 0 ? exportW : exportW - 1;
  exportH = exportH % 2 === 0 ? exportH : exportH - 1;

  return { exportW, exportH };
}

export class Export3DManager {
  private isRecording = false;
  private mediaRecorder: MediaRecorder | null = null;
  private cancelRecordingFlag = false;
  private isExportingStill = false;

  /**
   * Export a high-resolution still PNG by rendering into an off-screen
   * WebGLRenderTarget at the requested output size.
   *
   * The visible preview canvas is NEVER stretched or enlarged.
   * All scene state (camera, lighting, artwork, materials) is preserved.
   * Selection outlines and editor chrome do NOT appear in the output because
   * they are drawn on an HTML overlay, not in the WebGL scene.
   */
  public async exportStillPNG(
    sceneManager: SceneManager3D,
    options: ExportStillOptions,
    compositor?: TextureCompositor3D
  ): Promise<string> {
    if (this.isExportingStill) {
      throw new Error('Export already in progress');
    }
    this.isExportingStill = true;

    const { renderer, scene, camera, controls } = sceneManager;

    // ── 1. Resolve output dimensions ────────────────────────────────────────
    const { exportW, exportH } = resolveExportDimensions(options, renderer);

    // ── 2. Save current renderer / camera state ──────────────────────────────
    const prevRenderTarget = renderer.getRenderTarget();
    const prevClearColor = new THREE.Color();
    const prevClearAlpha = renderer.getClearAlpha();
    renderer.getClearColor(prevClearColor);
    const prevBackground = scene.background;

    const prevCameraPosition = camera.position.clone();
    const prevControlsTarget = controls.target.clone();
    const prevCameraAspect = camera.aspect;
    const prevCameraFov = camera.fov;

    // ── 3. Optionally snap to a preset camera view ───────────────────────────
    if (options.view === 'front') {
      sceneManager.setCameraPreset('front');
      // Flush the lerp immediately by calling update multiple times
      for (let i = 0; i < 60; i++) {
        sceneManager.update(1 / 30);
      }
    } else if (options.view === 'back') {
      sceneManager.setCameraPreset('back');
      for (let i = 0; i < 60; i++) {
        sceneManager.update(1 / 30);
      }
    }

    // ── 4. Apply export-time transparency setting ───────────────────────────
    if (options.transparent) {
      scene.background = null;
      renderer.setClearColor(0x000000, 0);
    }

    // ── 5. If compositor is provided, ensure texture is at full resolution ──
    // The compositor already works at 2048 internally; we just ensure its
    // current composite is up to date (it should be, but we trigger needsUpdate)
    if (compositor) {
      compositor.getTexture().needsUpdate = true;
      compositor.getBaseTexture().needsUpdate = true;
    }

    // ── 6. Create off-screen render target at export resolution ─────────────
    const exportTarget = new THREE.WebGLRenderTarget(exportW, exportH, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      type: THREE.UnsignedByteType,
      generateMipmaps: false,
      samples: renderer.capabilities.isWebGL2 ? 4 : 0, // MSAA if available
    });

    // ── 7. Adjust camera aspect for export dimensions ────────────────────────
    camera.aspect = exportW / exportH;
    camera.updateProjectionMatrix();

    // ── 8. Render scene into the off-screen render target ───────────────────
    renderer.setRenderTarget(exportTarget);
    renderer.setSize(exportW, exportH, false); // false = don't update CSS
    renderer.setClearColor(
      options.transparent ? 0x000000 : prevClearColor,
      options.transparent ? 0 : prevClearAlpha
    );
    renderer.clear();
    renderer.render(scene, camera);

    // ── 9. Read pixels from GPU into a Uint8Array ────────────────────────────
    const pixelBuffer = new Uint8Array(exportW * exportH * 4);
    renderer.readRenderTargetPixels(exportTarget, 0, 0, exportW, exportH, pixelBuffer);

    // ── 10. Restore renderer state ──────────────────────────────────────────
    renderer.setRenderTarget(prevRenderTarget);
    const vp = new THREE.Vector2();
    renderer.getSize(vp);
    renderer.setSize(vp.x, vp.y, false);
    scene.background = prevBackground;
    renderer.setClearColor(prevClearColor, prevClearAlpha);

    camera.position.copy(prevCameraPosition);
    controls.target.copy(prevControlsTarget);
    camera.aspect = prevCameraAspect;
    camera.fov = prevCameraFov;
    camera.updateProjectionMatrix();
    controls.update();

    // Restore a clean preview frame
    renderer.render(scene, camera);

    // ── 11. Dispose temporary render target ─────────────────────────────────
    exportTarget.dispose();

    // ── 12. Blit the pixel buffer into a canvas and encode to PNG ───────────
    // WebGL's coordinate origin is bottom-left; we flip vertically here.
    const offscreen = document.createElement('canvas');
    offscreen.width = exportW;
    offscreen.height = exportH;
    const ctx = offscreen.getContext('2d');
    if (!ctx) {
      this.isExportingStill = false;
      throw new Error('Could not create 2D canvas context for PNG encoding');
    }

    const imageData = ctx.createImageData(exportW, exportH);

    // Flip Y: WebGL origin is bottom-left, ImageData origin is top-left
    for (let y = 0; y < exportH; y++) {
      const srcRow = (exportH - 1 - y) * exportW * 4;
      const dstRow = y * exportW * 4;
      imageData.data.set(pixelBuffer.subarray(srcRow, srcRow + exportW * 4), dstRow);
    }

    ctx.putImageData(imageData, 0, 0);

    // ── 13. Encode and download ──────────────────────────────────────────────
    const dataUrl = offscreen.toDataURL('image/png');

    const filename =
      options.filename || `mockup-3d-${options.view}-${exportW}x${exportH}-${Date.now()}.png`;
    this.downloadFile(dataUrl, filename);

    console.info(
      `[Export3D] PNG exported: ${exportW}×${exportH}px (${options.resolution ?? 'custom'}), ` +
      `transparent=${options.transparent}, view=${options.view}`
    );

    this.isExportingStill = false;
    return dataUrl;
  }

  public getIsExportingStill(): boolean {
    return this.isExportingStill;
  }

  public async recordAnimationVideo(
    sceneManager: SceneManager3D,
    options: ExportVideoOptions
  ): Promise<Blob> {
    if (this.isRecording) {
      throw new Error('Video recording already in progress');
    }

    const canvas = sceneManager.renderer.domElement;
    if (!('captureStream' in canvas)) {
      throw new Error('Your browser does not support HTMLCanvasElement.captureStream()');
    }

    this.isRecording = true;
    this.cancelRecordingFlag = false;

    // Choose supported MIME type
    let mimeType = 'video/webm;codecs=vp9';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm;codecs=vp8';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm';
      }
    }

    const stream = (canvas as HTMLCanvasElement & { captureStream(fps: number): MediaStream }).captureStream(options.fps);
    const recordedChunks: Blob[] = [];

    const recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: 8000000, // 8 Mbps
    });
    this.mediaRecorder = recorder;

    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    };

    return new Promise((resolve, reject) => {
      const startTime = performance.now();
      const totalMs = options.durationSeconds * 1000;

      const progressInterval = window.setInterval(() => {
        if (this.cancelRecordingFlag) {
          window.clearInterval(progressInterval);
          recorder.stop();
          this.isRecording = false;
          reject(new Error('Video recording cancelled by user'));
          return;
        }

        const elapsed = performance.now() - startTime;
        const progress = Math.min(1.0, elapsed / totalMs);
        if (options.onProgress) {
          options.onProgress(progress);
        }

        if (elapsed >= totalMs) {
          window.clearInterval(progressInterval);
          if (recorder.state !== 'inactive') {
            recorder.stop();
          }
        }
      }, 50);

      recorder.onstop = () => {
        this.isRecording = false;
        if (this.cancelRecordingFlag) return;

        const blob = new Blob(recordedChunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const filename = options.filename || `mockup-3d-animation-${Date.now()}.webm`;
        this.downloadFile(url, filename);
        setTimeout(() => URL.revokeObjectURL(url), 5000);
        resolve(blob);
      };

      recorder.onerror = (err) => {
        window.clearInterval(progressInterval);
        this.isRecording = false;
        reject(err);
      };

      recorder.start(100);
    });
  }

  public cancelRecording(): void {
    if (this.isRecording) {
      this.cancelRecordingFlag = true;
      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop();
      }
      this.isRecording = false;
    }
  }

  public getIsRecording(): boolean {
    return this.isRecording;
  }

  private downloadFile(url: string, filename: string): void {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // For object URLs, revoke after a brief delay
    if (url.startsWith('blob:')) {
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    }
  }
}
