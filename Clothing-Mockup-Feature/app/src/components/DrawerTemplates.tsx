import React, { useState } from 'react';
import { CATALOG, getGarmentUrl } from '../data/catalog';
import { Search } from 'lucide-react';
import type { GarmentSide } from '../types/mockup';

interface DrawerTemplatesProps {
  currentTemplateId: number;
  activeSide: GarmentSide;
  onSelectTemplate: (id: number) => void;
  onSideChange?: (side: GarmentSide) => void;
}

export const DrawerTemplates: React.FC<DrawerTemplatesProps> = ({
  currentTemplateId,
  activeSide,
  onSelectTemplate,
  onSideChange,
}) => {
  const [search, setSearch] = useState('');

  const filtered = CATALOG.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="drawer-panel">
      <div className="drawer-header">
        <div className="drawer-title">Garment Catalog</div>
        <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 600 }}>
          {CATALOG.length} Templates
        </span>
      </div>

      <div className="drawer-content">
        {/* Search */}
        <div className="hex-input-row" style={{ padding: '6px 10px' }}>
          <Search size={15} style={{ color: 'var(--text-dim)' }} />
          <input
            type="text"
            className="hex-text-input"
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Template Grid */}
        <div className="catalog-grid">
          {filtered.map((item) => {
            const isSelected = item.mockup_id === currentTemplateId;
            const frontThumbUrl = getGarmentUrl(item.mockup_id, 'front');
            const backThumbUrl = getGarmentUrl(item.mockup_id, 'back');

            return (
              <div
                key={item.mockup_id}
                id={`template-card-${item.mockup_id}`}
                className={`catalog-card ${isSelected ? 'active' : ''}`}
                onClick={() => onSelectTemplate(item.mockup_id)}
              >
                <div className="catalog-thumb-container" style={{ position: 'relative' }}>
                  <img
                    src={activeSide === 'front' ? frontThumbUrl : backThumbUrl}
                    alt={`${item.name} (${activeSide})`}
                    className="catalog-thumb-img"
                    loading="lazy"
                  />
                  {isSelected && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '6px',
                        right: '6px',
                        padding: '2px 6px',
                        borderRadius: 'var(--radius-full)',
                        background: 'var(--accent)',
                        color: '#fff',
                        fontSize: '9px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                      }}
                    >
                      Active
                    </div>
                  )}
                  {/* Subtle side switcher on thumbnail */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '4px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      display: 'flex',
                      background: 'rgba(0,0,0,0.65)',
                      backdropFilter: 'blur(4px)',
                      borderRadius: 'var(--radius-full)',
                      padding: '2px',
                      gap: '2px',
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      style={{
                        background: activeSide === 'front' ? 'var(--accent)' : 'transparent',
                        color: '#fff',
                        border: 'none',
                        fontSize: '9px',
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: 'var(--radius-full)',
                        cursor: 'pointer',
                      }}
                      onClick={() => onSideChange?.('front')}
                    >
                      F
                    </button>
                    <button
                      style={{
                        background: activeSide === 'back' ? 'var(--accent)' : 'transparent',
                        color: '#fff',
                        border: 'none',
                        fontSize: '9px',
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: 'var(--radius-full)',
                        cursor: 'pointer',
                      }}
                      onClick={() => onSideChange?.('back')}
                    >
                      B
                    </button>
                  </div>
                </div>
                <div>
                  <div className="catalog-card-name">{item.name}</div>
                  <div className="catalog-card-id">ID: #{item.mockup_id} (Front / Back)</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
