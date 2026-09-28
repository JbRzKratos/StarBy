/**
 * Export Manager for VirtualThreads 2D Mockup Editor
 * Generates pristine, full-resolution exports for single sides, both sides (ZIP),
 * and side-by-side presentations with true alpha transparency.
 */

import JSZip from 'jszip';
import type { ProjectState, ExportOptions } from '../types/mockup';
import { compositor } from './compositor';

export class ExportManager {
  private parseDimensions(dimStr: string): { width: number; height: number } {
    const [w, h] = dimStr.split('x').map(s => parseInt(s.trim(), 10));
    return { width: w || 2048, height: h || 2048 };
  }

  async renderSideCanvas(
    project: ProjectState,
    side: 'front' | 'back',
    options: ExportOptions
  ): Promise<HTMLCanvasElement> {
    const { width, height } = this.parseDimensions(options.dimensions);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('Failed to create export canvas context');

    const sideLayers = side === 'front' ? project.front.layers : project.back.layers;

    await compositor.renderScene(ctx, {
      templateId: project.templateId,
      side,
      garmentColor: project.garmentColor,
      warp: project.warp,
      background: project.background,
      lighting: project.lighting,
      layers: sideLayers,
      drawUIHandles: false,
      transparentBg: options.transparentBg,
      includeShadow: options.includeShadow,
      outputWidth: width,
      outputHeight: height,
    });

    return canvas;
  }

  async renderSideBySideCanvas(
    project: ProjectState,
    options: ExportOptions
  ): Promise<HTMLCanvasElement> {
    const { width, height } = this.parseDimensions(options.dimensions);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('Failed to create export canvas context');

    const shirtSize = Math.min(Math.round(width * 0.46), Math.round(height * 0.92));
    const padX = (width - shirtSize * 2) / 3;
    const posY = (height - shirtSize) / 2;

    if (!options.transparentBg) {
      if (project.background.type === 'solid') {
        ctx.fillStyle = project.background.color || '#1e1e1e';
        ctx.fillRect(0, 0, width, height);
      } else {
        ctx.fillStyle = '#1e1e1e';
        ctx.fillRect(0, 0, width, height);
      }
    }

    const frontCanvas = await this.renderSideCanvas(project, 'front', {
      ...options,
      dimensions: `${shirtSize}x${shirtSize}` as any,
    });

    const backCanvas = await this.renderSideCanvas(project, 'back', {
      ...options,
      dimensions: `${shirtSize}x${shirtSize}` as any,
    });

    ctx.drawImage(frontCanvas, padX, posY, shirtSize, shirtSize);
    ctx.drawImage(backCanvas, padX * 2 + shirtSize, posY, shirtSize, shirtSize);

    if (!options.transparentBg) {
      ctx.font = '600 16px Inter, sans-serif';
      ctx.fillStyle = '#9ca3af';
      ctx.textAlign = 'center';
      ctx.fillText('FRONT', padX + shirtSize / 2, posY + shirtSize + 32);
      ctx.fillText('BACK', padX * 2 + shirtSize + shirtSize / 2, posY + shirtSize + 32);
    }

    return canvas;
  }

  downloadCanvas(canvas: HTMLCanvasElement, filename: string): void {
    const dataUrl = canvas.toDataURL('image/png', 1.0);
    if (typeof window !== 'undefined') {
      (window as any).__lastExportDataUrl = dataUrl;
    }
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  async executeExport(
    project: ProjectState,
    options: ExportOptions,
    onProgress?: (msg: string) => void
  ): Promise<void> {
    const timestamp = Date.now();

    if (options.scope === 'current') {
      onProgress?.('Rendering current side...');
      const canvas = await this.renderSideCanvas(project, project.activeSide, options);
      this.downloadCanvas(canvas, `mockup-${project.activeSide}-${options.dimensions}-${timestamp}.png`);
    } else if (options.scope === 'front') {
      onProgress?.('Rendering front side...');
      const canvas = await this.renderSideCanvas(project, 'front', options);
      this.downloadCanvas(canvas, `mockup-front-${options.dimensions}-${timestamp}.png`);
    } else if (options.scope === 'back') {
      onProgress?.('Rendering back side...');
      const canvas = await this.renderSideCanvas(project, 'back', options);
      this.downloadCanvas(canvas, `mockup-back-${options.dimensions}-${timestamp}.png`);
    } else if (options.scope === 'side_by_side') {
      onProgress?.('Rendering side-by-side presentation...');
      const canvas = await this.renderSideBySideCanvas(project, options);
      this.downloadCanvas(canvas, `mockup-presentation-${options.dimensions}-${timestamp}.png`);
    } else if (options.scope === 'both_zip') {
      onProgress?.('Rendering front view...');
      const frontCanvas = await this.renderSideCanvas(project, 'front', options);

      onProgress?.('Rendering back view...');
      const backCanvas = await this.renderSideCanvas(project, 'back', options);

      onProgress?.('Compressing ZIP archive...');
      const zip = new JSZip();

      const frontBlob = await new Promise<Blob>((resolve) => frontCanvas.toBlob((b) => resolve(b!), 'image/png'));
      const backBlob = await new Promise<Blob>((resolve) => backCanvas.toBlob((b) => resolve(b!), 'image/png'));

      zip.file(`mockup-front-${options.dimensions}.png`, frontBlob);
      zip.file(`mockup-back-${options.dimensions}.png`, backBlob);

      const content = await zip.generateAsync({ type: 'blob' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(content);
      a.download = `mockup-both-sides-${options.dimensions}-${timestamp}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    }
  }
}

export const exportManager = new ExportManager();
