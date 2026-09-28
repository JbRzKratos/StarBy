import * as THREE from 'three';

interface BoneSpringState {
  bone: THREE.Bone;
  restPosition: THREE.Vector3;
  restRotation: THREE.Euler;
  currentPos: THREE.Vector3;
  targetPos: THREE.Vector3;
  velocity: THREE.Vector3;
  worldPos: THREE.Vector3;
  prevWorldPos: THREE.Vector3;
  stiffness: number;
  damping: number;
}

export class SecondaryMotionController3D {
  private springs: BoneSpringState[] = [];
  private enabled = true;
  private tempVec = new THREE.Vector3();

  public setup(bones: THREE.Bone[], targetBoneNames?: string[]): void {
    this.dispose();

    if (!bones || bones.length === 0) return;

    const matchedBones: THREE.Bone[] = [];

    if (targetBoneNames && targetBoneNames.length > 0) {
      const nameSet = new Set(targetBoneNames.map((n) => n.toLowerCase()));
      for (const bone of bones) {
        if (nameSet.has(bone.name.toLowerCase())) {
          matchedBones.push(bone);
        }
      }
    }

    // Fallback: look for generic secondary bone patterns like Bone1..Bone8
    if (matchedBones.length === 0) {
      for (const bone of bones) {
        const lower = bone.name.toLowerCase();
        if (
          lower.includes('bone1') ||
          lower.includes('bone2') ||
          lower.includes('bone3') ||
          lower.includes('bone4') ||
          lower.includes('bone5') ||
          lower.includes('bone6') ||
          lower.includes('bone7') ||
          lower.includes('bone8')
        ) {
          matchedBones.push(bone);
        }
      }
    }

    for (const bone of matchedBones) {
      const worldPos = new THREE.Vector3();
      bone.getWorldPosition(worldPos);

      this.springs.push({
        bone,
        restPosition: bone.position.clone(),
        restRotation: bone.rotation.clone(),
        currentPos: worldPos.clone(),
        targetPos: worldPos.clone(),
        velocity: new THREE.Vector3(0, 0, 0),
        worldPos: worldPos.clone(),
        prevWorldPos: worldPos.clone(),
        stiffness: 450,
        damping: 48,
      });
    }
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.reset();
    }
  }

  public getEnabled(): boolean {
    return this.enabled;
  }

  public update(deltaTime: number): void {
    if (!this.enabled || this.springs.length === 0) return;

    // Clamp dt to avoid instability on frame drops
    const dt = Math.min(deltaTime, 0.05);

    for (const spring of this.springs) {
      const bone = spring.bone;
      bone.getWorldPosition(spring.targetPos);

      // Spring physics: force = displacement * stiffness - velocity * damping
      this.tempVec.subVectors(spring.targetPos, spring.currentPos);
      const accelX = this.tempVec.x * spring.stiffness - spring.velocity.x * spring.damping;
      const accelY = this.tempVec.y * spring.stiffness - spring.velocity.y * spring.damping;
      const accelZ = this.tempVec.z * spring.stiffness - spring.velocity.z * spring.damping;

      spring.velocity.x += accelX * dt;
      spring.velocity.y += accelY * dt;
      spring.velocity.z += accelZ * dt;

      spring.currentPos.x += spring.velocity.x * dt;
      spring.currentPos.y += spring.velocity.y * dt;
      spring.currentPos.z += spring.velocity.z * dt;

      // Subtle rotation adjustment proportional to spring lag
      const lagX = (spring.targetPos.x - spring.currentPos.x) * 0.08;
      const lagZ = (spring.targetPos.z - spring.currentPos.z) * 0.08;

      // Layer secondary motion on top of current animated bone rotation
      // rather than overwriting with static rest rotation.
      bone.rotation.x += THREE.MathUtils.clamp(lagZ, -0.25, 0.25);
      bone.rotation.z += THREE.MathUtils.clamp(-lagX, -0.25, 0.25);
    }
  }

  public reset(): void {
    for (const spring of this.springs) {
      spring.bone.rotation.copy(spring.restRotation);
      spring.velocity.set(0, 0, 0);
      spring.bone.getWorldPosition(spring.currentPos);
      spring.targetPos.copy(spring.currentPos);
    }
  }

  public dispose(): void {
    this.reset();
    this.springs = [];
  }
}
