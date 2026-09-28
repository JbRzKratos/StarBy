import React from 'react';
import { Play, Pause, Activity, Zap, RotateCcw } from 'lucide-react';
import type { AnimationActionName } from '../../types/threeD';

interface DrawerAnimation3DProps {
  isAnimated: boolean;
  onAnimatedToggle: () => void;
  currentAction: AnimationActionName;
  onActionChange: (action: AnimationActionName) => void;
  isPlaying: boolean;
  onPlayToggle: () => void;
  playbackSpeed: number;
  onSpeedChange: (speed: number) => void;
  secondaryMotionEnabled: boolean;
  onSecondaryMotionToggle: () => void;
}

const ACTION_DESCRIPTIONS: Record<AnimationActionName, { title: string; desc: string; icon: string }> = {
  IDLE: {
    title: 'Idle Pose',
    desc: 'Procedural torso and chest breathing cycle',
    icon: '🧘',
  },
  WALK: {
    title: 'Natural Walk',
    desc: 'Fluid forward gait with natural arm swings',
    icon: '🚶',
  },
  DANCE: {
    title: 'Dance Groove',
    desc: 'Rhythmic hip sway and expressive upper body motion',
    icon: '🕺',
  },
  RUN: {
    title: 'Sprint Run',
    desc: 'High-energy running motion with heavy fabric lag',
    icon: '🏃',
  },
  FIGHTER: {
    title: 'Fighter Stance',
    desc: 'Dynamic martial arts combat ready motions',
    icon: '🥊',
  },
  STRUT: {
    title: 'Catwalk Strut',
    desc: 'Confident high-fashion runway model stride',
    icon: '✨',
  },
};

export const DrawerAnimation3D: React.FC<DrawerAnimation3DProps> = ({
  isAnimated,
  onAnimatedToggle,
  currentAction,
  onActionChange,
  isPlaying,
  onPlayToggle,
  playbackSpeed,
  onSpeedChange,
  secondaryMotionEnabled,
  onSecondaryMotionToggle,
}) => {
  return (
    <div className="drawer-content" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div className="drawer-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Zap size={18} className="text-accent" />
          <h2 style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>Motion & Animation</h2>
        </div>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          {isAnimated ? 'Animation Enabled' : 'Static Rest Pose'}
        </span>
      </div>

      {/* Animation Master Mode Toggle */}
      <div
        style={{
          background: isAnimated ? 'rgba(99, 102, 241, 0.12)' : 'var(--bg-card, #131722)',
          border: isAnimated ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
          borderRadius: 'var(--radius-lg, 12px)',
          padding: '14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>
              {isAnimated ? 'Garment Motion Active' : 'Static Rest Pose (Default)'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {isAnimated
                ? 'Skeletal clips and spring-bone lag are playing'
                : 'Garment is framed stably in its authentic neutral relaxed pose'}
            </div>
          </div>
        </div>

        <button
          onClick={onAnimatedToggle}
          style={{
            background: isAnimated ? 'rgba(255, 255, 255, 0.1)' : 'linear-gradient(135deg, #3B5EFF, #2645E0)',
            color: '#fff',
            border: isAnimated ? '1px solid rgba(255, 255, 255, 0.2)' : 'none',
            borderRadius: '8px',
            padding: '8px 14px',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 0.15s ease',
          }}
        >
          {isAnimated ? (
            <>
              <RotateCcw size={14} />
              <span>Restore Static Rest Pose</span>
            </>
          ) : (
            <>
              <Play size={14} />
              <span>Enable Animation Mode</span>
            </>
          )}
        </button>
      </div>

      {isAnimated && (
        <>
          {/* Main Playback Bar */}
          <div
            style={{
              background: 'var(--bg-card, #131722)',
              border: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
              borderRadius: 'var(--radius-lg, 12px)',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
        <button
          onClick={onPlayToggle}
          style={{
            background: isPlaying ? 'rgba(255,255,255,0.12)' : 'var(--accent, #3B5EFF)',
            color: isPlaying ? '#fff' : '#000',
            border: 'none',
            borderRadius: 'var(--radius-md, 8px)',
            padding: '8px 16px',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          {isPlaying ? <Pause size={14} /> : <Play size={14} />}
          <span>{isPlaying ? 'Pause Motion' : 'Play Motion'}</span>
        </button>

        {/* Speed Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {[0.5, 1.0, 1.5, 2.0].map((s) => (
            <button
              key={s}
              onClick={() => onSpeedChange(s)}
              style={{
                background: playbackSpeed === s ? '#3B5EFF' : 'rgba(255,255,255,0.06)',
                color: playbackSpeed === s ? '#000' : 'var(--text-muted)',
                border: 'none',
                borderRadius: '6px',
                padding: '4px 8px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      {/* Secondary Motion Toggle */}
      <div
        style={{
          background: 'var(--bg-card, #131722)',
          border: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
          borderRadius: 'var(--radius-lg, 12px)',
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={16} color={secondaryMotionEnabled ? '#10b981' : '#888'} />
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600 }}>Secondary Bone Motion</div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
              Damped harmonic oscillation on hem & sleeves
            </div>
          </div>
        </div>

        <button
          onClick={onSecondaryMotionToggle}
          style={{
            padding: '4px 12px',
            borderRadius: '12px',
            border: secondaryMotionEnabled ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.15)',
            background: secondaryMotionEnabled ? 'rgba(0, 255, 170, 0.2)' : 'transparent',
            color: secondaryMotionEnabled ? '#10b981' : 'var(--text-muted)',
            fontSize: '11px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          {secondaryMotionEnabled ? 'ON' : 'OFF'}
        </button>
      </div>

      {/* Action Cards List */}
      <div>
        <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>
          Choose Action Strip:
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {(['IDLE', 'WALK', 'DANCE', 'RUN', 'FIGHTER', 'STRUT'] as AnimationActionName[]).map((act) => {
            const isSelected = currentAction === act;
            const meta = ACTION_DESCRIPTIONS[act];
            return (
              <div
                key={act}
                onClick={() => onActionChange(act)}
                style={{
                  background: isSelected ? 'rgba(0, 214, 255, 0.12)' : 'var(--bg-card, #131722)',
                  border: isSelected ? '1px solid var(--accent, #3B5EFF)' : '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
                  borderRadius: 'var(--radius-md, 8px)',
                  padding: '10px 12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '18px' }}>{meta.icon}</span>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: isSelected ? '#3B5EFF' : '#fff' }}>
                      {meta.title}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {meta.desc}
                    </div>
                  </div>
                </div>

                {isSelected && (
                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#3B5EFF', textTransform: 'uppercase' }}>
                    Active
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
        </>
      )}
    </div>
  );
};


