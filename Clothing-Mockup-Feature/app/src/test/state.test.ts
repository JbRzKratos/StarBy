import { describe, it, expect } from 'vitest';
import type { ArtworkLayer, ProjectState } from '../types/mockup';

describe('State Isolation: Front vs Back', () => {
  const createMockLayer = (id: string, name: string): ArtworkLayer => ({
    id,
    name,
    src: 'data:image/png;base64,mock',
    image: {} as HTMLImageElement,
    x: 1024,
    y: 1024,
    width: 500,
    height: 500,
    scaleX: 1,
    scaleY: 1,
    rotation: 0,
    opacity: 1,
    flipX: false,
    flipY: false,
    locked: false,
    visible: true,
    naturalWidth: 600,
    naturalHeight: 600,
  });

  const initialProject: ProjectState = {
    templateId: 18,
    activeSide: 'front',
    garmentColor: '#ffffff',
    warp: { enabled: true, strength: 2.0, blendFactor: 0.25 },
    background: { type: 'concrete1', color: '#222222' },
    lighting: { amount: 25, brightness: 3, contrast: 3, animated: false, frameIndex: 0 },
    front: { layers: [], selectedLayerId: null },
    back: { layers: [], selectedLayerId: null },
  };

  it('keeps front and back artwork layers completely independent', () => {
    const project = JSON.parse(JSON.stringify(initialProject)) as ProjectState;

    // Add layer to Front
    const frontLayer = createMockLayer('layer_front_1', 'Chest Logo');
    project.front.layers.push(frontLayer);
    project.front.selectedLayerId = frontLayer.id;

    // Verify Back is still empty
    expect(project.front.layers.length).toBe(1);
    expect(project.back.layers.length).toBe(0);
    expect(project.back.selectedLayerId).toBeNull();

    // Add layer to Back
    const backLayer = createMockLayer('layer_back_1', 'Back Graphic');
    project.back.layers.push(backLayer);
    project.back.selectedLayerId = backLayer.id;

    // Verify both sides have their respective layers
    expect(project.front.layers.length).toBe(1);
    expect(project.front.layers[0].name).toBe('Chest Logo');
    expect(project.back.layers.length).toBe(1);
    expect(project.back.layers[0].name).toBe('Back Graphic');

    // Modifying front layer does not alter back layer
    project.front.layers[0].x = 800;
    project.front.layers[0].rotation = 45;
    expect(project.back.layers[0].x).toBe(1024);
    expect(project.back.layers[0].rotation).toBe(0);
  });

  it('switches active side without mutating layers', () => {
    const project = JSON.parse(JSON.stringify(initialProject)) as ProjectState;
    project.front.layers.push(createMockLayer('front_1', 'Front 1'));
    project.back.layers.push(createMockLayer('back_1', 'Back 1'));

    project.activeSide = 'back';
    expect(project.activeSide).toBe('back');
    expect(project.front.layers.length).toBe(1);
    expect(project.back.layers.length).toBe(1);

    project.activeSide = 'front';
    expect(project.activeSide).toBe('front');
    expect(project.front.layers[0].id).toBe('front_1');
    expect(project.back.layers[0].id).toBe('back_1');
  });
});
