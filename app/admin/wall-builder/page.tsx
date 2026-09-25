'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Save,
  Plus,
  Trash2,
  Copy,
  Layers,
  Move,
  Sliders,
  RefreshCw,
  Layout,
  Grid,
} from 'lucide-react';
import { FREGORO_LAYOUTS } from '@/lib/wall-studio/layouts-data';
import type {
  WallLayout,
  WallSlot,
  PosterSize,
  Orientation,
  SlotType,
  WallSplitGroup,
} from '@/lib/wall-studio/types';

export default function AdminWallBuilderPage() {
  const [layouts, setLayouts] = useState<WallLayout[]>(FREGORO_LAYOUTS);
  const [selectedLayoutId, setSelectedLayoutId] = useState<string>(FREGORO_LAYOUTS[4].id); // Stepped Hero
  const [activeLayout, setActiveLayout] = useState<WallLayout>(
    JSON.parse(JSON.stringify(FREGORO_LAYOUTS[4])),
  );
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'canvas' | 'meta' | 'split-groups'>('canvas');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState(true);

  const canvasRef = useRef<HTMLDivElement>(null);

  // Load existing layouts from server if available
  useEffect(() => {
    async function fetchLayouts() {
      try {
        const res = await fetch('/api/wall-studio/layouts');
        const data = await res.json();
        if (data.success && Array.isArray(data.layouts) && data.layouts.length > 0) {
          setLayouts(data.layouts);
        }
      } catch (err) {
        console.warn('Could not load layouts from server, using local data', err);
      }
    }
    fetchLayouts();
  }, []);

  // When changing layout selection in dropdown
  const handleSelectLayout = (id: string) => {
    const found = layouts.find((l) => l.id === id);
    if (found) {
      setSelectedLayoutId(id);
      setActiveLayout(JSON.parse(JSON.stringify(found)));
      setSelectedSlotId(null);
    }
  };

  // Create new layout from scratch
  const handleCreateNewLayout = () => {
    const newId = `layout-${Date.now()}`;
    const newLayout: WallLayout = {
      id: newId,
      name: 'Custom Curated Wall',
      slug: `custom-wall-${Date.now().toString(36)}`,
      description: 'Original wall composition designed with professional visual balance.',
      wallWidthMm: 1600,
      wallHeightMm: 1050,
      coverageLabel: '160 × 105 cm',
      physicalPrintCount: 5,
      logicalArtworkCount: 5,
      basePrice: 699,
      compareAtPrice: 1099,
      badge: 'NEW',
      recommendedRoom: 'Living Room',
      recommendedWallWidth: '1.8m – 2.5m',
      recommendedThemes: ['Gaming', 'Cars', 'Marvel'],
      version: 1,
      published: true,
      splitGroups: [],
      slots: [
        {
          id: `slot-${newId}-1`,
          slotType: 'hero',
          x: 0.35,
          y: 0.2,
          width: 0.3,
          height: 0.6,
          rotation: 0,
          size: 'A3',
          orientation: 'portrait',
          required: true,
          physicalWidthMm: 297,
          physicalHeightMm: 420,
        },
        {
          id: `slot-${newId}-2`,
          slotType: 'support',
          x: 0.12,
          y: 0.25,
          width: 0.18,
          height: 0.36,
          rotation: 0,
          size: 'A4',
          orientation: 'portrait',
          required: false,
          physicalWidthMm: 210,
          physicalHeightMm: 297,
        },
        {
          id: `slot-${newId}-3`,
          slotType: 'support',
          x: 0.7,
          y: 0.25,
          width: 0.18,
          height: 0.36,
          rotation: 0,
          size: 'A4',
          orientation: 'portrait',
          required: false,
          physicalWidthMm: 210,
          physicalHeightMm: 297,
        },
      ],
    };
    setLayouts((prev) => [newLayout, ...prev]);
    setSelectedLayoutId(newId);
    setActiveLayout(newLayout);
    setSelectedSlotId(newLayout.slots[0].id);
  };

  // Duplicate current layout
  const handleDuplicateLayout = () => {
    const copy: WallLayout = JSON.parse(JSON.stringify(activeLayout));
    copy.id = `layout-${Date.now()}`;
    copy.name = `${copy.name} (Copy)`;
    copy.slug = `${copy.slug}-copy-${Date.now().toString(36)}`;
    copy.version = 1;
    setLayouts((prev) => [copy, ...prev]);
    setSelectedLayoutId(copy.id);
    setActiveLayout(copy);
  };

  // Selected slot object
  const selectedSlot = activeLayout.slots.find((s) => s.id === selectedSlotId);

  // Update selected slot property
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateSelectedSlot = (field: keyof WallSlot, value: any) => {
    if (!selectedSlotId) return;
    setActiveLayout((prev) => {
      const updatedSlots = prev.slots.map((s) => {
        if (s.id === selectedSlotId) {
          return { ...s, [field]: value };
        }
        return s;
      });
      return { ...prev, slots: updatedSlots };
    });
  };

  // Add new slot to canvas
  const handleAddSlot = () => {
    const newSlotId = `slot-${Date.now()}`;
    const newSlot: WallSlot = {
      id: newSlotId,
      slotType: 'support',
      x: 0.4,
      y: 0.4,
      width: 0.15,
      height: 0.3,
      rotation: 0,
      size: 'A4',
      orientation: 'portrait',
      required: false,
      physicalWidthMm: 210,
      physicalHeightMm: 297,
    };
    setActiveLayout((prev) => ({
      ...prev,
      slots: [...prev.slots, newSlot],
      physicalPrintCount: prev.slots.length + 1,
    }));
    setSelectedSlotId(newSlotId);
  };

  // Delete selected slot
  const handleDeleteSlot = (id: string) => {
    setActiveLayout((prev) => {
      const filtered = prev.slots.filter((s) => s.id !== id);
      return {
        ...prev,
        slots: filtered,
        physicalPrintCount: filtered.length,
      };
    });
    if (selectedSlotId === id) setSelectedSlotId(null);
  };

  // Auto-generate split group panels
  const handleAutoGenerateSplitGroup = (panelCount: 3 | 5) => {
    const groupId = `split_${Date.now()}`;
    const panelWidth = 0.6 / panelCount;
    const startX = 0.2;
    const baseY = 0.25;
    const panelHeight = 0.5;

    const newSlots: WallSlot[] = [];
    for (let i = 0; i < panelCount; i++) {
      // Create slight stepped stagger if 5 panel
      const stepOffset = panelCount === 5 ? (i === 2 ? -0.04 : i === 1 || i === 3 ? -0.02 : 0) : 0;
      newSlots.push({
        id: `split-${groupId}-${i}`,
        slotType: 'hero-panel',
        splitGroupId: groupId,
        panelIndex: i,
        size: 'A3',
        orientation: 'portrait',
        x: Number((startX + i * (panelWidth + 0.008)).toFixed(3)),
        y: Number((baseY + stepOffset).toFixed(3)),
        width: Number(panelWidth.toFixed(3)),
        height: Number(panelHeight.toFixed(3)),
        rotation: 0,
        required: true,
        physicalWidthMm: 297,
        physicalHeightMm: 420,
      });
    }

    const newSplitGroup: WallSplitGroup = {
      splitGroupId: groupId,
      id: groupId,
      name: `${panelCount}-Piece Center Hero`,
      panelCount,
      orientation: 'landscape',
      physicalSize: 'A3',
      aspectRatio: (panelWidth * panelCount) / panelHeight,
      slotIds: newSlots.map((s) => s.id),
      stepOffsetMm: panelCount === 5 ? 20 : 0,
    };

    setActiveLayout((prev) => ({
      ...prev,
      slots: [...prev.slots, ...newSlots],
      splitGroups: [...(prev.splitGroups || []), newSplitGroup],
      physicalPrintCount: prev.slots.length + panelCount,
    }));
    setSelectedSlotId(newSlots[0].id);
  };

  // Save to database & publish new version
  const handleSaveLayout = async () => {
    setIsSaving(true);
    setSaveStatus(null);
    try {
      // Recalculate physical and logical counts
      const splitGroupSet = new Set(
        activeLayout.slots.filter((s) => s.splitGroupId).map((s) => s.splitGroupId),
      );
      const nonSplitCount = activeLayout.slots.filter((s) => !s.splitGroupId).length;
      const logicalCount = nonSplitCount + splitGroupSet.size;

      const payload = {
        ...activeLayout,
        physicalPrintCount: activeLayout.slots.length,
        logicalArtworkCount: logicalCount,
        coverageLabel: `${Math.round(activeLayout.wallWidthMm / 10)} × ${Math.round(activeLayout.wallHeightMm / 10)} cm`,
      };

      const res = await fetch('/api/wall-studio/layouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setSaveStatus(`Saved successfully! Version updated to v${data.layout.version}.`);
        setActiveLayout(data.layout);
        setLayouts((prev) => prev.map((l) => (l.id === data.layout.id ? data.layout : l)));
        setTimeout(() => setSaveStatus(null), 4000);
      } else {
        setSaveStatus(`Error saving: ${data.message}`);
      }
    } catch (err) {
      setSaveStatus(`Network error while saving layout: ${String(err)}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans pb-16">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-bone font-mono tracking-tight flex items-center gap-2">
              <Layout className="text-[#3B5EFF]" size={24} />
              ADMIN WALL LAYOUT BUILDER
            </h1>
            <span className="px-2 py-0.5 rounded bg-[#3B5EFF]/20 border border-[#3B5EFF]/30 text-[#3B5EFF] text-xs font-mono font-bold">
              v{activeLayout.version}
            </span>
          </div>
          <p className="text-xs text-ash/70 font-mono mt-1">
            Data-driven visual composition designer. Configure normalized coordinates, mixed sizes,
            and multi-panel split groups.
          </p>
        </div>

        {/* Layout Switcher & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={selectedLayoutId}
            onChange={(e) => handleSelectLayout(e.target.value)}
            className="text-xs bg-[#1A1A1E] border border-white/20 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:ring-1 focus:ring-[#3B5EFF]"
          >
            {layouts.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name} ({l.physicalPrintCount} Prints · v{l.version})
              </option>
            ))}
          </select>

          <button
            onClick={handleCreateNewLayout}
            className="px-3 py-2 bg-white/10 hover:bg-white/15 text-white text-xs font-mono rounded-lg transition-colors inline-flex items-center gap-1.5"
            title="Create a fresh layout from scratch"
          >
            <Plus size={14} /> New Layout
          </button>

          <button
            onClick={handleDuplicateLayout}
            className="px-3 py-2 bg-white/10 hover:bg-white/15 text-white text-xs font-mono rounded-lg transition-colors inline-flex items-center gap-1.5"
            title="Duplicate layout to fork or create a variant"
          >
            <Copy size={14} /> Duplicate
          </button>

          <button
            onClick={handleSaveLayout}
            disabled={isSaving}
            className="px-4 py-2 bg-[#3B5EFF] hover:bg-[#2d4de0] text-white text-xs font-mono font-bold rounded-lg transition-colors inline-flex items-center gap-2 shadow-lg shadow-[#3B5EFF]/20 disabled:opacity-50"
          >
            {isSaving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
            Publish Version
          </button>
        </div>
      </div>

      {/* Save Notification */}
      {saveStatus && (
        <div className="p-3 bg-[#3B5EFF]/15 border border-[#3B5EFF]/30 rounded-lg text-xs font-mono text-white flex items-center justify-between">
          <span>{saveStatus}</span>
          <button onClick={() => setSaveStatus(null)} className="text-white/60 hover:text-white">
            ×
          </button>
        </div>
      )}

      {/* Mode Sub-tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2">
        <button
          onClick={() => setActiveTab('canvas')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors inline-flex items-center gap-1.5 ${
            activeTab === 'canvas' ? 'bg-[#3B5EFF] text-white' : 'text-ash hover:text-white'
          }`}
        >
          <Move size={14} /> Visual Canvas & Slots ({activeLayout.slots.length})
        </button>
        <button
          onClick={() => setActiveTab('split-groups')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors inline-flex items-center gap-1.5 ${
            activeTab === 'split-groups' ? 'bg-[#3B5EFF] text-white' : 'text-ash hover:text-white'
          }`}
        >
          <Layers size={14} /> Split Groups ({(activeLayout.splitGroups || []).length})
        </button>
        <button
          onClick={() => setActiveTab('meta')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors inline-flex items-center gap-1.5 ${
            activeTab === 'meta' ? 'bg-[#3B5EFF] text-white' : 'text-ash hover:text-white'
          }`}
        >
          <Sliders size={14} /> Layout Metadata & Pricing
        </button>
      </div>

      {/* TAB 1: VISUAL CANVAS & SLOTS */}
      {activeTab === 'canvas' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Visual Canvas (8 cols) */}
          <div className="lg:col-span-8 space-y-3">
            <div className="flex items-center justify-between text-xs text-ash/80 font-mono">
              <span>
                Wall: {activeLayout.wallWidthMm} × {activeLayout.wallHeightMm} mm (
                {activeLayout.coverageLabel})
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowGrid(!showGrid)}
                  className={`text-xs inline-flex items-center gap-1 hover:text-white ${
                    showGrid ? 'text-[#3B5EFF]' : 'text-ash/60'
                  }`}
                >
                  <Grid size={13} /> Grid
                </button>
                <button
                  onClick={handleAddSlot}
                  className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-xs inline-flex items-center gap-1"
                >
                  <Plus size={13} /> Add Slot
                </button>
              </div>
            </div>

            {/* The Wall Canvas Frame */}
            <div
              ref={canvasRef}
              className="relative w-full aspect-[16/10] bg-[#16161B] rounded-2xl border-2 border-white/10 overflow-hidden shadow-2xl p-6 select-none"
              style={{
                backgroundImage: showGrid
                  ? 'radial-gradient(rgba(255,255,255,0.08) 1px, transparent 0)'
                  : undefined,
                backgroundSize: '24px 24px',
              }}
              onClick={() => setSelectedSlotId(null)}
            >
              {/* Center Crosshairs */}
              {showGrid && (
                <>
                  <div className="absolute top-0 bottom-0 left-1/2 w-px bg-white/5 pointer-events-none" />
                  <div className="absolute left-0 right-0 top-1/2 h-px bg-white/5 pointer-events-none" />
                </>
              )}

              {/* Render Every Slot */}
              {activeLayout.slots.map((slot, index) => {
                const isSelected = slot.id === selectedSlotId;
                const isHero = slot.slotType === 'hero' || slot.slotType === 'hero-panel';

                return (
                  <div
                    key={slot.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedSlotId(slot.id);
                    }}
                    style={{
                      left: `${slot.x * 100}%`,
                      top: `${slot.y * 100}%`,
                      width: `${slot.width * 100}%`,
                      height: `${slot.height * 100}%`,
                      transform: slot.rotation ? `rotate(${slot.rotation}deg)` : undefined,
                    }}
                    className={`absolute rounded transition-all flex flex-col items-center justify-between p-1.5 cursor-pointer shadow-md ${
                      isSelected
                        ? 'border-2 border-[#3B5EFF] bg-[#3B5EFF]/25 z-30 shadow-[#3B5EFF]/40'
                        : isHero
                          ? 'border border-amber-400/50 bg-amber-400/10 hover:border-amber-400 z-20'
                          : 'border border-white/20 bg-black/40 hover:border-white/50 z-10'
                    }`}
                  >
                    {/* Top Slot Header */}
                    <div className="w-full flex items-center justify-between text-[9px] font-mono leading-none">
                      <span className="font-bold text-white/90">#{index + 1}</span>
                      <span className="px-1 py-0.5 rounded bg-black/60 text-white/80 font-bold">
                        {slot.size}
                      </span>
                    </div>

                    {/* Slot Role Center Indicator */}
                    <div className="text-center font-mono text-[10px] text-white/80 uppercase tracking-wider">
                      {slot.splitGroupId ? (
                        <span className="text-[#3B5EFF] font-bold">
                          Split {(slot.panelIndex ?? 0) + 1}
                        </span>
                      ) : isHero ? (
                        <span className="text-amber-300 font-bold">Hero</span>
                      ) : (
                        <span>{slot.slotType}</span>
                      )}
                    </div>

                    {/* Bottom Details */}
                    <div className="text-[8px] font-mono text-white/40 truncate w-full text-center">
                      {Math.round(slot.x * 100)}%, {Math.round(slot.y * 100)}%
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Slot Inspector / Coordinates Controls (4 cols) */}
          <div className="lg:col-span-4 bg-[#141418] border border-white/10 rounded-2xl p-5 space-y-5 font-mono text-xs shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Sliders size={14} className="text-[#3B5EFF]" />
                {selectedSlot
                  ? `Slot Inspector: #${activeLayout.slots.findIndex((s) => s.id === selectedSlot.id) + 1}`
                  : 'Slot Inspector'}
              </h3>
              {selectedSlot && (
                <button
                  onClick={() => handleDeleteSlot(selectedSlot.id)}
                  className="text-rose-400 hover:text-rose-300 transition-colors p-1"
                  title="Delete Slot"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>

            {selectedSlot ? (
              <div className="space-y-4">
                {/* Physical Size & Orientation */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-ash/70 uppercase block mb-1">
                      Print Size
                    </label>
                    <select
                      value={selectedSlot.size}
                      onChange={(e) => updateSelectedSlot('size', e.target.value as PosterSize)}
                      className="w-full bg-[#1F1F24] border border-white/15 rounded-lg px-2.5 py-1.5 text-white"
                    >
                      <option value="A3">A3 (297×420 mm)</option>
                      <option value="A4">A4 (210×297 mm)</option>
                      <option value="A5">A5 (148×210 mm)</option>
                      <option value="A6">A6 (105×148 mm)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-ash/70 uppercase block mb-1">
                      Orientation
                    </label>
                    <select
                      value={selectedSlot.orientation}
                      onChange={(e) =>
                        updateSelectedSlot('orientation', e.target.value as Orientation)
                      }
                      className="w-full bg-[#1F1F24] border border-white/15 rounded-lg px-2.5 py-1.5 text-white"
                    >
                      <option value="portrait">Portrait</option>
                      <option value="landscape">Landscape</option>
                      <option value="square">Square</option>
                    </select>
                  </div>
                </div>

                {/* Role / Slot Type */}
                <div>
                  <label className="text-[10px] text-ash/70 uppercase block mb-1">Slot Role</label>
                  <select
                    value={selectedSlot.slotType}
                    onChange={(e) => updateSelectedSlot('slotType', e.target.value as SlotType)}
                    className="w-full bg-[#1F1F24] border border-white/15 rounded-lg px-2.5 py-1.5 text-white"
                  >
                    <option value="hero">Hero Artwork (Central Dominant)</option>
                    <option value="hero-panel">Hero Split Panel</option>
                    <option value="support">Supporting Art</option>
                    <option value="accent">Accent / Graphic</option>
                    <option value="quote">Quote / Typography</option>
                    <option value="portrait">Character Portrait</option>
                    <option value="landscape">Cinematic Landscape</option>
                  </select>
                </div>

                {/* Coordinates Sliders & Inputs */}
                <div className="space-y-3 bg-black/40 p-3.5 rounded-xl border border-white/5">
                  <span className="text-[10px] uppercase text-ash/60 font-bold block">
                    Normalized Coordinates (0.00 – 1.00)
                  </span>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span>X Position:</span>
                      <span className="font-bold text-white">{selectedSlot.x.toFixed(3)}</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={0.9}
                      step={0.005}
                      value={selectedSlot.x}
                      onChange={(e) => updateSelectedSlot('x', parseFloat(e.target.value))}
                      className="w-full accent-[#3B5EFF]"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span>Y Position:</span>
                      <span className="font-bold text-white">{selectedSlot.y.toFixed(3)}</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={0.9}
                      step={0.005}
                      value={selectedSlot.y}
                      onChange={(e) => updateSelectedSlot('y', parseFloat(e.target.value))}
                      className="w-full accent-[#3B5EFF]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <span className="text-[10px] text-ash/70 block mb-0.5">Width:</span>
                      <input
                        type="number"
                        min={0.05}
                        max={0.8}
                        step={0.01}
                        value={selectedSlot.width}
                        onChange={(e) => updateSelectedSlot('width', parseFloat(e.target.value))}
                        className="w-full bg-[#1F1F24] border border-white/10 rounded px-2 py-1 text-white"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-ash/70 block mb-0.5">Height:</span>
                      <input
                        type="number"
                        min={0.05}
                        max={0.8}
                        step={0.01}
                        value={selectedSlot.height}
                        onChange={(e) => updateSelectedSlot('height', parseFloat(e.target.value))}
                        className="w-full bg-[#1F1F24] border border-white/10 rounded px-2 py-1 text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Quick Alignment Actions */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() =>
                      updateSelectedSlot('x', Number(((1 - selectedSlot.width) / 2).toFixed(3)))
                    }
                    className="p-2 bg-white/5 hover:bg-white/10 rounded text-[11px] text-ash/90 text-center transition-colors"
                  >
                    Center Horizontally
                  </button>
                  <button
                    onClick={() =>
                      updateSelectedSlot('y', Number(((1 - selectedSlot.height) / 2).toFixed(3)))
                    }
                    className="p-2 bg-white/5 hover:bg-white/10 rounded text-[11px] text-ash/90 text-center transition-colors"
                  >
                    Center Vertically
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-ash/60 space-y-2">
                <Move className="mx-auto text-ash/40" size={24} />
                <p>
                  Click on any slot on the wall canvas to inspect and edit its physical properties.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: SPLIT GROUPS BUILDER */}
      {activeTab === 'split-groups' && (
        <div className="bg-[#141418] border border-white/10 rounded-2xl p-6 space-y-6 font-mono text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <h3 className="font-bold text-white uppercase tracking-wider text-sm flex items-center gap-2">
                <Layers className="text-[#3B5EFF]" size={16} />
                Multi-Panel Continuous Split Groups
              </h3>
              <p className="text-ash/70 text-[11px] mt-1">
                Continuous split artwork spanning multiple physical panels with seamless crop
                continuation.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleAutoGenerateSplitGroup(3)}
                className="px-3 py-1.5 bg-[#3B5EFF] hover:bg-[#2d4de0] text-white rounded-lg transition-colors inline-flex items-center gap-1.5"
              >
                <Plus size={13} /> Add 3-Panel Split
              </button>
              <button
                onClick={() => handleAutoGenerateSplitGroup(5)}
                className="px-3 py-1.5 bg-[#3B5EFF] hover:bg-[#2d4de0] text-white rounded-lg transition-colors inline-flex items-center gap-1.5"
              >
                <Plus size={13} /> Add 5-Panel Split
              </button>
            </div>
          </div>

          {(activeLayout.splitGroups || []).length === 0 ? (
            <div className="text-center py-12 border border-dashed border-white/15 rounded-xl text-ash/60">
              No split groups created for this layout yet. Click one of the buttons above to
              automatically generate a continuous split group.
            </div>
          ) : (
            <div className="space-y-4">
              {activeLayout.splitGroups?.map((group) => {
                const groupSlots = activeLayout.slots.filter((s) => s.splitGroupId === group.id);
                return (
                  <div
                    key={group.id}
                    className="p-4 bg-black/40 border border-white/10 rounded-xl space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#3B5EFF]" />
                        <h4 className="font-bold text-white text-sm">{group.name}</h4>
                        <span className="px-2 py-0.5 rounded bg-white/10 text-ash text-[10px]">
                          {group.panelCount} Physical Panels ({group.physicalSize})
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setActiveLayout((prev) => ({
                            ...prev,
                            splitGroups: prev.splitGroups?.filter((g) => g.id !== group.id),
                            slots: prev.slots.filter((s) => s.splitGroupId !== group.id),
                          }));
                        }}
                        className="text-rose-400 hover:text-rose-300 text-xs inline-flex items-center gap-1"
                      >
                        <Trash2 size={13} /> Remove Group
                      </button>
                    </div>

                    {/* Panels Visual Connector */}
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 pt-2">
                      {groupSlots.map((slot, pIdx) => (
                        <div
                          key={slot.id}
                          className="p-2.5 bg-white/5 border border-[#3B5EFF]/40 rounded-lg text-center space-y-1"
                        >
                          <span className="text-[10px] text-ash/60 uppercase block">
                            Panel {pIdx + 1}
                          </span>
                          <span className="font-bold text-white text-xs">{slot.size}</span>
                          <span className="text-[9px] text-[#3B5EFF] block">
                            Index: {slot.panelIndex}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: METADATA & PRICING */}
      {activeTab === 'meta' && (
        <div className="bg-[#141418] border border-white/10 rounded-2xl p-6 space-y-6 font-mono text-xs">
          <h3 className="font-bold text-white uppercase tracking-wider text-sm flex items-center gap-2 border-b border-white/10 pb-3">
            <Sliders className="text-[#3B5EFF]" size={16} />
            Layout Metadata & Physical Specifications
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-ash/70 uppercase block mb-1">Layout Name</label>
              <input
                type="text"
                value={activeLayout.name}
                onChange={(e) => setActiveLayout({ ...activeLayout, name: e.target.value })}
                className="w-full bg-[#1F1F24] border border-white/15 rounded-lg px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="text-[10px] text-ash/70 uppercase block mb-1">URL Slug</label>
              <input
                type="text"
                value={activeLayout.slug}
                onChange={(e) => setActiveLayout({ ...activeLayout, slug: e.target.value })}
                className="w-full bg-[#1F1F24] border border-white/15 rounded-lg px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="text-[10px] text-ash/70 uppercase block mb-1">
                Wall Width (mm)
              </label>
              <input
                type="number"
                value={activeLayout.wallWidthMm}
                onChange={(e) =>
                  setActiveLayout({
                    ...activeLayout,
                    wallWidthMm: parseInt(e.target.value) || 1600,
                  })
                }
                className="w-full bg-[#1F1F24] border border-white/15 rounded-lg px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="text-[10px] text-ash/70 uppercase block mb-1">
                Wall Height (mm)
              </label>
              <input
                type="number"
                value={activeLayout.wallHeightMm}
                onChange={(e) =>
                  setActiveLayout({
                    ...activeLayout,
                    wallHeightMm: parseInt(e.target.value) || 1050,
                  })
                }
                className="w-full bg-[#1F1F24] border border-white/15 rounded-lg px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="text-[10px] text-ash/70 uppercase block mb-1">
                Base Price (₹ INR)
              </label>
              <input
                type="number"
                value={activeLayout.basePrice}
                onChange={(e) =>
                  setActiveLayout({ ...activeLayout, basePrice: parseFloat(e.target.value) || 699 })
                }
                className="w-full bg-[#1F1F24] border border-white/15 rounded-lg px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="text-[10px] text-ash/70 uppercase block mb-1">
                Compare-at Price (₹ INR)
              </label>
              <input
                type="number"
                value={activeLayout.compareAtPrice || ''}
                onChange={(e) =>
                  setActiveLayout({
                    ...activeLayout,
                    compareAtPrice: e.target.value ? parseFloat(e.target.value) : undefined,
                  })
                }
                className="w-full bg-[#1F1F24] border border-white/15 rounded-lg px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="text-[10px] text-ash/70 uppercase block mb-1">
                Badge (Optional)
              </label>
              <input
                type="text"
                value={activeLayout.badge || ''}
                placeholder="e.g. SIGNATURE, BESTSELLER, NEW"
                onChange={(e) => setActiveLayout({ ...activeLayout, badge: e.target.value })}
                className="w-full bg-[#1F1F24] border border-white/15 rounded-lg px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="text-[10px] text-ash/70 uppercase block mb-1">
                Recommended Room
              </label>
              <input
                type="text"
                value={activeLayout.recommendedRoom || ''}
                placeholder="e.g. Living Room, Bedroom, Studio"
                onChange={(e) =>
                  setActiveLayout({ ...activeLayout, recommendedRoom: e.target.value })
                }
                className="w-full bg-[#1F1F24] border border-white/15 rounded-lg px-3 py-2 text-white"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-ash/70 uppercase block mb-1">Description</label>
            <textarea
              rows={3}
              value={activeLayout.description}
              onChange={(e) => setActiveLayout({ ...activeLayout, description: e.target.value })}
              className="w-full bg-[#1F1F24] border border-white/15 rounded-lg px-3 py-2 text-white resize-none"
            />
          </div>
        </div>
      )}
    </div>
  );
}
