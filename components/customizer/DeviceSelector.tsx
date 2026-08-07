'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { deviceModels } from '@/data/devices';

interface DeviceSelectorProps {
  selectedDeviceId: string;
  onSelectDevice: (id: string) => void;
}

export function DeviceSelector({ selectedDeviceId, onSelectDevice }: DeviceSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string>('ALL');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedDevice = deviceModels.find((d) => d.id === selectedDeviceId) ?? deviceModels[0];

  // Extract unique brands for brand tabs
  const brands = useMemo(() => {
    const bSet = new Set<string>();
    deviceModels.forEach((d) => bSet.add(d.brand));
    return ['ALL', ...Array.from(bSet)];
  }, []);

  const filteredDevices = useMemo(() => {
    return deviceModels.filter((d) => {
      const matchesSearch =
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.brand.toLowerCase().includes(search.toLowerCase());
      const matchesBrand =
        selectedBrand === 'ALL' || d.brand.toUpperCase() === selectedBrand.toUpperCase();
      return matchesSearch && matchesBrand;
    });
  }, [search, selectedBrand]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!selectedDevice) return null;

  return (
    <div className="bg-graphite border border-smoke/30 p-6 rounded-lg" ref={dropdownRef}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-mono text-caption text-bone uppercase tracking-widest">
          Select Device
        </h3>
        <span className="font-mono text-[10px] text-cobalt uppercase tracking-widest">
          {deviceModels.length} Models Available
        </span>
      </div>

      <div className="relative">
        <div
          className="w-full bg-charcoal border border-smoke/30 text-bone px-4 py-3 font-mono text-sm cursor-pointer flex justify-between items-center hover:border-cobalt transition-colors rounded-md"
          onClick={() => {
            setIsOpen(!isOpen);
            setSearch('');
          }}
        >
          <div className="flex items-center gap-2">
            <span className="bg-cobalt/20 text-cobalt px-2 py-0.5 rounded text-[10px] uppercase font-bold">
              {selectedDevice.brand}
            </span>
            <span>{selectedDevice.name}</span>
          </div>
          <svg
            className={`w-4 h-4 transition-transform text-pearl ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-charcoal border border-smoke/40 rounded-xl shadow-2xl z-50 max-h-96 flex flex-col overflow-hidden">
            {/* Search Input */}
            <div className="p-3 border-b border-smoke/30 bg-graphite/50">
              <input
                type="text"
                className="w-full bg-charcoal border border-smoke/40 text-bone px-3 py-2 font-mono text-xs rounded-md focus:outline-none focus:border-cobalt placeholder-smoke"
                placeholder="Search iPhone, Samsung, Pixel, OnePlus..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
            </div>

            {/* Brand Filter Tabs */}
            <div className="flex items-center gap-1.5 p-2 bg-graphite/30 overflow-x-auto scrollbar-none border-b border-smoke/20">
              {brands.map((b) => (
                <button
                  key={b}
                  onClick={() => setSelectedBrand(b)}
                  className={`px-2.5 py-1 rounded text-[10px] font-mono uppercase tracking-wider whitespace-nowrap transition-colors ${
                    selectedBrand.toUpperCase() === b.toUpperCase()
                      ? 'bg-cobalt text-bone font-bold'
                      : 'bg-charcoal text-pearl hover:text-bone hover:bg-smoke/30'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>

            {/* Devices List */}
            <div className="overflow-y-auto max-h-64 divide-y divide-smoke/10 scrollbar-thin scrollbar-thumb-smoke/40">
              {filteredDevices.length > 0 ? (
                filteredDevices.map((d) => (
                  <div
                    key={d.id}
                    className={`px-4 py-3 font-mono text-xs cursor-pointer hover:bg-cobalt/10 flex justify-between items-center transition-colors ${
                      d.id === selectedDeviceId ? 'text-cobalt bg-cobalt/15 font-bold' : 'text-bone'
                    }`}
                    onClick={() => {
                      onSelectDevice(d.id);
                      setIsOpen(false);
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-smoke/20 text-pearl">
                        {d.brand}
                      </span>
                      <span>{d.name}</span>
                    </div>
                    <span className="text-pearl text-[9px] uppercase font-normal">{d.type}</span>
                  </div>
                ))
              ) : (
                <div className="px-4 py-6 font-mono text-xs text-pearl text-center">
                  No matching models found. Try searching another model!
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
