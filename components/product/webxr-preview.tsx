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
      tex.center.set(0.5, 0.5);
      return tex;
    }
    return null;
  }, [url]);

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

function HitTestPlacer({
  panels,
  isPlaced,
  setIsPlaced,
}: {
  panels: Panel[];
  isPlaced: boolean;
  setIsPlaced: (v: boolean) => void;
}) {
  const reticleRef = useRef<THREE.Mesh>(null);
  const [placedMatrix, setPlacedMatrix] = useState<THREE.Matrix4 | null>(null);

  useHitTest((hitMatrix) => {
    if (isPlaced) return;
    if (hitMatrix && reticleRef.current) {
      reticleRef.current.visible = true;
      reticleRef.current.matrix.copy(hitMatrix);
    }
  });

  const placePoster = () => {
    if (reticleRef.current && reticleRef.current.visible && !isPlaced) {
      const newMat = new THREE.Matrix4().copy(reticleRef.current.matrix);
      setPlacedMatrix(newMat);
      reticleRef.current.visible = false;
      setIsPlaced(true);
    }
  };

  const meshes = useMemo(() => {
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
      {/* Background mesh to catch pointer down everywhere in AR */}
      <mesh onPointerDown={placePoster}>
        <sphereGeometry args={[100, 32, 32]} />
        <meshBasicMaterial visible={false} side={THREE.BackSide} />
      </mesh>

      <mesh ref={reticleRef} matrixAutoUpdate={false} visible={false}>
        <ringGeometry args={[0.04, 0.05, 32]} />
        <meshBasicMaterial color="#3B5EFF" opacity={0.8} transparent side={THREE.DoubleSide} />
      </mesh>

      {placedMatrix && (
        <group matrixAutoUpdate={false} matrix={placedMatrix}>
          <group rotation={[-Math.PI / 2, 0, 0]}>{meshes}</group>
        </group>
      )}
    </>
  );
}

// A simple component to report when the XR session is active
function XRStateReporter({ onStateChange }: { onStateChange: (isPresenting: boolean) => void }) {
  const { isPresenting } = useXR();
  useEffect(() => {
    onStateChange(isPresenting);
  }, [isPresenting, onStateChange]);
  return null;
}

export function WebXRPreview({ panels, onClose }: WebXRPreviewProps) {
  const [started, setStarted] = useState(false);
  const [isPlaced, setIsPlaced] = useState(false);

  return (
    <div className="fixed inset-0 z-[200] bg-charcoal">
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
        <div className="absolute inset-0 z-[205] flex items-center justify-center bg-graphite/80 backdrop-blur-sm">
          <ARButton
            sessionInit={{ requiredFeatures: ['hit-test'] }}
            className="px-8 py-4 rounded-full bg-cobalt text-pearl font-bold uppercase tracking-wider shadow-[0_0_40px_rgba(59,94,255,0.4)]"
            style={{
              position: 'absolute',
              bottom: 'auto',
              left: 'auto',
              zIndex: 9999,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Launch True AR
          </ARButton>
        </div>
      )}

      {started && !isPlaced && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[210] text-center pointer-events-none w-[90%]">
          <p className="bg-charcoal/80 text-bone px-4 py-2 rounded-full border border-smoke text-sm shadow-xl">
            Point camera at a wall or floor & tap to place
          </p>
        </div>
      )}

      {started && isPlaced && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[210] text-center pointer-events-none w-[90%]">
          <p className="bg-charcoal/80 text-bone px-4 py-2 rounded-full border border-smoke text-sm shadow-xl">
            Walk around to view the poster!
          </p>
        </div>
      )}

      <div className="w-full h-full absolute inset-0 z-[200]">
        <Canvas>
          <XR>
            <XRStateReporter onStateChange={setStarted} />
            <ambientLight intensity={1} />
            <Suspense fallback={null}>
              <HitTestPlacer panels={panels} isPlaced={isPlaced} setIsPlaced={setIsPlaced} />
            </Suspense>
          </XR>
        </Canvas>
      </div>
    </div>
  );
}
