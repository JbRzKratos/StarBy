'use client';

import { useState, useRef, useEffect } from 'react';
import { deviceModels } from '@/data/devices';

interface DeviceSelectorProps {
  selectedDeviceId: string;
  onSelectDevice: (id: string) => void;
}

export function DeviceSelector({ selectedDeviceId, onSelectDevice }: DeviceSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedDevice = deviceModels.find((d) => d.id === selectedDeviceId) ?? deviceModels[0];

  const filteredDevices = deviceModels.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()),
  );

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
      <h3 className="font-mono text-caption text-bone uppercase tracking-widest mb-4">
        Select Device
      </h3>
      <div className="relative">
        <div
          className="w-full bg-charcoal border border-smoke/30 text-bone px-4 py-3 font-mono text-sm cursor-pointer flex justify-between items-center hover:border-cobalt transition-colors"
          onClick={() => {
            setIsOpen(!isOpen);
            setSearch('');
          }}
        >
          <span>{selectedDevice.name}</span>
          <svg
            className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-charcoal border border-smoke/30 rounded-sm shadow-xl z-50 max-h-64 flex flex-col">
            <div className="p-2 border-b border-smoke/30">
              <input
                type="text"
                className="w-full bg-graphite border border-smoke/30 text-bone px-3 py-2 font-mono text-sm focus:outline-none focus:border-cobalt"
                placeholder="Search device..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
            </div>
            <div className="overflow-y-auto">
              {filteredDevices.length > 0 ? (
                filteredDevices.map((d) => (
                  <div
                    key={d.id}
                    className={`px-4 py-3 font-mono text-sm cursor-pointer hover:bg-smoke/20 ${
                      d.id === selectedDeviceId ? 'text-cobalt bg-smoke/10' : 'text-bone'
                    }`}
                    onClick={() => {
                      onSelectDevice(d.id);
                      setIsOpen(false);
                    }}
                  >
                    {d.name}{' '}
                    <span className="text-pearl text-[10px] uppercase ml-2">({d.type})</span>
                  </div>
                ))
              ) : (
                <div className="px-4 py-4 font-mono text-sm text-pearl text-center">
                  No devices found
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
