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

export function SkinCustomizerDesktop() {
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

  const handleDeviceTypeSelect = (type: 'phone' | 'laptop') => {
    setDevice(type, null, null, null);
  };

  return (
    <div className="flex gap-12 w-full h-[80vh]">
      {/* LEFT: Controls & Selection */}
      <div className="w-1/3 flex flex-col gap-8 h-full overflow-y-auto pr-4 custom-scrollbar">
        <div>
          <h1 className="font-display text-4xl text-bone mb-2">Skin Customizer</h1>
          <p className="font-mono text-sm text-pearl">
            Design a high-precision skin for your device.
          </p>
        </div>

        {/* 1. Device Type Selection */}
        <div className="flex flex-col gap-3">
          <label className="font-mono text-xs uppercase tracking-widest text-ash font-bold">
            1. Select Device Type
          </label>
          <div className="flex gap-4">
            <button
              onClick={() => handleDeviceTypeSelect('phone')}
              className={`flex-1 py-4 font-mono text-sm uppercase tracking-wider font-bold transition-all border ${
                deviceType === 'phone'
                  ? 'bg-[#ED9518] text-[#0A0A0A] border-[#ED9518]'
                  : 'bg-transparent text-bone border-smoke hover:border-bone'
              }`}
            >
              Phone
            </button>
            <button
              onClick={() => handleDeviceTypeSelect('laptop')}
              className={`flex-1 py-4 font-mono text-sm uppercase tracking-wider font-bold transition-all border ${
                deviceType === 'laptop'
                  ? 'bg-[#ED9518] text-[#0A0A0A] border-[#ED9518]'
                  : 'bg-transparent text-bone border-smoke hover:border-bone'
              }`}
            >
              Laptop
            </button>
          </div>
        </div>

        {/* 2. Device Details Selection */}
        {deviceType && (
          <div className="flex flex-col gap-4">
            <label className="font-mono text-xs uppercase tracking-widest text-ash font-bold">
              2. Select Your Model
            </label>

            <select
              value={brand || ''}
              onChange={(e) => setDevice(deviceType, e.target.value, null, null)}
              className="w-full bg-graphite border border-smoke text-bone py-3 px-4 rounded-none font-mono text-sm focus:outline-none focus:border-[#ED9518]"
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
              className="w-full bg-graphite border border-smoke text-bone py-3 px-4 rounded-none font-mono text-sm focus:outline-none focus:border-[#ED9518] disabled:opacity-50"
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
              className="w-full bg-graphite border border-smoke text-bone py-3 px-4 rounded-none font-mono text-sm focus:outline-none focus:border-[#ED9518] disabled:opacity-50"
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
          <div className="pt-2">
            <p className="font-mono text-[11px] text-ash tracking-wide uppercase">
              H {selectedTemplate.dimensions.heightMm}mm × W {selectedTemplate.dimensions.widthMm}mm
              × D {selectedTemplate.dimensions.thicknessMm}mm
            </p>
          </div>
        )}

        {/* Admin Warning for Unverified Templates */}
        {process.env.NODE_ENV !== 'production' &&
          selectedTemplate &&
          !selectedTemplate.sourceVerified && (
            <div className="bg-red-500/10 border border-red-500/50 p-4 rounded flex items-start gap-3">
              <span className="text-red-500 text-xl leading-none">⚠</span>
              <p className="font-mono text-xs text-red-200">
                <strong>Admin Warning:</strong> This device template is unverified. Cutouts may not
                align with the physical device. Do not use in production until verified.
              </p>
            </div>
          )}

        {/* 3. Upload & Design (Locked until template selected) */}
        <div
          className={`flex flex-col gap-4 transition-opacity ${!selectedTemplate ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}
        >
          <label className="font-mono text-xs uppercase tracking-widest text-ash font-bold">
            3. Upload Design
          </label>
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
            className="w-full py-4 bg-bone text-[#0A0A0A] font-mono text-sm font-bold uppercase tracking-widest hover:bg-[#ED9518] transition-colors"
          >
            {designImage ? 'Change Image' : 'Upload Image'}
          </button>
          {designImage && (
            <p className="font-mono text-xs text-pearl">
              You can drag, scale, and rotate the image directly on the device preview.
            </p>
          )}
        </div>
      </div>

      {/* RIGHT: Canvas Canvas */}
      <div className="w-2/3 h-full relative bg-[#0E0E0F] border border-smoke/30 rounded-2xl p-8 flex flex-col items-center justify-center">
        {!selectedTemplate ? (
          <div className="text-center">
            <p className="font-mono text-ash text-sm">
              Please select a device to view the template.
            </p>
          </div>
        ) : (
          <div className="w-full h-full relative">
            <SkinCanvas
              ref={canvasRef}
              template={selectedTemplate}
              panel={selectedTemplate.panels[0] as DevicePanel} // V1 only supports back/lid (index 0)
              designImageUrl={designImage}
              onTransformChange={updateTransform}
            />
          </div>
        )}
      </div>
    </div>
  );
}
