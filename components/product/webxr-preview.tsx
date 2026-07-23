'use client';

import { Suspense, useRef, useState, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { ARButton, XR, useHitTest, useXR } from '@react-three/xr';

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

interface WebXRPreviewProps {
  panels: Panel[];
  onClose: () => void;
}

const CSS_TO_M = 0.003;
const GAP = 0.015;

function PosterMesh({
  panel,
  position,
  url,
}: {
  panel: Panel;
  position: [number, number, number];
  url: string | null;
}) {
  const wRaw = parseInt(panel.width) || 60;
  const hRaw = parseInt(panel.height) || 90;
  const width = wRaw * CSS_TO_M;
  const height = hRaw * CSS_TO_M;

  const texture = useMemo(() => {
    if (url) {
      const tex = new THREE.TextureLoader().load(url);
      tex.colorSpace = THREE.SRGBColorSpace;

      // Parse bgSize (e.g. "300% 100%")
      const bgSizeMatch = panel.bgSize.match(/([\d.]+)%\s+([\d.]+)%/);
      const sizeX = bgSizeMatch ? parseFloat(bgSizeMatch[1] || '100') / 100 : 1;
      const sizeY = bgSizeMatch ? parseFloat(bgSizeMatch[2] || '100') / 100 : 1;

      tex.repeat.set(1 / sizeX, 1 / sizeY);

      // Parse bgPosition (e.g. "50% 50%")
      const bgPosMatch = panel.bgPosition.match(/([\d.]+)%\s+([\d.]+)%/);
      const posX = bgPosMatch ? parseFloat(bgPosMatch[1] || '50') / 100 : 0.5;
      const posY = bgPosMatch ? parseFloat(bgPosMatch[2] || '50') / 100 : 0.5;

      // Calculate Offset (Three.js V axis is bottom-to-top, CSS is top-to-bottom)
      tex.offset.x = posX * (1 - tex.repeat.x);
      const invPosY = 1 - posY;
      tex.offset.y = invPosY * (1 - tex.repeat.y);

      return tex;
    }
    return null;
  }, [url, panel.bgSize, panel.bgPosition]);

  return (
    <mesh position={position}>
      <planeGeometry args={[width, height]} />
      {texture ? (
        <meshBasicMaterial map={texture} side={THREE.DoubleSide} />
      ) : (
        <meshBasicMaterial color="#333333" side={THREE.DoubleSide} />
      )}
    </mesh>
  );
}

// Math function to guarantee perfect upright orientation on any surface
function getAlignedMatrix(hitMatrix: THREE.Matrix4) {
  const position = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  hitMatrix.decompose(position, quaternion, scale);

  // WebXR Y-axis is the surface normal (sticking out of the wall)
  const normal = new THREE.Vector3(0, 1, 0).applyQuaternion(quaternion).normalize();

  const faceVec = normal;
  const rightVec = new THREE.Vector3();
  const upVec = new THREE.Vector3();

  // If normal is mostly horizontal, it's a WALL
  if (Math.abs(normal.y) < 0.8) {
    const worldUp = new THREE.Vector3(0, 1, 0); // True Gravity UP
    rightVec.crossVectors(worldUp, faceVec).normalize();
    upVec.crossVectors(faceVec, rightVec).normalize();
  } else {
    // If it's a FLOOR or CEILING
    const hitX = new THREE.Vector3(1, 0, 0).applyQuaternion(quaternion).normalize();
    rightVec.copy(hitX);
    upVec.crossVectors(faceVec, rightVec).normalize();
  }

  const alignedMatrix = new THREE.Matrix4();
  alignedMatrix.makeBasis(rightVec, upVec, faceVec);
  alignedMatrix.setPosition(position);
  return alignedMatrix;
}

function HitTestPlacer({
  panels,
  placedMatrix,
  setPlacedMatrix,
}: {
  panels: Panel[];
  placedMatrix: THREE.Matrix4 | null;
  setPlacedMatrix: (v: THREE.Matrix4 | null) => void;
}) {
  const reticleRef = useRef<THREE.Mesh>(null);
  const { session } = useXR();

  useHitTest((hitMatrix) => {
    if (placedMatrix) return;
    if (hitMatrix && reticleRef.current) {
      reticleRef.current.visible = true;
      const alignedMat = getAlignedMatrix(hitMatrix);
      reticleRef.current.matrix.copy(alignedMat);
    }
  });

  useEffect(() => {
    if (!session) return;
    const handleSelect = () => {
      if (reticleRef.current && reticleRef.current.visible && !placedMatrix) {
        const newMat = new THREE.Matrix4().copy(reticleRef.current.matrix);
        setPlacedMatrix(newMat);
        reticleRef.current.visible = false;
      }
    };
    session.addEventListener('select', handleSelect);
    return () => {
      session.removeEventListener('select', handleSelect);
    };
  }, [session, placedMatrix, setPlacedMatrix]);

  const meshes = useMemo(() => {
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

    if (isGrid && firstPanel) {
      const maxCol = Math.max(...panels.map((p) => p.gridCol || 1));
      const maxRow = Math.max(...panels.map((p) => p.gridRow || 1));

      const pW = (parseInt(firstPanel.width) || 60) * CSS_TO_M;
      const pH = (parseInt(firstPanel.height) || 90) * CSS_TO_M;

      const totalW = maxCol * pW + (maxCol - 1) * GAP;
      const totalH = maxRow * pH + (maxRow - 1) * GAP;

      return panels.map((panel, idx) => {
        const col = panel.gridCol || 1;
        const row = panel.gridRow || 1;
        const x = -totalW / 2 + (col - 1) * (pW + GAP) + pW / 2;
        const y = totalH / 2 - (row - 1) * (pH + GAP) - pH / 2;
        return (
          <PosterMesh key={idx} panel={panel} position={[x, y, 0]} url={panel.imageSrc || null} />
        );
      });
    }

    if (isVerticalStack) {
      const totalHeight =
        panels.reduce((acc, p) => acc + (parseInt(p.height) || 90) * CSS_TO_M, 0) +
        (panels.length - 1) * GAP;
      let currentY = totalHeight / 2;

      return panels.map((panel, idx) => {
        const h = (parseInt(panel.height) || 90) * CSS_TO_M;
        const y = currentY - h / 2;
        currentY -= h + GAP;
        return (
          <PosterMesh key={idx} panel={panel} position={[0, y, 0]} url={panel.imageSrc || null} />
        );
      });
    }

    // Default: Horizontal Stack (Side by side)
    const totalWidth =
      panels.reduce((acc, p) => acc + (parseInt(p.width) || 60) * CSS_TO_M, 0) +
      (panels.length - 1) * GAP;
    let currentX = -totalWidth / 2;

    return panels.map((panel, idx) => {
      const w = (parseInt(panel.width) || 60) * CSS_TO_M;
      const x = currentX + w / 2;
      currentX += w + GAP;
      return (
        <PosterMesh key={idx} panel={panel} position={[x, 0, 0]} url={panel.imageSrc || null} />
      );
    });
  }, [panels]);

  return (
    <>
      {/* Reticle explicitly faces +Z, getAlignedMatrix forces +Z to be the surface normal */}
      <mesh ref={reticleRef} matrixAutoUpdate={false} visible={false}>
        <ringGeometry args={[0.04, 0.05, 32]} />
        <meshBasicMaterial color="#3B5EFF" opacity={0.8} transparent side={THREE.DoubleSide} />
      </mesh>

      {/* Placed Poster explicitly faces +Z, gets exactly the same matrix as the reticle */}
      {placedMatrix && (
        <group matrixAutoUpdate={false} matrix={placedMatrix}>
          {meshes}
        </group>
      )}
    </>
  );
}

function XRStateReporter({ onStateChange }: { onStateChange: (isPresenting: boolean) => void }) {
  const { isPresenting } = useXR();
  useEffect(() => {
    onStateChange(isPresenting);
  }, [isPresenting, onStateChange]);
  return null;
}

export function WebXRPreview({ panels, onClose }: WebXRPreviewProps) {
  const [started, setStarted] = useState(false);
  const [placedMatrix, setPlacedMatrix] = useState<THREE.Matrix4 | null>(null);

  return (
    <div
      id="xr-overlay"
      className={`fixed inset-0 z-[200] ${started ? 'bg-transparent' : 'bg-charcoal'}`}
    >
      <div className="absolute top-0 left-0 right-0 z-[210] flex items-center justify-between px-5 py-4 bg-gradient-to-b from-charcoal/80 to-transparent pointer-events-none">
        <div>
          <p className="font-mono text-[10px] text-pearl uppercase tracking-widest">AR Preview</p>
          <p className="font-display text-bone text-lg">Surface Detection Active</p>
        </div>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-graphite border border-smoke flex items-center justify-center text-pearl hover:text-bone transition-colors pointer-events-auto"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {!started && (
        <div className="absolute inset-0 z-[205] flex flex-col items-center justify-center bg-graphite/80 backdrop-blur-sm px-5">
          <div className="flex flex-col items-center gap-8 max-w-sm w-full">
            <ARButton
              sessionInit={{
                requiredFeatures: ['hit-test'],
                optionalFeatures: ['dom-overlay'],
                domOverlay: { root: document.getElementById('xr-overlay') || document.body },
              }}
              className="px-8 py-4 w-full rounded-full bg-cobalt text-pearl font-bold uppercase tracking-wider shadow-[0_0_40px_rgba(59,94,255,0.4)] transition-transform active:scale-95"
              style={{
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Launch True AR
            </ARButton>

            <div className="bg-charcoal/60 text-bone px-6 py-6 rounded-2xl border border-smoke w-full text-left shadow-xl">
              <h3 className="text-lg font-bold text-pearl mb-4 text-center uppercase tracking-wider">
                How it works
              </h3>
              <div className="space-y-3 font-mono text-sm">
                <p>
                  <span className="text-cobalt font-bold mr-2">1.</span> Point camera at a{' '}
                  <b>well-lit wall</b>.
                </p>
                <p>
                  <span className="text-cobalt font-bold mr-2">2.</span> Slowly move phone{' '}
                  <b>side-to-side</b> to scan.
                </p>
                <p>
                  <span className="text-cobalt font-bold mr-2">3.</span> When <b>blue ring</b>{' '}
                  appears, <b>TAP SCREEN</b> to place!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {started && !placedMatrix && (
        <div className="absolute bottom-0 left-0 right-0 px-5 py-8 bg-gradient-to-t from-charcoal/90 to-transparent flex flex-col items-center pointer-events-none z-[9999]">
          <p className="font-mono text-[10px] text-pearl/90 uppercase tracking-widest text-center">
            Scan wall · Tap blue ring to place
          </p>
        </div>
      )}

      {started && placedMatrix && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[9999] text-center pointer-events-auto w-[90%] flex flex-col items-center gap-4">
          <p className="bg-charcoal/90 text-bone px-6 py-3 rounded-full border border-smoke text-sm shadow-2xl pointer-events-none font-bold">
            Walk around to view the poster!
          </p>
          <button
            onClick={() => setPlacedMatrix(null)}
            className="bg-cobalt text-pearl px-8 py-4 rounded-full font-bold uppercase tracking-wider shadow-[0_0_30px_rgba(59,94,255,0.4)] border border-blue-400"
          >
            Reposition Poster
          </button>
        </div>
      )}

      <div className="w-full h-full absolute inset-0 z-[200]">
        <Canvas>
          <XR>
            <XRStateReporter onStateChange={setStarted} />
            <ambientLight intensity={1} />
            <Suspense fallback={null}>
              <HitTestPlacer
                panels={panels}
                placedMatrix={placedMatrix}
                setPlacedMatrix={setPlacedMatrix}
              />
            </Suspense>
          </XR>
        </Canvas>
      </div>
    </div>
  );
}
