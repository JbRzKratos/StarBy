import * as THREE from 'three';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { Garment3DConfig } from '../../types/threeD';
import type { MaterialManager3D } from './materialManager';

export interface LoadedGarmentModel {
  root: THREE.Group;
  garmentMesh: THREE.SkinnedMesh | THREE.Mesh | null;
  neckTagMesh: THREE.SkinnedMesh | THREE.Mesh | null;
  masterClip: THREE.AnimationClip | null;
  positionNode: THREE.Object3D | null;
  skeleton: THREE.Skeleton | null;
  bones: THREE.Bone[];
}

/**
 * Classifies garment mesh vertices into outer shell (0.0) vs inner lining (1.0).
 *
 * Garment models (Marvelous Designer / Clo3D / Blender solidify exports) are constructed
 * with an outer fabric shell and an inner fabric lining that share identical UV coordinates.
 * By classifying each vertex as outer (0.0) or inner (1.0), the garment material shader
 * can restrict user uploaded artwork exclusively to the outside of the clothing, while
 * keeping the interior clean with realistic base fabric and authentic fold shading.
 */
export function classifyGarmentMeshGeometry(geometry: THREE.BufferGeometry): Float32Array {
  const pos = geometry.attributes.position;
  const norm = geometry.attributes.normal;
  const uv = geometry.attributes.uv;
  if (!pos || !norm || !uv) {
    return new Float32Array(pos ? pos.count : 0);
  }

  const count = pos.count;
  const isInner = new Float32Array(count);
  isInner.fill(-1); // -1 = unclassified

  // Step 1: Group vertices by UV coordinate (quantized to 4 decimal places)
  const uvMap = new Map<string, number[]>();
  for (let i = 0; i < count; i++) {
    const key = `${Math.round(uv.getX(i) * 10000)}_${Math.round(uv.getY(i) * 10000)}`;
    let list = uvMap.get(key);
    if (!list) {
      list = [];
      uvMap.set(key, list);
    }
    list.push(i);
  }

  // Step 2: Compare pairs sharing UV coordinates across fabric thickness
  const pA = new THREE.Vector3();
  const pB = new THREE.Vector3();
  const nA = new THREE.Vector3();
  const nB = new THREE.Vector3();
  const dir = new THREE.Vector3();

  for (const list of uvMap.values()) {
    if (list.length === 2) {
      const iA = list[0];
      const iB = list[1];
      pA.set(pos.getX(iA), pos.getY(iA), pos.getZ(iA));
      pB.set(pos.getX(iB), pos.getY(iB), pos.getZ(iB));
      nA.set(norm.getX(iA), norm.getY(iA), norm.getZ(iA));
      nB.set(norm.getX(iB), norm.getY(iB), norm.getZ(iB));

      dir.subVectors(pA, pB);
      const dotA = dir.dot(nA);
      const dotB = dir.dot(nB);

      if (dotA > 0 && dotB < 0) {
        isInner[iA] = 0.0;
        isInner[iB] = 1.0;
      } else if (dotA < 0 && dotB > 0) {
        isInner[iA] = 1.0;
        isInner[iB] = 0.0;
      }
    }
  }

  // Step 3: Propagate classification across connected triangles to resolve seams & cuffs
  const index = geometry.index;
  if (index) {
    for (let pass = 0; pass < 5; pass++) {
      let changed = false;
      for (let t = 0; t < index.count; t += 3) {
        const i0 = index.getX(t);
        const i1 = index.getX(t + 1);
        const i2 = index.getX(t + 2);
        const v0 = isInner[i0];
        const v1 = isInner[i1];
        const v2 = isInner[i2];

        if (v0 === -1 && v1 !== -1 && v1 === v2) { isInner[i0] = v1; changed = true; }
        if (v1 === -1 && v0 !== -1 && v0 === v2) { isInner[i1] = v0; changed = true; }
        if (v2 === -1 && v0 !== -1 && v0 === v1) { isInner[i2] = v0; changed = true; }
      }
      if (!changed) break;
    }
  }

  // Step 4: Any remaining seam edge vertices default to outer (0.0)
  for (let i = 0; i < count; i++) {
    if (isInner[i] === -1) {
      isInner[i] = 0.0;
    }
  }

  return isInner;
}

