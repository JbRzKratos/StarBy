'use client';

import type { ChangeEvent } from 'react';
import { useRef, useMemo } from 'react';
import { useSkinCustomizerStore } from '@/lib/stores/skin-customizer-store';
import {
  deviceTemplates,
  getUniqueBrands,
  getModelsByBrand,
  getVariantsByModel,
} from '@/data/device-templates';
import type { DevicePanel } from '@/data/device-templates';
import type { SkinCanvasHandle } from './skin-canvas';
import { SkinCanvas } from './skin-canvas';

export function SkinCustomizerMobile() {
  const canvasRef = useRef<SkinCanvasHandle>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    deviceType,
    brand,
    model,
    variant,
    designImage,
    setDevice,
    setDesignImage,
    updateTransform,
  } = useSkinCustomizerStore();

  const selectedTemplate = useMemo(() => {
    if (!deviceType || !brand || !model || !variant) return null;
    return deviceTemplates.find(
      (t) =>
        t.deviceType === deviceType &&
        t.brand === brand &&
        t.model === model &&
        t.variant === variant,
    );
  }, [deviceType, brand, model, variant]);

  const brands = deviceType ? getUniqueBrands(deviceType) : [];
  const models = brand ? getModelsByBrand(brand) : [];
  const variants = model ? getVariantsByModel(model) : [];

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setDesignImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col gap-8 w-full">
      <div className="text-center">
        <h1 className="font-display text-3xl text-bone mb-2">Skin Customizer</h1>
      </div>

      {/* Canvas Area */}
      <div className="w-full h-[50vh] relative bg-[#0E0E0F] border border-smoke/30 rounded-2xl p-4 flex flex-col items-center justify-center overflow-hidden">
        {!selectedTemplate ? (
          <div className="text-center p-4">
            <p className="font-mono text-ash text-sm">Select a device below to start designing.</p>
          </div>
        ) : (
          <div className="w-full h-full relative">
            <SkinCanvas
              ref={canvasRef}
              template={selectedTemplate}
              panel={selectedTemplate.panels[0] as DevicePanel}
              designImageUrl={designImage}
              onTransformChange={updateTransform}
            />
          </div>
        )}
      </div>

      {/* Controls Stack */}
      <div className="flex flex-col gap-6">
        {/* Device Type */}
        <div className="flex flex-col gap-2">
          <label className="font-mono text-xs uppercase tracking-widest text-ash font-bold">
            1. Type
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setDevice('phone', null, null, null)}
              className={`flex-1 py-3 font-mono text-xs uppercase tracking-wider font-bold transition-all border ${
                deviceType === 'phone'
                  ? 'bg-[#ED9518] text-[#0A0A0A] border-[#ED9518]'
                  : 'bg-transparent text-bone border-smoke'
              }`}
            >
              Phone
            </button>
            <button
              onClick={() => setDevice('laptop', null, null, null)}
              className={`flex-1 py-3 font-mono text-xs uppercase tracking-wider font-bold transition-all border ${
                deviceType === 'laptop'
                  ? 'bg-[#ED9518] text-[#0A0A0A] border-[#ED9518]'
                  : 'bg-transparent text-bone border-smoke'
              }`}
            >
              Laptop
            </button>
          </div>
        </div>

        {/* Device Selectors */}
        {deviceType && (
          <div className="flex flex-col gap-3">
            <label className="font-mono text-xs uppercase tracking-widest text-ash font-bold">
              2. Model
            </label>
            <select
              value={brand || ''}
              onChange={(e) => setDevice(deviceType, e.target.value, null, null)}
              className="w-full bg-graphite border border-smoke text-bone py-3 px-4 font-mono text-sm focus:outline-none"
            >
              <option value="" disabled>
                Select Brand
              </option>
              {brands.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
            <select
              value={model || ''}
              onChange={(e) => setDevice(deviceType, brand, e.target.value, null)}
              disabled={!brand}
              className="w-full bg-graphite border border-smoke text-bone py-3 px-4 font-mono text-sm focus:outline-none disabled:opacity-50"
            >
              <option value="" disabled>
                Select Model
              </option>
              {models.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <select
              value={variant || ''}
              onChange={(e) => setDevice(deviceType, brand, model, e.target.value)}
              disabled={!model}
              className="w-full bg-graphite border border-smoke text-bone py-3 px-4 font-mono text-sm focus:outline-none disabled:opacity-50"
            >
              <option value="" disabled>
                Select Variant
              </option>
              {variants.map((v) => (
                <option key={v.variant} value={v.variant}>
                  {v.variant}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Device Dimensions Display */}
        {selectedTemplate?.dimensions && !selectedTemplate.dimensions.conflicting && (
          <div className="pt-1">
            <p className="font-mono text-[10px] text-ash tracking-wide uppercase text-center">
              H {selectedTemplate.dimensions.heightMm}mm × W {selectedTemplate.dimensions.widthMm}mm
              × D {selectedTemplate.dimensions.thicknessMm}mm
            </p>
          </div>
        )}

        {process.env.NODE_ENV !== 'production' &&
          selectedTemplate &&
          !selectedTemplate.sourceVerified && (
            <div className="bg-red-500/10 border border-red-500/50 p-3 rounded">
              <p className="font-mono text-[10px] text-red-200 uppercase tracking-widest text-center">
                ⚠ Unverified Template (Admin Only)
              </p>
            </div>
          )}

        {/* Upload Button */}
        <div
          className={`flex flex-col gap-3 transition-opacity mt-4 ${!selectedTemplate ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}
        >
          <input
            type="file"
            accept="image/png, image/jpeg, image/svg+xml"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={!selectedTemplate}
            className="w-full py-4 bg-bone text-[#0A0A0A] font-mono text-sm font-bold uppercase tracking-widest"
          >
            {designImage ? 'Change Image' : 'Upload Image'}
          </button>
        </div>
      </div>
    </div>
  );
}
