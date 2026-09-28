import React, { useState } from 'react';
import { X, Download, Check, Loader2 } from 'lucide-react';
import type { ExportOptions, ProjectState } from '../types/mockup';
import { exportManager } from '../engine/exportManager';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectState;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  project,
}) => {
  const [scope, setScope] = useState<ExportOptions['scope']>('current');
  const [dimensions, setDimensions] = useState<ExportOptions['dimensions']>('2048x2048');
  const [transparentBg, setTransparentBg] = useState(false);
  const [includeShadow, setIncludeShadow] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [progressMsg, setProgressMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStartExport = async () => {
    setIsExporting(true);
    try {
      await exportManager.executeExport(
        project,
        {
          scope,
          dimensions,
          transparentBg,
          includeShadow,
        },
        (msg) => setProgressMsg(msg)
      );
      setTimeout(() => {
        setIsExporting(false);
        setProgressMsg(null);
        onClose();
      }, 500);
    } catch (err) {
      console.error('Export failed:', err);
      setIsExporting(false);
      setProgressMsg('Export error occurred');
    }
  };

  const dimensionPresets: { id: ExportOptions['dimensions']; label: string; desc: string }[] = [
    { id: '2048x2048', label: '2048 × 2048', desc: 'Native Square (High-Res)' },
    { id: '1920x1080', label: '1920 × 1080', desc: 'Full HD (16:9 Landscape)' },
    { id: '1200x1200', label: '1200 × 1200', desc: 'Standard Web (1:1)' },
    { id: '2560x1440', label: '2560 × 1440', desc: '2K QHD Studio Display' },
    { id: '3840x2160', label: '3840 × 2160', desc: '4K Ultra HD Commercial' },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title">Export High-Res Mockup</div>
          <button
            className="layer-action-btn"
            onClick={onClose}
            style={{ width: '28px', height: '28px', borderRadius: '50%' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Export Scope */}
          <div className="control-group">
            <div className="control-label">
              <span>Export Package</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              <button
                id="btn-export-scope-current"
                className={`catalog-card ${scope === 'current' ? 'active' : ''}`}
                onClick={() => setScope('current')}
                style={{ textAlign: 'center', padding: '10px 8px' }}
              >
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>Current Side</div>
                <div style={{ fontSize: '10px', color: 'var(--text-dim)', textTransform: 'capitalize' }}>
                  ({project.activeSide})
                </div>
              </button>

              <button
                id="btn-export-scope-both-zip"
                className={`catalog-card ${scope === 'both_zip' ? 'active' : ''}`}
                onClick={() => setScope('both_zip')}
                style={{ textAlign: 'center', padding: '10px 8px' }}
              >
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>Both Sides</div>
                <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>Download ZIP</div>
              </button>

              <button
                id="btn-export-scope-side-by-side"
                className={`catalog-card ${scope === 'side_by_side' ? 'active' : ''}`}
                onClick={() => setScope('side_by_side')}
                style={{ textAlign: 'center', padding: '10px 8px' }}
              >
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>Side-by-Side</div>
                <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>Studio Showcase</div>
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginTop: '6px' }}>
              <button
                id="btn-export-scope-front"
                className={`catalog-card ${scope === 'front' ? 'active' : ''}`}
                onClick={() => setScope('front')}
                style={{ textAlign: 'center', padding: '8px' }}
              >
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#fff' }}>Front Side Only</span>
              </button>
              <button
                id="btn-export-scope-back"
                className={`catalog-card ${scope === 'back' ? 'active' : ''}`}
                onClick={() => setScope('back')}
                style={{ textAlign: 'center', padding: '8px' }}
              >
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#fff' }}>Back Side Only</span>
              </button>
            </div>
          </div>

          {/* Dimension Selector */}
          <div className="control-group">
            <div className="control-label">
              <span>Target Dimensions</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {dimensionPresets.map((preset) => {
                const isSelected = dimensions === preset.id;
                return (
                  <div
                    key={preset.id}
                    id={`dim-preset-${preset.id}`}
                    className={`layer-item ${isSelected ? 'active' : ''}`}
                    onClick={() => setDimensions(preset.id)}
                    style={{ padding: '8px 12px' }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>{preset.label}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{preset.desc}</div>
                    </div>
                    {isSelected && <Check size={16} style={{ color: 'var(--accent)' }} />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Background & Shadow Transparency Options */}
          <div className="control-group">
            <div className="control-label">
              <span>Background & Alpha Options</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* Transparent Background */}
              <div
                id="option-transparent-bg"
                className="toggle-row"
                onClick={() => setTransparentBg(!transparentBg)}
              >
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>Transparent Background</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                    Export cutout PNG with alpha transparency
                  </span>
                </div>
                <label className="toggle-switch" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={transparentBg}
                    onChange={(e) => setTransparentBg(e.target.checked)}
                  />
                  <span className="toggle-slider" />
                </label>
              </div>

              {/* Include Cast Shadow */}
              <div
                id="option-include-shadow"
                className="toggle-row"
                style={{ opacity: transparentBg ? 1 : 0.4 }}
                onClick={() => {
                  if (transparentBg) setIncludeShadow(!includeShadow);
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>Include Garment Cast Shadow</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                    Keep natural drop shadow in transparent PNG
                  </span>
                </div>
                <label className="toggle-switch" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    disabled={!transparentBg}
                    checked={includeShadow}
                    onChange={(e) => setIncludeShadow(e.target.checked)}
                  />
                  <span className="toggle-slider" />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="header-btn" onClick={onClose} disabled={isExporting}>
            Cancel
          </button>
          <button
            id="btn-execute-download"
            className="header-btn btn-export"
            onClick={handleStartExport}
            disabled={isExporting}
            style={{ padding: '8px 20px', minWidth: '150px', justifyContent: 'center' }}
          >
            {isExporting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>{progressMsg || 'Rendering...'}</span>
              </>
            ) : (
              <>
                <Download size={16} />
                <span>Download Export</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
