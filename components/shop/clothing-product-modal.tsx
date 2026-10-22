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
    <>
      {device === 'desktop' ? (
        <ClothingProductModalDesktop state={state} />
      ) : (
        <ClothingProductModalMobile state={state} />
      )}
      {state.lockedPlacementNotice && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100020] w-[min(92vw,560px)] rounded-2xl border border-amber-400/40 bg-[#15120a]/95 px-4 py-3 text-left shadow-2xl backdrop-blur-xl animate-fadeIn"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-start gap-3">
            <span className="mt-0.5 text-lg" aria-hidden="true">🔒</span>
            <div className="space-y-1.5">
              <p className="font-mono text-[11px] leading-relaxed text-amber-100/90">
                {state.lockedPlacementNotice}
              </p>
              <a
                href="/customize/clothing-mockup"
                onClick={state.onClose}
                className="inline-flex font-mono text-[10px] font-bold uppercase tracking-wider text-amber-300 underline underline-offset-4 hover:text-amber-200"
              >
                Open custom 3D Studio →
              </a>
            </div>
          </div>
        </div>
      )}
    </>,
    document.body
  );
}
