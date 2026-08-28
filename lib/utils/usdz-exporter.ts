import * as THREE from 'three';
import { USDZExporter } from 'three/examples/jsm/exporters/USDZExporter.js';

interface Panel {
  width: string;
  height: string;
  bgPosition: string;
  bgSize: string;
  gradient: string;
  imageSrc?: string | null;
  gridCol?: number;
  gridRow?: number;
}

const CSS_TO_M = 0.0015;
const GAP = 0.015;

export async function generatePosterUSDZ(panels: Panel[]): Promise<string> {
  const scene = new THREE.Scene();

  const textureLoader = new THREE.TextureLoader();
  const textures = await Promise.all(
    panels.map((p) => (p.imageSrc ? textureLoader.loadAsync(p.imageSrc) : Promise.resolve(null))),
  );

  let isVerticalStack = true;
  let isGrid = false;

  const firstPanel = panels.length > 0 ? panels[0] : null;

  if (firstPanel && firstPanel.gridCol !== undefined) {
    isGrid = true;
  } else if (firstPanel) {
    const firstX = firstPanel.bgPosition.split(' ')[0];
    for (const p of panels) {
      if (p.bgPosition.split(' ')[0] !== firstX) {
        isVerticalStack = false;
      }
    }
  }

  const meshes: THREE.Mesh[] = [];

  if (isGrid && firstPanel) {
    const maxCol = Math.max(...panels.map((p) => p.gridCol ?? 0)) + 1;
    const maxRow = Math.max(...panels.map((p) => p.gridRow ?? 0)) + 1;

    const pW = (parseInt(firstPanel.width) || 60) * CSS_TO_M;
    const pH = (parseInt(firstPanel.height) || 90) * CSS_TO_M;

    const totalW = maxCol * pW + (maxCol - 1) * GAP;
    const totalH = maxRow * pH + (maxRow - 1) * GAP;

    panels.forEach((panel, idx) => {
      const col = panel.gridCol ?? 0;
      const row = panel.gridRow ?? 0;
      const x = -totalW / 2 + col * (pW + GAP) + pW / 2;
      const y = totalH / 2 - row * (pH + GAP) - pH / 2;

      meshes.push(createPanelMesh(panel, textures[idx] || null, x, y));
    });
  } else if (isVerticalStack) {
    const totalHeight =
      panels.reduce((acc, p) => acc + (parseInt(p.height) || 90) * CSS_TO_M, 0) +
      (panels.length - 1) * GAP;
    let currentY = totalHeight / 2;

    panels.forEach((panel, idx) => {
      const h = (parseInt(panel.height) || 90) * CSS_TO_M;
      const y = currentY - h / 2;
      currentY -= h + GAP;

      meshes.push(createPanelMesh(panel, textures[idx] || null, 0, y));
    });
  } else {
    // Horizontal Stack
    const totalWidth =
      panels.reduce((acc, p) => acc + (parseInt(p.width) || 60) * CSS_TO_M, 0) +
      (panels.length - 1) * GAP;
    let currentX = -totalWidth / 2;

    panels.forEach((panel, idx) => {
      const w = (parseInt(panel.width) || 60) * CSS_TO_M;
      const x = currentX + w / 2;
      currentX += w + GAP;

      meshes.push(createPanelMesh(panel, textures[idx] || null, x, 0));
    });
  }

  // Group all meshes and slightly move them forward to avoid z-fighting with walls in AR
  const group = new THREE.Group();
  meshes.forEach((m) => group.add(m));
  scene.add(group);

  const exporter = new USDZExporter();
  // Bypass outdated @types/three definitions that don't match Three.js 185 USDZExporter signature
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const arrayBuffer = await (exporter as any).parse(scene);
  const blob = new Blob([arrayBuffer as BlobPart], { type: 'model/vnd.usdz+zip' });
  return URL.createObjectURL(blob);
}

function createPanelMesh(
  panel: Panel,
  texture: THREE.Texture | null,
  x: number,
  y: number,
): THREE.Mesh {
  const width = (parseInt(panel.width) || 60) * CSS_TO_M;
  const height = (parseInt(panel.height) || 90) * CSS_TO_M;

  if (texture) {
    texture.colorSpace = THREE.SRGBColorSpace;
    const bgSizeMatch = panel.bgSize.match(/([\d.]+)%\s+([\d.]+)%/);
    const sizeX = bgSizeMatch ? parseFloat(bgSizeMatch[1] || '100') / 100 : 1;
    const sizeY = bgSizeMatch ? parseFloat(bgSizeMatch[2] || '100') / 100 : 1;
    texture.repeat.set(1 / sizeX, 1 / sizeY);

    const bgPosMatch = panel.bgPosition.match(/([\d.]+)%\s+([\d.]+)%/);
    const posX = bgPosMatch ? parseFloat(bgPosMatch[1] || '50') / 100 : 0.5;
    const posY = bgPosMatch ? parseFloat(bgPosMatch[2] || '50') / 100 : 0.5;

    texture.offset.x = posX * (1 - texture.repeat.x);
    const invPosY = 1 - posY;
    texture.offset.y = invPosY * (1 - texture.repeat.y);
  }

  const geometry = new THREE.PlaneGeometry(width, height);
  // USDZ Exporter needs materials
  const material = texture
    ? new THREE.MeshStandardMaterial({
        map: texture,
        side: THREE.DoubleSide,
        roughness: 0.8,
        metalness: 0.1,
      })
    : new THREE.MeshStandardMaterial({ color: 0x333333, side: THREE.DoubleSide });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, 0);
  return mesh;
}
