'use client';

/**
 * TShirt3DViewer.tsx
 *
 * Real-time 3D t-shirt preview using @react-three/fiber + @react-three/drei.
 * Scoped to tee / oversized-tee garments only.
 *
 * Error handling: GLTFLoader errors are caught by an ErrorBoundary and
 * shown as a friendly inline message -- they do NOT crash the page.
 */

import { Component, Suspense, useRef, useEffect, useState, useCallback } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF, useProgress } from '@react-three/drei';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import {
  useApparelCustomizerStore,
  type DesignTransform,
} from '@/lib/stores/apparel-customizer-store';

const MODEL_PATH = '/3d%20models/fbx.gltf';
const TEX_SIZE = 2048;

function detectWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl') || c.getContext('experimental-webgl'));
  } catch {
    return false;
  }
}

interface EBProps {
  children: ReactNode;
  resetKey?: string;
  onRetry?: () => void;
}

interface EBState {
  error: Error | null;
}

class ViewerErrorBoundary extends Component<EBProps, EBState> {
  constructor(props: EBProps) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error): EBState {
    return { error };
  }
  componentDidUpdate(prevProps: EBProps) {
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn('[TShirt3DViewer] load error:', error.message, info.componentStack);
  }
  render() {
    if (this.state.error) {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#111114]">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#ED9518"
            strokeWidth="1.5"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4m0 4h.01" />
          </svg>
          <div className="text-center px-6">
            <p className="font-mono text-xs text-pearl mb-1">3D preview unavailable</p>
            <p className="font-mono text-[10px] text-ash/60 mb-3">Failed to initialize 3D scene.</p>
            <button
              onClick={() => {
                this.setState({ error: null });
                this.props.onRetry?.();
              }}
              className="px-3 py-1 bg-[#ED9518]/20 hover:bg-[#ED9518]/30 border border-[#ED9518]/40 rounded font-mono text-[11px] text-[#ED9518] transition-colors"
            >
              Retry 3D
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const imageCache = new Map<string, HTMLImageElement>();

function loadImageCached(url: string): Promise<HTMLImageElement | null> {
  if (imageCache.has(url)) {
    const cached = imageCache.get(url);
    if (cached && cached.complete && cached.naturalWidth > 0) return Promise.resolve(cached);
  }
  return new Promise((resolve) => {
    const img = new Image();
    if (!url.startsWith('data:') && !url.startsWith('/')) img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageCache.set(url, img);
      resolve(img);
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

let sharedOffscreenCanvas: HTMLCanvasElement | null = null;
function getSharedCanvas(): HTMLCanvasElement {
  if (!sharedOffscreenCanvas) {
    sharedOffscreenCanvas = document.createElement('canvas');
    sharedOffscreenCanvas.width = TEX_SIZE;
    sharedOffscreenCanvas.height = TEX_SIZE;
  }
  return sharedOffscreenCanvas;
}

/**
 * Paints base garment color and bakes both front & back designs onto the shared 2048x2048 texture.
 * Reuses the existing canvas to avoid GC pauses and GPU re-allocation.
 */
async function paintDesignTexture(
  canvas: HTMLCanvasElement,
  front: { imageUrl: string | null; transform: DesignTransform | null },
  back: { imageUrl: string | null; transform: DesignTransform | null },
  colorHex: string,
): Promise<void> {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // 1. Fill base garment color
  ctx.fillStyle = colorHex;
  ctx.fillRect(0, 0, TEX_SIZE, TEX_SIZE);

  // 2. Helper to draw artwork onto front or back UV zone
  const drawView = async (
    viewType: 'front' | 'back',
    imageUrl: string | null,
    transform: DesignTransform | null,
  ) => {
    if (!imageUrl) return;
    const img = await loadImageCached(imageUrl);
    if (!img) return;

    // UV center coordinates in glTF UV space:
    // Front chest: center U = 0.319, V = 0.357
    // Back upper:  center U = 0.756, V = 0.335
    const uCenter = viewType === 'front' ? 0.319 : 0.756;
    const vCenter = viewType === 'front' ? 0.357 : 0.335;

    // UV print area radius (half dimensions)
    const halfU = 0.068;
    const halfV = 0.112;

    const normX = transform?.normX ?? 0;
    const normY = transform?.normY ?? 0;

    // On this glTF model:
    // With tex.flipY = false, row 0 in canvas is WebGL V = 0.0 (top, collar).
    // Moving down (normY > 0) increases V towards waist.
    // Moving right (normX > 0) increases U.
    const u = uCenter + normX * halfU;
    const v = vCenter + normY * halfV;

    const cx = u * TEX_SIZE;
    const cy = v * TEX_SIZE;

    // Scale calculations
    const baseW = halfU * 2 * TEX_SIZE * 0.75;
    const scale = transform?.scaleX ?? 1;
    const drawW = Math.max(10, baseW * scale);
    const aspect = (img.height || 1) / Math.max(img.width || 1, 1);
    const drawH = drawW * aspect;

    const angle = ((transform?.angle ?? 0) * Math.PI) / 180;
    const opacity = transform?.opacity ?? 1;

    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, opacity));
    ctx.translate(cx, cy);
    if (angle !== 0) ctx.rotate(angle);
    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();
  };

  await Promise.all([
    drawView('front', front.imageUrl, front.transform),
    drawView('back', back.imageUrl, back.transform),
  ]);
}

const DEFAULT_CAM_FRONT = new THREE.Vector3(0, 0, 3.6);
const DEFAULT_CAM_BACK = new THREE.Vector3(0, 0, -3.6);
const DEFAULT_TARGET = new THREE.Vector3(0, 0, 0);

function CameraRig({ resetSignal, view }: { resetSignal: number; view: 'front' | 'back' }) {
  const { camera } = useThree();
  const controlsRef = useRef<OrbitControlsImpl>(null);

  // Position camera facing front or back when view changes or resets
  useEffect(() => {
    const targetPos = view === 'front' ? DEFAULT_CAM_FRONT : DEFAULT_CAM_BACK;
    camera.position.copy(targetPos);
    controlsRef.current?.target.copy(DEFAULT_TARGET);
    controlsRef.current?.update();
  }, [view, resetSignal, camera]);

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={false}
      enableZoom
      minDistance={2.0}
      maxDistance={6.0}
      minPolarAngle={Math.PI / 6}
      maxPolarAngle={Math.PI / 1.6}
    />
  );
}

function TShirtModel({ colorHex, onLoaded }: { colorHex: string; onLoaded?: () => void }) {
  const { scene } = useGLTF(MODEL_PATH);
  const { designsByView } = useApparelCustomizerStore();

  const frontDesign = designsByView.front;
  const backDesign = designsByView.back;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const texRef = useRef<THREE.CanvasTexture | null>(null);

  // Initialize shared canvas & CanvasTexture once
  if (!canvasRef.current) {
    canvasRef.current = getSharedCanvas();
  }
  if (!texRef.current && canvasRef.current) {
    const tex = new THREE.CanvasTexture(canvasRef.current);
    tex.flipY = false;
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    texRef.current = tex;
  }

  // Paint and update texture whenever designs or color change
  useEffect(() => {
    let cancelled = false;
    const canvas = canvasRef.current;
    if (!canvas || !texRef.current) return;

    paintDesignTexture(canvas, frontDesign, backDesign, colorHex).then(() => {
      if (cancelled) return;
      if (texRef.current) {
        texRef.current.needsUpdate = true;
      }
      onLoaded?.();
    });

    return () => {
      cancelled = true;
    };
  }, [frontDesign, backDesign, colorHex, onLoaded]);

  // Apply materials to meshes in scene
  useEffect(() => {
    if (!texRef.current) return;

    scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        const raw = mesh.material;
        const mats = Array.isArray(raw) ? raw : [raw];

        mats.forEach((m) => {
          if (m instanceof THREE.MeshStandardMaterial) {
            const nameLower = m.name.toLowerCase();
            const isJersey =
              nameLower.includes('jersey') ||
              nameLower.includes('knit') ||
              nameLower.includes('cotton');

            if (isJersey) {
              // Torso body: use our baked canvas texture with pure white multiplier
              // so design colors remain 100% true and vibrant!
              m.map = texRef.current;
              m.color.set(0xffffff);
              m.roughness = 0.85;
              m.metalness = 0.0;
              m.transparent = false;
              m.side = THREE.FrontSide;
              m.needsUpdate = true;
            } else {
              // Collar ribbing, stitches, hems: dye with selected shirt color
              // so the collar matches the shirt instead of remaining stark white!
              m.color.set(colorHex);
              m.roughness = 0.85;
              m.metalness = 0.0;
              m.needsUpdate = true;
            }
          }
        });
      }
    });
  }, [scene, colorHex]);

  // Keep scene pristine: never modify scene.position or scene.scale directly
  useEffect(() => {
    scene.position.set(0, 0, 0);
    scene.scale.set(1, 1, 1);
    scene.rotation.set(0, 0, 0);
  }, [scene]);

  useEffect(
    () => () => {
      texRef.current?.dispose();
    },
    [],
  );

  // Frame the model centered cleanly at origin:
  // Raw glTF bounds: height = 6.475, center Y = 12.172.
  // Group scale 0.3398 sets height to 2.20; position Y = -4.136 centers the shirt precisely at (0, 0, 0).
  return (
    <group scale={[0.3398, 0.3398, 0.3398]} position={[0, -4.136, 0]}>
      <primitive object={scene} />
    </group>
  );
}

