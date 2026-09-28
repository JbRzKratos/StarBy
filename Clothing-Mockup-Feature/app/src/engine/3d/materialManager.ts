import * as THREE from 'three';
import type { Garment3DConfig } from '../../types/threeD';
import type { TextureCompositor3D } from './textureCompositor';

export class MaterialManager3D {
  private textureLoader: THREE.TextureLoader;
  private textureCache: Map<string, THREE.Texture> = new Map();
  private garmentMaterial: THREE.MeshStandardMaterial;
  private neckTagMaterial: THREE.MeshStandardMaterial;

  private microNormalTexture: THREE.Texture | null = null;
  private microNormalUniforms: {
    uMicroNormalMap: { value: THREE.Texture | null };
    uMicroNormalScale: { value: THREE.Vector2 };
    uMicroNormalRepeat: { value: THREE.Vector2 };
  } = {
    uMicroNormalMap: { value: null },
    uMicroNormalScale: { value: new THREE.Vector2(0.35, 0.35) },
    uMicroNormalRepeat: { value: new THREE.Vector2(28.0, 28.0) },
  };

  constructor() {
    this.textureLoader = new THREE.TextureLoader();

    // Default matte garment material — no textures until setupGarmentMaterials is called.
    // roughness=0.85 matches cotton fabric (reference Principled BSDF roughness ~0.82).
    this.garmentMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,   // color tinting is done inside the compositor canvas
      roughness: 0.85,
      metalness: 0.0,
      side: THREE.FrontSide,  // garments are double-sided in the GLB via material flag
      shadowSide: THREE.FrontSide,
    });

    // Inject fabric microdetail weave blending into the standard normal map chunk.
    // Uses Whiteout Normal Blending to combine the macro garment normal map
    // (large wrinkles, seams, and folds) with the fine micro-normal fabric weave.
    this.garmentMaterial.onBeforeCompile = (shader) => {
      shader.uniforms.uMicroNormalMap = this.microNormalUniforms.uMicroNormalMap;
      shader.uniforms.uMicroNormalScale = this.microNormalUniforms.uMicroNormalScale;
      shader.uniforms.uMicroNormalRepeat = this.microNormalUniforms.uMicroNormalRepeat;

      shader.fragmentShader =
        '#define USE_MICRO_NORMAL\n' +
        'uniform sampler2D uMicroNormalMap;\n' +
        'uniform vec2 uMicroNormalScale;\n' +
        'uniform vec2 uMicroNormalRepeat;\n' +
        shader.fragmentShader;

      shader.fragmentShader = shader.fragmentShader.replace(
        'mapN.xy *= normalScale;',
        `mapN.xy *= normalScale;
#ifdef USE_MICRO_NORMAL
  if (uMicroNormalScale.x > 0.0) {
    vec3 microN = texture2D(uMicroNormalMap, vNormalMapUv * uMicroNormalRepeat).xyz * 2.0 - 1.0;
    microN.xy *= uMicroNormalScale;
    // Whiteout normal blending: combines macro garment folds with fine fabric weave
    mapN = normalize(vec3(mapN.xy + microN.xy, mapN.z * microN.z));
  }
#endif`
      );
    };

    // Ensure Three.js tracks custom shader program compilation
    this.garmentMaterial.customProgramCacheKey = () => 'garment_material_micro_normal_v2';

    // Clean neutral material for inner collar / neck tags
    this.neckTagMaterial = new THREE.MeshStandardMaterial({
      color: 0xe8e8e8,
      roughness: 0.9,
      metalness: 0.0,
      side: THREE.DoubleSide,
    });

    // Preload fabric microdetail texture
    this.initMicroNormal();
  }

  private async initMicroNormal(): Promise<void> {
    try {
      const tex = await this.loadTexture('/3d-assets/NormalFabric.jpg', false);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.flipY = false;
      tex.generateMipmaps = true;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.anisotropy = 4;
      this.microNormalTexture = tex;
      this.microNormalUniforms.uMicroNormalMap.value = tex;
      this.garmentMaterial.needsUpdate = true;
    } catch (err) {
      console.warn('[MaterialManager3D] Failed to load fabric micro-normal:', err);
    }
  }

  public getGarmentMaterial(): THREE.MeshStandardMaterial {
    return this.garmentMaterial;
  }

  public getNeckTagMaterial(): THREE.MeshStandardMaterial {
    return this.neckTagMaterial;
  }

  public getMicroNormalTexture(): THREE.Texture | null {
    return this.microNormalTexture;
  }

  public setMicroNormalScale(scale: number): void {
    const s = Math.max(0, Math.min(2.0, scale));
    this.microNormalUniforms.uMicroNormalScale.value.set(s, s);
  }

  public setMicroNormalRepeat(repeat: number): void {
    const r = Math.max(4.0, Math.min(64.0, repeat));
    this.microNormalUniforms.uMicroNormalRepeat.value.set(r, r);
  }

  public async setupGarmentMaterials(
    garmentConfig: Garment3DConfig,
    compositor: TextureCompositor3D
  ): Promise<void> {
    // ─────────────────────────────────────────────────────────────────────────
    // 1. Assign composite canvas texture as the garment baseColor map.
    //    The compositor already incorporates: garment color tint + diffuse
    //    texture shading + artwork layers. This single canvas texture feeds
    //    into the PBR baseColor, matching the reference Verge3D material graph
    //    where a CanvasTexture replaced the VTLogo.png slot which feeds the
    //    Principled BSDF.baseColor input.
    // ─────────────────────────────────────────────────────────────────────────
    this.garmentMaterial.map = compositor.getTexture();
    this.garmentMaterial.map.needsUpdate = true;

    // 2. Load Normal Map (garment wrinkle/seam normals)
    if (garmentConfig.textures.normal) {
      try {
        const normalTex = await this.loadTexture(garmentConfig.textures.normal, false);
        // glTF normal maps: flipY = false (already in glTF convention, Y-up)
        normalTex.flipY = false;
        normalTex.wrapS = THREE.ClampToEdgeWrapping;
        normalTex.wrapT = THREE.ClampToEdgeWrapping;
        normalTex.generateMipmaps = true;
        normalTex.anisotropy = 4;
        normalTex.minFilter = THREE.LinearMipmapLinearFilter;
        normalTex.magFilter = THREE.LinearFilter;
        this.garmentMaterial.normalMap = normalTex;
        // Tangent-space normalScale: (2.8, 2.8) provides authentic macro fold and seam crease depth
        // that harmonizes with the micro-normal fabric weave (Verge3D reference used strength 10.0).
        this.garmentMaterial.normalScale.set(2.8, 2.8);
      } catch (err) {
        console.warn('[MaterialManager3D] Failed to load normal map:', err);
      }
    }

    // 3. Load Roughness Map
    //    glTF roughness maps are single-channel (G channel in PBR metallic-roughness).
    //    These are non-color data maps → NoColorSpace.
    if (garmentConfig.textures.roughness) {
      try {
        const roughnessTex = await this.loadTexture(garmentConfig.textures.roughness, false);
        roughnessTex.flipY = false;
        roughnessTex.wrapS = THREE.ClampToEdgeWrapping;
        roughnessTex.wrapT = THREE.ClampToEdgeWrapping;
        roughnessTex.generateMipmaps = true;
        roughnessTex.anisotropy = 4;
        roughnessTex.minFilter = THREE.LinearMipmapLinearFilter;
        roughnessTex.magFilter = THREE.LinearFilter;
        this.garmentMaterial.roughnessMap = roughnessTex;
        // Base roughness value that the roughness map modulates (multiplied together)
        this.garmentMaterial.roughness = 0.85;
      } catch (err) {
        console.warn('[MaterialManager3D] Failed to load roughness map:', err);
      }
    }

    this.garmentMaterial.needsUpdate = true;
  }

  public setFabricPreset(preset: 'cotton' | 'sweatshirt' | 'denim'): void {
    if (preset === 'cotton') {
      this.garmentMaterial.roughness = 0.85;
      this.garmentMaterial.metalness = 0.0;
      this.garmentMaterial.normalScale.set(2.6, 2.6);
      this.setMicroNormalScale(0.38);
      this.setMicroNormalRepeat(32.0);
    } else if (preset === 'sweatshirt') {
      this.garmentMaterial.roughness = 0.92;
      this.garmentMaterial.metalness = 0.0;
      this.garmentMaterial.normalScale.set(3.2, 3.2);
      this.setMicroNormalScale(0.50);
      this.setMicroNormalRepeat(22.0);
    } else if (preset === 'denim') {
      this.garmentMaterial.roughness = 0.76;
      this.garmentMaterial.metalness = 0.0;
      this.garmentMaterial.normalScale.set(3.4, 3.4);
      this.setMicroNormalScale(0.55);
      this.setMicroNormalRepeat(36.0);
    }
    this.garmentMaterial.needsUpdate = true;
  }

  public updateMaterialParams(roughness: number, metalness: number): void {
    this.garmentMaterial.roughness = THREE.MathUtils.clamp(roughness, 0.1, 1.0);
    this.garmentMaterial.metalness = THREE.MathUtils.clamp(metalness, 0.0, 1.0);
    this.garmentMaterial.needsUpdate = true;
  }

  private loadTexture(url: string, isColor = false): Promise<THREE.Texture> {
    if (this.textureCache.has(url)) {
      return Promise.resolve(this.textureCache.get(url)!);
    }
    return new Promise((resolve, reject) => {
      this.textureLoader.load(
        url,
        (tex) => {
          // Color textures (diffuse/albedo) are in sRGB; normal/roughness are linear data
          tex.colorSpace = isColor ? THREE.SRGBColorSpace : THREE.NoColorSpace;
          this.textureCache.set(url, tex);
          resolve(tex);
        },
        undefined,
        (err) => reject(err)
      );
    });
  }

  public dispose(): void {
    this.garmentMaterial.dispose();
    this.neckTagMaterial.dispose();
    this.textureCache.forEach((tex) => tex.dispose());
    this.textureCache.clear();
    this.microNormalTexture = null;
  }
}
