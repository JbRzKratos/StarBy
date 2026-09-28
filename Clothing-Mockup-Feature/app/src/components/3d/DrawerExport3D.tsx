import React, { useState } from 'react';
import { Download, Video, Image, Film } from 'lucide-react';
import type { SceneManager3D } from '../../engine/3d/sceneManager';
import { Export3DManager } from '../../engine/3d/export3D';

interface DrawerExport3DProps {
  sceneManager: SceneManager3D | null;
  garmentName: string;
}

export const DrawerExport3D: React.FC<DrawerExport3DProps> = ({
  sceneManager,
  garmentName,
}) => {
  const [exportManager] = useState(() => new Export3DManager());

  // Still Export State
  const [stillView, setStillView] = useState<'current' | 'front' | 'back'>('current');
  const [stillTransparent, setStillTransparent] = useState<boolean>(false);
  const [isExportingStill, setIsExportingStill] = useState<boolean>(false);

  // Video Export State
  const [videoDuration, setVideoDuration] = useState<number>(5);
  const [videoFps, setVideoFps] = useState<number>(30);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingProgress, setRecordingProgress] = useState<number>(0);

  const handleExportStill = async () => {
    if (!sceneManager) return;
    setIsExportingStill(true);
    try {
      const sanitized = garmentName.toLowerCase().replace(/[^a-z0-9]/g, '-');
      await exportManager.exportStillPNG(sceneManager, {
        view: stillView,
        transparent: stillTransparent,
        filename: `${sanitized}-3d-${stillView}-${Date.now()}.png`,
      });
    } catch (err) {
      console.error('[DrawerExport3D] Failed to export still:', err);
    } finally {
      setIsExportingStill(false);
    }
  };

  const handleExportVideo = async () => {
    if (!sceneManager) return;
    setIsRecording(true);
    setRecordingProgress(0);
    try {
      const sanitized = garmentName.toLowerCase().replace(/[^a-z0-9]/g, '-');
      await exportManager.recordAnimationVideo(sceneManager, {
        durationSeconds: videoDuration,
        fps: videoFps,
        filename: `${sanitized}-3d-motion-${Date.now()}.webm`,
        onProgress: (p) => setRecordingProgress(p),
      });
    } catch (err) {
      console.error('[DrawerExport3D] Failed to export video:', err);
    } finally {
      setIsRecording(false);
      setRecordingProgress(0);
    }
  };

  const handleCancelVideo = () => {
    exportManager.cancelRecording();
    setIsRecording(false);
    setRecordingProgress(0);
  };

  return (
    <div className="drawer-content" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="drawer-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Download size={18} className="text-accent" />
          <h2 style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>Export 3D Mockup</h2>
        </div>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          High-Res Stills & Motion Video
        </span>
      </div>

      {/* 1. Still Image Export Section */}
      <div
        style={{
          background: 'var(--bg-card, #131722)',
          border: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
          borderRadius: 'var(--radius-lg, 12px)',
          padding: '14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700 }}>
          <Image size={15} color="#3B5EFF" />
          <span>Still Image Render (PNG)</span>
        </div>

        {/* View choice */}
        <div>
          <label style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>
            Camera Angle:
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
            {[
              { id: 'current', label: 'Current View' },
              { id: 'front', label: 'Front Angle' },
              { id: 'back', label: 'Back Angle' },
            ].map((v) => (
              <button
                key={v.id}
                onClick={() => setStillView(v.id as any)}
                style={{
                  padding: '6px 4px',
                  borderRadius: '6px',
                  border: stillView === v.id ? '1px solid #3B5EFF' : '1px solid rgba(255,255,255,0.1)',
                  background: stillView === v.id ? 'rgba(0,214,255,0.15)' : 'transparent',
                  color: stillView === v.id ? '#3B5EFF' : 'var(--text-muted)',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>

        {/* Transparent background toggle */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Transparent Background</span>
          <button
            onClick={() => setStillTransparent(!stillTransparent)}
            style={{
              padding: '4px 10px',
              borderRadius: '10px',
              border: stillTransparent ? '1px solid #3B5EFF' : '1px solid rgba(255,255,255,0.1)',
              background: stillTransparent ? 'rgba(0,214,255,0.2)' : 'transparent',
              color: stillTransparent ? '#3B5EFF' : 'var(--text-muted)',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {stillTransparent ? 'Transparent' : 'Solid'}
          </button>
        </div>

        {/* Download Button */}
        <button
          onClick={handleExportStill}
          disabled={isExportingStill || !sceneManager}
          style={{
            background: 'var(--accent, #3B5EFF)',
            color: '#000',
            border: 'none',
            borderRadius: 'var(--radius-md, 8px)',
            padding: '10px',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            marginTop: '4px',
          }}
        >
          <Download size={14} />
          <span>{isExportingStill ? 'Rendering PNG...' : 'Download High-Res PNG'}</span>
        </button>
      </div>

      {/* 2. Video Motion Export Section */}
      <div
        style={{
          background: 'var(--bg-card, #131722)',
          border: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
          borderRadius: 'var(--radius-lg, 12px)',
          padding: '14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700 }}>
          <Film size={15} color="#10b981" />
          <span>Motion Video Export (WebM)</span>
        </div>

        {/* Duration selector */}
        <div>
          <label style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>
            Recording Duration:
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
            {[3, 5, 10].map((d) => (
              <button
                key={d}
                onClick={() => setVideoDuration(d)}
                style={{
                  padding: '6px',
                  borderRadius: '6px',
                  border: videoDuration === d ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.1)',
                  background: videoDuration === d ? 'rgba(0,255,170,0.15)' : 'transparent',
                  color: videoDuration === d ? '#10b981' : 'var(--text-muted)',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {d} Seconds
              </button>
            ))}
          </div>
        </div>

        {/* FPS selector */}
        <div>
          <label style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>
            Frame Rate:
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
            {[30, 60].map((fps) => (
              <button
                key={fps}
                onClick={() => setVideoFps(fps)}
                style={{
                  padding: '6px',
                  borderRadius: '6px',
                  border: videoFps === fps ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.1)',
                  background: videoFps === fps ? 'rgba(0,255,170,0.15)' : 'transparent',
                  color: videoFps === fps ? '#10b981' : 'var(--text-muted)',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {fps} FPS
              </button>
            ))}
          </div>
        </div>

        {/* Recording Progress or Trigger Button */}
        {isRecording ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#10b981' }}>
              <span>Recording Garment Animation...</span>
              <span>{Math.round(recordingProgress * 100)}%</span>
            </div>
            <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${recordingProgress * 100}%`, height: '100%', background: '#10b981', transition: 'width 0.1s linear' }} />
            </div>
            <button
              onClick={handleCancelVideo}
              style={{
                background: 'rgba(255, 77, 77, 0.2)',
                color: '#ff4d4d',
                border: '1px solid #ff4d4d',
                borderRadius: 'var(--radius-md, 8px)',
                padding: '6px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel Recording
            </button>
          </div>
        ) : (
          <button
            onClick={handleExportVideo}
            disabled={!sceneManager}
            style={{
              background: '#10b981',
              color: '#000',
              border: 'none',
              borderRadius: 'var(--radius-md, 8px)',
              padding: '10px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              marginTop: '4px',
            }}
          >
            <Video size={14} />
            <span>Record & Download WebM</span>
          </button>
        )}
      </div>
    </div>
  );
};


