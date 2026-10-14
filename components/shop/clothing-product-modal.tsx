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

export { isBackPlacement, getPlacementRegion };
export type { ClothingProductModalProps };

export function ClothingProductModal(props: ClothingProductModalProps) {
  const state = useClothingProductModalState(props);

  if (!state.mounted || !state.design) return null;

  return createPortal(
    <>
      <div className="hidden md:block">
        <ClothingProductModalDesktop state={state} />
      </div>
      <div className="block md:hidden">
        <ClothingProductModalMobile state={state} />
      </div>
    </>,
    document.body
  );
}
