import React, { useState } from 'react';
import { Shirt, Check, Search } from 'lucide-react';
import { GARMENT_3D_CATALOG } from '../../engine/3d/registry';
import type { Garment3DConfig } from '../../types/threeD';

interface DrawerGarment3DProps {
  selectedGarmentId: string;
  onSelectGarment: (garment: Garment3DConfig) => void;
}

export const DrawerGarment3D: React.FC<DrawerGarment3DProps> = ({
  selectedGarmentId,
  onSelectGarment,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories = [
    { id: 'all', label: 'All Items' },
    { id: 't-shirts', label: 'T-Shirts' },
    { id: 'hoodies', label: 'Hoodies & Sweats' },
    { id: 'pants', label: 'Pants' },
    { id: 'headwear', label: 'Headwear' },
  ];

  const filteredGarments = GARMENT_3D_CATALOG.filter((g) => {
    const matchesCategory =
      activeCategory === 'all' || g.category === activeCategory;
    const matchesSearch =
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="drawer-content" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="drawer-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Shirt size={18} className="text-accent" />
          <h2 style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>3D Garment Catalog</h2>
        </div>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          11 Skinned 3D Models
        </span>
      </div>

      {/* Search Input */}
      <div style={{ position: 'relative' }}>
        <Search
          size={14}
          style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
        />
        <input
          type="text"
          placeholder="Search garments..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 12px 8px 32px',
            background: 'var(--bg-card, #131722)',
            border: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
            borderRadius: 'var(--radius-md, 8px)',
            color: 'var(--text-main, #fff)',
            fontSize: '12px',
            outline: 'none',
          }}
        />
      </div>

      {/* Category Pills */}
      <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setActiveCategory(c.id)}
            style={{
              padding: '4px 10px',
              fontSize: '11px',
              fontWeight: 600,
              borderRadius: '14px',
              border: activeCategory === c.id ? '1px solid var(--accent, #3B5EFF)' : '1px solid transparent',
              background: activeCategory === c.id ? 'rgba(0, 214, 255, 0.18)' : 'rgba(255, 255, 255, 0.05)',
              color: activeCategory === c.id ? '#3B5EFF' : 'var(--text-muted)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
            }}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Garments Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
          gap: '12px',
          overflowY: 'auto',
          maxHeight: 'calc(100vh - 240px)',
          paddingRight: '4px',
        }}
      >
        {filteredGarments.map((garment) => {
          const isSelected = garment.id === selectedGarmentId;
          return (
            <div
              key={garment.id}
              onClick={() => onSelectGarment(garment)}
              style={{
                position: 'relative',
                background: isSelected ? 'rgba(0, 214, 255, 0.08)' : 'var(--bg-card, #131722)',
                border: isSelected ? '2px solid var(--accent, #3B5EFF)' : '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
                borderRadius: 'var(--radius-lg, 12px)',
                padding: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              {/* Thumbnail Container */}
              <div
                style={{
                  width: '100%',
                  aspectRatio: '1',
                  borderRadius: 'var(--radius-md, 8px)',
                  overflow: 'hidden',
                  background: '#0d1017',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <img
                  src={garment.thumbnailPath}
                  alt={garment.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  loading="lazy"
                />
              </div>

              {/* Title & Info */}
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: isSelected ? '#3B5EFF' : 'var(--text-main, #fff)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {garment.name}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {garment.regions.length} print {garment.regions.length === 1 ? 'zone' : 'zones'}
                </div>
              </div>

              {/* Selected Badge */}
              {isSelected && (
                <div
                  style={{
                    position: 'absolute',
                    top: '6px',
                    right: '6px',
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: 'var(--accent, #3B5EFF)',
                    color: '#000',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Check size={12} strokeWidth={3} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

