import React from 'react';
import type { SidebarTab, SidebarTabsProps } from './SidebarDesktop';

export const SidebarMobile: React.FC<SidebarTabsProps> = ({
  activeTab,
  onTabChange,
  layerCount,
  isDrawerOpen = true,
}) => {
  const tabs = [
    { id: 'library3d' as SidebarTab, label: 'Designs', symbol: '✦' },
    { id: 'artwork3d' as SidebarTab, label: 'Artwork', symbol: '↑', badge: layerCount },
    { id: 'color3d' as SidebarTab, label: 'Color', symbol: '●' },
    { id: 'garment3d' as SidebarTab, label: 'Garments', symbol: '◻' },
    { id: 'animation3d' as SidebarTab, label: 'Motion', symbol: '∿' },
    { id: 'lighting3d' as SidebarTab, label: 'Studio', symbol: '☼' },
    { id: 'uv3d' as SidebarTab, label: 'UV', symbol: '⊞' },
    { id: 'export3d' as SidebarTab, label: 'Export', symbol: '⤓' },
  ];

  return (
    <nav className="mobile-bottom-nav sidebar-mobile" aria-label="Mobile Navigation Dock">
      <div className="mobile-bottom-nav-inner">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id && isDrawerOpen;
          return (
            <button
              key={`mobile-${tab.id}`}
              id={`mobile-tab-btn-${tab.id}`}
              type="button"
              className={`mobile-nav-btn ${isActive ? 'active' : ''}`}
              onClick={() => onTabChange(tab.id)}
              title={tab.label}
              aria-label={tab.label}
              aria-selected={isActive}
            >
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="mobile-tab-symbol" style={{ fontSize: '18px', lineHeight: 1 }}>{tab.symbol}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="mobile-tab-badge">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="mobile-tab-label">{tab.label}</span>
              {isActive && <div className="mobile-tab-indicator" />}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
