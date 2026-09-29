import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import {
  Play,
  Pause,
  RotateCw,
  Layers,
  Activity,
  Upload,
} from 'lucide-react';
import type {
  AnimationActionName,
  ArtworkLayer3D,
  CameraPreset3D,
  Garment3DConfig,
  LightingConfig3D,
} from '../../types/threeD';
import { SceneManager3D } from '../../engine/3d/sceneManager';
import { ModelManager3D, type LoadedGarmentModel } from '../../engine/3d/modelManager';
import { MaterialManager3D } from '../../engine/3d/materialManager';
import { TextureCompositor3D } from '../../engine/3d/textureCompositor';
import { AnimationController3D } from '../../engine/3d/animationController';
import { SecondaryMotionController3D } from '../../engine/3d/secondaryMotion';
import {
  findPanelAtUV,
  findPanelById,
  type GarmentPanel3D,
} from '../../engine/3d/garmentPanels';

interface Viewport3DProps {
  garmentConfig: Garment3DConfig;
  garmentColor: string;
  roughness: number;
  metalness: number;
  artworkLayers: ArtworkLayer3D[];
  activeRegionId: string;
  selectedPanelId?: string | null;
  isAnimated: boolean;
  currentAction: AnimationActionName;
  isPlaying: boolean;
  playbackSpeed: number;
  secondaryMotionEnabled: boolean;
  lighting: LightingConfig3D;
  cameraPreset: CameraPreset3D;
  isTurntable: boolean;
  isUvEditorOpen?: boolean;
  onAnimatedToggle: () => void;
  onActionChange: (action: AnimationActionName) => void;
  onPlayToggle: () => void;
  onSpeedChange: (speed: number) => void;
  onSecondaryMotionToggle: () => void;
  onCameraPresetChange: (preset: CameraPreset3D) => void;
  onTurntableToggle: () => void;
  onToggleUvEditor?: () => void;
  onAddArtworkFromFile?: (file: File) => void;
  onSelectPanel?: (panelId: string | null) => void;
  onModelLoaded?: (mesh: THREE.SkinnedMesh | THREE.Mesh | null) => void;
  onSceneReady?: (sceneManager: SceneManager3D) => void;
}

