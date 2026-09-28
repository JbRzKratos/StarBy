import * as THREE from 'three';
import type { AnimationActionName } from '../../types/threeD';

export interface ActionFrameRange {
  name: AnimationActionName;
  startFrame: number;
  endFrame: number;
  fps: number;
}

export const ANIMATION_ACTION_RANGES: ActionFrameRange[] = [
  { name: 'IDLE', startFrame: 0, endFrame: 2, fps: 30 },
  { name: 'WALK', startFrame: 3, endFrame: 34, fps: 30 },
  { name: 'DANCE', startFrame: 35, endFrame: 70, fps: 30 },
  { name: 'RUN', startFrame: 71, endFrame: 114, fps: 30 },
  { name: 'FIGHTER', startFrame: 115, endFrame: 281, fps: 30 },
  { name: 'STRUT', startFrame: 282, endFrame: 327, fps: 30 },
];

export class AnimationController3D {
  private mixer: THREE.AnimationMixer | null = null;
  private actions: Map<AnimationActionName, THREE.AnimationAction> = new Map();
  private currentActionName: AnimationActionName = 'WALK';
  private currentAction: THREE.AnimationAction | null = null;
  private masterClip: THREE.AnimationClip | null = null;
  private root: THREE.Object3D | null = null;
  private isPlaying = false;
  private speed = 1.0;

  // Immutable cache of neutral rest transforms captured before playing any animation
  private restBoneTransforms: Map<
    string,
    { position: THREE.Vector3; quaternion: THREE.Quaternion; scale: THREE.Vector3 }
  > = new Map();

  // Procedural breathing state (IDLE only)
  private breathTime = 0;

  // Root motion compensation: cache initial hips X/Z each time we set up
  private hipsBone: THREE.Bone | null = null;
  private hipsInitialX = 0;
  private hipsInitialZ = 0;

  public setup(
    root: THREE.Object3D,
    masterClip: THREE.AnimationClip | null,
    startAnimated = false
  ): void {
    this.dispose();

    this.root = root;

    // ─────────────────────────────────────────────────────────────────────────
    // Capture authentic neutral rest transforms BEFORE touching the mixer or
    // evaluating any clips. This ensures we can cleanly return to the authentic
    // garment pose when animation is turned off or when switching garments.
    // ─────────────────────────────────────────────────────────────────────────
    const bones: THREE.Bone[] = [];
    root.traverse((child) => {
      if ((child as unknown as { isBone?: boolean }).isBone) {
        const bone = child as THREE.Bone;
        bones.push(bone);
        this.restBoneTransforms.set(bone.name, {
          position: bone.position.clone(),
          quaternion: bone.quaternion.clone(),
          scale: bone.scale.clone(),
        });
      }
    });

    if (!masterClip) {
      console.warn('[AnimationController3D] No master animation clip found');
      return;
    }

    this.masterClip = masterClip;
    this.mixer = new THREE.AnimationMixer(root);

    // Find Hips bone for root-motion stabilization
    const exactHips = bones.find(
      (b) => b.name === 'mixamorig:Hips' || b.name === 'mixamorig_Hips' || b.name === 'Hips'
    );
    const anyHips = bones.find((b) => b.name.toLowerCase().includes('hips'));
    const targetHips = exactHips || anyHips || null;

    this.hipsBone = targetHips;
    if (targetHips) {
      this.hipsInitialX = targetHips.position.x;
      this.hipsInitialZ = targetHips.position.z;
    }

    // Build the 6 subclips from the master animation strip.
    for (const range of ANIMATION_ACTION_RANGES) {
      try {
        const subclip = THREE.AnimationUtils.subclip(
          masterClip,
          range.name,
          range.startFrame,
          range.endFrame,
          range.fps
        );

        if (subclip.tracks.length === 0) continue;

        const action = this.mixer.clipAction(subclip);
        action.setLoop(THREE.LoopRepeat, Infinity);
        action.clampWhenFinished = false;
        action.enabled = true;
        action.weight = 0;
        this.actions.set(range.name, action);
      } catch (err) {
        console.warn(`[AnimationController3D] Failed to create subclip for ${range.name}:`, err);
      }
    }

    if (startAnimated) {
      this.isPlaying = true;
      this.playAction(this.currentActionName, 0);
    } else {
      this.isPlaying = false;
      this.restoreRestPose();
    }
  }

