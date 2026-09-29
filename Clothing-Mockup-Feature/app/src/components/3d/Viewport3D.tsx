import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import {
  Play,
  Pause,
  RotateCw,
  Layers,
  Activity,
  Upload,
} from 'lucide-react';
import type {
  AnimationActionName,
  ArtworkLayer3D,
  CameraPreset3D,
  Garment3DConfig,
  LightingConfig3D,
} from '../../types/threeD';
import { SceneManager3D } from '../../engine/3d/sceneManager';
import { ModelManager3D, type LoadedGarmentModel } from '../../engine/3d/modelManager';
import { MaterialManager3D } from '../../engine/3d/materialManager';
import { TextureCompositor3D } from '../../engine/3d/textureCompositor';
import { AnimationController3D } from '../../engine/3d/animationController';
import { SecondaryMotionController3D } from '../../engine/3d/secondaryMotion';
import {
  findPanelAtUV,
  findPanelById,
  type GarmentPanel3D,
} from '../../engine/3d/garmentPanels';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Viewport3DProps {
  garmentConfig: Garment3DConfig;
  garmentColor: string;
  roughness: number;
  metalness: number;
  artworkLayers: ArtworkLayer3D[];
  activeRegionId: string;
  selectedLayerId?: string | null;
  selectedPanelId?: string | null;
  isAnimated: boolean;
  currentAction: AnimationActionName;
  isPlaying: boolean;
  playbackSpeed: number;
  secondaryMotionEnabled: boolean;
  lighting: LightingConfig3D;
  cameraPreset: CameraPreset3D;
  isTurntable: boolean;
  isUvEditorOpen?: boolean;
  onAnimatedToggle: () => void;
  onActionChange: (action: AnimationActionName) => void;
  onPlayToggle: () => void;
  onSpeedChange: (speed: number) => void;
  onSecondaryMotionToggle: () => void;
  onCameraPresetChange: (preset: CameraPreset3D) => void;
  onTurntableToggle: () => void;
  onToggleUvEditor?: () => void;
  onAddArtworkFromFile?: (file: File) => void;
  onSelectPanel?: (panelId: string | null) => void;
  onSelectLayer?: (layerId: string | null) => void;
  onUpdateLayer?: (layerId: string, updates: Partial<ArtworkLayer3D>) => void;
  onModelLoaded?: (mesh: THREE.SkinnedMesh | THREE.Mesh | null) => void;
  onSceneReady?: (sceneManager: SceneManager3D, compositor: TextureCompositor3D) => void;
}

// ─── Interaction State Machine ────────────────────────────────────────────────

type InteractionState =
  | 'idle'
  | 'selected'
  | 'moving'
  | 'resizing-tl'
  | 'resizing-tr'
  | 'resizing-bl'
  | 'resizing-br'
  | 'rotating';

interface DragSession {
  state: InteractionState;
  layerId: string;
  clientX0: number;
  clientY0: number;
  uvX0: number;
  uvY0: number;
  u0: number;
  v0: number;
  uvWidth0: number;
  uvHeight0: number;
  scale0: number;
  rotation0: number;
  imgAspect: number;
  screenCenterX: number;
  screenCenterY: number;
  dist0: number;
  angleOffset: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

/** Half-size of handle squares in CSS pixels */
const HANDLE_HALF = 7;
/** Invisible touch hit area radius in CSS pixels */
const HANDLE_HIT_RADIUS = 22;
/** Rotation handle offset from center of top edge, in CSS pixels */
const ROTATE_HANDLE_OFFSET = 28;
/** Accent color for transform controls */
const ACCENT = '#3B5EFF';
const HANDLE_FILL = '#ffffff';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getLayerUV(layer: ArtworkLayer3D, garmentConfig?: Garment3DConfig): { u: number; v: number } {
  if (layer.u !== undefined && layer.v !== undefined) {
    return { u: layer.u, v: layer.v };
  }
  const region = garmentConfig?.regions.find((r) => r.id === layer.regionId) || garmentConfig?.regions[0];
  if (region) {
    return {
      u: region.uvCenter[0] + (layer.offsetX || 0) * 0.2,
      v: region.uvCenter[1] + (layer.offsetY || 0) * 0.2,
    };
  }
  return {
    u: 0.25 + (layer.offsetX || 0) * 0.2,
    v: 0.63 + (layer.offsetY || 0) * 0.2,
  };
}

function getLayerUVSize(layer: ArtworkLayer3D, imgAspect: number, garmentConfig?: Garment3DConfig): { uvW: number; uvH: number } {
  if (layer.uvWidth !== undefined && layer.uvHeight !== undefined && !layer.lockAspectRatio) {
    return { uvW: layer.uvWidth, uvH: layer.uvHeight };
  } else if (layer.uvWidth !== undefined) {
    return { uvW: layer.uvWidth, uvH: layer.uvWidth / imgAspect };
  }
  const region = garmentConfig?.regions.find((r) => r.id === layer.regionId) || garmentConfig?.regions[0];
  const baseSpan = region ? region.uvSpan[0] * (layer.scale || 1.0) : 0.32 * (layer.scale || 1.0);
  return { uvW: baseSpan, uvH: baseSpan / imgAspect };
}

function uvHitsLayer(u: number, v: number, layer: ArtworkLayer3D, imgAspect: number, garmentConfig?: Garment3DConfig): boolean {
  const center = getLayerUV(layer, garmentConfig);
  const { uvW, uvH } = getLayerUVSize(layer, imgAspect, garmentConfig);
  const dx = u - center.u;
  const dy = v - center.v;
  const rad = -(layer.rotation * Math.PI) / 180;
  const lx = dx * Math.cos(rad) - dy * Math.sin(rad);
  const ly = dx * Math.sin(rad) + dy * Math.cos(rad);
  return Math.abs(lx) <= uvW / 2 + 0.02 && Math.abs(ly) <= uvH / 2 + 0.02;
}

// ─── Fast UV Vertex Spatial Hash Index ────────────────────────────────────────

class FastUVIndex {
  private grid: number[][];
  private res: number;
  private posAttr: THREE.BufferAttribute | THREE.InterleavedBufferAttribute;
  private uvAttr: THREE.BufferAttribute | THREE.InterleavedBufferAttribute;
  private normAttr: THREE.BufferAttribute | THREE.InterleavedBufferAttribute | null;
  private innerAttr: THREE.BufferAttribute | THREE.InterleavedBufferAttribute | null;
  private count: number;

  // Pre-allocated return vectors — ZERO allocations per frame
  public resultPoint = new THREE.Vector3();
  public resultNormal = new THREE.Vector3();

  constructor(geometry: THREE.BufferGeometry, res = 32) {
    this.res = res;
    this.grid = Array.from({ length: res * res }, () => []);
    this.posAttr = geometry.attributes.position;
    this.uvAttr = geometry.attributes.uv;
    this.normAttr = geometry.attributes.normal ?? null;
    this.innerAttr = (geometry.attributes as any)?.aInner ?? null;
    this.count = this.posAttr ? this.posAttr.count : 0;
    this.build();
  }

  private build(): void {
    if (!this.posAttr || !this.uvAttr) return;
    const res = this.res;
    const count = this.count;
    for (let i = 0; i < count; i++) {
      if (this.innerAttr && this.innerAttr.getX(i) > 0.5) continue; // outer shell vertices only
      const u = this.uvAttr.getX(i);
      const v = this.uvAttr.getY(i);
      if (u < -0.05 || u > 1.05 || v < -0.05 || v > 1.05) continue;
      const cu = Math.min(1, Math.max(0, u));
      const cv = Math.min(1, Math.max(0, v));
      const gx = Math.min(res - 1, Math.max(0, Math.floor(cu * res)));
      const gy = Math.min(res - 1, Math.max(0, Math.floor(cv * res)));
      this.grid[gy * res + gx].push(i);
    }
  }

