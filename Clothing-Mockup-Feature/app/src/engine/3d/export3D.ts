import * as THREE from 'three';
import type { SceneManager3D } from './sceneManager';

export interface ExportStillOptions {
  view: 'current' | 'front' | 'back';
  transparent: boolean;
  width?: number;
  height?: number;
  filename?: string;
}

export interface ExportVideoOptions {
  durationSeconds: number;
  fps: number;
  filename?: string;
  onProgress?: (progress: number) => void;
}

export class Export3DManager {
  private isRecording = false;
  private mediaRecorder: MediaRecorder | null = null;
  private cancelRecordingFlag = false;

  public async exportStillPNG(
    sceneManager: SceneManager3D,
    options: ExportStillOptions
  ): Promise<string> {
    const { renderer, scene, camera, controls } = sceneManager;

    // Save previous camera and background states
    const prevPosition = camera.position.clone();
    const prevTarget = controls.target.clone();
    const prevBackground = scene.background;
    const prevClearColor = new THREE.Color();
    const prevClearAlpha = renderer.getClearAlpha();
    renderer.getClearColor(prevClearColor);

    // Apply view preset
    if (options.view === 'front') {
      sceneManager.setCameraPreset('front');
    } else if (options.view === 'back') {
      sceneManager.setCameraPreset('back');
    }

    // Apply transparency
    if (options.transparent) {
      scene.background = null;
      renderer.setClearColor(0x000000, 0);
    }

    // Force an immediate render
    controls.update();
    renderer.render(scene, camera);

    // Capture PNG data URL
    const dataUrl = renderer.domElement.toDataURL('image/png');

    // Restore previous state
    camera.position.copy(prevPosition);
    controls.target.copy(prevTarget);
    scene.background = prevBackground;
    renderer.setClearColor(prevClearColor, prevClearAlpha);
    controls.update();
    renderer.render(scene, camera);

    // Trigger download
    const filename = options.filename || `mockup-3d-${options.view}-${Date.now()}.png`;
    this.downloadFile(dataUrl, filename);

    return dataUrl;
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

    const stream = canvas.captureStream(options.fps);
    const recordedChunks: Blob[] = [];

    const recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: 6000000, // 6 Mbps high quality
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
  }
}