  /**
   * Restores the complete neutral/rest transform state across all bones,
   * stops active mixer actions, clears root drift, and recalculates skeleton matrices.
   */
  public restoreRestPose(): void {
    if (this.mixer) {
      this.mixer.stopAllAction();
    }

    this.actions.forEach((action) => {
      action.weight = 0;
      action.time = 0;
    });

    if (this.root) {
      this.root.traverse((child) => {
        if ((child as unknown as { isBone?: boolean }).isBone) {
          const bone = child as THREE.Bone;
          const rest = this.restBoneTransforms.get(bone.name);
          if (rest) {
            bone.position.copy(rest.position);
            bone.quaternion.copy(rest.quaternion);
            bone.scale.copy(rest.scale);
          }
        }
      });

      this.root.traverse((child) => {
        const skinned = child as THREE.SkinnedMesh;
        if (skinned.isSkinnedMesh && skinned.skeleton) {
          skinned.skeleton.update();
        }
      });

      this.root.updateMatrixWorld(true);
    }

    if (this.hipsBone) {
      this.hipsBone.position.x = this.hipsInitialX;
      this.hipsBone.position.z = this.hipsInitialZ;
    }

    this.breathTime = 0;
  }

  public playAction(name: AnimationActionName, crossfadeDuration = 0.3): void {
    const nextAction = this.actions.get(name);
    if (!nextAction) {
      console.warn('[AnimationController3D] Action not found:', name);
      return;
    }

    if (this.currentAction && this.currentAction !== nextAction) {
      if (crossfadeDuration > 0 && this.isPlaying) {
        nextAction.time = 0;
        nextAction.enabled = true;
        this.currentAction.crossFadeTo(nextAction, crossfadeDuration, true);
      } else {
        this.currentAction.weight = 0;
        nextAction.weight = 1;
        nextAction.time = 0;
      }
    } else {
      nextAction.weight = 1;
      nextAction.time = 0;
    }

    this.currentAction = nextAction;
    this.currentActionName = name;
    this.currentAction.timeScale = this.isPlaying ? this.speed : 0;
    this.currentAction.play();

    // Reset breathing timer when leaving IDLE
    if (name !== 'IDLE') {
      this.breathTime = 0;
    }
  }

  public setPlaying(playing: boolean): void {
    this.isPlaying = playing;
    if (this.currentAction) {
      this.currentAction.timeScale = playing ? this.speed : 0;
      if (playing) {
        this.currentAction.weight = 1;
        this.currentAction.play();
      }
    }
  }

  public setSpeed(speed: number): void {
    this.speed = Math.max(0.1, Math.min(3.0, speed));
    if (this.currentAction && this.isPlaying) {
      this.currentAction.timeScale = this.speed;
    }
  }

  public seekNormalized(progress: number): void {
    if (!this.currentAction || !this.mixer) return;
    const duration = this.currentAction.getClip().duration;
    const targetTime = THREE.MathUtils.clamp(progress, 0, 1) * duration;
    // Manually advance to target time
    this.currentAction.time = targetTime;
    // Force mixer eval at the new time without advancing
    this.mixer.update(0);
  }

  public getProgress(): number {
    if (!this.currentAction) return 0;
    const duration = this.currentAction.getClip().duration;
    if (duration <= 0) return 0;
    return (this.currentAction.time % duration) / duration;
  }

  public update(delta: number): void {
    if (!this.mixer) return;

    const effectiveDelta = this.isPlaying ? delta * this.speed : 0;

    // ─────────────────────────────────────────────────────────────────────────
    // NOTE: We advance the mixer with the raw delta (mixer handles timeScale
    // internally via action.timeScale). Don't multiply by speed here since
    // we already set action.timeScale = speed.
    // ─────────────────────────────────────────────────────────────────────────
    this.mixer.update(this.isPlaying ? delta : 0);

    // Root-motion stabilization: prevent character from walking out of frame.
    // We null out horizontal (X/Z) drift on the hips while preserving vertical
    // bobbing (Y) and all rotations.
    if (this.hipsBone && this.currentActionName !== 'IDLE') {
      this.hipsBone.position.x = this.hipsInitialX;
      this.hipsBone.position.z = this.hipsInitialZ;
    }

    // Procedural subtle chest breathing when IDLE.
    // Apply AFTER mixer update so we layer on top of the static IDLE pose.
    if (this.currentActionName === 'IDLE' && this.hipsBone) {
      this.breathTime += effectiveDelta;
      const phase = Math.sin(this.breathTime * 1.2 * Math.PI * 2);

      // Modulate hips Y position slightly
      const baseY = this.hipsBone.position.y;
      this.hipsBone.position.y = baseY + phase * 0.03;
    }
  }

  public getCurrentActionName(): AnimationActionName {
    return this.currentActionName;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getSpeed(): number {
    return this.speed;
  }

  public getMixer(): THREE.AnimationMixer | null {
    return this.mixer;
  }

  public getMasterClip(): THREE.AnimationClip | null {
    return this.masterClip;
  }

  public dispose(): void {
    this.breathTime = 0;
    if (this.mixer) {
      this.mixer.stopAllAction();
      this.mixer = null;
    }
    this.actions.clear();
    this.restBoneTransforms.clear();
    this.root = null;
    this.currentAction = null;
    this.masterClip = null;
    this.hipsBone = null;
  }
}
