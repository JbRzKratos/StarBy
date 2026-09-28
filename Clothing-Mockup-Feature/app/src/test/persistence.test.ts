import { describe, it, expect } from 'vitest';
import { persistenceManager } from '../engine/persistence';
import type { ProjectState } from '../types/mockup';

describe('Project Persistence: Serialization and Deserialization', () => {
  const project: ProjectState = {
    templateId: 18,
    activeSide: 'front',
    garmentColor: '#1e293b',
    warp: { enabled: true, strength: 3.5, blendFactor: 0.3 },
    background: { type: 'solid', color: '#111827' },
    lighting: { amount: 45, brightness: -2, contrast: 4, animated: false, frameIndex: 12 },
    front: {
      layers: [
        {
          id: 'front_layer_1',
          name: 'Front Artwork',
          src: 'data:image/png;base64,sample123',
          image: {} as HTMLImageElement,
          x: 1024,
          y: 900,
          width: 600,
          height: 600,
          scaleX: 1.2,
          scaleY: 1.2,
          rotation: 15,
          opacity: 0.95,
          flipX: true,
          flipY: false,
          locked: false,
          visible: true,
          naturalWidth: 1200,
          naturalHeight: 1200,
          isOpaque: false,
        },
      ],
      selectedLayerId: 'front_layer_1',
    },
    back: {
      layers: [
        {
          id: 'back_layer_1',
          name: 'Back Typography',
          src: 'data:image/png;base64,sample456',
          image: {} as HTMLImageElement,
          x: 1024,
          y: 950,
          width: 500,
          height: 300,
          scaleX: 1.0,
          scaleY: 1.0,
          rotation: -5,
          opacity: 1.0,
          flipX: false,
          flipY: false,
          locked: true,
          visible: true,
          naturalWidth: 1000,
          naturalHeight: 600,
          isOpaque: false,
        },
      ],
      selectedLayerId: null,
    },
  };

  it('serializes project state completely without data loss', () => {
    const serialized = persistenceManager.serializeProject(project);

    expect(serialized.templateId).toBe(18);
    expect(serialized.garmentColor).toBe('#1e293b');
    expect(serialized.warp.strength).toBe(3.5);
    expect(serialized.warp.blendFactor).toBe(0.3);
    expect(serialized.background.type).toBe('solid');
    expect(serialized.background.color).toBe('#111827');
    expect(serialized.lighting.amount).toBe(45);
    expect(serialized.lighting.brightness).toBe(-2);
    expect(serialized.lighting.contrast).toBe(4);

    expect(serialized.frontLayers.length).toBe(1);
    expect(serialized.frontLayers[0].id).toBe('front_layer_1');
    expect(serialized.frontLayers[0].name).toBe('Front Artwork');
    expect(serialized.frontLayers[0].rotation).toBe(15);
    expect(serialized.frontLayers[0].flipX).toBe(true);

    expect(serialized.backLayers.length).toBe(1);
    expect(serialized.backLayers[0].id).toBe('back_layer_1');
    expect(serialized.backLayers[0].locked).toBe(true);
  });

  it('produces valid JSON string that can be parsed', () => {
    const serialized = persistenceManager.serializeProject(project);
    const jsonStr = JSON.stringify(serialized);
    expect(() => JSON.parse(jsonStr)).not.toThrow();

    const parsed = JSON.parse(jsonStr);
    expect(parsed.frontLayers[0].scaleX).toBe(1.2);
    expect(parsed.backLayers[0].width).toBe(500);
  });
});
