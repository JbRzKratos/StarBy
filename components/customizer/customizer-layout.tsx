'use client';

import React, { useEffect } from 'react';
import { useCustomizerStore } from '@/lib/stores/customizer-store';
import type { ProductType } from '@/lib/config/printSpecs';
import { FabricCanvas } from './fabric-canvas';
import { ControlPanel } from './control-panel';

interface CustomizerLayoutProps {
  productType: ProductType;
  productId: string;
  mockupImageSrc: string; // The base product image without any design
}

export function CustomizerLayout({
  productType,
  productId,
  mockupImageSrc: defaultMockupImageSrc,
}: CustomizerLayoutProps) {
  const { setProduct, reset, selectedColor, selectedSide } = useCustomizerStore();

  useEffect(() => {
    // Initialize the store for this product
    setProduct(productType, productId);

    return () => {
      // Clean up on unmount
      reset();
    };
  }, [productType, productId, setProduct, reset]);

  // Compute dynamic mockup src
  let finalMockupImageSrc = defaultMockupImageSrc;
  let requiresColorOverlay = false;
  let selectedHexColor = '';

  const colors: Record<string, string> = {
    Black: '#000000',
    White: '#FFFFFF',
    'Cornflower Blue': '#6495ED',
    'Light Pink': '#FFB6C1',
    'Olive Green': '#556B2F',
  };

  if (productType === 't-shirt' || productType === 'hoodie') {
    const prefix = productType === 'hoodie' ? 'hoodie' : 'tee';

    // Check if we have native images (black and white)
    if (selectedColor === 'Black' || selectedColor === 'White') {
      const colorKey = selectedColor.toLowerCase();
      finalMockupImageSrc = `/images/mockups/${prefix}-${colorKey}-${selectedSide}.png`;
    } else {
      // Fallback to white and use color overlay
      finalMockupImageSrc = `/images/mockups/${prefix}-white-${selectedSide}.png`;
      requiresColorOverlay = true;
      selectedHexColor = colors[selectedColor] || '#FFFFFF';
    }
  }

  return (
    <div className="flex flex-col lg:flex-row w-full min-h-screen pt-[80px] lg:pt-[100px] bg-[#0A0A0B] text-[#F5F1EA]">
      {/* Left: Mockup Viewer (Interactive Canvas Area) */}
      <div className="flex-1 relative flex items-center justify-center p-4 lg:p-8 border-b lg:border-b-0 lg:border-r border-[#F5F1EA]/10">
        <div
          className="relative w-full max-w-2xl aspect-square rounded-2xl overflow-hidden shadow-2xl transition-colors duration-300"
          style={{ backgroundColor: requiresColorOverlay ? selectedHexColor : '#121214' }}
        >
          {/* Base Mockup Image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={finalMockupImageSrc}
            alt={`Customize ${productType}`}
            className="absolute inset-0 w-full h-full object-contain select-none pointer-events-none transition-all duration-300"
            style={{ mixBlendMode: requiresColorOverlay ? 'multiply' : 'normal' }}
          />

          {/* Fabric Canvas Overlays - One for front, one for back to preserve state independently */}
          <div className={`absolute inset-0 z-10 ${selectedSide === 'front' ? 'block' : 'hidden'}`}>
            <FabricCanvas productType={productType} side="front" />
          </div>
          <div className={`absolute inset-0 z-10 ${selectedSide === 'back' ? 'block' : 'hidden'}`}>
            <FabricCanvas productType={productType} side="back" />
          </div>
        </div>
      </div>

      {/* Right: Control Panel */}
      <div className="w-full lg:w-[400px] xl:w-[450px] flex flex-col bg-[#121214]">
        <ControlPanel />
      </div>
    </div>
  );
}
