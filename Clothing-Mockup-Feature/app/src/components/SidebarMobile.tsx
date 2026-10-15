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
import type { SidebarTab, SidebarTabsProps } from './SidebarDesktop';

export const SidebarMobile: React.FC<SidebarTabsProps> = ({
  mode,
  activeTab,
  onTabChange,
  layerCount,
}) => {
  const tabs2D = [
    { id: 'library' as SidebarTab, label: 'Designs', icon: Sparkles },
    { id: 'artwork' as SidebarTab, label: 'Artwork', icon: Upload, badge: layerCount },
    { id: 'garment' as SidebarTab, label: 'Color', icon: Palette },
    { id: 'templates' as SidebarTab, label: 'Catalog', icon: Shirt },
    { id: 'fabric' as SidebarTab, label: 'Warp', icon: Sparkles },
    { id: 'lighting' as SidebarTab, label: 'Light', icon: Sun },
    { id: 'project' as SidebarTab, label: 'Project', icon: Settings },
  ];

  const tabs3D = [
    { id: 'library3d' as SidebarTab, label: 'Designs', icon: Sparkles },
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
    <nav className="mobile-bottom-nav sidebar-mobile" aria-label="Mobile Navigation Dock">
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
              aria-label={tab.label}
              aria-selected={isActive}
            >
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={19} />
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
