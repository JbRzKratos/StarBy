'use client';

import { useRef, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { useCustomizerStore } from '@/store/customizer';
import type { Product } from '@/data/products';
import { mugTemplates } from '@/data/mugTemplates';

interface Mug3DViewerProps {
  product: Product;
}

function MugModel({ product }: { product: Product }) {
  const mTemplate = mugTemplates[product.slug || product.id];
  const {
    uploadedImage,
    customText,
    customTextColor,
    customTextFont,
    mugLayout,
    isMagicMugRevealed,
  } = useCustomizerStore();

  const meshRef = useRef<THREE.Mesh>(null);
  const [canvasTex, setCanvasTex] = useState<THREE.CanvasTexture | null>(null);

  // Generate 2D Texture from uploadedImage & customText
  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fill background
    ctx.fillStyle = mTemplate?.isColorChanging && !isMagicMugRevealed ? '#111111' : '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const renderText = () => {
      if (customText) {
        ctx.font = `bold 60px ${customTextFont}`;
        ctx.fillStyle = customTextColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        // Draw in the center of the print area
        ctx.fillText(customText, canvas.width / 2, canvas.height / 2);
      }

      const texture = new THREE.CanvasTexture(canvas);
      texture.anisotropy = 16;
      texture.colorSpace = THREE.SRGBColorSpace;

      // Flip Y because Three.js uses different texture coordinates
      texture.flipY = false;
      setCanvasTex(texture);
    };

    if (uploadedImage && (!mTemplate?.isColorChanging || isMagicMugRevealed)) {
      const img = new Image();
      img.src = uploadedImage;
      img.onload = () => {
        // Simple mapping: if single-panel, draw in center. If full-wrap, stretch.
        if (mugLayout === 'single-panel') {
          // Draw smaller in the center
          const dw = canvas.width * 0.4;
          const dh = canvas.height * 0.6;
          const dx = (canvas.width - dw) / 2;
          const dy = (canvas.height - dh) / 2;
          ctx.drawImage(img, dx, dy, dw, dh);
        } else {
          // Full wrap
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        }
        renderText();
      };
    } else {
      renderText();
    }
  }, [
    uploadedImage,
    customText,
    customTextColor,
    customTextFont,
    mugLayout,
    isMagicMugRevealed,
    mTemplate,
  ]);

  if (!mTemplate || !mTemplate.dimensions3D) return null;

  const { radius, height, material, handleOffset, handleRadius, handleTube } =
    mTemplate.dimensions3D;

  // Material settings based on mug type
  const isGlass = material === 'glass';
  const isEnamel = material === 'enamel';
  const isMatte = material === 'matte';

  return (
    <group position={[0, -height / 2, 0]}>
      {/* Mug Body */}
      <mesh ref={meshRef} position={[0, height / 2, 0]} castShadow receiveShadow>
        {/* Radius top, Radius bottom, Height, RadialSegments, HeightSegments, OpenEnded */}
        <cylinderGeometry args={[radius, radius, height, 64, 1, false]} />
        <meshPhysicalMaterial
          map={canvasTex}
          roughness={isMatte ? 0.7 : isGlass ? 0.1 : 0.2}
          metalness={isEnamel ? 0.3 : 0.0}
          transmission={isGlass ? 0.9 : 0.0}
          thickness={isGlass ? 0.2 : 0}
          clearcoat={isEnamel || isGlass ? 0 : 0.5}
          clearcoatRoughness={0.1}
          side={isGlass ? THREE.DoubleSide : THREE.FrontSide}
        />
      </mesh>

      {/* Inner Mug Body (if not glass, to simulate thickness) */}
      {!isGlass && (
        <mesh position={[0, height / 2, 0]}>
          <cylinderGeometry args={[radius - 0.05, radius - 0.05, height + 0.01, 64, 1, false]} />
          <meshPhysicalMaterial color="#ffffff" roughness={0.2} side={THREE.BackSide} />
        </mesh>
      )}

      {/* Mug Handle */}
      {handleRadius > 0.1 && (
        <mesh
          position={[handleOffset[0], height / 2 + handleOffset[1], handleOffset[2]]}
          castShadow
          receiveShadow
        >
          <torusGeometry args={[handleRadius, handleTube, 16, 64]} />
          <meshPhysicalMaterial
            color={mTemplate?.isColorChanging && !isMagicMugRevealed ? '#111111' : '#ffffff'}
            roughness={isMatte ? 0.7 : isGlass ? 0.1 : 0.2}
            metalness={isEnamel ? 0.3 : 0.0}
            transmission={isGlass ? 0.9 : 0.0}
            thickness={isGlass ? 0.2 : 0}
            clearcoat={isEnamel || isGlass ? 0 : 0.5}
            clearcoatRoughness={0.1}
          />
        </mesh>
      )}
    </group>
  );
}

export function Mug3DViewer({ product }: Mug3DViewerProps) {
  return (
    <div className="w-full h-full relative bg-charcoal/50 rounded-2xl overflow-hidden cursor-move">
      <Canvas shadows camera={{ position: [0, 2, 5], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} castShadow shadow-mapSize={1024} />
        <directionalLight position={[-5, 5, -5]} intensity={0.5} />

        <MugModel product={product} />

        <Environment preset="city" />
        <ContactShadows position={[0, -0.01, 0]} opacity={0.5} scale={10} blur={2} far={4} />

        <OrbitControls
          enablePan={false}
          enableZoom={true}
          minDistance={3}
          maxDistance={8}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 1.5}
          autoRotate
          autoRotateSpeed={1.5}
        />
      </Canvas>
      <div className="absolute bottom-4 right-4 bg-charcoal/80 backdrop-blur text-bone font-mono text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-full z-10 flex items-center gap-2">
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M2 12a10 10 0 1 0 20 0 10 10 0 1 0-20 0"></path>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
          <path d="M2 12h20"></path>
        </svg>
        Drag to rotate
      </div>
    </div>
  );
}
