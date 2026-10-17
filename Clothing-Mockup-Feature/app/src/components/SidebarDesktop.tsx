import React from 'react';

export type SidebarTab =
  | 'library'
  | 'library3d'
  | 'templates'
  | 'artwork'
  | 'garment'
  | 'fabric'
  | 'lighting'
  | 'project'
  | 'garment3d'
  | 'artwork3d'
  | 'uv3d'
  | 'color3d'
  | 'animation3d'
  | 'lighting3d'
  | 'export3d'
  | 'project3d';

export interface SidebarTabsProps {
  mode: '2d' | '3d';
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
  layerCount: number;
  isDrawerOpen?: boolean;
}

export const SidebarDesktop: React.FC<SidebarTabsProps> = ({
  mode,
  activeTab,
  onTabChange,
  layerCount,
  isDrawerOpen = true,
}) => {
  const tabs2D = [
    { id: 'library' as SidebarTab, label: 'Designs', symbol: '✦' },
    { id: 'artwork' as SidebarTab, label: 'Artwork', symbol: '↑', badge: layerCount },
    { id: 'garment' as SidebarTab, label: 'Color', symbol: '●' },
    { id: 'templates' as SidebarTab, label: 'Catalog', symbol: '◻' },
    { id: 'fabric' as SidebarTab, label: 'Warp', symbol: '∿' },
    { id: 'lighting' as SidebarTab, label: 'Light', symbol: '☼' },
    { id: 'project' as SidebarTab, label: 'Project', symbol: '⚙' },
  ];

  const tabs3D = [
    { id: 'library3d' as SidebarTab, label: 'Designs', symbol: '✦' },
    { id: 'artwork3d' as SidebarTab, label: 'Artwork', symbol: '↑', badge: layerCount },
    { id: 'color3d' as SidebarTab, label: 'Color', symbol: '●' },
    { id: 'garment3d' as SidebarTab, label: 'Garments', symbol: '◻' },
    { id: 'animation3d' as SidebarTab, label: 'Motion', symbol: '∿' },
    { id: 'lighting3d' as SidebarTab, label: 'Studio', symbol: '☼' },
    { id: 'uv3d' as SidebarTab, label: 'UV Editor', symbol: '⊞' },
    { id: 'export3d' as SidebarTab, label: 'Export', symbol: '⤓' },
  ];

  const tabs = mode === '3d' ? tabs3D : tabs2D;

  return (
    <nav className="nav-sidebar sidebar-desktop" aria-label="Desktop Studio Tools">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id && isDrawerOpen;
        return (
          <button
            key={`desktop-${tab.id}`}
            id={`tab-btn-${tab.id}`}
            type="button"
            className={`nav-tab-btn ${isActive ? 'active' : ''}`}
            onClick={() => onTabChange(tab.id)}
            title={tab.label}
          >
            <span className="tab-symbol" style={{ fontSize: '22px', lineHeight: 1 }}>{tab.symbol}</span>
            <span className="tab-label" style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.01em' }}>{tab.label}</span>
            {tab.badge !== undefined && tab.badge > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '6px',
                  right: '6px',
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: 'var(--accent, #3B5EFF)',
                  boxShadow: '0 0 6px rgba(59, 94, 255, 0.8)',
                }}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
};
