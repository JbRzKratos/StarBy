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
