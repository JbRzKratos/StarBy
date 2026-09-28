/**
 * Local Project Persistence (Save / Load)
 * Serializes and deserializes front/back mockup project state locally without external servers.
 */

import type {
  ArtworkLayer,
  ProjectState,
  SerializedLayer,
  SerializedProject,
} from '../types/mockup';
import { assetManager } from './assetManager';

export class PersistenceManager {
  serializeProject(project: ProjectState): SerializedProject {
    const serializeLayer = (layer: ArtworkLayer): SerializedLayer => ({
      id: layer.id,
      name: layer.name,
      src: layer.src,
      x: layer.x,
      y: layer.y,
      width: layer.width,
      height: layer.height,
      scaleX: layer.scaleX,
      scaleY: layer.scaleY,
      rotation: layer.rotation,
      opacity: layer.opacity,
      flipX: layer.flipX,
      flipY: layer.flipY,
      locked: layer.locked,
      visible: layer.visible,
      naturalWidth: layer.naturalWidth,
      naturalHeight: layer.naturalHeight,
      isOpaque: layer.isOpaque,
    });

    return {
      version: '1.0.0',
      timestamp: Date.now(),
      templateId: project.templateId,
      garmentColor: project.garmentColor,
      warp: { ...project.warp },
      background: {
        type: project.background.type,
        color: project.background.color,
        customImageUrl: project.background.customImageUrl,
      },
      lighting: { ...project.lighting },
      frontLayers: project.front.layers.map(serializeLayer),
      backLayers: project.back.layers.map(serializeLayer),
    };
  }

  saveProjectToFile(project: ProjectState): void {
    const serialized = this.serializeProject(project);
    const jsonStr = JSON.stringify(serialized, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `mockup-project-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async loadProjectFromJson(jsonStr: string): Promise<ProjectState> {
    const data: SerializedProject = JSON.parse(jsonStr);

    const restoreLayer = async (s: SerializedLayer): Promise<ArtworkLayer> => {
      const img = await assetManager.loadImage(s.src);
      return {
        ...s,
        image: img,
      };
    };

    const frontLayers = await Promise.all(data.frontLayers.map(restoreLayer));
    const backLayers = await Promise.all(data.backLayers.map(restoreLayer));

    let customImageElement: HTMLImageElement | null = null;
    if (data.background.customImageUrl) {
      try {
        customImageElement = await assetManager.loadImage(data.background.customImageUrl);
      } catch (e) {
        console.warn('Could not load custom background image:', e);
      }
    }

    return {
      templateId: data.templateId || 18,
      activeSide: 'front',
      garmentColor: data.garmentColor || '#ffffff',
      warp: data.warp || { enabled: true, strength: 2.0, blendFactor: 0.25 },
      background: {
        type: data.background.type || 'concrete1',
        color: data.background.color || '#222222',
        customImageUrl: data.background.customImageUrl,
        customImageElement,
      },
      lighting: data.lighting || {
        amount: 25,
        brightness: 3,
        contrast: 3,
        animated: false,
        frameIndex: 0,
      },
      front: {
        layers: frontLayers,
        selectedLayerId: frontLayers.length > 0 ? frontLayers[frontLayers.length - 1].id : null,
      },
      back: {
        layers: backLayers,
        selectedLayerId: backLayers.length > 0 ? backLayers[backLayers.length - 1].id : null,
      },
    };
  }
}

export const persistenceManager = new PersistenceManager();
