import React from 'react';
import {
  Shirt,
  Upload,
  Palette,
  Sparkles,
  Sun,
  Settings,
  Zap,
  Download,
  Layers,
} from 'lucide-react';

export type SidebarTab =
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

interface SidebarTabsProps {
  mode: '2d' | '3d';
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
  layerCount: number;
}

export const SidebarTabs: React.FC<SidebarTabsProps> = ({
  mode,
  activeTab,
  onTabChange,
  layerCount,
}) => {
  const tabs2D = [
    { id: 'artwork' as SidebarTab, label: 'Artwork', icon: Upload, badge: layerCount },
    { id: 'garment' as SidebarTab, label: 'Color', icon: Palette },
    { id: 'templates' as SidebarTab, label: 'Catalog', icon: Shirt },
    { id: 'fabric' as SidebarTab, label: 'Warp', icon: Sparkles },
    { id: 'lighting' as SidebarTab, label: 'Light', icon: Sun },
    { id: 'project' as SidebarTab, label: 'Project', icon: Settings },
  ];

  const tabs3D = [
    { id: 'artwork3d' as SidebarTab, label: 'Artwork', icon: Upload, badge: layerCount },
    { id: 'uv3d' as SidebarTab, label: 'UV Editor', icon: Layers },
    { id: 'color3d' as SidebarTab, label: 'Color', icon: Palette },
    { id: 'garment3d' as SidebarTab, label: 'Garments', icon: Shirt },
    { id: 'animation3d' as SidebarTab, label: 'Motion', icon: Zap },
    { id: 'lighting3d' as SidebarTab, label: 'Studio', icon: Sun },
    { id: 'export3d' as SidebarTab, label: 'Export', icon: Download },
  ];

  const tabs = mode === '3d' ? tabs3D : tabs2D;

  return (
    <>
      {/* ── 1. Desktop Left Sidebar ── */}
      <nav className="nav-sidebar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={`desktop-${tab.id}`}
              id={`tab-btn-${tab.id}`}
              type="button"
              className={`nav-tab-btn ${isActive ? 'active' : ''}`}
              onClick={() => onTabChange(tab.id)}
              title={tab.label}
            >
              <Icon size={19} />
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: 'var(--accent, #3B5EFF)',
                    border: '2px solid var(--bg-sidebar, #090b10)',
                  }}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* ── 2. Mobile Bottom Dock (Always visible & accessible on phone) ── */}
      <nav className="mobile-bottom-nav" aria-label="Mobile Navigation Dock">
        <div className="mobile-bottom-nav-inner">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={`mobile-${tab.id}`}
                id={`mobile-tab-btn-${tab.id}`}
                type="button"
                className={`mobile-nav-btn ${isActive ? 'active' : ''}`}
                onClick={() => onTabChange(tab.id)}
                title={tab.label}
              >
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={20} />
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className="mobile-tab-badge">
                      {tab.badge}
                    </span>
                  )}
                </div>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};



