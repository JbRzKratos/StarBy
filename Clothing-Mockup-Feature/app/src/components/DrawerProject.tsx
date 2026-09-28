import React, { useState, useRef } from 'react';
import { Save, FolderOpen, RotateCcw, AlertTriangle, ShieldCheck } from 'lucide-react';

interface DrawerProjectProps {
  onSaveProject: () => void;
  onLoadProjectFile: (file: File) => void;
  onResetProject: () => void;
}

export const DrawerProject: React.FC<DrawerProjectProps> = ({
  onSaveProject,
  onLoadProjectFile,
  onResetProject,
}) => {
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onLoadProjectFile(e.target.files[0]);
    }
    e.target.value = '';
  };

  return (
    <div className="drawer-panel">
      <div className="drawer-header">
        <div className="drawer-title">Project & State</div>
      </div>

      <div className="drawer-content">
        {/* Save Project */}
        <div className="control-group">
          <div className="control-label">
            <span>Local Backup</span>
          </div>
          <button
            id="drawer-btn-save-project"
            className="header-btn"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={onSaveProject}
          >
            <Save size={15} />
            <span>Download Project State (.json)</span>
          </button>
        </div>

        {/* Load Project */}
        <div className="control-group">
          <div className="control-label">
            <span>Restore Project</span>
          </div>
          <button
            id="drawer-btn-load-project"
            className="header-btn"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={() => fileInputRef.current?.click()}
          >
            <FolderOpen size={15} />
            <span>Load Project File (.json)</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </div>

        {/* Reset Project with Confirmation */}
        <div className="control-group" style={{ marginTop: '12px' }}>
          <div className="control-label">
            <span>Reset Canvas</span>
          </div>

          {!showConfirmReset ? (
            <button
              id="drawer-btn-reset-canvas"
              className="header-btn"
              style={{ width: '100%', justifyContent: 'center', borderColor: 'rgba(239,68,68,0.3)', color: '#f87171' }}
              onClick={() => setShowConfirmReset(true)}
            >
              <RotateCcw size={15} />
              <span>Reset All Edits...</span>
            </button>
          ) : (
            <div
              style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 'var(--radius-md)',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f87171', fontSize: '13px', fontWeight: 600 }}>
                <AlertTriangle size={16} />
                <span>Confirm Reset?</span>
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-dim)', lineHeight: 1.4 }}>
                This will clear all front and back artwork layers and return settings to defaults. Edits cannot be recovered.
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  id="btn-confirm-reset"
                  className="header-btn"
                  style={{ flex: 1, justifyContent: 'center', background: '#dc2626', color: '#fff', border: 'none' }}
                  onClick={() => {
                    onResetProject();
                    setShowConfirmReset(false);
                  }}
                >
                  Yes, Reset
                </button>
                <button
                  className="header-btn"
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => setShowConfirmReset(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Third-Party Notices & Licensing */}
        <div className="info-box" style={{ marginTop: '20px' }}>
          <ShieldCheck size={16} style={{ flexShrink: 0 }} />
          <div>
            <strong>Asset Notice:</strong> Reference mockup assets and gobo lighting textures are provided for local inspection. Maintain third-party rights and obtain appropriate licenses before public or commercial distribution.
          </div>
        </div>
      </div>
    </div>
  );
};