  public find(u: number, v: number): { localPoint: THREE.Vector3; localNormal: THREE.Vector3; vertexIndex: number } | null {
    if (!this.posAttr || !this.uvAttr || this.count === 0) return null;
    const res = this.res;
    const cu = Math.max(0, Math.min(1, u));
    const cv = Math.max(0, Math.min(1, v));
    const gx = Math.min(res - 1, Math.max(0, Math.floor(cu * res)));
    const gy = Math.min(res - 1, Math.max(0, Math.floor(cv * res)));

    let bestDistSq = Infinity;
    let bestIdx = -1;

    // Search target cell and immediate 1-ring neighbors (up to 9 cells)
    for (let dy = -1; dy <= 1; dy++) {
      const ny = gy + dy;
      if (ny < 0 || ny >= res) continue;
      for (let dx = -1; dx <= 1; dx++) {
        const nx = gx + dx;
        if (nx < 0 || nx >= res) continue;
        const cell = this.grid[ny * res + nx];
        for (let k = 0; k < cell.length; k++) {
          const idx = cell[k];
          const du = this.uvAttr.getX(idx) - cu;
          const dv = this.uvAttr.getY(idx) - cv;
          const dSq = du * du + dv * dv;
          if (dSq < bestDistSq) {
            bestDistSq = dSq;
            bestIdx = idx;
          }
        }
      }
    }

    // Expand search to expanding rings if on seam/margin (up to full grid)
    if (bestIdx === -1) {
      for (let r = 2; r <= 16; r++) {
        for (let dy = -r; dy <= r; dy++) {
          const ny = gy + dy;
          if (ny < 0 || ny >= res) continue;
          for (let dx = -r; dx <= r; dx++) {
            if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
            const nx = gx + dx;
            if (nx < 0 || nx >= res) continue;
            const cell = this.grid[ny * res + nx];
            for (let k = 0; k < cell.length; k++) {
              const idx = cell[k];
              const du = this.uvAttr.getX(idx) - cu;
              const dv = this.uvAttr.getY(idx) - cv;
              const dSq = du * du + dv * dv;
              if (dSq < bestDistSq) {
                bestDistSq = dSq;
                bestIdx = idx;
              }
            }
          }
        }
        if (bestIdx !== -1) break;
      }
    }

    if (bestIdx === -1) {
      bestIdx = 0;
    }

    this.resultPoint.set(
      this.posAttr.getX(bestIdx),
      this.posAttr.getY(bestIdx),
      this.posAttr.getZ(bestIdx)
    );

    if (this.normAttr) {
      this.resultNormal.set(
        this.normAttr.getX(bestIdx),
        this.normAttr.getY(bestIdx),
        this.normAttr.getZ(bestIdx)
      ).normalize();
    } else {
      this.resultNormal.set(0, 0, 1);
    }

    return {
      localPoint: this.resultPoint,
      localNormal: this.resultNormal,
      vertexIndex: bestIdx,
    };
  }
}

// Pre-allocated vector caches for zero-allocation screen projection
const _tempWorldPos = new THREE.Vector3();
const _tempProj = new THREE.Vector3();

function projectUVToScreen(
  u: number,
  v: number,
  uvLookup: FastUVIndex | null,
  mesh: THREE.Mesh | THREE.SkinnedMesh | null,
  camera: THREE.Camera,
  rect: DOMRect,
  skipMatrixUpdate = false
): { screenX: number; screenY: number; worldPos: THREE.Vector3 } {
  if (!uvLookup || !mesh) {
    return {
      screenX: u * rect.width,
      screenY: v * rect.height,
      worldPos: new THREE.Vector3(0, 0, 0),
    };
  }
  const hit = uvLookup.find(u, v);
  if (!hit) {
    return {
      screenX: u * rect.width,
      screenY: v * rect.height,
      worldPos: new THREE.Vector3(0, 0, 0),
    };
  }
  if (!skipMatrixUpdate) {
    mesh.updateMatrixWorld();
  }

  _tempWorldPos.copy(hit.localPoint);

  // If mesh is a SkinnedMesh, apply bone deformation to get actual 3D pose
  if ((mesh as any).isSkinnedMesh && (mesh as any).skeleton) {
    (mesh as any).applyBoneTransform(hit.vertexIndex, _tempWorldPos);
  }

  _tempWorldPos.applyMatrix4(mesh.matrixWorld);

  _tempProj.copy(_tempWorldPos).project(camera);
  const screenX = (_tempProj.x * 0.5 + 0.5) * rect.width;
  const screenY = (-_tempProj.y * 0.5 + 0.5) * rect.height;

  return { screenX, screenY, worldPos: _tempWorldPos.clone() };
}

// ─── Transform handles geometry ───────────────────────────────────────────────

interface HandleRect {
  cx: number; // center x in CSS pixels on overlay
  cy: number; // center y in CSS pixels on overlay
  type: 'corner-tl' | 'corner-tr' | 'corner-bl' | 'corner-br' | 'rotate';
}

interface ComputedHandlesResult {
  corners: [
    { x: number; y: number },
    { x: number; y: number },
    { x: number; y: number },
    { x: number; y: number }
  ];
  center: { x: number; y: number };
  handles: HandleRect[];
  isFacing: boolean;
  imgAspect: number;
}

function computeHandles(
  layer: ArtworkLayer3D,
  imgAspect: number,
  rendererRect: DOMRect,
  uvLookup: FastUVIndex | null,
  mesh: THREE.Mesh | THREE.SkinnedMesh | null,
  camera: THREE.Camera,
  garmentConfig?: Garment3DConfig,
  skipMatrixUpdate = false
): ComputedHandlesResult | null {
  const { u, v } = getLayerUV(layer, garmentConfig);
  const { uvW, uvH } = getLayerUVSize(layer, imgAspect, garmentConfig);
  const rotRad = (layer.rotation * Math.PI) / 180;

  const halfW = uvW / 2;
  const halfH = uvH / 2;
  const cosR = Math.cos(rotRad);
  const sinR = Math.sin(rotRad);

  function cornerUV(dx: number, dy: number): { u: number; v: number } {
    return {
      u: u + dx * cosR - dy * sinR,
      v: v + dx * sinR + dy * cosR,
    };
  }

  const tlUV = cornerUV(-halfW, -halfH);
  const trUV = cornerUV(+halfW, -halfH);
  const brUV = cornerUV(+halfW, +halfH);
  const blUV = cornerUV(-halfW, +halfH);

  // Ensure mesh world matrix is up to date once before all projections
  if (!skipMatrixUpdate && mesh) {
    mesh.updateMatrixWorld();
  }

  const centerProj = projectUVToScreen(u, v, uvLookup, mesh, camera, rendererRect, true);
  const tl = projectUVToScreen(tlUV.u, tlUV.v, uvLookup, mesh, camera, rendererRect, true);
  const tr = projectUVToScreen(trUV.u, trUV.v, uvLookup, mesh, camera, rendererRect, true);
  const br = projectUVToScreen(brUV.u, brUV.v, uvLookup, mesh, camera, rendererRect, true);
  const bl = projectUVToScreen(blUV.u, blUV.v, uvLookup, mesh, camera, rendererRect, true);

  // Geometric surface normal from 3D quad corners
  const rightVec = new THREE.Vector3().subVectors(tr.worldPos, tl.worldPos);
  const downVec = new THREE.Vector3().subVectors(bl.worldPos, tl.worldPos);
  const surfNorm = new THREE.Vector3().crossVectors(downVec, rightVec).normalize();

  const camToCenter = new THREE.Vector3().subVectors(centerProj.worldPos, camera.position).normalize();
  const isFacing = surfNorm.dot(camToCenter) < 0.45;

  const topMidX = (tl.screenX + tr.screenX) / 2;
  const topMidY = (tl.screenY + tr.screenY) / 2;
  const dirX = topMidX - centerProj.screenX;
  const dirY = topMidY - centerProj.screenY;
  const len = Math.hypot(dirX, dirY) || 1;
  const rotCx = topMidX + (dirX / len) * ROTATE_HANDLE_OFFSET;
  const rotCy = topMidY + (dirY / len) * ROTATE_HANDLE_OFFSET;

  const handles: HandleRect[] = [
    { cx: tl.screenX, cy: tl.screenY, type: 'corner-tl' },
    { cx: tr.screenX, cy: tr.screenY, type: 'corner-tr' },
    { cx: br.screenX, cy: br.screenY, type: 'corner-br' },
    { cx: bl.screenX, cy: bl.screenY, type: 'corner-bl' },
    { cx: rotCx, cy: rotCy, type: 'rotate' },
  ];

  return {
    corners: [
      { x: tl.screenX, y: tl.screenY },
      { x: tr.screenX, y: tr.screenY },
      { x: br.screenX, y: br.screenY },
      { x: bl.screenX, y: bl.screenY },
    ],
    center: { x: centerProj.screenX, y: centerProj.screenY },
    handles,
    isFacing,
    imgAspect,
  };
}

/** Find which handle (if any) a screen-space pointer hits. Returns null for none. */
function hitHandle(handles: HandleRect[], px: number, py: number): HandleRect | null {
  for (const h of handles) {
    const d = Math.hypot(px - h.cx, py - h.cy);
    if (d <= HANDLE_HIT_RADIUS) return h;
  }
  return null;
}

/** Draw all transform handles onto the overlay canvas. */
function drawTransformHandles(
  ctx: CanvasRenderingContext2D,
  layer: ArtworkLayer3D,
  imgAspect: number,
  rendererRect: DOMRect,
  dpr: number,
  uvLookup: FastUVIndex | null,
  mesh: THREE.Mesh | THREE.SkinnedMesh | null,
  camera: THREE.Camera | null,
  garmentConfig?: Garment3DConfig
): void {
  if (!camera) return;
  const result = computeHandles(layer, imgAspect, rendererRect, uvLookup, mesh, camera, garmentConfig);
  if (!result || !result.isFacing) return;

  const { corners, handles } = result;
  const [tl, tr, br, bl] = corners;

  ctx.save();
  ctx.scale(dpr, dpr); // work in CSS px units after this

  // 1. Draw quad outline with solid contrast underlay and dashed accent overlay
  ctx.beginPath();
  ctx.moveTo(tl.x, tl.y);
  ctx.lineTo(tr.x, tr.y);
  ctx.lineTo(br.x, br.y);
  ctx.lineTo(bl.x, bl.y);
  ctx.closePath();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.lineWidth = 2.5;
  ctx.shadowColor = 'rgba(0,0,0,0.65)';
  ctx.shadowBlur = 5;
  ctx.stroke();

  ctx.strokeStyle = ACCENT;
  ctx.lineWidth = 1.8;
  ctx.setLineDash([6, 4]);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.shadowBlur = 0;

  // 2. Rotation stem
  const topMidX = (tl.x + tr.x) / 2;
  const topMidY = (tl.y + tr.y) / 2;
  const rotH = handles[4];
  ctx.beginPath();
  ctx.setLineDash([3, 3]);
  ctx.strokeStyle = 'rgba(255,255,255,0.75)';
  ctx.lineWidth = 1.2;
  ctx.moveTo(topMidX, topMidY);
  ctx.lineTo(rotH.cx, rotH.cy);
  ctx.stroke();
  ctx.setLineDash([]);

  // 3. Draw handles
  for (const h of handles) {
    ctx.save();
    if (h.type === 'rotate') {
      ctx.beginPath();
      ctx.arc(h.cx, h.cy, HANDLE_HALF + 2, 0, Math.PI * 2);
      ctx.fillStyle = ACCENT;
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = 6;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = HANDLE_FILL;
      ctx.lineWidth = 2;
      ctx.stroke();
      // Arrow arc inside
      ctx.beginPath();
      ctx.arc(h.cx, h.cy, HANDLE_HALF - 2, -Math.PI * 0.75, Math.PI * 0.35);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.6;
      ctx.stroke();
    } else {
      ctx.translate(h.cx, h.cy);
      ctx.fillStyle = HANDLE_FILL;
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = 5;
      ctx.fillRect(-HANDLE_HALF, -HANDLE_HALF, HANDLE_HALF * 2, HANDLE_HALF * 2);
      ctx.shadowBlur = 0;
      ctx.strokeStyle = ACCENT;
      ctx.lineWidth = 2;
      ctx.strokeRect(-HANDLE_HALF, -HANDLE_HALF, HANDLE_HALF * 2, HANDLE_HALF * 2);
    }
    ctx.restore();
  }

  ctx.restore();
}

// ─── Component ────────────────────────────────────────────────────────────────

export const Viewport3D: React.FC<Viewport3DProps> = ({
  garmentConfig,
  garmentColor,
  roughness,
  metalness,
  artworkLayers,
  activeRegionId,
  selectedLayerId,
  selectedPanelId,
  isAnimated,
  currentAction,
  isPlaying,
  playbackSpeed,
  secondaryMotionEnabled,
  lighting,
  cameraPreset,
  isTurntable,
  isUvEditorOpen,
  onAnimatedToggle,
  onActionChange,
  onPlayToggle,
  onSpeedChange,
  onSecondaryMotionToggle,
  onCameraPresetChange,
  onTurntableToggle,
  onToggleUvEditor,
  onAddArtworkFromFile,
  onSelectPanel,
  onSelectLayer,
  onUpdateLayer,
  onModelLoaded,
  onSceneReady,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Engine singletons
  const sceneManagerRef = useRef<SceneManager3D | null>(null);
  const modelManagerRef = useRef<ModelManager3D | null>(null);
  const materialManagerRef = useRef<MaterialManager3D | null>(null);
  const compositorRef = useRef<TextureCompositor3D | null>(null);
  const animControllerRef = useRef<AnimationController3D | null>(null);
  const secondaryMotionRef = useRef<SecondaryMotionController3D | null>(null);
  const garmentMeshRef = useRef<THREE.Mesh | THREE.SkinnedMesh | null>(null);
  const uvLookupRef = useRef<FastUVIndex | null>(null);

  // Pre-allocated raycast objects (no per-event heap allocation)
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseVecRef = useRef(new THREE.Vector2());

  // Latest-value mirrors (always current, never trigger re-renders)
  const garmentConfigRef = useRef(garmentConfig);
  garmentConfigRef.current = garmentConfig;
  const garmentColorRef = useRef(garmentColor);
  garmentColorRef.current = garmentColor;
  const activeRegionIdRef = useRef(activeRegionId);
  activeRegionIdRef.current = activeRegionId;
  const artworkLayersRef = useRef(artworkLayers);
  artworkLayersRef.current = artworkLayers;
  const selectedLayerIdRef = useRef(selectedLayerId);
  selectedLayerIdRef.current = selectedLayerId;
  const selectedPanelIdRef = useRef(selectedPanelId);
  selectedPanelIdRef.current = selectedPanelId;
  const onSelectPanelRef = useRef(onSelectPanel);
  onSelectPanelRef.current = onSelectPanel;
  const onSelectLayerRef = useRef(onSelectLayer);
  onSelectLayerRef.current = onSelectLayer;
  const onUpdateLayerRef = useRef(onUpdateLayer);
  onUpdateLayerRef.current = onUpdateLayer;
  const isAnimatedRef = useRef(isAnimated);
  isAnimatedRef.current = isAnimated;
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;

  // UI refs
  const scrubberInputRef = useRef<HTMLInputElement>(null);
  const scrubberTextRef = useRef<HTMLSpanElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayCtxRef = useRef<CanvasRenderingContext2D | null>(null);

  // Loading state (React state — only changes occasionally)
  const [loading, setLoading] = useState<boolean>(true);
  const [loadProgress, setLoadProgress] = useState<number>(0);

  // Instruction hint visibility: hides on user interaction, reappears when new artwork is added
  const [showInstruction, setShowInstruction] = useState<boolean>(true);
  const prevArtworkCountRef = useRef<number>(artworkLayers.length);
  const instructionHiddenRef = useRef<boolean>(false);

  useEffect(() => {
    if (artworkLayers.length > prevArtworkCountRef.current) {
      setShowInstruction(true);
      instructionHiddenRef.current = false;
    }
    prevArtworkCountRef.current = artworkLayers.length;
  }, [artworkLayers.length]);

  /** Hide instruction badge without triggering re-renders on every drag tick */
  const hideInstruction = () => {
    if (!instructionHiddenRef.current) {
      instructionHiddenRef.current = true;
      setShowInstruction(false);
    }
  };

  // ── Interaction state machine ──────────────────────────────────────────────
  // All stored in refs to avoid re-renders during dragging.
  const interactionStateRef = useRef<InteractionState>('idle');
  const dragSessionRef = useRef<DragSession | null>(null);

  // Latest pointer event position captured on DOM events, consumed by tick().
  const pendingPointerRef = useRef<{ clientX: number; clientY: number } | null>(null);

  // Live layer state during drag (NOT committed to React until pointer-up).
  const liveLayerRef = useRef<ArtworkLayer3D | null>(null);

  // Cursor style — updated from tick(), propagated to React via direct DOM mutation.
  const cursorEl = useRef<HTMLDivElement | null>(null);

  // Hover hit for cursor
  const lastHoverHitRef = useRef<'handle' | 'layer' | 'none'>('none');

  // ── Raycasting ────────────────────────────────────────────────────────────

  const raycastGarmentUV = (clientX: number, clientY: number): { u: number; v: number } | null => {
    const mesh = garmentMeshRef.current;
    const sm = sceneManagerRef.current;
    if (!mesh || !sm) return null;
    const { camera, renderer } = sm;
    const rect = renderer.domElement.getBoundingClientRect();
    mouseVecRef.current.set(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1
    );
    raycasterRef.current.setFromCamera(mouseVecRef.current, camera);
    const hits = raycasterRef.current.intersectObject(mesh, false);
    for (const hit of hits) {
      if (!hit.uv) continue;
      // If aInner attribute exists, skip inner faces so clicks through neck/collar don't hit interior
      if (hit.face && mesh.geometry) {
        const innerAttr = (mesh.geometry.attributes as any)?.aInner;
        if (innerAttr) {
          const inA = innerAttr.getX(hit.face.a);
          const inB = innerAttr.getX(hit.face.b);
          const inC = innerAttr.getX(hit.face.c);
          if (inA > 0.5 && inB > 0.5 && inC > 0.5) continue;
        }
      }
      return { u: hit.uv.x, v: hit.uv.y };
    }
    return null;
  };

  const findLayerAtUV = (u: number, v: number): ArtworkLayer3D | null => {
    const layers = artworkLayersRef.current;
    const imageCache: Map<string, HTMLImageElement> =
      (compositorRef.current as any)?.imageCache ?? new Map();
    for (let i = layers.length - 1; i >= 0; i--) {
      const layer = layers[i];
      if ((layer.placementMode ?? 'atlas') !== 'atlas') continue;
      if (layer.opacity <= 0) continue;
      const img = imageCache.get(layer.imageUrl);
      const imgAspect = img && img.naturalHeight > 0 ? img.naturalWidth / img.naturalHeight : 1;
      if (uvHitsLayer(u, v, layer, imgAspect, garmentConfigRef.current)) return layer;
    }
    return null;
  };


  // ── Compute live layer UV size ─────────────────────────────────────────────

  const getImgAspectForLayer = (layer: ArtworkLayer3D): number => {
    const imageCache: Map<string, HTMLImageElement> =
      (compositorRef.current as any)?.imageCache ?? new Map();
    const img = imageCache.get(layer.imageUrl);
    return img && img.naturalHeight > 0 ? img.naturalWidth / img.naturalHeight : 1;
  };

  // ── Get current handles for selected layer ─────────────────────────────────

  const getSelectedLayerHandles = (): ComputedHandlesResult | null => {
    const selId = selectedLayerIdRef.current;
    if (!selId) return null;
    const liveLayer = liveLayerRef.current;
    const layer = liveLayer ?? artworkLayersRef.current.find((l) => l.id === selId);
    if (!layer) return null;
    const sm = sceneManagerRef.current;
    if (!sm) return null;
    const rect = sm.renderer.domElement.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;
    const imgAspect = getImgAspectForLayer(layer);
    return computeHandles(
      layer,
      imgAspect,
      rect,
      uvLookupRef.current,
      garmentMeshRef.current,
      sm.camera,
      garmentConfigRef.current
    );
  };

  // ── Tick-level transform computation ──────────────────────────────────────

  const processDragInTick = () => {
    const pending = pendingPointerRef.current;
    const session = dragSessionRef.current;
    if (!pending || !session) return;

    const { clientX, clientY } = pending;
    const compositor = compositorRef.current;
    const sm = sceneManagerRef.current;
    if (!compositor || !sm) return;

    const layers = artworkLayersRef.current;
    const baseLayer = layers.find((l) => l.id === session.layerId);
    if (!baseLayer) return;

    let updates: Partial<ArtworkLayer3D> = {};

    if (session.state === 'moving') {
      // ── Move: UV delta on garment surface ───────────────────────────────
      const uv = raycastGarmentUV(clientX, clientY);
      if (!uv) return; // hold last valid
      const deltaU = uv.u - session.uvX0;
      const deltaV = uv.v - session.uvY0;
      const newU = THREE.MathUtils.clamp(session.u0 + deltaU, -0.5, 1.5);
      const newV = THREE.MathUtils.clamp(session.v0 + deltaV, -0.5, 1.5);
      updates = {
        u: parseFloat(newU.toFixed(5)),
        v: parseFloat(newV.toFixed(5)),
        offsetX: parseFloat(((newU - 0.5) * 2).toFixed(4)),
        offsetY: parseFloat(((newV - 0.5) * 2).toFixed(4)),
      };
    } else if (session.state.startsWith('resizing')) {
      // ── Resize: distance from layer screen center ───────────────────────
      const rect = sm.renderer.domElement.getBoundingClientRect();
      const currentDist = Math.hypot(
        clientX - (rect.left + session.screenCenterX),
        clientY - (rect.top + session.screenCenterY)
      );
      const scaleFactor = Math.max(0.08, currentDist / (session.dist0 || 1));
      const newW = Math.max(0.02, Math.min(0.95, session.uvWidth0 * scaleFactor));
      const lockedH = newW / session.imgAspect;

      updates = {
        uvWidth: parseFloat(newW.toFixed(5)),
        uvHeight: parseFloat(lockedH.toFixed(5)),
        scale: parseFloat((newW / 0.35).toFixed(5)),
        u: session.u0,
        v: session.v0,
      };
    } else if (session.state === 'rotating') {
      // ── Rotate: screen-space angle from layer center ─────────────────────
      const rect = sm.renderer.domElement.getBoundingClientRect();
      const angle = Math.atan2(
        clientY - (rect.top + session.screenCenterY),
        clientX - (rect.left + session.screenCenterX)
      );
      const deg = (angle * 180) / Math.PI;
      const newRot = Math.round((deg + session.angleOffset + 720) % 360);
      updates = {
        rotation: newRot,
      };
    }

    if (Object.keys(updates).length === 0) return;

    // Hide instruction badge when user manipulates artwork (guarded — no re-render spam)
    hideInstruction();

    // Apply updates to liveLayer for overlay drawing
    liveLayerRef.current = { ...(liveLayerRef.current ?? baseLayer), ...updates };

    // Directly update the compositor preview — NO React state update
    compositor.updateDragPreview(liveLayerRef.current!);

    // Clear pending
    pendingPointerRef.current = null;
  };

  // ── Draw overlay each frame ────────────────────────────────────────────────
  const drawOverlayRef = useRef<() => void>(() => {});

  const drawOverlay = () => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;
    let ctx = overlayCtxRef.current;
    if (!ctx) {
      ctx = canvas.getContext('2d');
      overlayCtxRef.current = ctx;
    }
    if (!ctx) return;
    const sm = sceneManagerRef.current;
    if (!sm) return;

    const domEl = sm.renderer.domElement;
    const dpr = window.devicePixelRatio || 1;
    const expW = Math.round(domEl.clientWidth * dpr);
    const expH = Math.round(domEl.clientHeight * dpr);
    if (canvas.width !== expW || canvas.height !== expH) {
      canvas.width = expW;
      canvas.height = expH;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const selId = selectedLayerIdRef.current;
    if (!selId || !garmentMeshRef.current) return;

    const layers = artworkLayersRef.current;
    const liveLayer = liveLayerRef.current;
    const layer = liveLayer
      ? (liveLayer.id === selId ? liveLayer : layers.find((l) => l.id === selId))
      : layers.find((l) => l.id === selId);
    if (!layer) return;

    const rect = domEl.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const imgAspect = getImgAspectForLayer(layer);

    drawTransformHandles(
      ctx,
      layer,
      imgAspect,
      rect,
      dpr,
      uvLookupRef.current,
      garmentMeshRef.current,
      sm.camera,
      garmentConfigRef.current
    );
  };

  drawOverlayRef.current = drawOverlay;

  // ── Animation / render tick ────────────────────────────────────────────────

  // 1. Initialize Scene
  useEffect(() => {
    if (!containerRef.current) return;

    const sceneManager = new SceneManager3D(containerRef.current);
    const modelManager = new ModelManager3D();
    const materialManager = new MaterialManager3D();
    const compositor = new TextureCompositor3D(2048);
    compositor.setRenderer(sceneManager.renderer);
    const animController = new AnimationController3D();
    const secondaryMotion = new SecondaryMotionController3D();

    sceneManagerRef.current = sceneManager;
    modelManagerRef.current = modelManager;
    materialManagerRef.current = materialManager;
    compositorRef.current = compositor;
    animControllerRef.current = animController;
    secondaryMotionRef.current = secondaryMotion;

    if (onSceneReady) onSceneReady(sceneManager, compositor);

    // ── Overlay canvas ───────────────────────────────────────────────────────
    const overlay = document.createElement('canvas');
    overlay.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:5;';
    containerRef.current.appendChild(overlay);
    overlayCanvasRef.current = overlay;

    const domEl = sceneManager.renderer.domElement;

    // ── Pointer interaction ──────────────────────────────────────────────────

    const downInfo = { x: 0, y: 0, time: 0, pointerId: -1 };

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0 && e.pointerType !== 'touch') return;
      downInfo.x = e.clientX;
      downInfo.y = e.clientY;
      downInfo.time = performance.now();
      downInfo.pointerId = e.pointerId;

      // ── Check transform handles first ────────────────────────────────────
      const selId = selectedLayerIdRef.current;
      const sm = sceneManagerRef.current;
      if (selId && sm) {
        const rect = sm.renderer.domElement.getBoundingClientRect();
        const handlesResult = getSelectedLayerHandles();
        if (handlesResult && handlesResult.isFacing) {
          const px = e.clientX - rect.left;
          const py = e.clientY - rect.top;
          const hit = hitHandle(handlesResult.handles, px, py);
          if (hit) {
            hideInstruction();
            const layers = artworkLayersRef.current;
            const layer = layers.find((l) => l.id === selId)!;
            const { uvW, uvH } = getLayerUVSize(layer, handlesResult.imgAspect, garmentConfigRef.current);
            const { u, v } = getLayerUV(layer, garmentConfigRef.current);
            let state: InteractionState = 'rotating';
            if (hit.type === 'corner-tl') state = 'resizing-tl';
            else if (hit.type === 'corner-tr') state = 'resizing-tr';
            else if (hit.type === 'corner-bl') state = 'resizing-bl';
            else if (hit.type === 'corner-br') state = 'resizing-br';
            else state = 'rotating';

            const center = handlesResult.center;
            const dist0 = Math.hypot(e.clientX - (rect.left + center.x), e.clientY - (rect.top + center.y));
            const currentAngle = Math.atan2(e.clientY - (rect.top + center.y), e.clientX - (rect.left + center.x));
            const currentAngleDeg = (currentAngle * 180) / Math.PI;
            const angleOffset = (layer.rotation - currentAngleDeg + 720) % 360;

            dragSessionRef.current = {
              state,
              layerId: selId,
              clientX0: e.clientX,
              clientY0: e.clientY,
              uvX0: 0,
              uvY0: 0,
              u0: u,
              v0: v,
              uvWidth0: uvW,
              uvHeight0: uvH,
              scale0: layer.scale,
              rotation0: layer.rotation,
              imgAspect: handlesResult.imgAspect,
              screenCenterX: center.x,
              screenCenterY: center.y,
              dist0: Math.max(10, dist0),
              angleOffset,
            };
            interactionStateRef.current = state;
            liveLayerRef.current = { ...layer };

            sceneManager.controls.enabled = false;
            compositor.beginDragPreview(
              selId,
              garmentColorRef.current,
              artworkLayersRef.current,
              garmentConfigRef.current,
              activeRegionIdRef.current
            );

            try { domEl.setPointerCapture(e.pointerId); } catch (_) {}
            return;
          }
        }
      }

      // ── Check artwork hit ────────────────────────────────────────────────
      const uv = raycastGarmentUV(e.clientX, e.clientY);
      if (uv) {
        const hitLayer = findLayerAtUV(uv.u, uv.v);
        if (hitLayer) {
          hideInstruction();
          if (selId !== hitLayer.id) {
            onSelectLayerRef.current?.(hitLayer.id);
          }
          const { u: lu, v: lv } = getLayerUV(hitLayer, garmentConfigRef.current);
          const { uvW, uvH } = getLayerUVSize(hitLayer, getImgAspectForLayer(hitLayer), garmentConfigRef.current);
          const handlesResult = getSelectedLayerHandles();
          const screenCenterX = handlesResult ? handlesResult.center.x : 0;
          const screenCenterY = handlesResult ? handlesResult.center.y : 0;

          dragSessionRef.current = {
            state: 'moving',
            layerId: hitLayer.id,
            clientX0: e.clientX,
            clientY0: e.clientY,
            uvX0: uv.u,
            uvY0: uv.v,
            u0: lu,
            v0: lv,
            uvWidth0: uvW,
            uvHeight0: uvH,
            scale0: hitLayer.scale,
            rotation0: hitLayer.rotation,
            imgAspect: getImgAspectForLayer(hitLayer),
            screenCenterX,
            screenCenterY,
            dist0: 0,
            angleOffset: 0,
          };
          interactionStateRef.current = 'moving';
          liveLayerRef.current = { ...hitLayer };

          sceneManager.controls.enabled = false;
          compositor.beginDragPreview(
            hitLayer.id,
            garmentColorRef.current,
            artworkLayersRef.current,
            garmentConfigRef.current,
            activeRegionIdRef.current
          );

          try { domEl.setPointerCapture(e.pointerId); } catch (_) {}
          return;
        }
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      // Store latest pointer position — consumed by tick()
      if (dragSessionRef.current) {
        pendingPointerRef.current = { clientX: e.clientX, clientY: e.clientY };
        return;
      }

      // Skip hover hit-testing while the user is orbiting / panning the camera.
      // OrbitControls captures the pointer, and raycasting a 74K-vertex mesh on
      // every pointer move during orbit is the single biggest source of jitter.
      const sm = sceneManagerRef.current;
      if (sm && sm.isPointerDown) return;

      // Hover: detect hit for cursor style (only when pointer is free)
      if (interactionStateRef.current === 'idle' || interactionStateRef.current === 'selected') {
        const selId = selectedLayerIdRef.current;
        if (selId && sm) {
          const handlesResult = getSelectedLayerHandles();
          if (handlesResult && handlesResult.isFacing) {
            const rect = sm.renderer.domElement.getBoundingClientRect();
            const px = e.clientX - rect.left;
            const py = e.clientY - rect.top;
            const hit = hitHandle(handlesResult.handles, px, py);
            if (hit) {
              lastHoverHitRef.current = 'handle';
              setCursorStyle(hit.type === 'rotate' ? 'grab' : 'nwse-resize');
              return;
            }
          }
        }
        const uv = raycastGarmentUV(e.clientX, e.clientY);
        if (uv) {
          const hitLayer = findLayerAtUV(uv.u, uv.v);
          if (hitLayer) {
            lastHoverHitRef.current = 'layer';
            setCursorStyle('grab');
            return;
          }
        }
        lastHoverHitRef.current = 'none';
        setCursorStyle('default');
      }
    };

    const finishDrag = (e: PointerEvent) => {
      const session = dragSessionRef.current;
      const compositor = compositorRef.current;
      const liveLayer = liveLayerRef.current;
      if (!session) return;

      // Process the final pending position before committing
      if (pendingPointerRef.current) {
        processDragInTick();
      }

      // Commit to React state ONCE
      if (liveLayer) {
        const lv = getLayerUV(liveLayer, garmentConfigRef.current);
        const finalUpdates: Partial<ArtworkLayer3D> = {
          u: lv.u,
          v: lv.v,
          offsetX: parseFloat(((lv.u - 0.5) * 2).toFixed(4)),
          offsetY: parseFloat(((lv.v - 0.5) * 2).toFixed(4)),
          uvWidth: liveLayer.uvWidth,
          uvHeight: liveLayer.uvHeight,
          scale: liveLayer.scale,
          rotation: liveLayer.rotation,
        };
        onUpdateLayerRef.current?.(session.layerId, finalUpdates);

        // Run full composite to settle final state
        if (compositor) {
          const layers = artworkLayersRef.current.map((l) =>
            l.id === session.layerId ? { ...l, ...finalUpdates } : l
          );
          compositor.endDragPreview(
            garmentColorRef.current,
            layers,
            garmentConfigRef.current,
            activeRegionIdRef.current
          );
        }
      }

      dragSessionRef.current = null;
      liveLayerRef.current = null;
      interactionStateRef.current = selectedLayerIdRef.current ? 'selected' : 'idle';
      pendingPointerRef.current = null;
      sceneManagerRef.current && (sceneManagerRef.current.controls.enabled = true);
      setCursorStyle('default');

      try { domEl.releasePointerCapture(e.pointerId); } catch (_) {}
    };

    const onPointerUp = (e: PointerEvent) => {
      if (dragSessionRef.current) {
        finishDrag(e);
        return;
      }
      // Click (no drag) — panel selection
      const dx = e.clientX - downInfo.x;
      const dy = e.clientY - downInfo.y;
      const dt = performance.now() - downInfo.time;
      if (Math.hypot(dx, dy) < 6 && dt < 450) {
        const uv = raycastGarmentUV(e.clientX, e.clientY);
        if (uv) {
          // Check artwork first
          const hitLayer = findLayerAtUV(uv.u, uv.v);
          if (hitLayer) {
            onSelectLayerRef.current?.(hitLayer.id);
            interactionStateRef.current = 'selected';
            return;
          }
          // Then panel
          const panel = findPanelAtUV(garmentConfigRef.current.id, uv.u, uv.v);
          if (panel) {
            onSelectPanelRef.current?.(
              panel.id === selectedPanelIdRef.current ? null : panel.id
            );
            return;
          }
        }
        // Clicked empty space — deselect layer
        if (selectedLayerIdRef.current) {
          onSelectLayerRef.current?.(null);
          interactionStateRef.current = 'idle';
        }
      }
    };

    const onPointerCancel = (e: PointerEvent) => {
      if (dragSessionRef.current) {
        // Cancel without committing — restore from artworkLayersRef
        dragSessionRef.current = null;
        liveLayerRef.current = null;
        interactionStateRef.current = selectedLayerIdRef.current ? 'selected' : 'idle';
        pendingPointerRef.current = null;
        const compositor = compositorRef.current;
        const sm = sceneManagerRef.current;
        if (compositor) {
          compositor.endDragPreview(
            garmentColorRef.current,
            artworkLayersRef.current,
            garmentConfigRef.current,
            activeRegionIdRef.current
          );
        }
        if (sm) sm.controls.enabled = true;
        setCursorStyle('default');
        try { domEl.releasePointerCapture(e.pointerId); } catch (_) {}
      }
    };

    domEl.addEventListener('pointerdown', onPointerDown);
    domEl.addEventListener('pointermove', onPointerMove);
    domEl.addEventListener('pointerup', onPointerUp);
    domEl.addEventListener('pointercancel', onPointerCancel);

    // ── Resize Observer ──────────────────────────────────────────────────────
    const resizeObserver = new ResizeObserver(() => {
      sceneManager.handleResize();
      const ov = overlayCanvasRef.current;
      if (ov) {
        const dpr = window.devicePixelRatio || 1;
        ov.width = Math.round(domEl.clientWidth * dpr);
        ov.height = Math.round(domEl.clientHeight * dpr);
      }
    });
    resizeObserver.observe(containerRef.current!);

    // ── Render loop ──────────────────────────────────────────────────────────
    let lastTime = performance.now();
    let animFrameId: number;

    const tick = (now: number) => {
      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // Advance animation
      if (isAnimatedRef.current && isPlayingRef.current) {
        animController.update(delta);
        secondaryMotion.update(delta);
        const prog = animController.getProgress();
        if (scrubberInputRef.current) scrubberInputRef.current.value = String(prog);
        if (scrubberTextRef.current) scrubberTextRef.current.textContent = `${Math.round(prog * 100)}%`;
      } else if (isAnimatedRef.current) {
        secondaryMotion.update(delta);
      }

      // Process pending drag input
      if (dragSessionRef.current && pendingPointerRef.current) {
        processDragInTick();
      }

      // Render WebGL scene
      sceneManager.update(delta);

      // Draw transform handles overlay
      drawOverlayRef.current();

      animFrameId = requestAnimationFrame(tick);
    };

    animFrameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animFrameId);
      domEl.removeEventListener('pointerdown', onPointerDown);
      domEl.removeEventListener('pointermove', onPointerMove);
      domEl.removeEventListener('pointerup', onPointerUp);
      domEl.removeEventListener('pointercancel', onPointerCancel);
      resizeObserver.disconnect();
      secondaryMotion.dispose();
      animController.dispose();
      compositor.dispose();
      materialManager.dispose();
      modelManager.dispose();
      sceneManager.dispose();
      if (overlayCanvasRef.current?.parentNode) {
        overlayCanvasRef.current.parentNode.removeChild(overlayCanvasRef.current);
        overlayCanvasRef.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Cursor style helper (direct DOM mutation — no React re-render) ──────────
  const setCursorStyle = (style: string) => {
    if (cursorEl.current) cursorEl.current.style.cursor = style;
  };

  // 2. Garment Model Switch
  useEffect(() => {
    let cancelled = false;
    async function switchGarment() {
      if (!sceneManagerRef.current || !modelManagerRef.current || !materialManagerRef.current ||
          !compositorRef.current || !animControllerRef.current || !secondaryMotionRef.current) return;
      setLoading(true);
      setLoadProgress(10);
      try {
        const compositor = compositorRef.current;
        const materialManager = materialManagerRef.current;
        const modelManager = modelManagerRef.current;
        const sceneManager = sceneManagerRef.current;
        const animController = animControllerRef.current;
        const secondaryMotion = secondaryMotionRef.current;

        await compositor.setDiffuseTexture(garmentConfig.textures.diffuse);
        if (cancelled) return;
        await materialManager.setupGarmentMaterials(garmentConfig, compositor);
        if (cancelled) return;
        for (const layer of artworkLayers) await compositor.preloadArtwork(layer.imageUrl);
        compositor.composite(garmentColor, artworkLayers, garmentConfig, activeRegionId);

        setLoadProgress(40);
        const loadedModel: LoadedGarmentModel = await modelManager.loadGarment(
          garmentConfig, materialManager, (p) => { if (!cancelled) setLoadProgress(40 + Math.round(p * 0.5)); }
        );
        if (cancelled) return;

        for (let i = sceneManager.scene.children.length - 1; i >= 0; i--) {
          const child = sceneManager.scene.children[i];
          if (child.name.includes('GarmentRoot') || child.type === 'Group') sceneManager.scene.remove(child);
        }
        loadedModel.root.name = `GarmentRoot_${garmentConfig.id}`;
        sceneManager.scene.add(loadedModel.root);

        animController.setup(loadedModel.root, loadedModel.masterClip, isAnimated);
        if (isAnimated) {
          animController.playAction(currentAction, 0);
          animController.setPlaying(isPlaying);
          animController.setSpeed(playbackSpeed);
        } else {
          animController.restoreRestPose();
        }

        secondaryMotion.setup(loadedModel.bones, garmentConfig.wiggleBoneNames);
        secondaryMotion.setEnabled(isAnimated && secondaryMotionEnabled);

        sceneManager.setCameraFraming(garmentConfig.cameraDefaults.target,
          garmentConfig.cameraDefaults.distance, garmentConfig.cameraDefaults.fov);

        compositor.setGarmentMesh(loadedModel.garmentMesh);
        compositor.composite(garmentColor, artworkLayers, garmentConfig, activeRegionId);
        garmentMeshRef.current = loadedModel.garmentMesh;
        if (loadedModel.garmentMesh && loadedModel.garmentMesh.geometry) {
          uvLookupRef.current = new FastUVIndex(loadedModel.garmentMesh.geometry);
        } else {
          uvLookupRef.current = null;
        }
        if (onModelLoaded) onModelLoaded(loadedModel.garmentMesh);

        setLoadProgress(100);
        setLoading(false);
      } catch (err) {
        console.error('[Viewport3D] Error switching garment:', err);
        if (!cancelled) setLoading(false);
      }
    }
    switchGarment();
    return () => { cancelled = true; };
  }, [garmentConfig.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // 3. Color / Artwork / Material / Panel changes — only when NOT dragging
  useEffect(() => {
    if (!compositorRef.current || !materialManagerRef.current) return;
    // Skip during active drag — compositor is managed directly
    if (dragSessionRef.current) return;

    async function updateTexture() {
      if (!compositorRef.current || !materialManagerRef.current) return;
      for (const layer of artworkLayers) await compositorRef.current.preloadArtwork(layer.imageUrl);
      const panel = selectedPanelId ? findPanelById(garmentConfig.id, selectedPanelId) : null;
      compositorRef.current.setHighlightPanel(panel);
      compositorRef.current.composite(garmentColor, artworkLayers, garmentConfig, activeRegionId, true);
      materialManagerRef.current.updateMaterialParams(roughness, metalness);
    }
    updateTexture();
  }, [garmentColor, artworkLayers, garmentConfig, roughness, metalness, activeRegionId, selectedPanelId]);

  const activePanel: GarmentPanel3D | null = useMemo(
    () => (selectedPanelId ? findPanelById(garmentConfig.id, selectedPanelId) : null),
    [garmentConfig.id, selectedPanelId]
  );

  // 4. Lighting
  useEffect(() => {
    if (sceneManagerRef.current) sceneManagerRef.current.applyLighting(lighting);
  }, [lighting]);

  // 5. Animation
  useEffect(() => {
    if (!animControllerRef.current || !secondaryMotionRef.current) return;
    if (isAnimated) {
      if (animControllerRef.current.getCurrentActionName() !== currentAction)
        animControllerRef.current.playAction(currentAction, 0.3);
      animControllerRef.current.setPlaying(isPlaying);
      animControllerRef.current.setSpeed(playbackSpeed);
      secondaryMotionRef.current.setEnabled(secondaryMotionEnabled);
    } else {
      animControllerRef.current.restoreRestPose();
      secondaryMotionRef.current.reset();
      secondaryMotionRef.current.setEnabled(false);
    }
  }, [isAnimated, currentAction, isPlaying, playbackSpeed, secondaryMotionEnabled]);

  // 6. Secondary Motion
  useEffect(() => {
    if (secondaryMotionRef.current) secondaryMotionRef.current.setEnabled(secondaryMotionEnabled);
  }, [secondaryMotionEnabled]);

  // 7. Camera Preset
  useEffect(() => {
    if (sceneManagerRef.current) sceneManagerRef.current.setCameraPreset(cameraPreset);
  }, [cameraPreset]);

  // 8. Turntable
  useEffect(() => {
    if (sceneManagerRef.current) sceneManagerRef.current.setTurntable(isTurntable);
  }, [isTurntable]);

  // 9. Interaction state when selected layer changes from outside
  useEffect(() => {
    if (selectedLayerId && interactionStateRef.current === 'idle') {
      interactionStateRef.current = 'selected';
    } else if (!selectedLayerId) {
      interactionStateRef.current = 'idle';
      liveLayerRef.current = null;
    }
  }, [selectedLayerId]);

  const handleScrubberChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (scrubberTextRef.current) scrubberTextRef.current.textContent = `${Math.round(val * 100)}%`;
    if (animControllerRef.current) animControllerRef.current.seekNormalized(val);
  }, []);

  // Determine hint text based on interaction state
  const hasSelectedLayer = !!selectedLayerId;

  return (
    <div
      ref={cursorEl}
      className="viewport-3d-wrapper"
      style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', cursor: 'default' }}
    >
      {/* Three.js Canvas Container */}
      <div ref={containerRef} style={{ width: '100%', height: '100%', outline: 'none' }} />

      {/* Loading Overlay */}
      {loading && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(9,11,16,0.85)', backdropFilter: 'blur(8px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          zIndex: 20, color: '#fff', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid rgba(0,214,255,0.2)',
            borderTopColor: '#3B5EFF', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <div style={{ fontSize: '15px', fontWeight: 600 }}>Loading 3D {garmentConfig.name}…</div>
          <div style={{ width: '180px', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ width: `${loadProgress}%`, height: '100%',
              background: 'linear-gradient(90deg,#3B5EFF,#5B7EFF)', transition: 'width 0.2s ease' }} />
          </div>
        </div>
      )}

      {/* Transform hint badge — repositioned to bottom, non-overlapping, auto-dismisses on interaction */}
      {showInstruction && hasSelectedLayer && !loading && (
        <div id="artwork-drag-hint-3d" style={{
          position: 'absolute',
          bottom: isAnimated ? '150px' : '76px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(15,20,30,0.88)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(59,94,255,0.45)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.4), 0 0 10px rgba(59,94,255,0.2)',
          color: '#c7d2fe',
          fontSize: '11px',
          fontWeight: 600,
          padding: '6px 14px',
          borderRadius: '16px',
          pointerEvents: 'none',
          zIndex: 12,
          whiteSpace: 'nowrap',
          transition: 'opacity 0.25s ease, transform 0.25s ease',
        }}>
          Drag to move · Corner handles to resize · Circle handle to rotate
        </div>
      )}

      {/* Camera Presets Bar */}
      <div id="camera-presets-bar" className="camera-presets-bar">
        <span className="camera-presets-label">Views:</span>
        {(['front', 'back', 'left', 'right', 'threeQuarter'] as CameraPreset3D[]).map((p) => (
          <button key={p} onClick={() => onCameraPresetChange(p)}
            className={`camera-preset-btn ${cameraPreset === p ? 'active' : ''}`}
            title={`View ${p === 'threeQuarter' ? '3/4 Angle' : p}`}>
            {p === 'threeQuarter' ? (
              <><span className="camera-view-full">3/4 View</span><span className="camera-view-short">3/4</span></>
            ) : p}
          </button>
        ))}
        <div className="camera-preset-divider" />
        <button onClick={onTurntableToggle} title="Toggle Turntable 360° Auto-Rotate"
          className={`camera-preset-btn camera-preset-turntable ${isTurntable ? 'active' : ''}`}>
          <RotateCw size={13} className={isTurntable ? 'spin-slow' : ''} />
          <span>360°</span>
        </button>
        <div className="camera-preset-divider" />
        <button id="toggle-animation-btn" onClick={onAnimatedToggle}
          title={isAnimated ? 'Disable Animation' : 'Enable Skeletal Animation'}
          className={`camera-preset-btn camera-preset-animate ${isAnimated ? 'active' : ''}`}>
          <Activity size={13} />
          <span className="camera-anim-full">{isAnimated ? 'Animating' : 'Animate'}</span>
          <span className="camera-anim-short">{isAnimated ? 'Anim' : 'Motion'}</span>
        </button>
        {onToggleUvEditor && (
          <button id="toggle-uv-editor-btn" onClick={onToggleUvEditor}
            title={isUvEditorOpen ? 'Hide 2D UV Editor' : 'Show 2D UV Editor'}
            className={`camera-preset-btn camera-preset-uv desktop-only-preset-uv ${isUvEditorOpen ? 'active' : ''}`}>
            <Layers size={13} />
            <span>UV Editor</span>
          </button>
        )}
      </div>

      {/* Floating Viewport Action Bar */}
      <div className="viewport-quick-actions" id="viewport-3d-quick-actions">
        {onAddArtworkFromFile && (
          <label className="quick-action-pill quick-action-upload" title="Upload custom graphic to 3D model">
            <Upload size={14} />
            <span className="quick-action-full">Upload Design</span>
            <span className="quick-action-short">Upload</span>
            <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onAddArtworkFromFile(file);
                e.target.value = '';
              }} />
          </label>
        )}
        {onToggleUvEditor && (
          <button type="button"
            className={`quick-action-pill quick-action-uv ${isUvEditorOpen ? 'active' : ''}`}
            onClick={onToggleUvEditor}
            title={isUvEditorOpen ? 'Close 2D UV Editor' : 'Open 2D UV Placement Editor'}>
            <Layers size={14} />
            <span>{isUvEditorOpen ? 'Close UV' : 'UV Editor'}</span>
          </button>
        )}
      </div>

      {/* Animation Control Bar */}
      {isAnimated && (
        <div id="animation-control-bar" className="animation-control-bar" style={{
          position: 'absolute', left: '50%', transform: 'translateX(-50%)',
          width: 'min(92%, 620px)', background: 'rgba(15,20,30,0.88)', backdropFilter: 'blur(12px)',
          padding: '10px 16px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: '0 12px 40px rgba(0,0,0,0.5)', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '8px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button onClick={onPlayToggle} style={{
              background: isPlaying ? 'rgba(255,255,255,0.12)' : 'var(--accent,#3B5EFF)',
              color: isPlaying ? '#fff' : '#000', border: 'none', borderRadius: '50%',
              width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', flexShrink: 0,
            }} title={isPlaying ? 'Pause' : 'Play'}>
              {isPlaying ? <Pause size={15} /> : <Play size={15} style={{ marginLeft: '2px' }} />}
            </button>
            <input ref={scrubberInputRef} id="animation-timeline-scrubber" type="range"
              min={0} max={1} step={0.002} defaultValue={0} onChange={handleScrubberChange}
              style={{ flex: 1, accentColor: 'var(--accent,#3B5EFF)', cursor: 'pointer' }} />
            <span ref={scrubberTextRef}
              style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace', minWidth: '38px', textAlign: 'right' }}>
              0%
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
            <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', scrollbarWidth: 'none', maxWidth: '100%' }}>
              {(['IDLE', 'WALK', 'DANCE', 'RUN', 'FIGHTER', 'STRUT'] as AnimationActionName[]).map((act) => (
                <button key={act} onClick={() => onActionChange(act)} style={{
                  background: currentAction === act ? 'rgba(0,214,255,0.22)' : 'rgba(255,255,255,0.05)',
                  color: currentAction === act ? '#3B5EFF' : 'var(--text-muted)',
                  border: currentAction === act ? '1px solid rgba(0,214,255,0.5)' : '1px solid transparent',
                  borderRadius: '12px', padding: '3px 8px', fontSize: '11px', fontWeight: 600,
                  cursor: 'pointer', transition: 'all 0.12s ease',
                }}>{act}</button>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button onClick={onSecondaryMotionToggle} title="Toggle spring bones" style={{
                background: secondaryMotionEnabled ? 'rgba(0,255,170,0.15)' : 'rgba(255,255,255,0.05)',
                color: secondaryMotionEnabled ? '#10b981' : 'var(--text-muted)',
                border: secondaryMotionEnabled ? '1px solid rgba(0,255,170,0.4)' : '1px solid transparent',
                borderRadius: '12px', padding: '3px 8px', fontSize: '11px', fontWeight: 600,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
              }}>
                <Activity size={12} /><span>Spring Bones</span>
              </button>
              <div style={{ display: 'flex', background: 'rgba(255,255,255,0.06)', borderRadius: '10px', padding: '2px' }}>
                {[0.5, 1.0, 1.5].map((s) => (
                  <button key={s} onClick={() => onSpeedChange(s)} style={{
                    background: playbackSpeed === s ? 'var(--accent,#3B5EFF)' : 'transparent',
                    color: playbackSpeed === s ? '#000' : 'var(--text-muted)',
                    border: 'none', borderRadius: '8px', padding: '2px 6px',
                    fontSize: '10px', fontWeight: 700, cursor: 'pointer',
                  }}>{s}x</button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Selected Panel Info Badge */}
      {activePanel && (
        <div id="active-panel-info-pill" style={{
          position: 'absolute', bottom: isAnimated ? '110px' : '24px', left: '50%', transform: 'translateX(-50%)',
          display: 'flex', alignItems: 'center', gap: '10px',
          background: 'rgba(15,20,30,0.92)', backdropFilter: 'blur(12px)',
          padding: '8px 16px', borderRadius: '24px',
          border: `1.5px solid ${activePanel.color}`,
          boxShadow: `0 8px 32px rgba(0,0,0,0.5),0 0 16px ${activePanel.color}33`,
          zIndex: 15, color: '#fff', pointerEvents: 'auto',
        }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%',
            background: activePanel.color, boxShadow: `0 0 8px ${activePanel.color}`, flexShrink: 0 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700 }}>{activePanel.name}</span>
            {activePanel.description && (
              <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)' }}>{activePanel.description}</span>
            )}
          </div>
          <button onClick={() => onSelectPanel?.(null)} style={{
            background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '12px',
            color: 'rgba(255,255,255,0.8)', padding: '3px 8px', fontSize: '11px', fontWeight: 600,
            cursor: 'pointer', marginLeft: '6px',
          }} title="Clear Panel Selection">Clear</button>
        </div>
      )}
    </div>
  );
};
