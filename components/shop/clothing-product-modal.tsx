'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import {
  useClothingProductModalState,
  isBackPlacement,
  getPlacementRegion,
  type ClothingProductModalProps,
} from './clothing-product-modal.shared';
import { ClothingProductModalDesktop } from './clothing-product-modal.desktop';
import { ClothingProductModalMobile } from './clothing-product-modal.mobile';
import { useDevice } from '@/lib/providers/device-provider';

export { isBackPlacement, getPlacementRegion };
export type { ClothingProductModalProps };

export function ClothingProductModal(props: ClothingProductModalProps) {
  const state = useClothingProductModalState(props);
  const device = useDevice();

  if (!state.mounted || !state.design) return null;

  return createPortal(
    device === 'desktop' ? (
      <ClothingProductModalDesktop state={state} />
    ) : (
      <ClothingProductModalMobile state={state} />
    ),
    document.body
  );
}