export const Viewport3D: React.FC<Viewport3DProps> = ({
  garmentConfig,
  garmentColor,
  roughness,
  metalness,
  artworkLayers,
  activeRegionId,
  selectedPanelId,
  isAnimated,
  currentAction,
  isPlaying,
  playbackSpeed,
  secondaryMotionEnabled,
  lighting,
  cameraPreset,
  isTurntable,
  isUvEditorOpen,
  onAnimatedToggle,
  onActionChange,
  onPlayToggle,
  onSpeedChange,
  onSecondaryMotionToggle,
  onCameraPresetChange,
  onTurntableToggle,
  onToggleUvEditor,
  onAddArtworkFromFile,
  onSelectPanel,
  onModelLoaded,
  onSceneReady,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Engine singletons stored in refs
  const sceneManagerRef = useRef<SceneManager3D | null>(null);
  const modelManagerRef = useRef<ModelManager3D | null>(null);
  const materialManagerRef = useRef<MaterialManager3D | null>(null);
  const compositorRef = useRef<TextureCompositor3D | null>(null);
  const animControllerRef = useRef<AnimationController3D | null>(null);
  const secondaryMotionRef = useRef<SecondaryMotionController3D | null>(null);
  const garmentMeshRef = useRef<THREE.Mesh | THREE.SkinnedMesh | null>(null);

  const garmentConfigRef = useRef(garmentConfig);
  garmentConfigRef.current = garmentConfig;
  const onSelectPanelRef = useRef(onSelectPanel);
  onSelectPanelRef.current = onSelectPanel;
  const selectedPanelIdRef = useRef(selectedPanelId);
  selectedPanelIdRef.current = selectedPanelId;

  const isAnimatedRef = useRef(isAnimated);
  isAnimatedRef.current = isAnimated;
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;
  const scrubberInputRef = useRef<HTMLInputElement>(null);
  const scrubberTextRef = useRef<HTMLSpanElement>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [loadProgress, setLoadProgress] = useState<number>(0);

  // 1. Initialize Three.js Scene and Subsystems
  useEffect(() => {
    if (!containerRef.current) return;

    const sceneManager = new SceneManager3D(containerRef.current);
    const modelManager = new ModelManager3D();
    const materialManager = new MaterialManager3D();
    const compositor = new TextureCompositor3D(2048);
    compositor.setRenderer(sceneManager.renderer);
    const animController = new AnimationController3D();
    const secondaryMotion = new SecondaryMotionController3D();

    sceneManagerRef.current = sceneManager;
    modelManagerRef.current = modelManager;
    materialManagerRef.current = materialManager;
    compositorRef.current = compositor;
    animControllerRef.current = animController;
    secondaryMotionRef.current = secondaryMotion;

    if (onSceneReady) {
      onSceneReady(sceneManager);
    }

    // Pointer click raycasting on the 3D garment mesh
    const isDownPos = { x: 0, y: 0, time: 0 };
    const onDomPointerDown = (e: PointerEvent) => {
      isDownPos.x = e.clientX;
      isDownPos.y = e.clientY;
      isDownPos.time = performance.now();
    };
    const onDomPointerUp = (e: PointerEvent) => {
      const dx = e.clientX - isDownPos.x;
      const dy = e.clientY - isDownPos.y;
      const dt = performance.now() - isDownPos.time;
      // If user clicked (not dragged orbit control)
      if (Math.hypot(dx, dy) < 6 && dt < 450) {
        if (!garmentMeshRef.current || !sceneManagerRef.current) return;
        const { camera, renderer } = sceneManagerRef.current;
        const rect = renderer.domElement.getBoundingClientRect();
        const mouse = new THREE.Vector2(
          ((e.clientX - rect.left) / rect.width) * 2 - 1,
          -((e.clientY - rect.top) / rect.height) * 2 + 1
        );
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, camera);
        const hits = raycaster.intersectObject(garmentMeshRef.current, false);
        if (hits.length > 0 && hits[0].uv) {
          const uv = hits[0].uv;
          const panel = findPanelAtUV(garmentConfigRef.current.id, uv.x, uv.y);
          if (panel) {
            onSelectPanelRef.current?.(
              panel.id === selectedPanelIdRef.current ? null : panel.id
            );
            return;
          }
        }
      }
    };

    const domEl = sceneManager.renderer.domElement;
    domEl.addEventListener('pointerdown', onDomPointerDown);
    domEl.addEventListener('pointerup', onDomPointerUp);

    // Resize Observer
    const resizeObserver = new ResizeObserver(() => {
      sceneManager.handleResize();
    });
    resizeObserver.observe(containerRef.current);

    // Render & Animation Loop
    let lastTime = performance.now();
    let animFrameId: number;

    const tick = (now: number) => {
      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // 1. Advance skeletal animation & spring physics only when animating
      if (isAnimatedRef.current && isPlayingRef.current) {
        animController.update(delta);
        secondaryMotion.update(delta);
        const prog = animController.getProgress();
        if (scrubberInputRef.current) {
          scrubberInputRef.current.value = String(prog);
        }
        if (scrubberTextRef.current) {
          scrubberTextRef.current.textContent = `${Math.round(prog * 100)}%`;
        }
      } else if (isAnimatedRef.current) {
        secondaryMotion.update(delta);
      }

      // 2. Update scene and render (handles OrbitControls damping & camera transitions)
      sceneManager.update(delta);

      animFrameId = requestAnimationFrame(tick);
    };

    animFrameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animFrameId);
      domEl.removeEventListener('pointerdown', onDomPointerDown);
      domEl.removeEventListener('pointerup', onDomPointerUp);
      resizeObserver.disconnect();
      secondaryMotion.dispose();
      animController.dispose();
      compositor.dispose();
      materialManager.dispose();
      modelManager.dispose();
      sceneManager.dispose();
    };
  }, []);

  // 2. Handle Garment Model Switch
  useEffect(() => {
    let cancelled = false;

    async function switchGarment() {
      if (
        !sceneManagerRef.current ||
        !modelManagerRef.current ||
        !materialManagerRef.current ||
        !compositorRef.current ||
        !animControllerRef.current ||
        !secondaryMotionRef.current
      ) {
        return;
      }

      setLoading(true);
      setLoadProgress(10);

      try {
        const compositor = compositorRef.current;
        const materialManager = materialManagerRef.current;
        const modelManager = modelManagerRef.current;
        const sceneManager = sceneManagerRef.current;
        const animController = animControllerRef.current;
        const secondaryMotion = secondaryMotionRef.current;

        // 1. Load diffuse fabric texture for compositor
        await compositor.setDiffuseTexture(garmentConfig.textures.diffuse);
        if (cancelled) return;

        // 2. Setup PBR normal/roughness materials
        await materialManager.setupGarmentMaterials(garmentConfig, compositor);
        if (cancelled) return;

        // 3. Preload all existing artwork
        for (const layer of artworkLayers) {
          await compositor.preloadArtwork(layer.imageUrl);
        }

        // 4. Render initial UV texture canvas
        compositor.composite(garmentColor, artworkLayers, garmentConfig, activeRegionId);

        // 5. Load GLB Model
        setLoadProgress(40);
        const loadedModel: LoadedGarmentModel = await modelManager.loadGarment(
          garmentConfig,
          materialManager,
          (percent) => {
            if (!cancelled) setLoadProgress(40 + Math.round(percent * 0.5));
          }
        );
        if (cancelled) return;

        // 6. Add model to scene
        // Clear previous garment models from scene
        for (let i = sceneManager.scene.children.length - 1; i >= 0; i--) {
          const child = sceneManager.scene.children[i];
          if (child.name.includes('GarmentRoot') || child.type === 'Group') {
            sceneManager.scene.remove(child);
          }
        }
        loadedModel.root.name = `GarmentRoot_${garmentConfig.id}`;
        sceneManager.scene.add(loadedModel.root);

        // 7. Setup skeletal animation with static default
        animController.setup(loadedModel.root, loadedModel.masterClip, isAnimated);
        if (isAnimated) {
          animController.playAction(currentAction, 0);
          animController.setPlaying(isPlaying);
          animController.setSpeed(playbackSpeed);
        } else {
          animController.restoreRestPose();
        }

        // 8. Setup secondary motion bones
        secondaryMotion.setup(loadedModel.bones, garmentConfig.wiggleBoneNames);
        secondaryMotion.setEnabled(isAnimated && secondaryMotionEnabled);

        // 9. Frame camera to garment
        sceneManager.setCameraFraming(
          garmentConfig.cameraDefaults.target,
          garmentConfig.cameraDefaults.distance,
          garmentConfig.cameraDefaults.fov
        );

        // 10. Pass garment mesh to compositor for 3D surface projection & up to 2D UV Editor
        compositor.setGarmentMesh(loadedModel.garmentMesh);
        compositor.composite(garmentColor, artworkLayers, garmentConfig, activeRegionId);
        if (onModelLoaded) {
          onModelLoaded(loadedModel.garmentMesh);
        }

        setLoadProgress(100);
        setLoading(false);
      } catch (err) {
        console.error('[Viewport3D] Error switching garment:', err);
        if (!cancelled) setLoading(false);
      }
    }

    switchGarment();

    return () => {
      cancelled = true;
    };
  }, [garmentConfig.id]);

  // 3. Handle Garment Color, Artwork Layers, Material Updates, or Panel Highlight
  useEffect(() => {
    if (!compositorRef.current || !materialManagerRef.current) return;

    // Preload artwork if new and composite onto UV canvas
    async function updateTexture() {
      if (!compositorRef.current || !materialManagerRef.current) return;
      for (const layer of artworkLayers) {
        await compositorRef.current.preloadArtwork(layer.imageUrl);
      }
      const panel = selectedPanelId ? findPanelById(garmentConfig.id, selectedPanelId) : null;
      compositorRef.current.setHighlightPanel(panel);
      compositorRef.current.composite(
        garmentColor,
        artworkLayers,
        garmentConfig,
        activeRegionId,
        true
      );
      materialManagerRef.current.updateMaterialParams(roughness, metalness);
    }

    updateTexture();
  }, [
    garmentColor,
    artworkLayers,
    garmentConfig,
    roughness,
    metalness,
    activeRegionId,
    selectedPanelId,
  ]);

  const activePanel: GarmentPanel3D | null = useMemo(
    () => (selectedPanelId ? findPanelById(garmentConfig.id, selectedPanelId) : null),
    [garmentConfig.id, selectedPanelId]
  );

  // 4. Handle Lighting Updates
  useEffect(() => {
    if (sceneManagerRef.current) {
      sceneManagerRef.current.applyLighting(lighting);
    }
  }, [lighting]);

  // 5. Handle Animation Action & Playback Updates
  useEffect(() => {
    if (!animControllerRef.current || !secondaryMotionRef.current) return;
    if (isAnimated) {
      if (animControllerRef.current.getCurrentActionName() !== currentAction) {
        animControllerRef.current.playAction(currentAction, 0.3);
      }
      animControllerRef.current.setPlaying(isPlaying);
      animControllerRef.current.setSpeed(playbackSpeed);
      secondaryMotionRef.current.setEnabled(secondaryMotionEnabled);
    } else {
      animControllerRef.current.restoreRestPose();
      secondaryMotionRef.current.reset();
      secondaryMotionRef.current.setEnabled(false);
    }
  }, [isAnimated, currentAction, isPlaying, playbackSpeed, secondaryMotionEnabled]);

  // 6. Handle Secondary Motion Toggle
  useEffect(() => {
    if (secondaryMotionRef.current) {
      secondaryMotionRef.current.setEnabled(secondaryMotionEnabled);
    }
  }, [secondaryMotionEnabled]);

  // 7. Handle Camera Preset
  useEffect(() => {
    if (sceneManagerRef.current) {
      sceneManagerRef.current.setCameraPreset(cameraPreset);
    }
  }, [cameraPreset]);

  // 8. Handle Turntable Toggle
  useEffect(() => {
    if (sceneManagerRef.current) {
      sceneManagerRef.current.setTurntable(isTurntable);
    }
  }, [isTurntable]);

  const handleScrubberChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (scrubberTextRef.current) {
      scrubberTextRef.current.textContent = `${Math.round(val * 100)}%`;
    }
    if (animControllerRef.current) {
      animControllerRef.current.seekNormalized(val);
    }
  }, []);

  return (
    <div className="viewport-3d-wrapper" style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      {/* Three.js Canvas Container */}
      <div ref={containerRef} style={{ width: '100%', height: '100%', outline: 'none' }} />

      {/* Loading Overlay */}
      {loading && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(9, 11, 16, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 20,
            color: '#fff',
            gap: '12px',
          }}
        >
          <div className="spinner-border" style={{ width: '40px', height: '40px', border: '3px solid rgba(0,214,255,0.2)', borderTopColor: '#3B5EFF', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <div style={{ fontSize: '15px', fontWeight: 600 }}>Loading 3D {garmentConfig.name}...</div>
          <div style={{ width: '180px', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ width: `${loadProgress}%`, height: '100%', background: 'linear-gradient(90deg, #3B5EFF, #5B7EFF)', transition: 'width 0.2s ease' }} />
          </div>
        </div>
      )}

      {/* Floating Top Camera Presets Bar */}
      {/* Camera View Switcher Preset Bar */}
      <div
        id="camera-presets-bar"
        className="camera-presets-bar"
      >
        <span className="camera-presets-label">
          Views:
        </span>
        {(['front', 'back', 'left', 'right', 'threeQuarter'] as CameraPreset3D[]).map((p) => (
          <button
            key={p}
            onClick={() => onCameraPresetChange(p)}
            className={`camera-preset-btn ${cameraPreset === p ? 'active' : ''}`}
            title={`View ${p === 'threeQuarter' ? '3/4 Angle' : p}`}
          >
            {p === 'threeQuarter' ? (
              <>
                <span className="camera-view-full">3/4 View</span>
                <span className="camera-view-short">3/4</span>
              </>
            ) : (
              p
            )}
          </button>
        ))}

        <div className="camera-preset-divider" />

        {/* Turntable Auto-Rotate Toggle */}
        <button
          onClick={onTurntableToggle}
          title="Toggle Turntable 360° Auto-Rotate"
          className={`camera-preset-btn camera-preset-turntable ${isTurntable ? 'active' : ''}`}
        >
          <RotateCw size={13} className={isTurntable ? 'spin-slow' : ''} />
          <span>360°</span>
        </button>

        <div className="camera-preset-divider" />

        {/* Animate Garment Toggle */}
        <button
          id="toggle-animation-btn"
          onClick={onAnimatedToggle}
          title={isAnimated ? 'Disable Animation (Restore Static Neutral Pose)' : 'Enable Skeletal Animation'}
          className={`camera-preset-btn camera-preset-animate ${isAnimated ? 'active' : ''}`}
        >
          <Activity size={13} />
          <span className="camera-anim-full">{isAnimated ? 'Animating' : 'Animate'}</span>
          <span className="camera-anim-short">{isAnimated ? 'Anim' : 'Motion'}</span>
        </button>

        {onToggleUvEditor && (
          <button
            id="toggle-uv-editor-btn"
            onClick={onToggleUvEditor}
            title={isUvEditorOpen ? 'Hide 2D UV Editor' : 'Show 2D UV Editor'}
            className={`camera-preset-btn camera-preset-uv desktop-only-preset-uv ${isUvEditorOpen ? 'active' : ''}`}
          >
            <Layers size={13} />
            <span>UV Editor</span>
          </button>
        )}
      </div>

      {/* Floating Viewport Action Bar: Direct UV Editor & Upload Design buttons */}
      <div className="viewport-quick-actions" id="viewport-3d-quick-actions">
        {onAddArtworkFromFile && (
          <label className="quick-action-pill quick-action-upload" title="Upload custom graphic to 3D model">
            <Upload size={14} />
            <span className="quick-action-full">Upload Design</span>
            <span className="quick-action-short">Upload</span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  onAddArtworkFromFile(file);
                }
                e.target.value = '';
              }}
            />
          </label>
        )}

        {onToggleUvEditor && (
          <button
            type="button"
            className={`quick-action-pill quick-action-uv ${isUvEditorOpen ? 'active' : ''}`}
            onClick={onToggleUvEditor}
            title={isUvEditorOpen ? 'Close 2D UV Editor' : 'Open 2D UV Placement Editor'}
          >
            <Layers size={14} />
            <span>{isUvEditorOpen ? 'Close UV' : 'UV Editor'}</span>
          </button>
        )}
      </div>

      {/* Floating Bottom Animation Control Bar (Only visible when animation mode is ON) */}
      {isAnimated && (
        <div
          id="animation-control-bar"
          className="animation-control-bar"
          style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'min(92%, 620px)',
            background: 'rgba(15, 20, 30, 0.88)',
            backdropFilter: 'blur(12px)',
            padding: '10px 16px',
            borderRadius: '18px',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5)',
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          {/* Scrubber row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={onPlayToggle}
              style={{
                background: isPlaying ? 'rgba(255,255,255,0.12)' : 'var(--accent, #3B5EFF)',
                color: isPlaying ? '#fff' : '#000',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0,
              }}
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause size={15} /> : <Play size={15} style={{ marginLeft: '2px' }} />}
            </button>

            <input
              ref={scrubberInputRef}
              id="animation-timeline-scrubber"
              type="range"
              min={0}
              max={1}
              step={0.002}
              defaultValue={0}
              onChange={handleScrubberChange}
              style={{
                flex: 1,
                accentColor: 'var(--accent, #3B5EFF)',
                cursor: 'pointer',
              }}
            />
            <span
              ref={scrubberTextRef}
              style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace', minWidth: '38px', textAlign: 'right' }}
            >
              0%
            </span>
          </div>

          {/* Action Selectors & Speeds */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
            {/* 6 Actions */}
            <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', scrollbarWidth: 'none', maxWidth: '100%', WebkitOverflowScrolling: 'touch' }}>
              {(['IDLE', 'WALK', 'DANCE', 'RUN', 'FIGHTER', 'STRUT'] as AnimationActionName[]).map((act) => (
                <button
                  key={act}
                  onClick={() => onActionChange(act)}
                  style={{
                    background: currentAction === act ? 'rgba(0, 214, 255, 0.22)' : 'rgba(255, 255, 255, 0.05)',
                    color: currentAction === act ? '#3B5EFF' : 'var(--text-muted)',
                    border: currentAction === act ? '1px solid rgba(0, 214, 255, 0.5)' : '1px solid transparent',
                    borderRadius: '12px',
                    padding: '3px 8px',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.12s ease',
                  }}
                >
                  {act}
                </button>
              ))}
            </div>

            {/* Secondary Motion & Speed Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={onSecondaryMotionToggle}
                title="Toggle secondary bone spring movement (WiggleBone physics)"
                style={{
                  background: secondaryMotionEnabled ? 'rgba(0, 255, 170, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                  color: secondaryMotionEnabled ? '#10b981' : 'var(--text-muted)',
                  border: secondaryMotionEnabled ? '1px solid rgba(0, 255, 170, 0.4)' : '1px solid transparent',
                  borderRadius: '12px',
                  padding: '3px 8px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Activity size={12} />
                <span>Spring Bones</span>
              </button>

              {/* Speed Pills */}
              <div style={{ display: 'flex', background: 'rgba(255,255,255,0.06)', borderRadius: '10px', padding: '2px' }}>
                {[0.5, 1.0, 1.5].map((s) => (
                  <button
                    key={s}
                    onClick={() => onSpeedChange(s)}
                    style={{
                      background: playbackSpeed === s ? 'var(--accent, #3B5EFF)' : 'transparent',
                      color: playbackSpeed === s ? '#000' : 'var(--text-muted)',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '2px 6px',
                      fontSize: '10px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating 3D Selected Panel Info Badge */}
      {activePanel && (
        <div
          id="active-panel-info-pill"
          style={{
            position: 'absolute',
            bottom: isAnimated ? '110px' : '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'rgba(15, 20, 30, 0.92)',
            backdropFilter: 'blur(12px)',
            padding: '8px 16px',
            borderRadius: '24px',
            border: `1.5px solid ${activePanel.color}`,
            boxShadow: `0 8px 32px rgba(0, 0, 0, 0.5), 0 0 16px ${activePanel.color}33`,
            zIndex: 15,
            color: '#fff',
            pointerEvents: 'auto',
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: activePanel.color,
              boxShadow: `0 0 8px ${activePanel.color}`,
              flexShrink: 0,
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.02em' }}>
              {activePanel.name}
            </span>
            {activePanel.description && (
              <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.7)' }}>
                {activePanel.description}
              </span>
            )}
          </div>
          <button
            onClick={() => onSelectPanel?.(null)}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '12px',
              color: 'rgba(255, 255, 255, 0.8)',
              padding: '3px 8px',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              marginLeft: '6px',
            }}
            title="Clear Panel Selection"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
};


