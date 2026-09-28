import React, { useEffect, useState, useRef } from 'react';
import { Save, FolderOpen, Trash2, Download, Upload, Check, Clock } from 'lucide-react';
import { Storage3D } from '../../engine/3d/storage3D';
import type { ProjectState3D } from '../../types/threeD';

interface DrawerProject3DProps {
  currentProject: ProjectState3D;
  onLoadProject: (project: ProjectState3D) => void;
  onProjectSavedNotification?: (name: string) => void;
}

export const DrawerProject3D: React.FC<DrawerProject3DProps> = ({
  currentProject,
  onLoadProject,
  onProjectSavedNotification,
}) => {
  const [storage] = useState(() => new Storage3D());
  const [projectName, setProjectName] = useState<string>(currentProject.name);
  const [savedProjects, setSavedProjects] = useState<{ id: string; name: string; garmentId: string; updatedAt: string }[]>([]);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refreshList = async () => {
    try {
      const list = await storage.listProjects();
      setSavedProjects(list);
    } catch (err) {
      console.warn('[DrawerProject3D] Failed to list projects:', err);
    }
  };

  useEffect(() => {
    refreshList();
  }, []);

  const handleSave = async () => {
    try {
      const toSave: ProjectState3D = {
        ...currentProject,
        name: projectName || 'Untitled 3D Mockup',
      };
      await storage.saveProject(toSave);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
      refreshList();
      if (onProjectSavedNotification) {
        onProjectSavedNotification(toSave.name);
      }
    } catch (err) {
      console.error('[DrawerProject3D] Failed to save project:', err);
    }
  };

  const handleLoad = async (id: string) => {
    try {
      const project = await storage.loadProject(id);
      if (project) {
        onLoadProject(project);
        setProjectName(project.name);
      }
    } catch (err) {
      console.error('[DrawerProject3D] Failed to load project:', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await storage.deleteProject(id);
      refreshList();
    } catch (err) {
      console.error('[DrawerProject3D] Failed to delete project:', err);
    }
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(currentProject, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${currentProject.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-project.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json && json.garmentId) {
          onLoadProject(json);
          setProjectName(json.name || 'Imported Project');
        }
      } catch (err) {
        console.error('[DrawerProject3D] Failed to parse project JSON:', err);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="drawer-content" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div className="drawer-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FolderOpen size={18} className="text-accent" />
          <h2 style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>Project Management</h2>
        </div>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          IndexedDB Local Persistence
        </span>
      </div>

      {/* Save Project Card */}
      <div
        style={{
          background: 'var(--bg-card, #131722)',
          border: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
          borderRadius: 'var(--radius-lg, 12px)',
          padding: '14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>
          Project Title:
        </label>
        <input
          type="text"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          placeholder="e.g. Summer Drop Hoodie 01"
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 'var(--radius-md, 8px)',
            padding: '8px 12px',
            color: '#fff',
            fontSize: '12px',
          }}
        />

        <button
          onClick={handleSave}
          style={{
            background: saveSuccess ? '#10b981' : 'var(--accent, #3B5EFF)',
            color: '#000',
            border: 'none',
            borderRadius: 'var(--radius-md, 8px)',
            padding: '9px',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'background 0.2s ease',
          }}
        >
          {saveSuccess ? <Check size={14} /> : <Save size={14} />}
          <span>{saveSuccess ? 'Project Saved!' : 'Save Current Project'}</span>
        </button>

        {/* JSON Export / Import buttons */}
        <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
          <button
            onClick={handleExportJSON}
            style={{
              flex: 1,
              padding: '6px',
              borderRadius: '6px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff',
              fontSize: '11px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
            }}
          >
            <Download size={12} />
            <span>Export JSON</span>
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              flex: 1,
              padding: '6px',
              borderRadius: '6px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff',
              fontSize: '11px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
            }}
          >
            <Upload size={12} />
            <span>Import JSON</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            style={{ display: 'none' }}
            onChange={handleImportJSON}
          />
        </div>
      </div>

      {/* Saved Projects List */}
      <div>
        <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>
          Saved Projects ({savedProjects.length}):
        </label>

        {savedProjects.length === 0 ? (
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>
            No saved 3D projects found.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {savedProjects.map((p) => (
              <div
                key={p.id}
                style={{
                  background: 'var(--bg-card, #131722)',
                  border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
                  borderRadius: 'var(--radius-md, 8px)',
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>
                    {p.name}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                    <Clock size={10} />
                    <span>{new Date(p.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    onClick={() => handleLoad(p.id)}
                    style={{
                      background: 'rgba(0,214,255,0.15)',
                      border: '1px solid #3B5EFF',
                      color: '#3B5EFF',
                      borderRadius: '6px',
                      padding: '4px 8px',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Load
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#ff4d4d',
                      cursor: 'pointer',
                      padding: '4px',
                    }}
                    title="Delete"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};