export class ModelManager3D {
  private loader: GLTFLoader;
  private currentModel: LoadedGarmentModel | null = null;
  private loadCache: Map<string, GLTF> = new Map();

  constructor() {
    this.loader = new GLTFLoader();
  }

  public async loadGarment(
    garmentConfig: Garment3DConfig,
    materialManager: MaterialManager3D,
    onProgress?: (percent: number) => void
  ): Promise<LoadedGarmentModel> {
    // 1. Dispose previous active model if any
    if (this.currentModel) {
      this.disposeModel(this.currentModel);
      this.currentModel = null;
    }

    // 2. Load GLTF
    const gltf = await this.fetchGLTF(garmentConfig.modelPath, onProgress);

    // ─────────────────────────────────────────────────────────────────
    // CRITICAL FIX: Use SkeletonUtils.clone() instead of scene.clone(true).
    // scene.clone(true) does NOT rewire SkinnedMesh.skeleton to the cloned
    // bones – the skinned meshes still reference the original (shared) skeleton.
    // SkeletonUtils.clone() deep-clones the hierarchy AND remaps all bone
    // references so that each clone has its own independent skeleton.
    // ─────────────────────────────────────────────────────────────────
    const sceneClone = SkeletonUtils.clone(gltf.scene) as THREE.Group;

    let garmentMesh: THREE.SkinnedMesh | THREE.Mesh | null = null;
    let neckTagMesh: THREE.SkinnedMesh | THREE.Mesh | null = null;
    let positionNode: THREE.Object3D | null = null;
    let skeleton: THREE.Skeleton | null = null;
    const bones: THREE.Bone[] = [];

    // 3. Find nodes & configure meshes
    sceneClone.traverse((child) => {
      // Find ModelPosition node and center it to (0, 0, 0)
      if (
        child.name === garmentConfig.positionNodeName ||
        child.name.startsWith('ModelPosition')
      ) {
        positionNode = child;
        child.position.set(0, 0, 0);
      }

      // Collect bones
      if ((child as THREE.Bone).isBone) {
        bones.push(child as THREE.Bone);
      }

      // Find meshes
      if ((child as THREE.SkinnedMesh).isSkinnedMesh || (child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.SkinnedMesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        // IMPORTANT: do NOT frustum cull skinned meshes — their bounding box doesn't
        // update with bone transforms and they get incorrectly culled mid-animation.
        mesh.frustumCulled = false;

        if (mesh.geometry) {
          mesh.geometry.computeBoundingBox();
          mesh.geometry.computeBoundingSphere();
        }

        if ((mesh as THREE.SkinnedMesh).isSkinnedMesh && (mesh as THREE.SkinnedMesh).skeleton && !skeleton) {
          skeleton = (mesh as THREE.SkinnedMesh).skeleton;
        }

        // Match NeckTag first (before garment fallback)
        if (
          garmentConfig.neckTagNodeName &&
          (child.name === garmentConfig.neckTagNodeName || child.name.includes('NeckTag'))
        ) {
          neckTagMesh = mesh;
          mesh.material = materialManager.getNeckTagMaterial();
        } else if (
          !garmentMesh && (
            child.name === garmentConfig.garmentNodeName ||
            child.name === 'Stick'  // Regular T-Shirt uses 'Stick' as the mesh name
          )
        ) {
          garmentMesh = mesh;
          mesh.material = materialManager.getGarmentMaterial();
        }
      }
    });

    // Fallback: find the largest non-NeckTag skinned mesh
    if (!garmentMesh) {
      let largestVertexCount = 0;
      sceneClone.traverse((child) => {
        if (
          child !== neckTagMesh &&
          ((child as THREE.SkinnedMesh).isSkinnedMesh || (child as THREE.Mesh).isMesh) &&
          (child as THREE.Mesh).geometry
        ) {
          const mesh = child as THREE.Mesh;
          const vertCount = mesh.geometry.attributes.position?.count ?? 0;
          if (vertCount > largestVertexCount) {
            largestVertexCount = vertCount;
            garmentMesh = mesh;
          }
        }
      });
      if (garmentMesh) {
        const gMesh = garmentMesh as THREE.Mesh;
        gMesh.material = materialManager.getGarmentMaterial();
        console.log('[ModelManager3D] Garment fallback selected:', gMesh.name);
      }
    }

    // ─────────────────────────────────────────────────────────────────
    // Compute and assign aInner attribute so shader isolates artwork
    // to the outer garment surface while preserving inner fabric.
    // ─────────────────────────────────────────────────────────────────
    const targetMesh = garmentMesh as THREE.Mesh | THREE.SkinnedMesh | null;
    if (targetMesh && targetMesh.geometry) {
      if (!targetMesh.geometry.attributes.aInner) {
        const isInnerArray = classifyGarmentMeshGeometry(targetMesh.geometry);
        targetMesh.geometry.setAttribute('aInner', new THREE.BufferAttribute(isInnerArray, 1));
      }
    }

    // Ensure all meshes sharing garmentMaterial have the attribute
    sceneClone.traverse((child) => {
      if (((child as THREE.SkinnedMesh).isSkinnedMesh || (child as THREE.Mesh).isMesh) && (child as THREE.Mesh).geometry) {
        const m = child as THREE.Mesh;
        if (m.material === materialManager.getGarmentMaterial() && !m.geometry.attributes.aInner) {
          const arr = new Float32Array(m.geometry.attributes.position ? m.geometry.attributes.position.count : 0);
          m.geometry.setAttribute('aInner', new THREE.BufferAttribute(arr, 1));
        }
      }
    });

    // Ensure ModelPosition is at origin
    if (positionNode) {
      (positionNode as THREE.Object3D).position.set(0, 0, 0);
      (positionNode as THREE.Object3D).updateMatrixWorld(true);
    }

    // Center the model horizontally (X/Z) so all garments (including those
    // modeled with world X offsets in Blender, such as Oversized_T-Shirt at X=14.9)
    // are perfectly centered on the turntable at (0, y, 0).
    sceneClone.updateMatrixWorld(true);
    const bbox = new THREE.Box3().setFromObject(sceneClone);
    if (!bbox.isEmpty()) {
      const center = bbox.getCenter(new THREE.Vector3());
      sceneClone.position.x -= center.x;
      sceneClone.position.z -= center.z;
      sceneClone.updateMatrixWorld(true);
    }

    // 4. Extract Master Animation Clip from the ORIGINAL gltf (not the clone)
    // Animations in GLTF reference node indices; use the original scene's node names
    // to remap tracks to the cloned hierarchy.
    let masterClip: THREE.AnimationClip | null = null;
    if (gltf.animations && gltf.animations.length > 0) {
      const rawClip =
        gltf.animations.find((a) => a.name === garmentConfig.masterClipName) ||
        gltf.animations.find((a) => a.name.startsWith('WALK')) ||
        gltf.animations[0];

      if (rawClip) {
        // Clone the clip so we don't mutate the cached original
        masterClip = rawClip.clone();
      }
    }

    this.currentModel = {
      root: sceneClone,
      garmentMesh,
      neckTagMesh,
      masterClip,
      positionNode,
      skeleton,
      bones,
    };

    return this.currentModel;
  }

  private fetchGLTF(url: string, onProgress?: (percent: number) => void): Promise<GLTF> {
    if (this.loadCache.has(url)) {
      return Promise.resolve(this.loadCache.get(url)!);
    }
    return new Promise((resolve, reject) => {
      this.loader.load(
        url,
        (gltf) => {
          // Bounded cache (keep up to 4 models in memory for fast switching)
          if (this.loadCache.size >= 4) {
            const firstKey = this.loadCache.keys().next().value;
            if (firstKey) this.loadCache.delete(firstKey);
          }
          this.loadCache.set(url, gltf);
          resolve(gltf);
        },
        (xhr) => {
          if (xhr.lengthComputable && onProgress) {
            onProgress(Math.round((xhr.loaded / xhr.total) * 100));
          }
        },
        (err) => reject(err)
      );
    });
  }

  public disposeModel(model: LoadedGarmentModel): void {
    model.root.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.geometry) {
          mesh.geometry.dispose();
        }
        // Note: do not dispose shared materials — they are managed by MaterialManager
      }
    });
  }

  public getCurrentModel(): LoadedGarmentModel | null {
    return this.currentModel;
  }

  public dispose(): void {
    if (this.currentModel) {
      this.disposeModel(this.currentModel);
      this.currentModel = null;
    }
    this.loadCache.clear();
  }
}
