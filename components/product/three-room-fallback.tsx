'use client';

import { Suspense, useMemo } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Center } from '@react-three/drei';

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

      const bgSizeMatch = panel.bgSize.match(/([\d.]+)%\s+([\d.]+)%/);
      const sizeX = bgSizeMatch ? parseFloat(bgSizeMatch[1] || '100') / 100 : 1;
      const sizeY = bgSizeMatch ? parseFloat(bgSizeMatch[2] || '100') / 100 : 1;

      tex.repeat.set(1 / sizeX, 1 / sizeY);

      const bgPosMatch = panel.bgPosition.match(/([\d.]+)%\s+([\d.]+)%/);
      const posX = bgPosMatch ? parseFloat(bgPosMatch[1] || '50') / 100 : 0.5;
      const posY = bgPosMatch ? parseFloat(bgPosMatch[2] || '50') / 100 : 0.5;

      tex.offset.x = posX * (1 - tex.repeat.x);
      const invPosY = 1 - posY;
      tex.offset.y = invPosY * (1 - tex.repeat.y);

      return tex;
    }
    return null;
  }, [url, panel.bgSize, panel.bgPosition]);

  return (
    <mesh position={position} castShadow>
      {/* Box instead of Plane to give it thickness like a real canvas/poster board */}
      <boxGeometry args={[width, height, 0.02]} />
      {texture ? (
        <meshStandardMaterial map={texture} roughness={0.7} metalness={0.1} />
      ) : (
        <meshStandardMaterial color="#333333" roughness={0.7} />
      )}
    </mesh>
  );
}

function PosterAssembly({ panels }: { panels: Panel[] }) {
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
      const maxCol = Math.max(...panels.map((p) => p.gridCol ?? 0)) + 1;
      const maxRow = Math.max(...panels.map((p) => p.gridRow ?? 0)) + 1;
      const pW = (parseInt(firstPanel.width) || 60) * CSS_TO_M;
      const pH = (parseInt(firstPanel.height) || 90) * CSS_TO_M;
      const totalW = maxCol * pW + (maxCol - 1) * GAP;
      const totalH = maxRow * pH + (maxRow - 1) * GAP;

      return panels.map((panel, idx) => {
        const col = panel.gridCol ?? 0;
        const row = panel.gridRow ?? 0;
        const x = -totalW / 2 + col * (pW + GAP) + pW / 2;
        const y = totalH / 2 - row * (pH + GAP) - pH / 2;
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

  return <Center>{meshes}</Center>;
}

export function ThreeRoomFallback({ panels, onClose }: { panels: Panel[]; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[200] bg-charcoal flex flex-col">
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-5 py-4 bg-gradient-to-b from-charcoal/80 to-transparent pointer-events-none">
        <div>
          <p className="font-mono text-[10px] text-pearl uppercase tracking-widest">3D Preview</p>
          <p className="font-display text-bone text-lg">Virtual Room</p>
        </div>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-graphite border border-smoke flex items-center justify-center text-pearl hover:text-bone transition-colors pointer-events-auto"
          aria-label="Close 3D preview"
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

      <div className="flex-1 relative cursor-move">
        <Canvas camera={{ position: [0, 0, 2], fov: 45 }} shadows>
          <color attach="background" args={['#1a1a1a']} />
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} intensity={1} castShadow shadow-mapSize={1024} />

          <Suspense fallback={null}>
            <Environment preset="studio" />
            <group position={[0, 0.2, 0]}>
              <PosterAssembly panels={panels} />
            </group>

            {/* Wall */}
            <mesh position={[0, 0, -0.05]} receiveShadow>
              <planeGeometry args={[10, 10]} />
              <meshStandardMaterial color="#222222" roughness={0.9} />
            </mesh>

            <ContactShadows position={[0, -1, 0]} opacity={0.4} scale={5} blur={2} far={2} />
          </Suspense>

          <OrbitControls
            enablePan={false}
            minPolarAngle={Math.PI / 3}
            maxPolarAngle={Math.PI / 1.5}
            minAzimuthAngle={-Math.PI / 4}
            maxAzimuthAngle={Math.PI / 4}
            minDistance={1}
            maxDistance={4}
          />
        </Canvas>
      </div>

      <div className="absolute bottom-0 left-0 right-0 px-5 py-6 bg-gradient-to-t from-charcoal/90 to-transparent flex flex-col items-center gap-1 pointer-events-none">
        <p className="font-mono text-[10px] text-pearl/70 uppercase tracking-widest text-center">
          Drag to rotate · Scroll to zoom
        </p>
      </div>
    </div>
  );
}