function LoadingFallback() {
  const { progress } = useProgress();
  
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#111114] z-20">
      <div className="relative w-16 h-16 flex items-center justify-center">
        <div className="absolute inset-0 border-2 border-[#ED9518]/20 border-t-[#ED9518] rounded-full animate-spin" />
        <span className="font-mono text-[11px] text-[#ED9518]">{Math.round(progress)}%</span>
      </div>
      <p className="font-mono text-xs text-ash tracking-widest uppercase">Loading 3D Engine...</p>
    </div>
  );
}

export interface TShirt3DViewerProps {
  colorHex: string;
  view: 'front' | 'back';
}

export function TShirt3DViewer({ colorHex, view }: TShirt3DViewerProps) {
  const [hasWebGL] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return detectWebGL();
  });
  const [resetSignal, setResetSignal] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const handleReset = useCallback(() => setResetSignal((n) => n + 1), []);

  if (!hasWebGL) return null;

  return (
    <div className="relative w-full h-full bg-[#111114] rounded-xl overflow-hidden">
      <ViewerErrorBoundary resetKey={`${colorHex}-${view}-${resetSignal}`} onRetry={handleReset}>
        <Canvas
          frameloop="always"
          camera={{ position: [0, 0, 3.6], fov: 42 }}
          gl={{ antialias: true, alpha: false }}
          style={{ width: '100%', height: '100%' }}
        >
          {/* Ambient fill */}
          <ambientLight intensity={0.65} />
          {/* Front key & fill */}
          <directionalLight position={[3, 4, 3]} intensity={1.1} />
          <directionalLight position={[-3, 2, 2]} intensity={0.5} />
          {/* Back key & fill */}
          <directionalLight position={[-2, 4, -3]} intensity={1.1} />
          <directionalLight position={[2, 2, -2]} intensity={0.5} />
          <Suspense fallback={null}>
            <TShirtModel colorHex={colorHex} onLoaded={() => setIsLoaded(true)} />
          </Suspense>
          <CameraRig resetSignal={resetSignal} view={view} />
        </Canvas>
      </ViewerErrorBoundary>

      {!isLoaded && <LoadingFallback />}

      <div className="absolute bottom-3 right-3 z-10">
        <button
          id="tshirt-3d-reset-view"
          onClick={handleReset}
          title="Reset camera view"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-charcoal/80 backdrop-blur-sm border border-smoke/40 rounded-md font-mono text-[10px] text-pearl hover:border-[#ED9518]/60 hover:text-[#ED9518] transition-colors"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
          Reset view
        </button>
      </div>

      <div className="absolute top-3 left-3 z-10">
        <span className="font-mono text-[9px] text-ash/60 bg-charcoal/50 backdrop-blur-sm px-2 py-1 rounded">
          Drag to rotate &middot; Scroll to zoom
        </span>
      </div>
    </div>
  );
}
// DO NOT add useGLTF.preload() at module level.
// It caused stale chunk cache (old .glb path) after hot reload.
